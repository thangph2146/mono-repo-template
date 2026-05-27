"use client"

import { useEffect, useState, useRef } from "react"
import { GitBranch, KeyRound, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Badge } from "@ui/components/badge"
import { Button } from "@ui/components/button"
import { PageSection } from "@ui/components/layout"
import { cn } from "@ui/lib/utils"
import { AdminPageGuard } from "@/components/admin-page-guard"
import { api } from "@/lib/api"

type ColumnKind = "pk" | "fk" | "field"

type SchemaColumn = {
  name: string
  type: string
  kind?: ColumnKind
  nullable?: boolean
  references?: string
}

type SchemaTable = {
  name: string
  domain: string
  description: string
  columns: SchemaColumn[]
}

type SchemaRelation = {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  cardinality: "many-to-one" | "one-to-one" | "self"
  deleteRule?: "cascade" | "set null" | "restrict"
  note?: string
}

type TablePosition = {
  x: number
  y: number
  width: number
  height: number
}

const domainClassNames: Record<string, string> = {
  Identity:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
  Auth: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300",
  Student:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  Support:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  Content:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
  Messaging:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300",
  System:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
}

function SchemaCanvas({
  tables,
  relations,
}: {
  tables: SchemaTable[]
  relations: SchemaRelation[]
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState<Record<string, TablePosition>>(() => {
    // Auto-layout tables in a grid by domain with dynamic spacing
    // Identity (users) placed in the middle
    const domainOrder = ["Auth", "Student", "Support", "Identity", "Content", "Messaging", "System"]
    const pos: Record<string, TablePosition> = {}
    const domainPositions: Record<string, { x: number; nextY: number }> = {}
    const domainSpacing = 700

    domainOrder.forEach((domain, idx) => {
      domainPositions[domain] = { x: idx * domainSpacing, nextY: 0 }
    })

    tables.forEach((table) => {
      const domainPos = domainPositions[table.domain] || { x: 0, nextY: 0 }
      const tableHeight = Math.max(250, table.columns.length * 50 + 100)
      pos[table.name] = {
        x: domainPos.x,
        y: domainPos.nextY,
        width: 480,
        height: tableHeight,
      }
      // Update next Y position for this domain with padding
      domainPositions[table.domain] = {
        x: domainPos.x,
        nextY: domainPos.nextY + tableHeight + 80, // 80px padding between tables
      }
    })

    return pos
  })

  const [dragging, setDragging] = useState<{ table: string; offsetX: number; offsetY: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent, tableName: string) => {
    const pos = positions[tableName]
    if (!pos) return
    setDragging({
      table: tableName,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setPositions((prev) => ({
      ...prev,
      [dragging.table]: {
        ...prev[dragging.table],
        x: e.clientX - dragging.offsetX,
        y: e.clientY - dragging.offsetY,
      },
    }))
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  // Calculate canvas dimensions to fit all tables
  const canvasWidth = Math.max(...Object.values(positions).map(p => p.x + p.width)) + 100
  const canvasHeight = Math.max(...Object.values(positions).map(p => p.y + p.height)) + 100

  return (
    <>
      <div className="z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleResetZoom}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
        >
          <ZoomIn className="size-4" />
        </Button>
        <span className="flex items-center text-sm font-mono bg-background px-2 py-1 rounded border">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div
        ref={canvasRef}
        className="relative w-full overflow-auto border bg-muted/20 p-4 rounded-lg"
        style={{ height: 'calc(100vh - 300px)', minHeight: '80vh' }}
      >
        {/* Zoom Controls */}

        <div
          className="relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {relations.map((rel, idx) => {
              const fromPos = positions[rel.fromTable]
              const toPos = positions[rel.toTable]
              if (!fromPos || !toPos) return null

              const fromX = fromPos.x + fromPos.width / 2
              const fromY = fromPos.y + fromPos.height / 2
              const toX = toPos.x + toPos.width / 2
              const toY = toPos.y + toPos.height / 2

              // Calculate label position (midpoint)
              const midX = (fromX + toX) / 2
              const midY = (fromY + toY) / 2

              return (
                <g key={`${rel.fromTable}-${rel.toTable}-${idx}`}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted-foreground opacity-60"
                  />
                  <circle cx={fromX} cy={fromY} r="6" fill="currentColor" className="text-primary" />
                  <circle cx={toX} cy={toY} r="6" fill="currentColor" className="text-primary" />
                  {/* Cardinality label */}
                  <rect
                    x={midX - 20}
                    y={midY - 10}
                    width={40}
                    height={20}
                    fill="currentColor"
                    className="bg-background opacity-90"
                    rx="4"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    className="text-primary-foreground"
                  >
                    {rel.cardinality === 'many-to-one' ? 'N:1' : rel.cardinality === 'one-to-one' ? '1:1' : 'self'}
                  </text>
                </g>
              )
            })}
          </svg>

          {tables.map((table) => {
            const pos = positions[table.name]
            if (!pos) return null

            return (
              <div
                key={table.name}
                className="absolute cursor-move overflow-hidden rounded-lg border-2 bg-card shadow-lg"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: pos.width,
                }}
                onMouseDown={(e) => handleMouseDown(e, table.name)}
              >
                <div
                  className={cn(
                    "border-b-2 bg-muted/40 px-4 py-3",
                    domainClassNames[table.domain],
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold">{table.name}</span>
                    <Badge variant="outline" className={cn("text-xs", domainClassNames[table.domain])}>
                      {table.domain}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm opacity-80">{table.description}</p>
                </div>
                <div className="divide-y p-3">
                  {table.columns.map((column) => (
                    <div
                      key={column.name}
                      className="flex items-center justify-between gap-2 py-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {column.kind === "pk" && <KeyRound className="size-4 text-primary" />}
                        {column.kind === "fk" && <GitBranch className="size-4 text-muted-foreground" />}
                        <span className="truncate font-mono font-medium">{column.name}</span>
                        {column.nullable && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            NULL
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-muted-foreground text-sm">{column.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function DatabaseSchemaPageInner() {
  const [schema, setSchema] = useState<{ tables: SchemaTable[]; relations: SchemaRelation[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSchema() {
      try {
        setLoading(true)
        setError(null)
        const response = await api.system.getDatabaseSchema()
        setSchema(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load database schema')
        console.error('Failed to load database schema:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSchema()
  }, [])

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Đang tải sơ đồ CSDL...</p>
        </div>
      </PageSection>
    )
  }

  if (error || !schema) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-destructive">{error || 'Không thể tải dữ liệu'}</p>
        </div>
      </PageSection>
    )
  }

  const { tables: schemaTables, relations: schemaRelations } = schema

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <SchemaCanvas tables={schemaTables} relations={schemaRelations} />
    </PageSection>
  )
}

export default function DatabaseSchemaPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <DatabaseSchemaPageInner />
    </AdminPageGuard>
  )
}
