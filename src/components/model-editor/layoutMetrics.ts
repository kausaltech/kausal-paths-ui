import type { Edge, Node } from '@xyflow/react';

export type LayoutMetrics = {
  nodes: number;
  edges: number;
  totalEdgeLength: number;
  avgEdgeLength: number;
  edgeLengthStdDev: number;
  crossings: number;
  backwardEdges: number;
  nodeOverlaps: number;
  boundingBox: { width: number; height: number };
  aspectRatio: number;
};

type Seg = { x1: number; y1: number; x2: number; y2: number };
type Rect = { x: number; y: number; w: number; h: number };
type NodeInfo = Rect & { id: string; cx: number; cy: number };

function ccw(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}

function segmentsIntersect(a: Seg, b: Seg) {
  return (
    ccw(a.x1, a.y1, b.x1, b.y1, b.x2, b.y2) !== ccw(a.x2, a.y2, b.x1, b.y1, b.x2, b.y2) &&
    ccw(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1) !== ccw(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2)
  );
}

function lineIntersectsEdge(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
) {
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-10) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function segIntersectsRect(seg: Seg, r: Rect) {
  const { x, y, w, h } = r;
  return (
    lineIntersectsEdge(seg.x1, seg.y1, seg.x2, seg.y2, x, y, x + w, y) ||
    lineIntersectsEdge(seg.x1, seg.y1, seg.x2, seg.y2, x + w, y, x + w, y + h) ||
    lineIntersectsEdge(seg.x1, seg.y1, seg.x2, seg.y2, x + w, y + h, x, y + h) ||
    lineIntersectsEdge(seg.x1, seg.y1, seg.x2, seg.y2, x, y + h, x, y)
  );
}

export function computeLayoutMetrics(nodes: Node[], edges: Edge[]): LayoutMetrics {
  const nodeInfos: NodeInfo[] = nodes.map((n) => {
    const x = n.position.x;
    const y = n.position.y;
    const w = n.measured?.width ?? n.width ?? 150;
    const h = n.measured?.height ?? n.height ?? 50;
    return { id: n.id, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  });
  const nodeMap = new Map(nodeInfos.map((n) => [n.id, n]));

  const segs: Seg[] = [];
  const edgeRefs: { source: string; target: string }[] = [];
  let totalLength = 0;
  let backwardEdges = 0;

  for (const edge of edges) {
    const s = nodeMap.get(edge.source);
    const t = nodeMap.get(edge.target);
    if (!s || !t) continue;
    const dx = t.cx - s.cx;
    const dy = t.cy - s.cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    totalLength += len;
    segs.push({ x1: s.cx, y1: s.cy, x2: t.cx, y2: t.cy });
    edgeRefs.push({ source: edge.source, target: edge.target });
    if (s.cx > t.cx + 5) backwardEdges++;
  }

  const resolvedCount = segs.length;
  const avgLength = resolvedCount ? totalLength / resolvedCount : 0;

  let variance = 0;
  for (const seg of segs) {
    const len = Math.sqrt((seg.x2 - seg.x1) ** 2 + (seg.y2 - seg.y1) ** 2);
    variance += (len - avgLength) ** 2;
  }
  const stdDev = resolvedCount ? Math.sqrt(variance / resolvedCount) : 0;

  let crossings = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const ei = edgeRefs[i], ej = edgeRefs[j];
      if (
        ei.source === ej.source || ei.source === ej.target ||
        ei.target === ej.source || ei.target === ej.target
      ) continue;
      if (segmentsIntersect(segs[i], segs[j])) crossings++;
    }
  }

  let nodeOverlaps = 0;
  for (let i = 0; i < segs.length; i++) {
    const ref = edgeRefs[i];
    for (const node of nodeInfos) {
      if (node.id === ref.source || node.id === ref.target) continue;
      if (segIntersectsRect(segs[i], node)) nodeOverlaps++;
    }
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodeInfos) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + n.w);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y + n.h);
  }
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    nodes: nodes.length,
    edges: edges.length,
    totalEdgeLength: Math.round(totalLength),
    avgEdgeLength: Math.round(avgLength),
    edgeLengthStdDev: Math.round(stdDev),
    crossings,
    backwardEdges,
    nodeOverlaps,
    boundingBox: { width: Math.round(width), height: Math.round(height) },
    aspectRatio: height > 0 ? Math.round((width / height) * 100) / 100 : 0,
  };
}

export function formatMetrics(m: LayoutMetrics): string {
  const backwardPct = m.edges > 0 ? Math.round((m.backwardEdges / m.edges) * 100) : 0;
  return [
    `Layout metrics (${m.nodes} nodes, ${m.edges} edges):`,
    `  Edge length:     ${m.totalEdgeLength.toLocaleString()} px total, ${m.avgEdgeLength} avg ± ${m.edgeLengthStdDev}`,
    `  Crossings:       ${m.crossings.toLocaleString()}`,
    `  Backward edges:  ${m.backwardEdges} (${backwardPct}%)`,
    `  Node overlaps:   ${m.nodeOverlaps.toLocaleString()}`,
    `  Bounding box:    ${m.boundingBox.width} × ${m.boundingBox.height} (aspect ${m.aspectRatio})`,
  ].join('\n');
}
