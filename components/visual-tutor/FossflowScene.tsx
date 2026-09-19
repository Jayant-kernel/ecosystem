import React, { useMemo } from 'react';
import type { VisualPlan } from './visualTypes';

interface FossflowSceneProps { plan: VisualPlan; visibleNodeIds: string[]; visibleEdgeIds: string[]; }

const icon = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="${color}"/><path d="M18 32h28M32 18v28" stroke="white" stroke-width="4" stroke-linecap="round"/></svg>`)}`;
const tileFor = (index: number, total: number) => ({ x: 2 + (index % 3) * 5, y: 2 + Math.floor(index / 3) * Math.max(4, Math.ceil(total / 3) * 2) });

/**
 * FossFLOW owns the portable diagram model and read-only camera layer. The custom
 * teaching overlay above it controls reveal timing and semantic pointer feedback.
 */
export default function FossflowScene({ plan, visibleNodeIds, visibleEdgeIds }: FossflowSceneProps) {
  const [Isoflow, setIsoflow] = React.useState<React.ComponentType<any> | null>(null);
  React.useEffect(() => { let live = true; import('fossflow').then((module) => live && setIsoflow(() => module.Isoflow)).catch(() => live && setIsoflow(null)); return () => { live = false; }; }, []);
  const initialData = useMemo(() => {
    const nodes = plan.nodes.filter((node) => visibleNodeIds.includes(node.id));
    const ids = new Set(nodes.map((node) => node.id));
    return {
      title: plan.title,
      fitToView: true,
      items: nodes.map((node) => ({ id: node.id, name: node.label, description: node.detail, icon: node.type })),
      icons: [...new Set(nodes.map((node) => node.type))].map((type, index) => ({ id: type, name: type, url: icon(['#f97316', '#22d3ee', '#a78bfa', '#10b981', '#facc15'][index % 5]), collection: 'Visual Tutor', isIsometric: false })),
      colors: [{ id: 'accent', value: '#f97316' }],
      views: [{ id: 'lesson', name: plan.title, items: nodes.map((node) => ({ id: node.id, tile: tileFor(plan.nodes.findIndex((item) => item.id === node.id), plan.nodes.length) })), connectors: plan.edges.filter((edge) => visibleEdgeIds.includes(edge.id) && ids.has(edge.from) && ids.has(edge.to)).map((edge) => ({ id: edge.id, description: edge.label, color: 'accent', width: 2, style: 'SOLID', anchors: [{ id: `${edge.id}-from`, ref: { item: edge.from } }, { id: `${edge.id}-to`, ref: { item: edge.to } }] })) }],
    };
  }, [plan, visibleEdgeIds, visibleNodeIds]);
  if (!Isoflow) return null;
  return <div className="visual-fossflow-model" aria-hidden="true"><Isoflow key={JSON.stringify(initialData)} initialData={initialData as any} editorMode="EXPLORABLE_READONLY" mainMenuOptions={[]} width="1px" height="1px" /></div>;
}
