import { useState } from 'react'
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { KIND_COLORS, NODE_REGISTRY, PALETTE_GROUPS } from './registry'

export const DND_MIME = 'application/tapwire-node-type'

/* Per-kind hover treatment driven by a CSS custom property set on each item */
const paletteCss = `
.tw-palette-item {
  transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition), background var(--transition);
}
.tw-palette-item:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: var(--item-color);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 12px var(--item-glow);
}
.tw-palette-item:not(:disabled):hover .tw-palette-grip { opacity: 0.7; }
.tw-palette-item:not(:disabled):active { cursor: grabbing; }
`

interface NodePaletteProps {
  /** when true, trigger items are disabled (a rule has exactly one trigger) */
  hasTrigger: boolean
  onAdd: (nodeType: string) => void
}

export function NodePalette({ hasTrigger, onAdd }: NodePaletteProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="glass flex-shrink-0 border-0 border-r border-[var(--border)] flex flex-col items-center pt-3" style={{ width: 40 }}>
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          title="Expand palette"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        {PALETTE_GROUPS.map((g) => (
          <span
            key={g.kind}
            className="mt-4 rounded-full select-none"
            style={{
              width: 8,
              height: 8,
              background: KIND_COLORS[g.kind].main,
              boxShadow: `0 0 8px ${KIND_COLORS[g.kind].glow}`,
            }}
            title={g.title}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="glass w-56 flex-shrink-0 border-0 border-r border-[var(--border)] overflow-y-auto">
      <style>{paletteCss}</style>

      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span
          className="uppercase tracking-wider font-medium text-[var(--text-muted)]"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Blocks
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          title="Collapse palette"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {PALETTE_GROUPS.map((group) => {
        const colors = KIND_COLORS[group.kind]
        return (
          <div key={group.kind} className="px-3 pb-3">
            <div className="flex items-center gap-2 py-2">
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 7, height: 7, background: colors.main, boxShadow: `0 0 8px ${colors.glow}` }}
              />
              <span
                className="uppercase tracking-wider font-medium"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
              >
                {group.title}
              </span>
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
                    className="tw-palette-item flex items-center gap-2 w-full pl-1.5 pr-2.5 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-left disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-grab"
                    style={
                      {
                        background: 'var(--surface-2)',
                        '--item-color': colors.main,
                        '--item-glow': colors.glow,
                      } as React.CSSProperties
                    }
                  >
                    <GripVertical
                      className="tw-palette-grip flex-shrink-0 transition-opacity"
                      style={{ width: 12, height: 12, color: 'var(--text-faint)', opacity: 0.4 }}
                    />
                    <span
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: colors.dim,
                        color: colors.main,
                        boxShadow: `inset 0 0 0 1px ${colors.glow}`,
                      }}
                    >
                      <Icon style={{ width: 13, height: 13 }} />
                    </span>
                    <span
                      className="text-[var(--text)] truncate flex-1"
                      style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
                    >
                      {meta.label}
                    </span>
                    {disabled && (
                      <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded-[var(--radius-full)] border border-[var(--border)] text-[var(--text-faint)]"
                        style={{ fontSize: 9, letterSpacing: '0.04em' }}
                      >
                        1 max
                      </span>
                    )}
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
