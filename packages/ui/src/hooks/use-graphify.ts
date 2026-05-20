"use client"

import { useState, useCallback } from "react"
import type { GraphifyPayload, GraphNode } from "../lib/graphify-context"
import {
  getLinkedNodes,
  communityBreakdown,
  topHubs,
  routeFiles,
} from "../lib/graphify-context"

export interface UseGraphifyReturn {
  data: GraphifyPayload | null
  loading: boolean
  error: string | null
  selectedNode: GraphNode | null
  setSelectedNode: (n: GraphNode | null) => void
  linkedNodes: Map<string, number>
  communities: ReturnType<typeof communityBreakdown>
  hubs: ReturnType<typeof topHubs>
  routes: ReturnType<typeof routeFiles>
  refresh: () => Promise<void>
}

export function useGraphify(
  apiPath = "/api/graphify",
  maxDegree = 1
): UseGraphifyReturn {
  const [data, setData] = useState<GraphifyPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiPath)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload: GraphifyPayload = await res.json()
      setData(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  const linkedNodes =
    selectedNode && data
      ? getLinkedNodes(selectedNode.id, data.graph, maxDegree)
      : new Map<string, number>()

  return {
    data,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    linkedNodes,
    communities: data ? communityBreakdown(data.graph) : [],
    hubs: data ? topHubs(data.context) : [],
    routes: data ? routeFiles(data.context) : [],
    refresh,
  }
}
