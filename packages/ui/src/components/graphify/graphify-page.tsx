"use client";

import { useGraphify } from "../../hooks/use-graphify";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Badge } from "../badge";
import { Separator } from "../separator";
import { Skeleton } from "../skeleton";
import { ScrollArea } from "../scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible";
import { nodeColorByCommunity } from "../../lib/graphify-context";
import type { GraphNode } from "../../lib/graphify-context";
import { Heading, Text } from "../typography";
import { GraphifyForceGraph3D } from "./force-graph-3d";
import {
  Network,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Search,
  GripHorizontal,
  MousePointerClick,
  Maximize2,
  X,
  ChevronRight,
  Folder,
} from "lucide-react";

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
};

type TreeFolder = {
  name: string;
  path: string;
  children: Record<string, TreeFolder>;
  files: GraphNode[];
};

function FolderNode({
  folder,
  selectedNode,
  linkedNodes,
  onNodeClick,
  defaultOpen = false
}: {
  folder: TreeFolder;
  selectedNode: GraphNode | null;
  linkedNodes: Map<string, number>;
  onNodeClick: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const hasChildren = Object.keys(folder.children).length > 0;
  const hasFiles = folder.files.length > 0;

  if (!hasChildren && !hasFiles) return null;

  const color = nodeColorByCommunity(folder.path === "" || folder.path === "Project" ? "root" : folder.path);

  return (
    <Collapsible defaultOpen={defaultOpen} className="w-full">
      <CollapsibleTrigger className="group flex items-center gap-1.5 w-full px-2 py-1.5 text-left hover:bg-muted/50 transition-colors cursor-pointer rounded-md">
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 shrink-0" />
        <Folder
          className="size-4 shrink-0 transition-colors"
          style={{ color: color, fill: color, fillOpacity: 0.2 }}
        />
        <span className="text-body-sm font-medium text-foreground truncate">
          {folder.name || "Project"}
        </span>
        {(hasFiles || hasChildren) && (
          <Badge variant="outline" className="text-[10px] h-4 min-w-4 px-1 ml-auto shrink-0 bg-muted/60 border-border/50 text-muted-foreground leading-none flex items-center justify-center">
            {folder.files.length + Object.keys(folder.children).length}
          </Badge>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-3 ml-2 border-l border-border/40 space-y-0.5 mt-0.5">
          {Object.values(folder.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(child => (
              <FolderNode
                key={child.path}
                folder={child}
                selectedNode={selectedNode}
                linkedNodes={linkedNodes}
                onNodeClick={onNodeClick}
              />
            ))}

          {folder.files.map(n => {
            const isSelected = selectedNode?.id === n.id;
            const isLinked = linkedNodes.has(n.id);
            return (
              <div
                key={n.id}
                onClick={() => onNodeClick(n.id)}
                className={`flex items-center gap-2 px-2 py-1 mt-0.5 text-body-sm cursor-pointer transition-colors rounded-md ${isSelected
                  ? "bg-primary/20 text-foreground font-semibold"
                  : isLinked
                    ? "bg-warning/15 text-warning"
                    : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <span className="shrink-0 flex items-center justify-center w-4">
                  {TYPE_ICON[n.file_type] ?? TYPE_ICON.code}
                </span>
                <span className="flex-1 truncate min-w-0">
                  {n.label}
                </span>
                {isSelected && (
                  <span className="text-caption text-primary font-bold">★</span>
                )}
                {isLinked && !isSelected && (
                  <span className="text-caption text-amber-500">→</span>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface GraphifyPageProps {
  homeHref?: string;
  homeLabel?: string;
  apiPath?: string;
}

export function GraphifyPage({
  homeHref = "/",
  homeLabel = "Home",
  apiPath = "/api/graphify",
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
  } = useGraphify(apiPath, 2);
  const [search, setSearch] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCommunities = useMemo(() => {
    if (!data) return communities;
    let result = communities;
    if (selectedNode) {
      const allowed = new Set([selectedNode.id, ...linkedNodes.keys()]);
      result = communities.map(([id, nodes]) => [
        id,
        nodes.filter((n) => allowed.has(n.id)),
      ]) as typeof communities;
    }
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.map(([id, nodes]) => [
      id,
      nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.source_file.toLowerCase().includes(q),
      ),
    ]) as typeof communities;
  }, [communities, search, data, selectedNode, linkedNodes]);

  const folderTree = useMemo(() => {
    const tree: TreeFolder = { name: "Project", path: "", children: {}, files: [] };
    filteredCommunities.forEach(([id, nodes]) => {
      if (nodes.length === 0 && search) return;
      let current = tree;
      const idStr = String(id);
      if (idStr !== "root") {
        const parts = idStr.split("/");
        let currentPath = "";
        for (const part of parts) {
          if (!part) continue;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: currentPath,
              children: {},
              files: [],
            };
          }
          current = current.children[part];
        }
      }
      current.files.push(...nodes);
    });
    return tree;
  }, [filteredCommunities, search]);

  const handleNodeClick = useCallback(
    (id: string) => {
      const node = data?.graph.nodes.find((n) => n.id === id) ?? null;
      setSelectedNode(node);
    },
    [data, setSelectedNode],
  );

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3 shrink-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex-1 flex">
          <Skeleton className="w-72 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
        <AlertTriangle className="size-10 text-destructive" />
        <Heading as="h1" size="title">
          Failed to load graph data
        </Heading>
        <Text variant="muted">{error}</Text>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="mr-2 size-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur px-4 py-3 flex items-center gap-3 shrink-0">
        <Network className="size-4 text-primary" />
        <Text variant="body" className="font-semibold text-foreground">
          Graphify 3D Architecture
        </Text>
        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          {selectedNode ? (
            <>
              <Badge
                variant="outline"
                className="text-caption text-warning border-warning/40 bg-warning/10"
              >
                {1 + linkedNodes.size} / {data.graph.nodes.length} visible
              </Badge>
              <Badge
                variant="outline"
                className="text-caption text-foreground border-border bg-muted/60"
              >
                {communities.length} communities
              </Badge>
            </>
          ) : (
            <>
              <Badge
                variant="outline"
                className="text-caption text-foreground border-border bg-muted/60"
              >
                {data.graph.nodes.length} nodes
              </Badge>
              <Badge
                variant="outline"
                className="text-caption text-foreground border-border bg-muted/60"
              >
                {data.graph.links.length} links
              </Badge>
              <Badge
                variant="outline"
                className="text-caption text-foreground border-border bg-muted/60"
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

      <div className="flex flex-1 h-[calc(100vh-57px)]">
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-72 xl:w-80 shrink-0 border-r border-border/50 bg-card flex flex-col">
          {selectedNode && (
            <div className="px-3 pt-2 flex items-center gap-2">
              <span className="text-caption px-2 py-1 rounded-md border bg-amber-500/15 text-amber-300 border-amber-500/30">
                Focus: {linkedNodes.size} linked
              </span>
              <span className="text-caption text-muted-foreground">
                Click elsewhere to clear
              </span>
            </div>
          )}

          <div className="p-3 border-b border-border/40 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-body-sm bg-background border-border"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
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
        <div className="flex-1 min-w-0 relative sticky top-[57px] h-[calc(100vh-57px)]">
          <GraphifyForceGraph3D
            graph={data.graph}
            selectedNode={selectedNode}
            onNodeClick={(n) => setSelectedNode(n)}
            onBackgroundClick={() => setSelectedNode(null)}
            linkedNodes={linkedNodes}
          />

          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur rounded-lg border border-border/30 px-3 py-2">
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
  );
}
