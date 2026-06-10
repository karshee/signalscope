import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { KIND_COLORS, NODE_REGISTRY, PALETTE_GROUPS } from './registry'

export const DND_MIME = 'application/tapwire-node-type'

interface NodePaletteProps {
  /** when true, trigger items are disabled (a rule has exactly one trigger) */
  hasTrigger: boolean
  onAdd: (nodeType: string) => void
}

export function NodePalette({ hasTrigger, onAdd }: NodePaletteProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div
        className="flex-shrink-0 border-r border-[var(--border)] flex flex-col items-center pt-3"
        style={{ width: 40, background: 'var(--surface)' }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          title="Expand palette"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        {PALETTE_GROUPS.map((g) => (
          <span
            key={g.kind}
            className="mt-4 select-none"
            style={{ color: KIND_COLORS[g.kind].main, fontSize: 'var(--text-sm)' }}
            title={g.title}
          >
            {g.symbol}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-56 flex-shrink-0 border-r border-[var(--border)] overflow-y-auto"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span
          className="uppercase tracking-wider font-medium text-[var(--text-muted)]"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Blocks
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          title="Collapse palette"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {PALETTE_GROUPS.map((group) => {
        const colors = KIND_COLORS[group.kind]
        return (
          <div key={group.kind} className="px-3 pb-3">
            <div
              className="flex items-center gap-1.5 py-2 font-medium"
              style={{ fontSize: 'var(--text-xs)', color: colors.main }}
            >
              <span>{group.symbol}</span>
              <span className="uppercase tracking-wider">{group.title}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {group.types.map((type) => {
                const meta = NODE_REGISTRY[type]
                const Icon = meta.icon
                const disabled = group.kind === 'trigger' && hasTrigger
                return (
                  <button
                    key={type}
                    disabled={disabled}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DND_MIME, type)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => !disabled && onAdd(type)}
                    title={
                      disabled
                        ? 'A rule has exactly one trigger — delete the current one first'
                        : `Click or drag onto the canvas`
                    }
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-grab enabled:hover:border-[var(--border-strong)] enabled:hover:bg-[var(--surface-hover)]"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <span
                      className="flex items-center justify-center rounded-[var(--radius-sm)] flex-shrink-0"
                      style={{ width: 24, height: 24, background: colors.dim, color: colors.main }}
                    >
                      <Icon style={{ width: 13, height: 13 }} />
                    </span>
                    <span className="text-[var(--text)] truncate" style={{ fontSize: 'var(--text-sm)' }}>
                      {meta.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="px-3 pb-4 text-[var(--text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
        Click a block to add it, or drag it onto the canvas. Connect blocks top-to-bottom.
      </div>
    </div>
  )
}
