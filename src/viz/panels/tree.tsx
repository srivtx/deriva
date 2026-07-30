"use client"

import { useMemo } from "react"
import { hierarchy, tree } from "d3-hierarchy"

// Tree node structure
export interface TreeNode {
  id: string
  value: number | string
  left?: TreeNode | null
  right?: TreeNode | null
  state?: "untouched" | "active" | "settled" | "cached" | "pruned"
}

interface TreePanelProps {
  root: TreeNode | null
  width?: number
  height?: number
}

// Convert our tree structure to d3 hierarchy
function toD3Tree(node: TreeNode | null): { name: string; children: ({ name: string; children: unknown[] } | null)[] } | null {
  if (!node) return null
  return {
    name: String(node.value),
    children: [
      toD3Tree(node.left ?? null),
      toD3Tree(node.right ?? null),
    ].filter(Boolean) as ({ name: string; children: unknown[] } | null)[],
  }
}

const stateColors: Record<string, string> = {
  untouched: "var(--viz-untouched)",
  active:    "var(--viz-active)",
  settled:   "var(--viz-settled)",
  cached:    "var(--viz-cached)",
  pruned:    "var(--viz-pruned)",
}

export function TreePanel({ root, width = 600, height = 400 }: TreePanelProps) {
  const d3Root = useMemo(() => {
    if (!root) return null
    const data = toD3Tree(root)
    if (!data) return null
    const h = hierarchy(data as any)
    const treeLayout = tree().size([width - 40, height - 40])
    treeLayout(h)
    return h
  }, [root, width, height])

  if (!d3Root) {
    return <div style={{ padding: "2rem", color: "var(--ink-soft)" }}>No tree data</div>
  }

  return (
    <svg width={width} height={height} style={{ background: "var(--paper-raised)", borderRadius: "var(--radius)" }}>
      {/* Links */}
      {(d3Root.links() as { source: { x: number; y: number }; target: { x: number; y: number } }[]).map((link, i) => (
        <line
          key={i}
          x1={link.source.x + 20}
          y1={link.source.y + 20}
          x2={link.target.x + 20}
          y2={link.target.y + 20}
          stroke="var(--line)"
          strokeWidth={2}
        />
      ))}

      {/* Nodes */}
      {d3Root.descendants().map((node, i) => {
        const state = (node.data as unknown as TreeNode)?.state || "untouched"
        return (
          <g key={i} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              cx={20} cy={20} r={20}
              fill={stateColors[state] || stateColors.untouched}
              opacity={0.2}
              stroke={stateColors[state] || stateColors.untouched}
              strokeWidth={2}
            />
            <text
              x={20} y={24}
              textAnchor="middle"
              fontSize={14}
              fontFamily="JetBrains Mono, monospace"
              fill="var(--ink)"
            >
              {node.data.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Helper: build tree from level-order array (for testing)
export function buildTree(data: (number | null)[]): TreeNode | null {
  if (!data.length || data[0] === null) return null
  const nodes: (TreeNode | null)[] = data.map((val, i) =>
    val === null ? null : { id: `node-${i}`, value: val }
  )
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i]) continue
    const leftIdx = 2 * i + 1
    const rightIdx = 2 * i + 2
    if (leftIdx < nodes.length) nodes[i]!.left = nodes[leftIdx] as TreeNode | null
    if (rightIdx < nodes.length) nodes[i]!.right = nodes[rightIdx] as TreeNode | null
  }
  return nodes[0] as TreeNode
}
