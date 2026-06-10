import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type OnSelectionChangeFunc,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AlertCircle, ArrowLeft, FlaskConical, Loader2, Save, X, Zap } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import {
  api,
  type Channel,
  type CompileNodeError,
  type MediaAsset,
  type RuleGraph,
  type RuleNode,
  type Template,
  type WebhookToken,
} from '../lib/api'
import { LookupsContext, nodeTypes, type AutomationFlowNode } from '../components/automations/nodes'
import { DND_MIME, NodePalette } from '../components/automations/NodePalette'
import { ConfigDrawer } from '../components/automations/ConfigDrawer'
import { TestRunModal, type TestRunResult } from '../components/automations/TestRunModal'
import { KIND_COLORS, NODE_REGISTRY, type Lookups, type NodeKind } from '../components/automations/registry'

const RATE_LIMITS = [5, 10, 30, 60]

const flowOverrides = `
.automation-flow .react-flow__pane { background: var(--bg); }
.automation-flow .react-flow__controls {
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.automation-flow .react-flow__controls-button {
  background: transparent;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  fill: var(--text-muted);
}
.automation-flow .react-flow__controls-button:hover {
  background: var(--surface-hover);
  color: var(--accent);
  fill: var(--accent);
}
.automation-flow .react-flow__minimap {
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.automation-flow .react-flow__attribution {
  background: transparent;
  color: var(--text-faint);
}
.automation-flow .react-flow__edge-path { stroke: rgba(0, 229, 179, 0.6); stroke-width: 2; }
.automation-flow .react-flow__edge.animated .react-flow__edge-path { stroke: rgba(0, 229, 179, 0.6); }
.automation-flow .react-flow__edge.selected .react-flow__edge-path {
  stroke: var(--accent);
  filter: drop-shadow(0 0 4px rgba(0, 229, 179, 0.55));
}
.automation-flow .react-flow__connectionline { stroke: var(--accent); stroke-width: 2; }
.automation-flow .react-flow__handle:hover {
  box-shadow: 0 0 0 2px rgba(238, 241, 251, 0.9), 0 0 10px rgba(0, 229, 179, 0.35) !important;
}
`

interface Banner {
  kind: 'error' | 'info'
  title: string
  items?: string[]
}

function newNodeId() {
  return `n_${Math.random().toString(36).slice(2, 10)}`
}

function hydrateNodes(graphNodes: RuleNode[]): AutomationFlowNode[] {
  // Rules created via the raw API may omit positions — lay them out in a row
  return graphNodes.map((n, i) => ({
    id: n.id,
    type: n.type,
    position: n.position ?? { x: 60 + i * 260, y: 120 },
    data: { nodeType: n.data.nodeType, config: n.data.config ?? {} },
  }))
}

function EditorInner() {
  const { id: ruleId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { screenToFlowPosition, fitView } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<AutomationFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [name, setName] = useState('Untitled automation')
  const [description, setDescription] = useState('')
  const [rateLimit, setRateLimit] = useState(10)
  const [isEnabled, setIsEnabled] = useState(true)

  const [loading, setLoading] = useState(Boolean(ruleId))
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [channels, setChannels] = useState<Channel[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [webhooks, setWebhooks] = useState<WebhookToken[]>([])

  const [testOpen, setTestOpen] = useState(false)
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<TestRunResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  // ── data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    api.channels.list().then((r) => setChannels(r.data)).catch(() => {})
    api.templates.list().then((r) => setTemplates(r.data)).catch(() => {})
    api.media.list().then((r) => setMedia(r.data)).catch(() => {})
    api.webhooks.list().then((r) => setWebhooks(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!ruleId) return
    let cancelled = false
    setLoading(true)
    api.rules
      .get(ruleId)
      .then((res) => {
        if (cancelled) return
        const rule = res.data
        setName(rule.name)
        setDescription(rule.description ?? '')
        setRateLimit(rule.rate_limit_per_min || 10)
        setIsEnabled(rule.is_enabled)
        setNodes(hydrateNodes(rule.graph.nodes))
        setEdges(rule.graph.edges.map((e) => ({ ...e, type: 'smoothstep', animated: true })))
        requestAnimationFrame(() => fitView({ padding: 0.25, maxZoom: 1 }))
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this automation — it may have been deleted.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ruleId, setNodes, setEdges, fitView])

  const lookups = useMemo<Lookups>(
    () => ({
      channels: Object.fromEntries(channels.map((c) => [c.id, c.title || c.username])),
      templates: Object.fromEntries(templates.map((t) => [t.id, t.name])),
      media: Object.fromEntries(media.map((m) => [m.id, m.filename ?? m.id])),
      webhooks: Object.fromEntries(webhooks.map((w) => [w.id, w.name])),
    }),
    [channels, templates, media, webhooks]
  )

  const hasTrigger = nodes.some((n) => n.type === 'trigger')
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  // ── graph editing ───────────────────────────────────────────────────────────

  const addNodeAt = useCallback(
    (nodeType: string, position?: { x: number; y: number }) => {
      const meta = NODE_REGISTRY[nodeType]
      if (!meta) return
      if (meta.kind === 'trigger' && nodes.some((n) => n.type === 'trigger')) {
        setBanner({
          kind: 'info',
          title: 'A rule has exactly one trigger — delete the existing one to swap it.',
        })
        return
      }
      let pos = position
      if (!pos) {
        if (nodes.length === 0) {
          pos = { x: 260, y: 80 }
        } else {
          const lowest = nodes.reduce((a, b) => (b.position.y > a.position.y ? b : a))
          pos = { x: lowest.position.x, y: lowest.position.y + 130 }
        }
      }
      const node: AutomationFlowNode = {
        id: newNodeId(),
        type: meta.kind,
        position: pos,
        selected: true,
        data: { nodeType, config: { ...meta.defaultConfig } },
      }
      setSelectedId(node.id)
      setNodes((current) => [...current.map((n) => ({ ...n, selected: false })), node])
    },
    [nodes, setNodes]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DND_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const nodeType = e.dataTransfer.getData(DND_MIME)
      if (!nodeType) return
      e.preventDefault()
      addNodeAt(nodeType, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    },
    [addNodeAt, screenToFlowPosition]
  )

  const isValidConnection = useCallback(
    (conn: Edge | Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return false
      // no cycles: nothing downstream of the target may loop back to the source
      const adjacency = new Map<string, string[]>()
      for (const e of edges) adjacency.set(e.source, [...(adjacency.get(e.source) ?? []), e.target])
      const stack = [conn.target]
      const seen = new Set<string>()
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (cur === conn.source) return false
        if (seen.has(cur)) continue
        seen.add(cur)
        stack.push(...(adjacency.get(cur) ?? []))
      }
      return true
    },
    [edges]
  )

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true }, eds)),
    [setEdges]
  )

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(({ nodes: selected }) => {
    setSelectedId(selected[0]?.id ?? null)
  }, [])

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((ns) =>
        ns.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config, error: undefined } } : n
        )
      )
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== nodeId))
      setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedId((cur) => (cur === nodeId ? null : cur))
    },
    [setNodes, setEdges]
  )

  // ── save / test ─────────────────────────────────────────────────────────────

  const buildGraph = useCallback(
    (): RuleGraph => ({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type ?? 'condition') as RuleNode['type'],
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        data: { nodeType: n.data.nodeType, config: n.data.config ?? {} },
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    }),
    [nodes, edges]
  )

  const save = async () => {
    setBanner(null)
    const triggers = nodes.filter((n) => n.type === 'trigger')
    if (triggers.length !== 1) {
      setBanner({
        kind: 'error',
        title:
          triggers.length === 0
            ? 'Every automation starts with a trigger — drag one in from the palette.'
            : 'A rule can only have one trigger.',
      })
      return
    }
    setSaving(true)
    setNodes((ns) => ns.map((n) => (n.data.error ? { ...n, data: { ...n.data, error: undefined } } : n)))
    const payload = {
      name: name.trim() || 'Untitled automation',
      description: description.trim() || undefined,
      graph: buildGraph(),
      is_enabled: isEnabled,
      rate_limit_per_min: rateLimit,
    }
    try {
      if (ruleId) await api.rules.update(ruleId, payload)
      else await api.rules.create(payload)
      navigate('/app/automations')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: unknown } } }
      const detail = e.response?.data?.detail
      if (
        e.response?.status === 422 &&
        detail &&
        typeof detail === 'object' &&
        Array.isArray((detail as { errors?: unknown }).errors)
      ) {
        const compile = detail as { message?: string; errors: CompileNodeError[] }
        const byNode: Record<string, string> = {}
        for (const ce of compile.errors) if (ce.node_id) byNode[ce.node_id] = ce.message
        setNodes((ns) =>
          ns.map((n) =>
            byNode[n.id] ? { ...n, data: { ...n.data, error: byNode[n.id] } } : n
          )
        )
        setBanner({
          kind: 'error',
          title: compile.message ?? 'The rule graph is invalid',
          items: compile.errors.map((ce) => ce.message),
        })
      } else {
        setBanner({
          kind: 'error',
          title: typeof detail === 'string' ? detail : 'Could not save the automation',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    if (!ruleId) {
      setBanner({
        kind: 'info',
        title: 'Save the automation first — test runs execute the saved version of the rule.',
      })
      return
    }
    setTestOpen(true)
    setTestRunning(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await api.rules.test(ruleId)
      setTestResult(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } } }
      const detail = e.response?.data?.detail
      setTestError(typeof detail === 'string' ? detail : 'Test run failed')
    } finally {
      setTestRunning(false)
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)]">
        <AlertCircle className="w-8 h-8 text-[var(--loss)]" />
        <p style={{ fontSize: 'var(--text-sm)' }}>{loadError}</p>
        <Button variant="ghost" onClick={() => navigate('/app/automations')}>
          <ArrowLeft className="w-4 h-4" /> Back to automations
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>{flowOverrides}</style>

      {/* top bar */}
      <div className="glass flex items-center gap-3 px-4 py-2.5 border-0 border-b border-[var(--border)] flex-shrink-0 flex-wrap">
        <button
          onClick={() => navigate('/app/automations')}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] transition-colors flex-shrink-0"
          title="Back to automations"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Automation name"
          className="px-2 py-1.5 rounded-[var(--radius-md)] border border-transparent bg-transparent text-[var(--text)] outline-none hover:border-[var(--border)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)] focus:shadow-[0_0_0_3px_rgba(0,229,179,0.12)] transition-all w-60"
          style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1 min-w-32 px-2 py-1.5 rounded-[var(--radius-md)] border border-transparent bg-transparent text-[var(--text-muted)] outline-none hover:border-[var(--border)] focus:border-[var(--accent)] focus:bg-[var(--surface-2)] focus:shadow-[0_0_0_3px_rgba(0,229,179,0.12)] transition-all hidden md:block"
          style={{ fontSize: 'var(--text-sm)' }}
        />
        <select
          value={rateLimit}
          onChange={(e) => setRateLimit(Number(e.target.value))}
          title="Rate limit"
          className="px-3 py-1.5 rounded-[var(--radius-full)] border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-muted)] outline-none hover:border-[var(--accent)] hover:text-[var(--text)] focus:border-[var(--accent)] transition-colors flex-shrink-0 cursor-pointer"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          {RATE_LIMITS.map((r) => (
            <option key={r} value={r}>
              max {r}/min
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={runTest} className="flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5" /> Test run
        </Button>
        <Button
          size="sm"
          onClick={save}
          loading={saving}
          className="flex-shrink-0"
          style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }}
        >
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
      </div>

      {/* banner */}
      {banner && (
        <div
          className="flex items-start gap-2.5 px-4 py-2.5 border-b flex-shrink-0"
          style={{
            background: banner.kind === 'error' ? 'var(--loss-dim)' : 'var(--accent-dim)',
            borderColor: banner.kind === 'error' ? 'var(--loss)' : 'var(--accent)',
            color: banner.kind === 'error' ? 'var(--loss)' : 'var(--accent)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div style={{ fontSize: 'var(--text-sm)' }}>{banner.title}</div>
            {banner.items && banner.items.length > 0 && (
              <ul className="mt-1 list-disc list-inside" style={{ fontSize: 'var(--text-xs)' }}>
                {banner.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={() => setBanner(null)} className="flex-shrink-0 hover:opacity-70 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* main area */}
      <div className="flex flex-1 min-h-0">
        <NodePalette hasTrigger={hasTrigger} onAdd={addNodeAt} />

        <div className="flex-1 relative min-w-0 automation-flow">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-[var(--text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rule…
            </div>
          ) : (
            <LookupsContext.Provider value={lookups}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                onDrop={onDrop}
                onDragOver={onDragOver}
                isValidConnection={isValidConnection}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
                deleteKeyCode={['Backspace', 'Delete']}
                colorMode="dark"
                fitView={false}
                minZoom={0.3}
                maxZoom={1.75}
                style={{ background: 'var(--bg)' }}
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(74, 81, 112, 0.35)" />
                <Controls position="bottom-left" />
                <MiniMap
                  position="bottom-right"
                  style={{ width: 120, height: 84 }}
                  maskColor="rgba(10,10,11,0.75)"
                  nodeColor={(n) => KIND_COLORS[(n.type ?? 'condition') as NodeKind]?.main ?? 'var(--surface-3)'}
                  nodeStrokeWidth={2}
                />
              </ReactFlow>

              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="glass flex flex-col items-center gap-3.5 px-12 py-10 rounded-[var(--radius-xl)]"
                    style={{ boxShadow: 'var(--shadow-lg)' }}
                  >
                    <span
                      className="flex items-center justify-center rounded-[var(--radius-lg)] float-y"
                      style={{
                        width: 52,
                        height: 52,
                        background: 'var(--accent-gradient-soft)',
                        color: 'var(--accent)',
                        boxShadow: 'inset 0 0 0 1px rgba(0, 229, 179, 0.25), var(--accent-glow)',
                      }}
                    >
                      <Zap className="w-6 h-6" />
                    </span>
                    <div className="text-[var(--text)]" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                      Drag a <span className="gradient-text">trigger</span> to start
                    </div>
                    <div className="text-[var(--text-muted)] text-center max-w-64 leading-relaxed" style={{ fontSize: 'var(--text-sm)' }}>
                      Every automation begins with one trigger — conditions and actions flow down from it.
                    </div>
                  </div>
                </div>
              )}
            </LookupsContext.Provider>
          )}
        </div>

        {selectedNode && (
          <ConfigDrawer
            node={selectedNode}
            channels={channels}
            templates={templates}
            media={media}
            webhooks={webhooks}
            onConfigChange={updateNodeConfig}
            onDelete={deleteNode}
            onClose={() => {
              setNodes((ns) => ns.map((n) => ({ ...n, selected: false })))
              setSelectedId(null)
            }}
          />
        )}
      </div>

      <TestRunModal
        isOpen={testOpen}
        onClose={() => setTestOpen(false)}
        running={testRunning}
        result={testResult}
        error={testError}
        lookups={lookups}
      />
    </div>
  )
}

export default function AutomationEditor() {
  return (
    <AppShell>
      <div className="h-full">
        <ReactFlowProvider>
          <EditorInner />
        </ReactFlowProvider>
      </div>
    </AppShell>
  )
}
