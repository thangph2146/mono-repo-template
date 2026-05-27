import { NextResponse } from "next/server";
import graphData from "../../../../.graphify/snapshot/graph.json";
import contextData from "../../../../.graphify/snapshot/context.json";
import type { GraphData, ContextData } from "@ui/lib/graphify-context";

export async function GET() {
  try {
    const payload = {
      graph: graphData as unknown as GraphData,
      context: contextData as unknown as ContextData,
    };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load graphify data" },
      { status: 500 }
    );
  }
}
