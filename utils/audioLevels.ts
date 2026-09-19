/**
 * Mutable bridge between the audio pipeline and the orb's render loop.
 *
 * `useVoiceTutor` writes these while the microphone or the tutor's playback is
 * running; the orb reads them inside `useFrame`. Deliberately NOT React state:
 * these change up to 60 times a second and must never trigger a re-render.
 *
 * Values are normalised 0..1 (roughly "how loud right now").
 */
export const audioLevels = {
  /** Live microphone loudness while the learner is speaking. */
  mic: 0,
  /** Loudness of the tutor's spoken reply during playback. */
  speaker: 0,
};

/** Reset both levels, e.g. when a session ends. */
export function resetAudioLevels(): void {
  audioLevels.mic = 0;
  audioLevels.speaker = 0;
}

/**
 * Loudness that counts as "full scale" when normalising to 0..1.
 * Raise these if the orb barely reacts; lower them if it saturates.
 */
export const MIC_REFERENCE = 0.14;
export const SPEAKER_REFERENCE = 0.26;
