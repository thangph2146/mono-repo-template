import { NextResponse } from "next/server";
import graphData from "../../../../.graphify/graph.json";
import contextData from "../../../../.graphify/context.json";
import type { GraphData, ContextData } from "@/lib/graphify-context";

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
