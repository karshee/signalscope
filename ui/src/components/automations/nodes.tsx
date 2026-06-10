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

const handleStyle: React.CSSProperties = {
  width: 9,
  height: 9,
  background: 'var(--surface-3)',
  border: '1.5px solid var(--text-muted)',
}

function NodeShell({ kind, data, selected }: { kind: NodeKind; data: AutomationNodeData; selected?: boolean }) {
  const lookups = useContext(LookupsContext)
  const meta = NODE_REGISTRY[data.nodeType]
  const colors = KIND_COLORS[kind]
  const Icon = meta?.icon
  const summary = meta ? meta.summary(data.config ?? {}, lookups) : data.nodeType
  const hasError = Boolean(data.error)

  const ring = hasError
    ? '0 0 0 2px var(--loss)'
    : selected
      ? '0 0 0 2px var(--accent)'
      : 'var(--shadow-sm)'

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 py-2.5"
      style={{
        background: 'var(--surface)',
        borderLeft: `3px solid ${colors.main}`,
        boxShadow: ring,
        width: 200,
        transition: 'box-shadow 120ms ease',
      }}
      title={data.error}
    >
      {kind !== 'trigger' && <Handle type="target" position={Position.Top} style={handleStyle} />}

      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-[var(--radius-sm)] flex-shrink-0"
          style={{ width: 22, height: 22, background: colors.dim, color: colors.main }}
        >
          {Icon && <Icon style={{ width: 13, height: 13 }} />}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="font-medium text-[var(--text)] truncate leading-tight"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {meta?.label ?? data.nodeType}
          </div>
          <div
            className="uppercase tracking-wider leading-tight"
            style={{ fontSize: 9, color: colors.main, opacity: 0.85 }}
          >
            {KIND_LABELS[kind]}
          </div>
        </div>
        {hasError && (
          <AlertCircle className="flex-shrink-0" style={{ width: 14, height: 14, color: 'var(--loss)' }} />
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
