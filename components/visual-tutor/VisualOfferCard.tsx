import { Eye, X } from 'lucide-react';

interface Props { topic: string; reason?: string; onAccept: () => void; onDismiss: () => void; }

export default function VisualOfferCard({ topic, reason, onAccept, onDismiss }: Props) {
  return <div className="visual-offer-card" role="status">
    <div className="visual-offer-card__icon"><Eye size={18} /></div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-cyan-300">Live visual teaching</p>
      <p className="mt-1 text-sm font-semibold text-white">Want me to show <span className="text-orange-300">{topic}</span> live?</p>
      {reason && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{reason}</p>}
      <div className="mt-3 flex gap-2"><button onClick={onAccept} className="visual-offer-card__accept">Show me visually</button><button onClick={onDismiss} className="visual-offer-card__dismiss">Keep explaining</button></div>
    </div>
    <button className="visual-offer-card__close" onClick={onDismiss} aria-label="Dismiss visual explanation"><X size={15} /></button>
  </div>;
}
