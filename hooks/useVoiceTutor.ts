import { useCallback, useEffect, useRef, useState } from 'react';
import { Lesson, Progress, Transcript, TutorToolCall, TutorToolResponse } from '../types';
import { voiceService, base64ToBlob } from '../services/voiceService';

const MAX_HISTORY_TURNS = 8;

/** Trim a context string so a single lesson cannot bloat the prompt. */
const clip = (value: string | undefined, max: number): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};

/** Flatten a lesson's flow charts into "step -> step -> step" lines. */
const lessonFlowsText = (lesson: Lesson | null): string | undefined => {
  const flows = lesson?.content?.flows;
  if (!flows?.length) return undefined;
  return flows
    .map((flow) => {
      const steps = flow.steps.map((step) => step.label).join(' -> ');
      return flow.title ? `${flow.title}: ${steps}` : steps;
    })
    .join('\n');
};

/**
 * Custom voice pipeline (no ElevenLabs Conversational AI Agent):
 *
 *   mic -> record -> POST /voice -> ElevenLabs STT -> Bedrock/Gemini
 *        -> ElevenLabs TTS -> play audio
 *
 * The tutor speaks first: on the first startSession of a lesson it requests an
 * intro turn, plays it, and only then opens the microphone.
 */
export const useVoiceTutor = (
  onStreamMessage: (transcript: Transcript) => void,
  onToolCall: (calls: TutorToolCall[]) => Promise<TutorToolResponse[]>,
  progress: Progress,
  currentLesson: Lesson | null,
  editorCodeRef?: React.MutableRefObject<string>,
  courseTitle?: string,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const finishPlaybackRef = useRef<(() => void) | null>(null);
  const introPlayedRef = useRef<string | null>(null);

  const onStreamRef = useRef(onStreamMessage);
  useEffect(() => { onStreamRef.current = onStreamMessage; }, [onStreamMessage]);

  const onToolCallRef = useRef(onToolCall);
  useEffect(() => { onToolCallRef.current = onToolCall; }, [onToolCall]);

  // A new lesson earns a fresh opening from the tutor.
  useEffect(() => {
    introPlayedRef.current = null;
  }, [currentLesson?.id]);

  const stopPlayback = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      audio.pause();
      audioElRef.current = null;
    }
    setIsPlaying(false);
    finishPlaybackRef.current?.();
    finishPlaybackRef.current = null;
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  /** Resolves when playback finishes, errors, or is stopped by the learner. */
  const playAudio = useCallback((base64: string, mimeType: string) => {
    return new Promise<void>((resolve) => {
      const url = URL.createObjectURL(base64ToBlob(base64, mimeType));
      const audio = new Audio(url);
      audioElRef.current = audio;
      setIsPlaying(true);

      const finish = () => {
        URL.revokeObjectURL(url);
        if (audioElRef.current === audio) audioElRef.current = null;
        finishPlaybackRef.current = null;
        setIsPlaying(false);
        resolve();
      };

      finishPlaybackRef.current = finish;
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    });
  }, []);

  const lessonContext = useCallback(() => ({
    courseTitle,
    lessonTitle: currentLesson?.title,
    objectives: currentLesson?.objectives?.join('; '),
    aiMemory: progress.aiMemory?.slice(-3).join('; '),
    lessonMode: currentLesson?.mode,
    lessonGuide: clip(currentLesson?.content?.explanations?.join('\n\n'), 3000),
    lessonFlows: clip(lessonFlowsText(currentLesson), 1200),
    lessonTask: clip(currentLesson?.content?.exercises?.[0]?.prompt, 800),
  }), [courseTitle, currentLesson, progress.aiMemory]);

  const ensureSession = useCallback(async () => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = await voiceService.createSession();
    }
    return sessionIdRef.current;
  }, []);

  const sendRecording = useCallback(async (blob: Blob) => {
    if (!blob.size) {
      setSessionError('No audio was captured. Please try again.');
      return;
    }

    setIsProcessing(true);
    setSessionError(null);
    try {
      const sessionId = await ensureSession();

      const result = await voiceService.processVoice({
        audio: blob,
        sessionId,
        history: historyRef.current.slice(-MAX_HISTORY_TURNS),
        editorCode: editorCodeRef?.current,
        ...lessonContext(),
      });

      onStreamRef.current({
        user: result.transcript,
        ai: result.response,
        isFinal: true,
      });

      if (result.transcript || result.response) {
        historyRef.current = [
          ...historyRef.current,
          { role: 'user' as const, content: result.transcript },
          { role: 'assistant' as const, content: result.response },
        ].slice(-MAX_HISTORY_TURNS);
      }

      if (result.toolCalls?.length) {
        await onToolCallRef.current(
          result.toolCalls.map((call, index) => ({
            id: `voice-tool-${index}`,
            name: call.name,
            args: call.args || {},
          })),
        );
      }

      if (result.audio) {
        await playAudio(result.audio, result.audioMimeType);
      }
    } catch (error: any) {
      setSessionError(error?.message || 'Voice request failed');
    } finally {
      setIsProcessing(false);
    }
  }, [editorCodeRef, ensureSession, lessonContext, playAudio]);

  /** The tutor opens the conversation, then hands over the microphone. */
  const playIntro = useCallback(async () => {
    setIsProcessing(true);
    try {
      const sessionId = await ensureSession();
      const result = await voiceService.processVoice({
        intro: true,
        sessionId,
        ...lessonContext(),
      });

      onStreamRef.current({ user: '', ai: result.response, isFinal: true });
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant' as const, content: result.response },
      ].slice(-MAX_HISTORY_TURNS);

      if (result.audio) await playAudio(result.audio, result.audioMimeType);
    } catch (error: any) {
      setSessionError(error?.message || 'Could not start the tutor.');
    } finally {
      setIsProcessing(false);
    }
  }, [ensureSession, lessonContext, playAudio]);

  const startSession = useCallback(async () => {
    if (isRecording || isProcessing) return;

    if (!voiceService.isConfigured()) {
      setSessionError('Voice backend not configured (set VITE_API_BASE_URL).');
      return;
    }

    setSessionError(null);

    // Speak first, once per lesson, before opening the microphone.
    if (!introPlayedRef.current) {
      introPlayedRef.current = currentLesson?.id ?? 'open';
      await playIntro();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        void sendRecording(blob);
      };

      recorder.start();
      setIsRecording(true);
      setIsMuted(false);
    } catch (error: any) {
      releaseStream();
      setSessionError(
        error?.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : error?.message || 'Could not access the microphone.',
      );
    }
  }, [currentLesson?.id, isProcessing, isRecording, playIntro, releaseStream, sendRecording]);

  const stopSession = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    releaseStream();
    setIsRecording(false);
  }, [releaseStream]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setIsMuted(next);
  }, [isMuted]);

  useEffect(() => () => {
    stopPlayback();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    releaseStream();
  }, [releaseStream, stopPlayback]);

  return {
    isSessionActive: isRecording,
    isConnecting: isProcessing,
    isSpeaking: isPlaying,
    isListening: isRecording,
    isMuted,
    startSession,
    stopSession,
    toggleMute,
    sessionError,
  };
};
