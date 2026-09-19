import { ConversationChapter } from './ConversationChapter';
import { LearningLoopChapter } from './LearningLoopChapter';
import { OutcomeChapter } from './OutcomeChapter';
import { ProblemChapter } from './ProblemChapter';
import { STORY } from './story';
import type { View } from '../../App';

interface ScrollStoryProps {
  navigateTo: (view: View) => void;
}

/**
 * The scroll-driven story mounted immediately after the cinematic laptop
 * hero (see CourseSelection). Four chapters, one continuous visual journey:
 * problem path → conversation waveform → learning loop → convergence → CTA.
 *
 * Each chapter owns an independent Framer Motion scroll-progress binding
 * against its own tall section. Native document scroll remains the only
 * input; the cinematic hero's film driver is neither read nor disturbed.
 */
export function ScrollStory({ navigateTo }: ScrollStoryProps): JSX.Element {
  return (
    <div data-scroll-story="journey" style={{ background: STORY.bg }}>
      <ProblemChapter />
      <ConversationChapter />
      <LearningLoopChapter />
      <OutcomeChapter navigateTo={navigateTo} />
    </div>
  );
}
