import { createContext, memo, useContext } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { AlertCircle } from 'lucide-react'
import {
  EMPTY_LOOKUPS,
  KIND_COLORS,
  KIND_LABELS,
  NODE_REGISTRY,
  type Lookups,
  type NodeKind,
} from './registry'

export type AutomationNodeData = {
  nodeType: string
  config: Record<string, unknown>
  /** server compile error attached after a failed save */
  error?: string
  [key: string]: unknown
}

export type AutomationFlowNode = Node<AutomationNodeData>

/** Provided by the editor so node summaries can show channel/template names */
export const LookupsContext = createContext<Lookups>(EMPTY_LOOKUPS)

/** Kind-colored handle dot — white hover ring is applied via the editor's flow CSS */
const handleStyleFor = (color: string): React.CSSProperties => ({
  width: 11,
  height: 11,
  background: color,
  border: '2px solid var(--bg)',
  boxShadow: '0 0 0 1px rgba(238, 241, 251, 0.18)',
  transition: 'box-shadow 140ms ease',
})

function NodeShell({ kind, data, selected }: { kind: NodeKind; data: AutomationNodeData; selected?: boolean }) {
  const lookups = useContext(LookupsContext)
  const meta = NODE_REGISTRY[data.nodeType]
  const colors = KIND_COLORS[kind]
  const Icon = meta?.icon
  const summary = meta ? meta.summary(data.config ?? {}, lookups) : data.nodeType
  const hasError = Boolean(data.error)

  const borderColor = hasError ? 'var(--loss)' : selected ? colors.main : 'var(--border-strong)'
  const shadow = hasError
    ? '0 0 0 1px rgba(255, 93, 108, 0.35), 0 0 22px rgba(255, 93, 108, 0.28), var(--shadow-sm)'
    : selected
      ? `0 0 22px ${colors.glow}, var(--shadow-md)`
      : 'var(--shadow-sm)'

  const handleStyle = handleStyleFor(colors.main)

  return (
    <div
      className="glass relative"
      style={{
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        width: 212,
        padding: '11px 12px 10px',
        transition: 'box-shadow 160ms ease, border-color 160ms ease',
      }}
      title={data.error}
    >
      {/* faint top gradient strip, tinted by kind */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 14,
          right: 14,
          height: 2,
          borderRadius: '0 0 2px 2px',
          background: `linear-gradient(90deg, transparent, ${colors.main}, transparent)`,
          opacity: hasError ? 0 : 0.55,
          pointerEvents: 'none',
        }}
      />

      {kind !== 'trigger' && <Handle type="target" position={Position.Top} style={handleStyle} />}

      <div className="flex items-center gap-2.5">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: colors.dim,
            color: colors.main,
            boxShadow: `inset 0 0 0 1px ${colors.glow}`,
          }}
        >
          {Icon && <Icon style={{ width: 14, height: 14 }} />}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[var(--text)] truncate leading-tight"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
          >
            {meta?.label ?? data.nodeType}
          </div>
        </div>
        {hasError ? (
          <AlertCircle className="flex-shrink-0" style={{ width: 14, height: 14, color: 'var(--loss)' }} />
        ) : (
          <span
            className="uppercase flex-shrink-0 select-none"
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              letterSpacing: '0.09em',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: colors.dim,
              color: colors.main,
            }}
          >
            {KIND_LABELS[kind]}
          </span>
        )}
      </div>

      <div
        className="mt-1.5 truncate"
        style={{ fontSize: 'var(--text-xs)', color: hasError ? 'var(--loss)' : 'var(--text-muted)' }}
      >
        {hasError ? data.error : summary}
      </div>

      {kind !== 'action' && <Handle type="source" position={Position.Bottom} style={handleStyle} />}
    </div>
  )
}

const TriggerNode = memo(({ data, selected }: NodeProps<AutomationFlowNode>) => (
  <NodeShell kind="trigger" data={data} selected={selected} />
))
TriggerNode.displayName = 'TriggerNode'

const ConditionNode = memo(({ data, selected }: NodeProps<AutomationFlowNode>) => (
  <NodeShell kind="condition" data={data} selected={selected} />
))
ConditionNode.displayName = 'ConditionNode'

const ActionNode = memo(({ data, selected }: NodeProps<AutomationFlowNode>) => (
  <NodeShell kind="action" data={data} selected={selected} />
))
ActionNode.displayName = 'ActionNode'

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
}
