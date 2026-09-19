import type { VisualNode, VisualPlan } from '../visual-tutor/visualTypes';

/**
 * Semantic graph mutations. The AI expresses intent with stable IDs only —
 * never coordinates, selectors, or renderer state. Every command is
 * validated against the live canonical plan before anything is applied, and
 * the canonical plan stays the source of truth (positions preserved unless
 * the command itself moves a node).
 */

export type DiagramCommand =
  | { type: 'create_node'; nodeId: string; label: string; nodeType: VisualPlan['nodes'][number]['type']; detail?: string }
  | { type: 'delete_node'; nodeId: string }
  | { type: 'update_node'; nodeId: string; label?: string; detail?: string }
  | { type: 'connect_nodes'; edgeId: string; source: string; target: string; label?: string }
  | { type: 'delete_edge'; edgeId: string }
  | { type: 'update_edge'; edgeId: string; label?: string }
  | { type: 'focus_node'; nodeId: string; text?: string }
  | { type: 'focus_edge'; edgeId: string; text?: string }
  | { type: 'explain_node'; nodeId: string; text?: string }
  | { type: 'explain_edge'; edgeId: string; text?: string };

export const DIAGRAM_COMMAND_TYPES = [
  'create_node',
  'delete_node',
  'update_node',
  'connect_nodes',
  'delete_edge',
  'update_edge',
  'focus_node',
  'focus_edge',
  'explain_node',
  'explain_edge',
] as const;

export type DiagramCommandType = (typeof DIAGRAM_COMMAND_TYPES)[number];

const ID = /^[a-z][a-z0-9-]{0,47}$/;
const MAX_NODES = 16;
const MAX_EDGES = 24;

const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

/** Structural + semantic validation of one raw command against the plan. */
export function validateDiagramCommand(plan: VisualPlan, input: unknown): { ok: true; command: DiagramCommand } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Diagram command must be an object.' };
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.type !== 'string' || !(DIAGRAM_COMMAND_TYPES as readonly string[]).includes(raw.type)) {
    return { ok: false, error: 'Unknown diagram command.' };
  }
  const nodeIds = new Set(plan.nodes.map((node) => node.id));
  const edgeIds = new Set(plan.edges.map((edge) => edge.id));
  const id = (value: unknown): string | null =>
    typeof value === 'string' && ID.test(value.trim()) ? value.trim() : null;

  switch (raw.type) {
    case 'create_node': {
      const nodeId = id(raw.nodeId);
      if (!nodeId) return { ok: false, error: 'create_node needs a valid nodeId.' };
      if (nodeIds.has(nodeId)) return { ok: false, error: `Node "${nodeId}" already exists.` };
      if (plan.nodes.length >= MAX_NODES) return { ok: false, error: 'Node limit reached.' };
      if (!text(raw.label, 60)) return { ok: false, error: 'create_node needs a label.' };
      const allowed: string[] = ['client', 'gateway', 'compute', 'database', 'queue', 'storage', 'service', 'user'];
      if (typeof raw.nodeType !== 'string' || !allowed.includes(raw.nodeType)) {
        return { ok: false, error: 'create_node needs a known nodeType.' };
      }
      return {
        ok: true,
        command: {
          type: 'create_node',
          nodeId,
          label: raw.label.trim(),
          nodeType: raw.nodeType as VisualNode['type'],
          ...(text(raw.detail, 120) ? { detail: raw.detail.trim() } : {}),
        },
      };
    }
    case 'delete_node': {
      const nodeId = id(raw.nodeId);
      if (!nodeId || !nodeIds.has(nodeId)) return { ok: false, error: 'delete_node targets an unknown node.' };
      return { ok: true, command: { type: 'delete_node', nodeId } };
    }
    case 'update_node': {
      const nodeId = id(raw.nodeId);
      if (!nodeId || !nodeIds.has(nodeId)) return { ok: false, error: 'update_node targets an unknown node.' };
      if (raw.label !== undefined && !text(raw.label, 60)) return { ok: false, error: 'update_node label is invalid.' };
      if (raw.detail !== undefined && (typeof raw.detail !== 'string' || raw.detail.length > 120)) {
        return { ok: false, error: 'update_node detail is invalid.' };
      }
      return {
        ok: true,
        command: {
          type: 'update_node',
          nodeId,
          ...(text(raw.label, 60) ? { label: (raw.label as string).trim() } : {}),
          ...(typeof raw.detail === 'string' ? { detail: (raw.detail as string).trim() } : {}),
        },
      };
    }
    case 'connect_nodes': {
      const edgeId = id(raw.edgeId);
      const source = id(raw.source);
      const target = id(raw.target);
      if (!edgeId || !source || !target) return { ok: false, error: 'connect_nodes needs edgeId, source, and target.' };
      if (edgeIds.has(edgeId)) return { ok: false, error: `Edge "${edgeId}" already exists.` };
      if (!nodeIds.has(source) || !nodeIds.has(target)) return { ok: false, error: 'connect_nodes references unknown nodes.' };
      if (source === target) return { ok: false, error: 'connect_nodes rejects self references.' };
      if (plan.edges.length >= MAX_EDGES) return { ok: false, error: 'Edge limit reached.' };
      if (raw.label !== undefined && !text(raw.label, 48)) return { ok: false, error: 'connect_nodes label is invalid.' };
      return {
        ok: true,
        command: {
          type: 'connect_nodes',
          edgeId,
          source,
          target,
          ...(text(raw.label, 48) ? { label: (raw.label as string).trim() } : {}),
        },
      };
    }
    case 'delete_edge': {
      const edgeId = id(raw.edgeId);
      if (!edgeId || !edgeIds.has(edgeId)) return { ok: false, error: 'delete_edge targets an unknown edge.' };
      return { ok: true, command: { type: 'delete_edge', edgeId } };
    }
    case 'update_edge': {
      const edgeId = id(raw.edgeId);
      if (!edgeId || !edgeIds.has(edgeId)) return { ok: false, error: 'update_edge targets an unknown edge.' };
      if (raw.label !== undefined && !text(raw.label, 48)) return { ok: false, error: 'update_edge label is invalid.' };
      return {
        ok: true,
        command: {
          type: 'update_edge',
          edgeId,
          ...(text(raw.label, 48) ? { label: (raw.label as string).trim() } : {}),
        },
      };
    }
    case 'focus_node':
    case 'explain_node': {
      const nodeId = id(raw.nodeId);
      if (!nodeId || !nodeIds.has(nodeId)) return { ok: false, error: `${raw.type} targets an unknown node.` };
      // Models sometimes reach for `detail`; accept it as the note alias.
      const note = text(raw.text, 140) ? (raw.text as string).trim() : text(raw.detail, 140) ? (raw.detail as string).trim() : undefined;
      if ((raw.text !== undefined && !text(raw.text, 140)) || (raw.detail !== undefined && !text(raw.detail, 140))) {
        return { ok: false, error: `${raw.type} note is invalid.` };
      }
      return {
        ok: true,
        command: { type: raw.type, nodeId, ...(note ? { text: note } : {}) } as DiagramCommand,
      };
    }
    case 'focus_edge':
    case 'explain_edge': {
      const edgeId = id(raw.edgeId);
      if (!edgeId || !edgeIds.has(edgeId)) return { ok: false, error: `${raw.type} targets an unknown edge.` };
      const note = text(raw.text, 140) ? (raw.text as string).trim() : text(raw.detail, 140) ? (raw.detail as string).trim() : undefined;
      if ((raw.text !== undefined && !text(raw.text, 140)) || (raw.detail !== undefined && !text(raw.detail, 140))) {
        return { ok: false, error: `${raw.type} note is invalid.` };
      }
      return {
        ok: true,
        command: { type: raw.type, edgeId, ...(note ? { text: note } : {}) } as DiagramCommand,
      };
    }
    default:
      return { ok: false, error: 'Unknown diagram command.' };
  }
}

export interface CommandResult {
  index: number;
  ok: boolean;
  error?: string;
}

/**
 * Applies validated commands in order. Mutations preserve stable IDs and
 * positions; deleting a node removes its edges safely. Focus/explain
 * commands never mutate — they are teaching intents for the controller.
 */
export function applyDiagramCommands(
  plan: VisualPlan,
  inputs: unknown[],
): { plan: VisualPlan; results: CommandResult[] } {
  let nodes = plan.nodes.map((node) => ({ ...node }));
  let edges = plan.edges.map((edge) => ({ ...edge }));
  const results: CommandResult[] = [];
  inputs.forEach((input, index) => {
    const checked = validateDiagramCommand({ ...plan, nodes, edges }, input);
    if (!checked.ok) {
      results.push({ index, ok: false, error: checked.error });
      return;
    }
    const command = checked.command;
    switch (command.type) {
      case 'create_node':
        nodes.push({ id: command.nodeId, label: command.label, type: command.nodeType, ...(command.detail ? { detail: command.detail } : {}) });
        break;
      case 'delete_node':
        nodes = nodes.filter((node) => node.id !== command.nodeId);
        edges = edges.filter((edge) => edge.from !== command.nodeId && edge.to !== command.nodeId);
        break;
      case 'update_node':
        nodes = nodes.map((node) =>
          node.id === command.nodeId
            ? { ...node, ...(command.label ? { label: command.label } : {}), ...(command.detail !== undefined ? { detail: command.detail } : {}) }
            : node,
        );
        break;
      case 'connect_nodes':
        edges.push({ id: command.edgeId, from: command.source, to: command.target, ...(command.label ? { label: command.label } : {}) });
        break;
      case 'delete_edge':
        edges = edges.filter((edge) => edge.id !== command.edgeId);
        break;
      case 'update_edge':
        edges = edges.map((edge) => (edge.id === command.edgeId && command.label ? { ...edge, label: command.label } : edge));
        break;
      case 'focus_node':
      case 'focus_edge':
      case 'explain_node':
      case 'explain_edge':
        break;
    }
    results.push({ index, ok: true });
  });
  return { plan: { ...plan, nodes, edges }, results };
}


