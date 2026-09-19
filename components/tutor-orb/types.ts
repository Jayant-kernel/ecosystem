/**
 * The five states the orb can be in. ConversationPanel derives this from the
 * existing voice-session flags, so the orb never owns session logic itself.
 */
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface TutorOrbProps {
  state: OrbState;
  /** Click / Enter / Space. Starts or stops the voice session. */
  onToggle: () => void;
  /** Rendered size in pixels. The orb reads best between 180 and 240. */
  size?: number;
  /** Screen-reader label; defaults to a state-aware sentence. */
  label?: string;
  className?: string;
}

export const ORB_STATE_LABEL: Record<OrbState, string> = {
  idle: 'AI tutor is idle. Activate to start talking.',
  listening: 'AI tutor is listening. Activate to stop.',
  thinking: 'AI tutor is thinking.',
  speaking: 'AI tutor is speaking.',
  error: 'AI tutor hit an error. Activate to try again.',
};
