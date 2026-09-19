import type { Node, Edge } from '@xyflow/react';
import type { VisualNode, VisualPlan } from '../visual-tutor/visualTypes';

/**
 * Canonical DiagramPlan → React Flow graph state.
 *
 * The AI reasons only in semantic node/edge IDs (the VisualPlan). This
 * adapter owns every React Flow internal: node objects, layout positions,
 * edge wiring, and teaching flags. Nothing AI-generated ever touches it.
 */

export const DATAFLOW_NODE_TYPE = 'eco';
export const DATAFLOW_EDGE_TYPE = 'eco';

/** Estimated on-canvas size of an Ecosystem node (matches CSS below). */
export const ECO_NODE_WIDTH = 232;
export const ECO_NODE_HEIGHT = 118;

const LAYER_X = 300;
const LAYER_Y = 190;

export interface EcoNodeData extends Record<string, unknown> {
  label: string;
  nodeType: VisualNode['type'];
  detail?: string;
  teaching: boolean;
  dimmed: boolean;
}

export interface EcoEdgeData extends Record<string, unknown> {
  label?: string;
  teaching: boolean;
}

export type EcoNode = Node<EcoNodeData, 'eco'>;
export type EcoEdge = Edge<EcoEdgeData, 'eco'>;

/**
 * Layered auto-layout: BFS depth from sourceless nodes sets x, sibling order
 * sets y, centered per layer. Nodes with stored canonical positions keep
 * them (user drags and stable-ID preservation across mutations).
 */
export function layoutPlan(plan: VisualPlan): Map<string, { x: number; y: number }> {
  const ids = new Set(plan.nodes.map((node) => node.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of plan.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of plan.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const node of plan.nodes) {
    if ((incoming.get(node.id) ?? 0) === 0) {
      depth.set(node.id, 0);
      queue.push(node.id);
    }
  }
  // Cycles or fully-linked graphs: seed leftovers in input order.
  for (const node of plan.nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 0);
      queue.push(node.id);
    }
  }
  while (queue.length) {
    const id = queue.shift() as string;
    for (const next of outgoing.get(id) ?? []) {
      const candidate = (depth.get(id) ?? 0) + 1;
      if (candidate > (depth.get(next) ?? -1)) {
        depth.set(next, candidate);
        queue.push(next);
      }
    }
  }
  const layers = new Map<number, string[]>();
  for (const node of plan.nodes) {
    const layer = depth.get(node.id) ?? 0;
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)?.push(node.id);
  }
  const positions = new Map<string, { x: number; y: number }>();
  for (const [layer, members] of layers) {
    members.forEach((id, index) => {
      positions.set(id, {
        x: layer * LAYER_X,
        y: (index - (members.length - 1) / 2) * LAYER_Y,
      });
    });
  }
  // Canonical positions win: stable IDs keep stable places.
  for (const node of plan.nodes) {
    if (node.position && Number.isFinite(node.position.x) && Number.isFinite(node.position.y)) {
      positions.set(node.id, { x: node.position.x, y: node.position.y });
    }
  }
  return positions;
}

export interface FlowPoint { x: number; y: number }

/** Center of a node box in flow coordinates. */
export function nodeCenter(position: FlowPoint, width: number, height: number): FlowPoint {
  return { x: position.x + width / 2, y: position.y + height / 2 };
}

/** Midpoint between two flow points (edge teaching fallback). */
export function edgeMidpoint(a: FlowPoint, b: FlowPoint): FlowPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export interface FlowGraph {
  nodes: EcoNode[];
  edges: EcoEdge[];
}

/**
 * Builds React Flow state for a plan. `teachingId` marks the currently
 * taught node/edge; `focusedId` selects it. Everything else renders dimmed
 * only when `dimmedIds` is non-empty (teaching focus context).
 */
export function planToFlow(
  plan: VisualPlan,
  options: { teachingId?: string | null; focusedId?: string | null; dimmedIds?: string[] } = {},
): FlowGraph {
  const positions = layoutPlan(plan);
  const dimmed = new Set(options.dimmedIds ?? []);
  const nodes: EcoNode[] = plan.nodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 };
    const teaching = options.teachingId === node.id;
    return {
      id: node.id,
      type: DATAFLOW_NODE_TYPE,
      position,
      data: {
        label: node.label,
        nodeType: node.type,
        detail: node.detail,
        teaching,
        dimmed: dimmed.size > 0 && !dimmed.has(node.id) && !teaching,
      },
      selected: options.focusedId === node.id,
    };
  });
  const edges: EcoEdge[] = plan.edges.map((edge) => ({
    id: edge.id,
    type: DATAFLOW_EDGE_TYPE,
    source: edge.from,
    target: edge.to,
    label: edge.label,
    data: { label: edge.label, teaching: options.teachingId === edge.id },
    selected: options.focusedId === edge.id,
  }));
  return { nodes, edges };
}
