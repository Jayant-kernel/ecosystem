import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Database, Globe2, Layers3, ServerCog, Table2, Waypoints, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import FossflowScene from './FossflowScene';
import VisualTutorPointer from './VisualTutorPointer';
import { VisualPlaybackEngine } from './VisualPlaybackEngine';
import { visualReducer } from './visualReducer';
import { EMPTY_VISUAL_SCENE, type VisualPlan, type VisualNode, type VisualSceneState, type VisualStep } from './visualTypes';

interface Props { plan: VisualPlan; followUpSteps?: VisualStep[]; onClose: () => void; onSceneChange?: (scene: VisualSceneState) => void; }
type Position = { x: number; y: number };

const ICONS: Record<VisualNode['type'], typeof Globe2> = { client: Globe2, gateway: Waypoints, compute: ServerCog, database: Database, queue: Layers3, storage: Table2, service: Layers3, user: Globe2 };
function layout(nodes: VisualNode[]): Record<string, Position> {
  const cols = nodes.length <= 4 ? 1 : Math.min(3, Math.ceil(Math.sqrt(nodes.length)));
  const rows = Math.ceil(nodes.length / cols);
  return Object.fromEntries(nodes.map((node, index) => ({
    id: node.id,
    value: { x: cols === 1 ? 50 : 16 + (index % cols) * (68 / (cols - 1)), y: rows === 1 ? 50 : 16 + Math.floor(index / cols) * (68 / (rows - 1)) },
  })).map((entry) => [entry.id, entry.value]));
}

export default function VisualTutorCanvas({ plan, followUpSteps = [], onClose, onSceneChange }: Props) {
  const [scene, dispatch] = useReducer(visualReducer, EMPTY_VISUAL_SCENE);
  const [zoom, setZoom] = useState(1);
  const engine = useRef<VisualPlaybackEngine | null>(null);
  const appliedFollowUps = useRef(0);
  const reduceMotion = useReducedMotion();
  const positions = useMemo(() => layout(plan.nodes), [plan.nodes]);

  useEffect(() => {
    const instance = new VisualPlaybackEngine((index) => dispatch({ type: 'step', index, step: plan.steps[index] }), () => dispatch({ type: 'complete' }));
    engine.current = instance;
    dispatch({ type: 'load', plan });
    if (reduceMotion) plan.steps.forEach((step, index) => dispatch({ type: 'step', index, step }));
    else instance.play(plan);
    return () => instance.cancel();
  }, [plan, reduceMotion]);
  useEffect(() => { onSceneChange?.(scene); }, [onSceneChange, scene]);
  useEffect(() => {
    const fresh = followUpSteps.slice(appliedFollowUps.current);
    fresh.forEach((step, offset) => dispatch({ type: 'step', step, index: scene.activeStep + offset + 1 }));
    appliedFollowUps.current = followUpSteps.length;
  }, [followUpSteps, scene.activeStep]);

  const pointer = scene.pointerTargetId ? positions[scene.pointerTargetId] : null;
  const activeLabel = plan.nodes.find((node) => node.id === scene.pointerTargetId)?.label;
  const visibleNodes = new Set(scene.visibleNodeIds);
  const visibleEdges = new Set(scene.visibleEdgeIds);
  return <section className="visual-tutor-canvas" aria-label="Live visual teaching canvas">
    <FossflowScene plan={plan} visibleNodeIds={scene.visibleNodeIds} visibleEdgeIds={scene.visibleEdgeIds} />
    <div className="visual-tutor-canvas__topbar">
      <div><p className="visual-tutor-canvas__eyebrow">Tutor-controlled visual mode</p><h2>{plan.title}</h2></div>
      <div className="visual-tutor-canvas__tools"><button onClick={() => setZoom((value) => Math.max(.8, value - .1))} aria-label="Zoom out"><ZoomOut size={16} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.25, value + .1))} aria-label="Zoom in"><ZoomIn size={16} /></button><button className="visual-tutor-canvas__close" onClick={onClose}>Back to code</button></div>
    </div>
    <motion.div className="visual-tutor-stage" animate={{ scale: zoom }} transition={{ type: 'spring', stiffness: 180, damping: 24 }}>
      <svg className="visual-tutor-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="visual-arrow" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4z" fill="#fb923c" /></marker></defs>
        {plan.edges.map((edge) => {
          const from = positions[edge.from]; const to = positions[edge.to];
          if (!from || !to || !visibleEdges.has(edge.id)) return null;
          const showing = visibleNodes.has(edge.from) && visibleNodes.has(edge.to);
          return <g key={edge.id} className={showing ? 'visual-tutor-edge visual-tutor-edge--visible' : 'visual-tutor-edge'}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd="url(#visual-arrow)" />{edge.label && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 2}>{edge.label}</text>}</g>;
        })}
      </svg>
      {plan.nodes.map((node) => {
        const pos = positions[node.id]; const Icon = ICONS[node.type]; const visible = visibleNodes.has(node.id);
        const focused = scene.activeNodeId === node.id;
        const annotation = scene.annotations.find((item) => item.target === node.id);
        return <AnimatePresence key={node.id}>{visible && <motion.article data-visual-node={node.id} initial={{ opacity: 0, y: 8, scale: .92 }} animate={{ opacity: scene.dimmed && !focused ? .25 : 1, y: 0, scale: focused ? 1.045 : 1 }} exit={{ opacity: 0, scale: .92 }} transition={{ duration: reduceMotion ? 0 : .36, ease: [0.16, 1, .3, 1] }} className={`visual-tutor-node visual-tutor-node--${node.type} ${focused ? 'is-focused' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
          <span className="visual-tutor-node__ring" /><span className="visual-tutor-node__icon"><Icon size={20} /></span><span className="visual-tutor-node__copy"><strong>{node.label}</strong><small>{node.detail || node.type}</small></span>{annotation && <span className="visual-tutor-node__annotation">{annotation.text}</span>}
        </motion.article>}</AnimatePresence>;
      })}
      <VisualTutorPointer x={pointer?.x ?? 50} y={pointer?.y ?? 50} label={activeLabel} visible={Boolean(pointer)} />
    </motion.div>
    <div className="visual-tutor-canvas__status"><span className={scene.status === 'interactive' ? 'is-ready' : ''} />{scene.status === 'interactive' ? 'Diagram ready to explore' : 'Building the explanation live…'}</div>
  </section>;
}
