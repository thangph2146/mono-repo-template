"use client";

import { useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { GraphData, GraphNode } from "../../lib/graphify-context";
import { nodeColorByCommunity } from "../../lib/graphify-context";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface Props {
  graph: GraphData;
  selectedNode: GraphNode | null;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick?: () => void;
  hiddenNodes?: Set<string>;
  linkedNodes?: Map<string, number>;
}

function createLabelSprite(
  text: string,
  color: string,
  fontSize = 28,
  opacity = 1,
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = Math.max(128, Math.ceil(metrics.width) + 24);
  const h = fontSize + 16;
  canvas.width = w;
  canvas.height = h;

  ctx.fillStyle = `rgba(9,9,11,${0.6 * opacity})`;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(w / 16, h / 16, 1);
  sprite.position.y = 2.2;
  return sprite;
}

export function GraphifyForceGraph3D({
  graph,
  selectedNode,
  onNodeClick,
  onBackgroundClick,
  hiddenNodes,
  linkedNodes,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  const degreeMap = useMemo(() => {
    const d = new Map<string, number>();
    for (const l of graph.links) {
      d.set(l.source, (d.get(l.source) ?? 0) + 1);
      d.set(l.target, (d.get(l.target) ?? 0) + 1);
    }
    return d;
  }, [graph.links]);

  const fgData = useMemo(() => {
    const nodes = graph.nodes
      .filter((n) => !hiddenNodes?.has(n.id))
      .map((n) => {
        const isSelected = n.id === selectedNode?.id;
        const isLinked = linkedNodes?.has(n.id);
        const degree = degreeMap.get(n.id) ?? 0;
        return {
          ...n,
          color: nodeColorByCommunity(n.community),
          val: isSelected ? 10 : isLinked ? 7 : Math.max(3, Math.min(8, 2 + degree * 0.5)),
          __degree: degree,
          __isSelected: isSelected,
          __isLinked: isLinked,
        };
      });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const relatedIds = selectedNode ? new Set([selectedNode.id, ...(linkedNodes?.keys() ?? [])]) : null;
    const links = graph.links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({ ...l, __isRelated: relatedIds ? relatedIds.has(l.source) && relatedIds.has(l.target) : false }));

    return { nodes, links };
  }, [graph, hiddenNodes, selectedNode, linkedNodes, degreeMap]);

  const handleNodeClick = useCallback(
    (node: unknown) => {
      const n = node as GraphNode & { x?: number; y?: number; z?: number };
      onNodeClick(n);
      if (fgRef.current && typeof fgRef.current.cameraPosition === "function" && n.x != null) {
        const dist = 140;
        const ratio = 1 + dist / Math.hypot(n.x, n.y || 0, n.z || 0);
        fgRef.current.cameraPosition(
          { x: n.x * ratio, y: (n.y || 0) * ratio, z: (n.z || 0) * ratio },
          { x: n.x, y: n.y || 0, z: n.z || 0 },
          1200
        );
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={fgData}
        backgroundColor="#09090b"
        nodeLabel={(n: unknown) => (n as GraphNode).label}
        onNodeClick={handleNodeClick}
        onBackgroundClick={onBackgroundClick}
        linkColor={(l: unknown) => (l as { __isRelated?: boolean }).__isRelated ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.04)"}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowColor={(l: unknown) => (l as { __isRelated?: boolean }).__isRelated ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.06)"}
        linkDirectionalParticles={(l: unknown) => (l as { __isRelated?: boolean }).__isRelated ? 4 : 0}
        linkDirectionalParticleWidth={1}
        linkDirectionalParticleSpeed={0.008}
        nodeColor={(n: unknown) => {
          const node = n as GraphNode;
          if (node.id === selectedNode?.id) return "#ffffff";
          if (linkedNodes?.has(node.id)) return "#f59e0b";
          return nodeColorByCommunity(node.community);
        }}
        nodeRelSize={6}
        nodeResolution={16}
        linkWidth={(l: unknown) => (l as { __isRelated?: boolean }).__isRelated ? 2 : 0.3}
        warmupTicks={60}
        cooldownTicks={80}
        nodeThreeObject={(n: unknown) => {
          const node = n as GraphNode & { __degree: number; __isSelected: boolean; __isLinked: boolean; color: string; val: number };
          const group = new THREE.Group();

          const geo = new THREE.SphereGeometry(1, 16, 16);
          const mat = new THREE.MeshLambertMaterial({
            color: node.id === selectedNode?.id ? 0xffffff : linkedNodes?.has(node.id) ? 0xf59e0b : node.color,
            transparent: true,
            opacity: selectedNode && !node.__isSelected && !node.__isLinked ? 0.15 : 0.92,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.scale.setScalar(node.val / 3);
          group.add(mesh);

          const labelColor = node.__isSelected
            ? "#ffffff"
            : node.__isLinked
              ? "#fbbf24"
              : "#a1a1aa";
          const fontSize = node.__isSelected ? 32 : node.__isLinked ? 28 : 20;
          const opacity = node.__isSelected ? 1 : node.__isLinked ? 0.9 : selectedNode ? 0.25 : 0.65;
          const sprite = createLabelSprite(node.label, labelColor, fontSize, opacity);
          group.add(sprite);

          if (node.__isSelected) {
            const ringGeo = new THREE.RingGeometry(1.4, 1.6, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.scale.setScalar(node.val / 3);
            ring.lookAt(new THREE.Vector3(0, 0, 1));
            group.add(ring);
          }

          return group;
        }}
      />
    </div>
  );
}
