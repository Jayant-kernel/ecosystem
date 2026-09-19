const ID = /^[a-z][a-z0-9-]{0,47}$/;
const NODE_TYPES = new Set(['client', 'gateway', 'compute', 'database', 'queue', 'storage', 'service', 'user']);
const ACTION_TYPES = new Set(['revealNode', 'revealEdge', 'focus', 'highlightNode', 'pulse', 'annotate', 'dimOthers', 'clearFocus', 'wait', 'finish']);
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

const DIAGRAM_COMMAND_TYPES = new Set(['create_node', 'delete_node', 'update_node', 'connect_nodes', 'delete_edge', 'update_edge', 'focus_node', 'focus_edge', 'explain_node', 'explain_edge']);

/** Server-side guard before untrusted model output reaches the browser. */
export function validateVisualPlan(input) {
  if (!input || typeof input !== 'object' || !text(input.title, 100) || !Array.isArray(input.nodes) || !Array.isArray(input.edges) || !Array.isArray(input.steps)) return false;
  if (input.nodes.length > 16 || input.edges.length > 24 || input.steps.length > 64) return false;
  const nodes = new Set();
  for (const node of input.nodes) {
    if (!node || !text(node.id, 48) || !ID.test(node.id) || nodes.has(node.id) || !text(node.label, 60) || !NODE_TYPES.has(node.type)) return false;
    nodes.add(node.id);
  }
  const edges = new Set();
  for (const edge of input.edges) {
    if (!edge || !text(edge.id, 48) || !ID.test(edge.id) || edges.has(edge.id) || !nodes.has(edge.from) || !nodes.has(edge.to) || edge.from === edge.to || (edge.label !== undefined && !text(edge.label, 48))) return false;
    edges.add(edge.id);
  }
  for (const step of input.steps) {
    if (!step || !ACTION_TYPES.has(step.type)) return false;
    const nodeAction = ['revealNode', 'focus', 'highlightNode', 'pulse', 'annotate', 'dimOthers'].includes(step.type);
    if ((nodeAction && !nodes.has(step.target)) || (step.type === 'revealEdge' && !edges.has(step.target))) return false;
    if (step.text !== undefined && !text(step.text, 140)) return false;
    if (step.durationMs !== undefined && (!Number.isInteger(step.durationMs) || step.durationMs < 0 || step.durationMs > 6000)) return false;
  }
  return true;
}

export function sanitizeVisualToolCalls(calls = []) {
  return calls.filter((call) => {
    if (call?.name === 'presentVisualExplanation') return validateVisualPlan(call.args);
    if (call?.name === 'offerVisualExplanation') return text(call.args?.topic, 100) && (call.args?.reason === undefined || text(call.args.reason, 160));
    if (call?.name === 'updateVisualExplanation') return Array.isArray(call.args?.actions) && call.args.actions.length <= 12 && call.args.actions.every((step) => step && ACTION_TYPES.has(step.type) && (step.target === undefined || (text(step.target, 48) && ID.test(step.target))) && (step.text === undefined || text(step.text, 140)));
    if (call?.name === 'modifyVisualDiagram') return Array.isArray(call.args?.actions) && call.args.actions.length >= 1 && call.args.actions.length <= 8 && call.args.actions.every((action) => action && DIAGRAM_COMMAND_TYPES.has(action.type));
    return true;
  });
}
