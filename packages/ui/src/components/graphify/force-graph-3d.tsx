"use client"

import { useMemo, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import * as THREE from "three"
import type { GraphData, GraphNode } from "../../lib/graphify-context"
import { nodeColorByCommunity } from "../../lib/graphify-context"

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
})

interface Props {
  graph: GraphData
  selectedNode: GraphNode | null
  onNodeClick: (node: GraphNode) => void
  onBackgroundClick?: () => void
  hiddenNodes?: Set<string>
  linkedNodes?: Map<string, number>
}

function createLabelSprite(
  text: string,
  color: string,
  fontSize = 28,
  opacity = 1
) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`
  const metrics = ctx.measureText(text)
  const w = Math.max(128, Math.ceil(metrics.width) + 24)
  const h = fontSize + 16
  canvas.width = w
  canvas.height = h

  ctx.fillStyle = `rgba(9,9,11,${0.6 * opacity})`
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, w / 2, h / 2)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(w / 16, h / 16, 1)
  sprite.position.y = 2.2
  return sprite
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
  const fgRef = useRef<any>(null)

  const degreeMap = useMemo(() => {
    const d = new Map<string, number>()
    for (const l of graph.links) {
      d.set(l.source, (d.get(l.source) ?? 0) + 1)
      d.set(l.target, (d.get(l.target) ?? 0) + 1)
    }
    return d
  }, [graph.links])

  const fgData = useMemo(() => {
    const nodes = graph.nodes
      .filter((n) => !hiddenNodes?.has(n.id))
      .map((n) => {
        const isSelected = n.id === selectedNode?.id
        const isLinked = linkedNodes?.has(n.id)
        const degree = degreeMap.get(n.id) ?? 0
        return {
          ...n,
          color: nodeColorByCommunity(n.community),
          val: isSelected
            ? 14
            : isLinked
              ? 10
              : Math.max(3, Math.min(8, 2 + degree * 0.5)),
          __degree: degree,
          __isSelected: isSelected,
          __isLinked: isLinked,
        }
      })

    const nodeIds = new Set(nodes.map((n) => n.id))
    const relatedIds = selectedNode
      ? new Set([selectedNode.id, ...(linkedNodes?.keys() ?? [])])
      : null
    const links = graph.links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => {
        const src =
          typeof l.source === "string"
            ? l.source
            : ((l.source as { id?: string })?.id ?? "")
        const tgt =
          typeof l.target === "string"
            ? l.target
            : ((l.target as { id?: string })?.id ?? "")
        const isConnectedToSelected = selectedNode
          ? src === selectedNode.id || tgt === selectedNode.id
          : false
        return {
          ...l,
          __isRelated: relatedIds
            ? relatedIds.has(src) && relatedIds.has(tgt)
            : false,
          __isDirectConnection: isConnectedToSelected,
        }
      })

    return { nodes, links }
  }, [graph, hiddenNodes, selectedNode, linkedNodes, degreeMap])

  const handleNodeClick = useCallback(
    (node: unknown) => {
      const n = node as GraphNode & { x?: number; y?: number; z?: number }
      onNodeClick(n)
      if (
        fgRef.current &&
        typeof fgRef.current.cameraPosition === "function" &&
        n.x != null
      ) {
        const dist = 140
        const ratio = 1 + dist / Math.hypot(n.x, n.y || 0, n.z || 0)
        fgRef.current.cameraPosition(
          { x: n.x * ratio, y: (n.y || 0) * ratio, z: (n.z || 0) * ratio },
          { x: n.x, y: n.y || 0, z: n.z || 0 },
          1200
        )
      }
    },
    [onNodeClick]
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      <ForceGraph3D
        ref={fgRef}
        graphData={fgData}
        backgroundColor="#09090b"
        nodeLabel={(n: unknown) => (n as GraphNode).label}
        onNodeClick={handleNodeClick}
        onBackgroundClick={onBackgroundClick}
        linkThreeObject={(l: unknown) => {
          const link = l as {
            source: { x: number; y: number; z: number }
            target: { x: number; y: number; z: number }
            __isRelated?: boolean
            __isDirectConnection?: boolean
          }
          const start = new THREE.Vector3(
            link.source.x,
            link.source.y,
            link.source.z
          )
          const end = new THREE.Vector3(
            link.target.x,
            link.target.y,
            link.target.z
          )
          const direction = new THREE.Vector3().subVectors(end, start)
          const length = direction.length()
          const isDirect = link.__isDirectConnection ?? false
          const isRelated = link.__isRelated ?? false
          const hasSelection = selectedNode !== null
          const radius = isDirect
            ? 0.6
            : isRelated
              ? 0.4
              : hasSelection
                ? 0.08
                : 0.2

          let color: number
          let opacity: number
          if (isDirect) {
            color = 0xfbbf24
            opacity = 1.0
          } else if (isRelated) {
            color = 0xf59e0b
            opacity = 0.8
          } else if (hasSelection) {
            color = 0x52525b
            opacity = 0.25
          } else {
            color = 0xd4d4d8
            opacity = 0.8
          }
          const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
          })

          const group = new THREE.Group()

          // Cylinder body: dọc +Y mặc định, origin tại midpoint
          const cylinderGeo = new THREE.CylinderGeometry(
            radius,
            radius,
            length,
            8,
            1
          )
          cylinderGeo.rotateX(-Math.PI / 2)
          group.add(new THREE.Mesh(cylinderGeo, material))

          // Mũi tên cone ở đầu target
          const arrowHeight = radius * 6
          const arrowRadius = radius * 3
          const coneGeo = new THREE.ConeGeometry(arrowRadius, arrowHeight, 8)
          coneGeo.rotateX(-Math.PI / 2)
          coneGeo.translate(0, 0, length / 2 - arrowHeight / 2)
          group.add(new THREE.Mesh(coneGeo, material))

          // Glow layer mờ xung quanh link (origin tại midpoint)
          if (isDirect || isRelated || !hasSelection) {
            const glowRadius = radius * 2.5
            const glowGeo = new THREE.CylinderGeometry(
              glowRadius,
              glowRadius,
              length,
              8,
              1
            )
            glowGeo.rotateX(-Math.PI / 2)
            const glowMat = new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: isDirect
                ? 0.04
                : isRelated
                  ? 0.04
                  : hasSelection
                    ? 0.0
                    : 0.1,
              depthWrite: false,
            })
            group.add(new THREE.Mesh(glowGeo, glowMat))
          }

          return group
        }}
        linkPositionUpdate={(
          obj: unknown,
          {
            start,
            end,
          }: {
            start: { x: number; y: number; z: number }
            end: { x: number; y: number; z: number }
          }
        ) => {
          const group = obj as THREE.Group
          group.position.set(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
          )
          group.lookAt(end.x, end.y, end.z)
        }}
        linkDirectionalParticles={(l: unknown) => {
          const link = l as {
            __isRelated?: boolean
            __isDirectConnection?: boolean
          }
          if (link.__isDirectConnection) return 8
          if (link.__isRelated) return 4
          return selectedNode ? 0 : 3
        }}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(l: unknown) => {
          const link = l as {
            __isRelated?: boolean
            __isDirectConnection?: boolean
          }
          if (link.__isDirectConnection) return "rgba(251,191,36,1)"
          if (link.__isRelated) return "rgba(245,158,11,0.9)"
          return selectedNode
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.8)"
        }}
        warmupTicks={80}
        cooldownTicks={80}
        nodeThreeObject={(n: unknown) => {
          const node = n as GraphNode & {
            __degree: number
            __isSelected: boolean
            __isLinked: boolean
            color: string
            val: number
          }
          const group = new THREE.Group()

          const geo = new THREE.SphereGeometry(1, 16, 16)
          const isDimmed =
            selectedNode && !node.__isSelected && !node.__isLinked
          const mat = new THREE.MeshLambertMaterial({
            color: node.__isSelected
              ? 0xffffff
              : node.__isLinked
                ? 0xfbbf24
                : node.color,
            transparent: true,
            opacity: node.__isSelected
              ? 1.0
              : node.__isLinked
                ? 0.95
                : isDimmed
                  ? 0.2
                  : 0.92,
          })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.scale.setScalar(node.val / 3)
          group.add(mesh)

          // Halo glow cho node nổi bật
          if (node.__isSelected || node.__isLinked) {
            const haloGeo = new THREE.SphereGeometry(1, 16, 16)
            const haloMat = new THREE.MeshBasicMaterial({
              color: node.__isSelected ? 0xffffff : 0xfbbf24,
              transparent: true,
              opacity: node.__isSelected ? 0.18 : 0.12,
              depthWrite: false,
            })
            const halo = new THREE.Mesh(haloGeo, haloMat)
            halo.scale.setScalar((node.val / 3) * 1.5)
            group.add(halo)
          }

          const labelColor = node.__isSelected
            ? "#ffffff"
            : node.__isLinked
              ? "#fbbf24"
              : "#a1a1aa"
          const fontSize = node.__isSelected ? 36 : node.__isLinked ? 30 : 20
          const opacity = node.__isSelected
            ? 1
            : node.__isLinked
              ? 0.95
              : selectedNode
                ? 0.3
                : 0.7
          const sprite = createLabelSprite(
            node.label,
            labelColor,
            fontSize,
            opacity
          )
          group.add(sprite)

          if (node.__isSelected) {
            const ringGeo = new THREE.RingGeometry(1.4, 1.65, 32)
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.35,
              side: THREE.DoubleSide,
            })
            const ring = new THREE.Mesh(ringGeo, ringMat)
            ring.scale.setScalar(node.val / 3)
            ring.lookAt(new THREE.Vector3(0, 0, 1))
            group.add(ring)
          }

          if (node.__isLinked) {
            const ringGeo = new THREE.RingGeometry(1.35, 1.55, 32)
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xfbbf24,
              transparent: true,
              opacity: 0.25,
              side: THREE.DoubleSide,
            })
            const ring = new THREE.Mesh(ringGeo, ringMat)
            ring.scale.setScalar(node.val / 3)
            ring.lookAt(new THREE.Vector3(0, 0, 1))
            group.add(ring)
          }

          return group
        }}
      />
    </div>
  )
}
