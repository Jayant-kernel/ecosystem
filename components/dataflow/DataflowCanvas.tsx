import { useEffect, useRef, useState } from 'react';
import {
  Background,
  BezierEdge,
  Handle,
  Position,
  ReactFlow,
  useReactFlow,
  useViewport,
  type EdgeProps,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useReducedMotion } from 'framer-motion';
import VisualTutorPointer from '../visual-tutor/VisualTutorPointer';
import {
  DATAFLOW_EDGE_TYPE,
  DATAFLOW_NODE_TYPE,
  ECO_NODE_HEIGHT,
  ECO_NODE_WIDTH,
  edgeMidpoint,
  nodeCenter,
  planToFlow,
  type EcoEdge,
  type EcoNode,
} from './dataflowAdapter';
import type { VisualPlan } from '../visual-tutor/visualTypes';

export interface DiagramCursorTarget {
  kind: 'diagram_node' | 'diagram_edge';
  id: string;
  label: string;
}

interface DataflowCanvasProps {
  plan: VisualPlan;
  /** Node/edge id carrying the teaching glow + selection. */
  activeId?: string | null;
  /** Cursor target; when set with a nonce in focusSignal, the viewport fits it. */
  cursor?: DiagramCursorTarget | null;
  focusSignal?: number;
  onInit?: (instance: ReactFlowInstance<EcoNode, EcoEdge>) => void;
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
  onClose?: () => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  client: '#22d3ee',
  gateway: '#a78bfa',
  compute: '#f97316',
  database: '#10b981',
  queue: '#facc15',
  storage: '#38bdf8',
  service: '#fb7185',
  user: '#e879f9',
};

/** Ecosystem-native node: dark card, type tag, handles, teaching states. */
function EcosystemNode({ data, selected }: NodeProps<EcoNode>): JSX.Element {
  const accent = NODE_TYPE_COLORS[data.nodeType] ?? '#f97316';
  return (
    <article
      aria-label={data.label}
      className={`dataflow-node${selected ? ' is-selected' : ''}${data.teaching ? ' is-teaching' : ''}${data.dimmed ? ' is-dimmed' : ''}`}
      style={{ width: ECO_NODE_WIDTH, ['--eco-accent' as string]: accent }}
    >
      <Handle type="target" position={Position.Top} className="dataflow-handle" />
      <p className="dataflow-node__type">{data.nodeType}</p>
      <h3 className="dataflow-node__title">{data.label}</h3>
      {data.detail ? <p className="dataflow-node__detail">{data.detail}</p> : null}
      <Handle type="source" position={Position.Bottom} className="dataflow-handle" />
    </article>
  );
}

function EcosystemEdge(props: EdgeProps<EcoEdge>): JSX.Element {
  const teaching = props.data?.teaching === true;
  return (
    <BezierEdge
      {...props}
      interactionWidth={28}
      style={teaching ? { stroke: '#f97316', strokeWidth: 3.5 } : undefined}
      labelStyle={teaching ? { fill: '#fdba74', fontWeight: 700 } : undefined}
    />
  );
}

const nodeTypes = { [DATAFLOW_NODE_TYPE]: EcosystemNode };
const edgeTypes = { [DATAFLOW_EDGE_TYPE]: EcosystemEdge };

/**
 * Teaching cursor: resolves the cursor target to the ACTUAL rendered node
 * through the React Flow instance (never guessed coordinates) and renders
 * the existing pointer at viewport-relative percentages. Re-renders on every
 * viewport change (pan/zoom) via useViewport, so it tracks correctly while
 * the graph moves underneath it. No listeners, no loops.
 */
function DiagramCursor({ target, wrapperRef }: { target: DiagramCursorTarget | null; wrapperRef: React.RefObject<HTMLDivElement | null> }): JSX.Element {
  const instance = useReactFlow();
  // Re-resolve on every pan/zoom (and on every parent render, e.g. drags and
  // step changes). Pure reads only — no state, no effects, no loops.
  useViewport();
  if (!target) return <VisualTutorPointer x={50} y={50} visible={false} />;
  const wrapper = wrapperRef.current;
  const rect = wrapper?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return <VisualTutorPointer x={50} y={50} visible={false} />;
  let flowPoint: { x: number; y: number } | null = null;
  if (target.kind === 'diagram_node') {
    const node = instance.getNode(target.id);
    if (!node) return <VisualTutorPointer x={50} y={50} visible={false} />;
    flowPoint = nodeCenter(node.position, node.measured?.width ?? ECO_NODE_WIDTH, node.measured?.height ?? ECO_NODE_HEIGHT);
  } else {
    const edge = instance.getEdge(target.id);
    const source = edge ? instance.getNode(edge.source) : undefined;
    const targetNode = edge ? instance.getNode(edge.target) : undefined;
    if (!edge || !source || !targetNode) return <VisualTutorPointer x={50} y={50} visible={false} />;
    flowPoint = edgeMidpoint(
      nodeCenter(source.position, source.measured?.width ?? ECO_NODE_WIDTH, source.measured?.height ?? ECO_NODE_HEIGHT),
      nodeCenter(targetNode.position, targetNode.measured?.width ?? ECO_NODE_WIDTH, targetNode.measured?.height ?? ECO_NODE_HEIGHT),
    );
  }
  const screen = instance.flowToScreenPosition(flowPoint);
  return (
    <VisualTutorPointer
      x={((screen.x - rect.left) / rect.width) * 100}
      y={((screen.y - rect.top) / rect.height) * 100}
      label={target.label}
      visible
    />
  );
}

/**
 * AI-native dataflow canvas. Graph state always derives from the canonical
 * plan via the adapter; the AI never touches React Flow internals.
 */
export default function DataflowCanvas({
  plan,
  activeId = null,
  cursor = null,
  focusSignal = 0,
  onInit,
  onPositionsChange,
  onClose,
}: DataflowCanvasProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [instance, setInstance] = useState<ReactFlowInstance<EcoNode, EcoEdge> | null>(null);

  const [bootstrapped] = useState(() => planToFlow(plan, { teachingId: activeId, focusedId: activeId }));
  const [nodes, setNodes] = useState(bootstrapped.nodes);
  const [edges, setEdges] = useState(bootstrapped.edges);

  // Canonical plan (or teaching focus) changed: rebuild derived state.
  // Drag-in-progress positions are preserved because the adapter prefers
  // stored canonical positions, which drag-stop writes back into the plan.
  useEffect(() => {
    const next = planToFlow(plan, { teachingId: activeId, focusedId: activeId });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [plan, activeId]);

  // Semantic focus: pan/zoom the viewport to the cursor target.
  const fittedSignal = useRef(0);
  useEffect(() => {
    if (!instance || !cursor || focusSignal === 0 || fittedSignal.current === focusSignal) return;
    fittedSignal.current = focusSignal;
    if (cursor.kind === 'diagram_node') {
      instance.fitView({ nodes: [{ id: cursor.id }], padding: 0.35, duration: reduceMotion ? 0 : 450, maxZoom: 1.1 });
    } else {
      const edge = instance.getEdge(cursor.id);
      if (!edge) return;
      instance.fitView({ nodes: [{ id: edge.source }, { id: edge.target }], padding: 0.4, duration: reduceMotion ? 0 : 450, maxZoom: 1.1 });
    }
  }, [instance, cursor, focusSignal, reduceMotion]);

  return (
    <section ref={wrapperRef} className="dataflow-canvas" aria-label="AI dataflow diagram">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={(changes) => {
          setNodes((current) => {
            const next = [...current];
            for (const change of changes) {
              if (change.type === 'position' && change.position) {
                const index = next.findIndex((node) => node.id === change.id);
                if (index >= 0) next[index] = { ...next[index], position: change.position };
              } else if (change.type === 'remove') {
                const index = next.findIndex((node) => node.id === change.id);
                if (index >= 0) next.splice(index, 1);
              }
            }
            return next;
          });
        }}
        onNodeDragStop={(_, node) => {
          onPositionsChange?.({ [node.id]: { x: node.position.x, y: node.position.y } });
        }}
        onInit={(created) => {
          setInstance(created);
          onInit?.(created);
        }}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.4}
        maxZoom={1.75}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: false }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        zoomOnScroll
        panOnDrag
      >
        <Background gap={28} size={1.5} />
        <DiagramCursor target={cursor} wrapperRef={wrapperRef} />
      </ReactFlow>
      <div className="dataflow-canvas__tools">
        <button type="button" aria-label="Zoom out" onClick={() => instance?.zoomOut()}>
          −
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => instance?.zoomIn()}>
          +
        </button>
        {onClose ? (
          <button type="button" className="dataflow-canvas__close" onClick={onClose}>
            Back to code
          </button>
        ) : null}
      </div>
    </section>
  );
}
