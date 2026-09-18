
import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveServerMessage, FunctionCall, FunctionResponse } from "@google/genai";
import { Progress, Transcript, Lesson } from '../types';
import { startLiveSession, createPcmBlob, LiveSession } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MAX_RETRIES = 3;
// Streaming chunks arrive many times per second. Instead of re-rendering the
// whole learning view on every chunk, we buffer transcript updates and flush
// them on this interval (final turns flush immediately).
const TRANSCRIPT_FLUSH_MS = 150;

export const useLiveTutor = (
  onStreamMessage: (newTranscript: Transcript) => void,
  onToolCall: (functionCalls: FunctionCall[]) => Promise<FunctionResponse[]>,
  progress: Progress,
  currentLesson: Lesson | null
) => {
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const inputAudioContextRef = useRef<AudioContext | undefined>(undefined);
  const outputAudioContextRef = useRef<AudioContext | undefined>(undefined);
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  const scriptProcessorRef = useRef<ScriptProcessorNode | undefined>(undefined);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  
  const transcriptRef = useRef<Transcript>({ user: '', ai: '', isFinal: false });
  const retryCountRef = useRef(0);
  const stopSignalRef = useRef(false);

  // Transcript buffering: latest value is held here and flushed on a timer.
  const pendingTranscriptRef = useRef<Transcript | null>(null);
  const transcriptFlushTimerRef = useRef<number | null>(null);

  // Refs for state that must be accessed inside the audio processing closure without staleness
  const isMutedRef = useRef(isMuted);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Clear any pending buffered transcript flush on unmount.
  useEffect(() => () => {
      if (transcriptFlushTimerRef.current !== null) {
          clearTimeout(transcriptFlushTimerRef.current);
          transcriptFlushTimerRef.current = null;
      }
  }, []);

  // Ref to hold the latest version of onToolCall.
  const onToolCallRef = useRef(onToolCall);
  useEffect(() => {
      onToolCallRef.current = onToolCall;
  }, [onToolCall]);

  const processAudioMessage = useCallback(async (message: LiveServerMessage) => {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      }
      const ctx = outputAudioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      if (!isSpeakingRef.current) {
        setIsSpeaking(true);
      }
      
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, OUTPUT_SAMPLE_RATE, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      
      audioSourcesRef.current.add(source);
      source.onended = () => {
        audioSourcesRef.current.delete(source);
        if (audioSourcesRef.current.size === 0) {
            setIsSpeaking(false);
        }
      };
    }
  }, []);
  
  const flushTranscript = useCallback(() => {
      if (transcriptFlushTimerRef.current !== null) {
          clearTimeout(transcriptFlushTimerRef.current);
          transcriptFlushTimerRef.current = null;
      }
      const pending = pendingTranscriptRef.current;
      if (!pending) return;
      pendingTranscriptRef.current = null;
      onStreamMessage(pending);
  }, [onStreamMessage]);

  const scheduleTranscriptFlush = useCallback((immediate: boolean) => {
      if (immediate) {
          flushTranscript();
          return;
      }
      // A flush is already queued; the newest value will be picked up by it.
      if (transcriptFlushTimerRef.current !== null) return;
      transcriptFlushTimerRef.current = window.setTimeout(flushTranscript, TRANSCRIPT_FLUSH_MS);
  }, [flushTranscript]);

  const processTranscriptionMessage = useCallback((message: LiveServerMessage) => {
      let updated = false;

      if (transcriptRef.current.isFinal && (message.serverContent?.inputTranscription || message.serverContent?.outputTranscription)) {
          transcriptRef.current = { user: '', ai: '', isFinal: false };
          updated = true;
      }

      if (message.serverContent?.inputTranscription) {
          transcriptRef.current.user = message.serverContent.inputTranscription.text || '';
          updated = true;
      }
      if (message.serverContent?.outputTranscription) {
          transcriptRef.current.ai += message.serverContent.outputTranscription.text || '';
          updated = true;
      }

      const turnComplete = !!message.serverContent?.turnComplete;
      if (turnComplete) {
          transcriptRef.current.isFinal = true;
          updated = true;
      }

      if (updated) {
          // Buffer the newest snapshot; flush now on turn completion so the
          // final answer settles, otherwise flush on the next buffered tick.
          pendingTranscriptRef.current = { ...transcriptRef.current };
          scheduleTranscriptFlush(turnComplete);
      }
  }, [scheduleTranscriptFlush]);

  const cleanUpResources = useCallback(() => {
    // Drop any buffered transcript so a stale flush cannot fire after teardown.
    if (transcriptFlushTimerRef.current !== null) {
        clearTimeout(transcriptFlushTimerRef.current);
        transcriptFlushTimerRef.current = null;
    }
    pendingTranscriptRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect(0);
    if (inputAudioContextRef.current?.state !== 'closed') {
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = undefined;
    }
    setIsSessionActive(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsMuted(false); // Reset mute state on close
  }, []);

  const connectRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const handleConnectionError = useCallback(() => {
    cleanUpResources();
    sessionPromiseRef.current = null;
    
    if (stopSignalRef.current) {
        return;
    }

    if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = 1000 * retryCountRef.current;
        setSessionError(`Connection failed. Retrying in ${delay / 1000}s...`);
        setTimeout(() => connectRef.current?.(), delay);
    } else {
        setSessionError('Could not connect to the service. Please try again later.');
        setIsConnecting(false);
    }
  }, [cleanUpResources]);

  const connect = useCallback(async () => {
    if (sessionPromiseRef.current || isConnecting || stopSignalRef.current) return;
    
    setIsConnecting(true);
    if (retryCountRef.current > 0) {
        setSessionError(`Retrying connection... (${retryCountRef.current}/${MAX_RETRIES})`);
    } else {
        setSessionError(null);
    }

    try {
        const sessionPromise = startLiveSession(progress, currentLesson, {
            onopen: async () => {
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
                const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    // SMART MUTE LOGIC: 
                    // Only send audio if NOT muted manually AND NOT currently speaking (prevents AI hearing itself)
                    if (!isMutedRef.current && !isSpeakingRef.current) {
                        sessionPromiseRef.current?.then((session) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            session.sendRealtimeInput({ media: createPcmBlob(inputData) });
                        });
                    }
                };

                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

                setIsSessionActive(true);
                setIsConnecting(false);
                setIsListening(true);
                setSessionError(null);
                retryCountRef.current = 0;
            },
            onmessage: async (msg: LiveServerMessage) => {
                if (msg.toolCall?.functionCalls) {
                    const results = await onToolCallRef.current(msg.toolCall.functionCalls);
                    const session = await sessionPromiseRef.current;
                    session?.sendToolResponse({ functionResponses: results });
                }
                
                processAudioMessage(msg);
                processTranscriptionMessage(msg);
            },
            onerror: (e) => {
                console.error('Session error:', e);
                handleConnectionError();
            },
            onclose: () => {
                console.log('Session closed');
                cleanUpResources();
                sessionPromiseRef.current = null;
            },
        });

        sessionPromiseRef.current = sessionPromise;
        await sessionPromise;

    } catch (error) {
        console.error('Failed to start session:', error);
        handleConnectionError();
    }
  }, [isConnecting, progress, currentLesson, processAudioMessage, processTranscriptionMessage, handleConnectionError, cleanUpResources]);
  
  connectRef.current = connect;

  const startSession = useCallback(() => {
    stopSignalRef.current = false;
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  const stopSession = useCallback(async () => {
    stopSignalRef.current = true;
    const session = await sessionPromiseRef.current;
    if (session) {
      session.close();
    } else {
        cleanUpResources();
    }
    setSessionError(null);
    retryCountRef.current = 0;
    sessionPromiseRef.current = null;
  }, [cleanUpResources]);

  const toggleMute = useCallback(() => {
      setIsMuted(prev => !prev);
  }, []);

  return { 
      isSessionActive, 
      isConnecting, 
      isSpeaking, 
      isListening, 
      isMuted,
      startSession, 
      stopSession, 
      toggleMute,
      sessionError 
  };
};
