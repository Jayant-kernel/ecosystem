import { motion, useReducedMotion } from 'framer-motion';
import VirtualTeachingHand from '../VirtualTeachingHand';

interface PointerProps { x: number; y: number; label?: string; visible: boolean; }

/** Deliberately unlike a system cursor: it exists only inside the teaching canvas. */
export default function VisualTutorPointer({ x, y, label, visible }: PointerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="visual-tutor-pointer"
      initial={false}
      animate={{ left: `${x}%`, top: `${y}%`, opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 110, damping: 18, mass: 0.65 }}
    >
      <span className="visual-tutor-pointer__hand"><VirtualTeachingHand size={42} /></span>
      <span className="visual-tutor-pointer__spark" />
      {label && <span className="visual-tutor-pointer__label">{label}</span>}
    </motion.div>
  );
}
