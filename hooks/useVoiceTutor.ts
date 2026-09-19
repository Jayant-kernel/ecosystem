import { useCallback, useEffect, useRef, useState } from 'react';
import { Lesson, Progress, Transcript, TutorToolCall, TutorToolResponse } from '../types';
import { voiceService, base64ToBlob } from '../services/voiceService';

const MAX_HISTORY_TURNS = 8;

/**
 * Custom voice pipeline (no ElevenLabs Conversational AI Agent):
 *
 *   mic -> record -> POST /voice -> ElevenLabs STT -> Bedrock Claude
 *        -> ElevenLabs TTS -> play audio
 *
 * The hook keeps the same return shape the UI already consumes
 * (isSessionActive / isConnecting / isSpeaking / isListening / startSession...).
 */
export const useVoiceTutor = (
  onStreamMessage: (transcript: Transcript) => void,
  onToolCall: (calls: TutorToolCall[]) => Promise<TutorToolResponse[]>,
  progress: Progress,
  currentLesson: Lesson | null,
  editorCodeRef?: React.MutableRefObject<string>,
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

  const onStreamRef = useRef(onStreamMessage);
  useEffect(() => { onStreamRef.current = onStreamMessage; }, [onStreamMessage]);

  const onToolCallRef = useRef(onToolCall);
  useEffect(() => { onToolCallRef.current = onToolCall; }, [onToolCall]);

  const stopPlayback = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /** Returns the current session id, creating a backend session on first use. */
  const ensureSessionId = useCallback(async (): Promise<string> => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = await voiceService.createSession();
    }
    return sessionIdRef.current;
  }, []);

  /** Append an exchange (e.g. a chapter intro) to the local conversation history. */
  const pushHistory = useCallback((userText: string, assistantText: string) => {
    if (!userText && !assistantText) return;
    historyRef.current = [
      ...historyRef.current,
      { role: 'user' as const, content: userText },
      { role: 'assistant' as const, content: assistantText },
    ].slice(-MAX_HISTORY_TURNS);
  }, []);

  /** Start a fresh conversation (used when the learner opens another chapter). */
  const resetConversation = useCallback(() => {
    historyRef.current = [];
    sessionIdRef.current = null;
    setSessionError(null);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const playAudio = useCallback(async (base64: string, mimeType: string) => {
    const url = URL.createObjectURL(base64ToBlob(base64, mimeType));
    const audio = new Audio(url);
    audioElRef.current = audio;
    setIsPlaying(true);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (audioElRef.current === audio) audioElRef.current = null;
      setIsPlaying(false);
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    try {
      await audio.play();
    } catch (error: any) {
      cleanup();
      throw new Error(`Audio playback was blocked by the browser: ${error?.message || error}`);
    }
  }, []);

  const sendRecording = useCallback(async (blob: Blob) => {
    if (!blob.size) {
      setSessionError('No audio was captured. Please try again.');
      return;
    }

    setIsProcessing(true);
    setSessionError(null);
    try {
      if (!sessionIdRef.current) {
        sessionIdRef.current = await voiceService.createSession();
      }

      const result = await voiceService.processVoice({
        audio: blob,
        sessionId: sessionIdRef.current,
        history: historyRef.current.slice(-MAX_HISTORY_TURNS),
        lessonTitle: currentLesson?.title,
        objectives: currentLesson?.objectives?.join('; '),
        aiMemory: progress.aiMemory?.slice(-3).join('; '),
        editorCode: editorCodeRef?.current,
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
  }, [currentLesson, editorCodeRef, playAudio, progress.aiMemory]);

  const startSession = useCallback(async () => {
    if (isRecording || isProcessing) return;

    if (!voiceService.isConfigured()) {
      setSessionError('Voice backend not configured (set VITE_API_BASE_URL).');
      return;
    }

    setSessionError(null);
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
  }, [isProcessing, isRecording, releaseStream, sendRecording]);

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

  /** Play server-generated audio (e.g. a chapter intro) outside a recording. */
  const playExternalAudio = useCallback(async (base64: string, mimeType: string) => {
    setSessionError(null);
    await playAudio(base64, mimeType);
  }, [playAudio]);

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
    ensureSessionId,
    pushHistory,
    resetConversation,
    playExternalAudio,
  };
};
