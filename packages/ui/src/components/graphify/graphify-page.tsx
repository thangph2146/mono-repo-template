"use client"

import { useGraphify } from "../../hooks/use-graphify"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "../button"
import { Input } from "../input"
import { Badge } from "../badge"
import { Skeleton } from "../skeleton"
import { ScrollArea } from "../scroll-area"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../collapsible"
import { nodeColorByCommunity } from "../../lib/graphify-context"
import type { GraphNode } from "../../lib/graphify-context"
import { Heading, Text } from "../typography"
import { GraphifyForceGraph3D } from "./force-graph-3d"
import { cn } from "../../lib/utils"
import {
  Network,
  RefreshCw,
  AlertTriangle,
  Search,
  GripHorizontal,
  MousePointerClick,
  Maximize2,
  X,
  ChevronRight,
  Folder,
} from "lucide-react"

const TYPE_ICON: Record<string, React.ReactNode> = {
  page: <span className="text-blue-400">●</span>,
  layout: <span className="text-orange-400">■</span>,
  component: <span className="text-violet-400">◆</span>,
  hook: <span className="text-emerald-400">⚡</span>,
  util: <span className="text-cyan-400">◇</span>,
  styles: <span className="text-pink-400">▪</span>,
  code: <span className="text-zinc-400">○</span>,
  tsx: <span className="text-violet-300">⚛</span>,
  ts: <span className="text-blue-300">⊃</span>,
  api: <span className="text-amber-400">⚡</span>,
}

type TreeFolder = {
  name: string
  path: string
  children: Record<string, TreeFolder>
  files: GraphNode[]
}

function FolderNode({
  folder,
  selectedNode,
  linkedNodes,
  onNodeClick,
  defaultOpen = false,
}: {
  folder: TreeFolder
  selectedNode: GraphNode | null
  linkedNodes: Map<string, number>
  onNodeClick: (id: string) => void
  defaultOpen?: boolean
}) {
  const hasChildren = Object.keys(folder.children).length > 0
  const hasFiles = folder.files.length > 0

  if (!hasChildren && !hasFiles) return null

  const color = nodeColorByCommunity(
    folder.path === "" || folder.path === "Project" ? "root" : folder.path
  )

  return (
    <Collapsible defaultOpen={defaultOpen} className="w-full">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50">
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />
        <Folder
          className="size-4 shrink-0 transition-colors"
          style={{ color: color, fill: color, fillOpacity: 0.2 }}
        />
        <span className="truncate text-body-sm font-medium text-foreground">
          {folder.name || "Project"}
        </span>
        {(hasFiles || hasChildren) && (
          <Badge
            variant="outline"
            className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center border-border/50 bg-muted/60 px-1 text-[10px] leading-none text-muted-foreground"
          >
            {folder.files.length + Object.keys(folder.children).length}
          </Badge>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-0.5 ml-2 space-y-0.5 border-l border-border/40 pl-3">
          {Object.values(folder.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FolderNode
                key={child.path}
                folder={child}
                selectedNode={selectedNode}
                linkedNodes={linkedNodes}
                onNodeClick={onNodeClick}
              />
            ))}

          {folder.files.map((n) => {
            const isSelected = selectedNode?.id === n.id
            const isLinked = linkedNodes.has(n.id)
            return (
              <div
                key={n.id}
                onClick={() => onNodeClick(n.id)}
                className={`mt-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-body-sm transition-colors ${
                  isSelected
                    ? "bg-primary/20 font-semibold text-foreground"
                    : isLinked
                      ? "bg-warning/15 text-warning"
                      : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="flex w-4 shrink-0 items-center justify-center">
                  {TYPE_ICON[n.file_type] ?? TYPE_ICON.code}
                </span>
                <span className="min-w-0 flex-1 truncate">{n.label}</span>
                {isSelected && (
                  <span className="text-caption font-bold text-primary">★</span>
                )}
                {isLinked && !isSelected && (
                  <span className="text-caption text-amber-500">→</span>
                )}
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export interface GraphifyPageProps {
  _homeHref?: string
  _homeLabel?: string
  apiPath?: string
  /**
   * When `true`, the graph view fills the parent container's height
   * (used in admin shell where Page/PageContent wrappers are skipped).
   * When `false` (default), it uses `min-h-screen` for standalone pages.
   */
  sticky?: boolean
  /** Class overrides for fine-tuning layout per app context. */
  classes?: {
    /** Root container (default: `flex h-full w-full flex-col` or `min-h-screen flex w-full flex-col`) */
    root?: string
    /** Header bar */
    header?: string
    /** Left sidebar container */
    sidebar?: string
    /** ScrollArea inside sidebar */
    scrollArea?: string
    /** Graph area container */
    graphArea?: string
    /** Hints overlay at bottom-right */
    hints?: string
  }
}

export function GraphifyPage({
  _homeHref = "/",
  _homeLabel = "Home",
  apiPath = "/api/graphify",
  classes = {},
}: GraphifyPageProps) {
  const {
    data,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    linkedNodes,
    communities,
    refresh,
  } = useGraphify(apiPath, 2)
  const [search, setSearch] = useState("")

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCommunities = useMemo(() => {
    if (!data) return communities
    let result = communities
    if (selectedNode) {
      const allowed = new Set([selectedNode.id, ...linkedNodes.keys()])
      result = communities.map(([id, nodes]) => [
        id,
        nodes.filter((n) => allowed.has(n.id)),
      ]) as typeof communities
    }
    if (!search.trim()) return result
    const q = search.toLowerCase()
    return result.map(([id, nodes]) => [
      id,
      nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.source_file.toLowerCase().includes(q)
      ),
    ]) as typeof communities
  }, [communities, search, data, selectedNode, linkedNodes])

  const folderTree = useMemo(() => {
    const tree: TreeFolder = {
      name: "Project",
      path: "",
      children: {},
      files: [],
    }
    filteredCommunities.forEach(([id, nodes]) => {
      if (nodes.length === 0 && search) return
      let current = tree
      const idStr = String(id)
      if (idStr !== "root") {
        const parts = idStr.split("/")
        let currentPath = ""
        for (const part of parts) {
          if (!part) continue
          currentPath = currentPath ? `${currentPath}/${part}` : part
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: currentPath,
              children: {},
              files: [],
            }
          }
          current = current.children[part]
        }
      }
      current.files.push(...nodes)
    })
    return tree
  }, [filteredCommunities, search])

  const handleNodeClick = useCallback(
    (id: string) => {
      const node = data?.graph.nodes.find((n) => n.id === id) ?? null
      setSelectedNode(node)
    },
    [data, setSelectedNode]
  )

  if (loading && !data) {
    return (
      <div className={classes.root ?? "flex h-full w-full flex-col"}>
        <header
          className={cn(
            "sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur",
            classes.header
          )}
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex min-h-0 flex-1">
          <Skeleton className="h-full w-72" />
          <Skeleton className="h-full flex-1" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={classes.root ?? "flex h-full flex-col"}>
        <div className="flex flex-1 items-center justify-center gap-4 text-foreground">
          <AlertTriangle className="size-10 text-destructive" />
          <Heading as="h1" size="title">
            Failed to load graph data
          </Heading>
          <Text variant="muted">{error}</Text>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="mr-2 size-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={classes.root ?? "flex h-full w-full flex-col"}>
      {/* ── HEADER ── */}
      <header
        className={cn(
          "sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur",
          classes.header
        )}
      >
        <Network className="size-4 text-primary" />
        <Text variant="body" className="font-semibold text-foreground">
          Graphify 3D Architecture
        </Text>
        <div className="ml-2 hidden items-center gap-1.5 sm:flex">
          {selectedNode ? (
            <>
              <Badge
                variant="outline"
                className="border-warning/40 bg-warning/10 text-caption text-warning"
              >
                {1 + linkedNodes.size} / {data.graph.nodes.length} visible
              </Badge>
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-caption text-foreground"
              >
                {communities.length} communities
              </Badge>
            </>
          ) : (
            <>
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-caption text-foreground"
              >
                {data.graph.nodes.length} nodes
              </Badge>
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-caption text-foreground"
              >
                {data.graph.links.length} links
              </Badge>
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-caption text-foreground"
              >
                {communities.length} communities
              </Badge>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            title="Refresh data"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── LEFT SIDEBAR ── */}
        <div
          className={cn(
            "flex w-72 shrink-0 flex-col border-r border-border/50 bg-card xl:w-80",
            classes.sidebar
          )}
        >
          {selectedNode && (
            <div className="flex items-center gap-2 px-3 pt-2">
              <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-caption text-amber-300">
                Focus: {linkedNodes.size} linked
              </span>
              <span className="text-caption text-muted-foreground">
                Click elsewhere to clear
              </span>
            </div>
          )}

          <div className="shrink-0 border-b border-border/40 p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-border bg-background pl-8 text-body-sm"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea
            className={cn(
              "max-h-[calc(100vh-12rem)] flex-1",
              classes.scrollArea
            )}
          >
            <div className="p-3">
              <FolderNode
                folder={folderTree}
                selectedNode={selectedNode}
                linkedNodes={linkedNodes}
                onNodeClick={handleNodeClick}
                defaultOpen={true}
              />
            </div>
          </ScrollArea>
        </div>

        {/* ── GRAPH AREA ── */}
        <div className={cn("relative min-w-0 flex-1", classes.graphArea)}>
          <GraphifyForceGraph3D
            graph={data.graph}
            selectedNode={selectedNode}
            onNodeClick={(n) => setSelectedNode(n)}
            onBackgroundClick={() => setSelectedNode(null)}
            linkedNodes={linkedNodes}
          />

          <div
            className={cn(
              "absolute right-3 bottom-3 rounded-lg border border-border/30 bg-background/80 px-3 py-2 backdrop-blur",
              classes.hints
            )}
          >
            <div className="flex items-center gap-3 text-caption text-muted-foreground">
              <span className="flex items-center gap-1">
                <GripHorizontal className="size-3" /> Drag to rotate
              </span>
              <span className="flex items-center gap-1">
                <Maximize2 className="size-3" /> Scroll to zoom
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="size-3" /> Click to select
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
