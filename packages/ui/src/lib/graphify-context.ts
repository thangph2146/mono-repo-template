/**
 * Graphify Context — Shared codebase understanding layer.
 *
 * Provides typed access to graph.json + context.json so both
 * the AI assistant and the 3D visualisation can reason about the
 * project structure, dependencies, and functions in real time.
 */

export interface GraphNode {
  id: string
  label: string
  file_type: string
  source_file: string
  source_location: string
  community: string | number
  community_name: string
}

export interface GraphLink {
  source: string
  target: string
  relation: string
  confidence: string
  source_file: string
  source_location: string
  weight: number
  confidence_score: number
}

export interface GraphData {
  directed: boolean
  multigraph: boolean
  graph: {
    community_labels: Record<string, string>
  }
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface FileEntry {
  id: string
  type: string
  client: boolean
  exports: string[]
  imports: string[]
  importedBy: string[]
  content?: string
}

export interface ContextData {
  generatedAt: string
  projectRoot: string
  summary: {
    totalFiles: number
    clientComponents: number
    pages: string[]
    layouts: string[]
    apiRoutes: string[]
  }
  files: Record<string, FileEntry>
}

export interface GraphifyPayload {
  graph: GraphData
  context: ContextData
}

/* ---------- Colour palette per community ---------- */
const COMMUNITY_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
]

export function nodeColorByCommunity(community: string | number) {
  if (typeof community === "string") {
    let hash = 0
    for (let i = 0; i < community.length; i++) {
      hash = community.charCodeAt(i) + ((hash << 5) - hash)
    }
    return (
      COMMUNITY_COLORS[Math.abs(hash) % COMMUNITY_COLORS.length] ?? "#64748b"
    )
  }
  return COMMUNITY_COLORS[community % COMMUNITY_COLORS.length] ?? "#64748b"
}

/* ---------- Type badge helpers ---------- */
const TYPE_EMOJI: Record<string, string> = {
  page: "📄",
  layout: "🖼️",
  styles: "🎨",
  code: "💻",
  tsx: "⚛️",
  ts: "📘",
  component: "🧩",
  hook: "🪝",
  util: "🔧",
}

export function emojiForType(t?: string) {
  return TYPE_EMOJI[t ?? "code"] ?? "📦"
}

/* ---------- AI helpers ---------- */

export function resolveSourceFile(node: GraphNode, context: ContextData) {
  return context.files[node.source_file]?.type ?? node.file_type
}

export function exportsOfFile(path: string, context: ContextData) {
  return context.files[path]?.exports ?? []
}

export function importedBy(path: string, context: ContextData) {
  return context.files[path]?.importedBy ?? []
}

export function importsOf(path: string, context: ContextData) {
  return context.files[path]?.imports ?? []
}

export function getLinkedNodes(nodeId: string, graph: GraphData, maxDepth = 1) {
  const visited = new Map<string, number>()
  visited.set(nodeId, 0)
  const queue: [string, number][] = [[nodeId, 0]]

  while (queue.length) {
    const [cur, depth] = queue.shift()!
    if (depth >= maxDepth) continue

    for (const link of graph.links) {
      const other =
        link.source === cur
          ? link.target
          : link.target === cur
            ? link.source
            : null
      if (other && !visited.has(other)) {
        visited.set(other, depth + 1)
        queue.push([other, depth + 1])
      }
    }
  }

  visited.delete(nodeId)
  return visited
}

export function communityBreakdown(graph: GraphData) {
  const map = new Map<string | number, GraphNode[]>()
  for (const n of graph.nodes) {
    const arr = map.get(n.community) ?? []
    arr.push(n)
    map.set(n.community, arr)
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
}

export function routeFiles(context: ContextData) {
  return Object.entries(context.files).filter(([, v]) =>
    ["page", "layout", "api"].includes(v.type)
  )
}

export function communityName(nodes: GraphNode[]) {
  const types = new Map<string, number>()
  let hasPage = false,
    hasLayout = false,
    hasApi = false,
    hasHook = false,
    hasComponent = false
  for (const n of nodes) {
    types.set(n.file_type, (types.get(n.file_type) ?? 0) + 1)
    if (n.file_type === "page" || n.source_file?.includes("/page"))
      hasPage = true
    if (n.file_type === "layout" || n.source_file?.includes("/layout"))
      hasLayout = true
    if (n.file_type === "api" || n.source_file?.includes("/api")) hasApi = true
    if (
      n.file_type === "hook" ||
      (n.label.endsWith("()") &&
        (n.source_file?.includes("/hooks/") || n.source_file?.includes("use")))
    )
      hasHook = true
    if (n.file_type === "component" || n.source_file?.includes("/components/"))
      hasComponent = true
  }
  const sorted = [...types.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted[0]?.[0] ?? ""

  if (hasPage && hasLayout) return "App Shell"
  if (hasPage) return "Pages"
  if (hasLayout) return "Layouts"
  if (hasApi) return "API Routes"
  if (hasHook && hasComponent) return "UI + Hooks"
  if (hasComponent) return "UI Components"
  if (hasHook) return "Hooks & Utils"
  if (top === "styles" || top === "css") return "Styles"
  if (top === "code" && nodes.some((n) => n.source_file?.includes("config")))
    return "Config"
  if (
    nodes.some(
      (n) => n.source_file?.includes("lib/") || n.source_file?.includes("utils")
    )
  )
    return "Lib & Utils"
  if (nodes.some((n) => n.source_file?.includes("types"))) return "Types"
  return top ? top[0]?.toUpperCase() + top.slice(1) + "s" : "Mixed"
}

export function topHubs(context: ContextData, limit = 10) {
  return Object.entries(context.files)
    .map(([path, f]) => ({
      path,
      count: (f.importedBy ?? []).length,
      exports: f.exports ?? [],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
