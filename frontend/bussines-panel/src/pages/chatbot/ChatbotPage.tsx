import { useState, useRef, useEffect } from 'react'
import {
  useChatbotSettings, useSaveChatbotSettings,
  type FlowNode, type FlowButton, type ButtonActionType,
  BUTTON_ACTION_LABELS, DEFAULT_NODES,
} from '@/hooks/useChatbot'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import {
  MessageSquare, Bot, Plus, Trash2, Send, Loader2,
  GitBranch, Zap, RotateCcw, Check, X, Star,
  ArrowRight, Info,
} from 'lucide-react'

// Action type badge colors
const ACTION_COLORS: Record<ButtonActionType, string> = {
  'goto': 'bg-blue-50 text-blue-700 border-blue-200',
  'list-appointments': 'bg-purple-50 text-purple-700 border-purple-200',
  'open-booking': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'cancel-appointment': 'bg-red-50 text-red-700 border-red-200',
  'show-services': 'bg-amber-50 text-amber-700 border-amber-200',
  'show-prices': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'show-contact': 'bg-teal-50 text-teal-700 border-teal-200',
  'human-agent': 'bg-gray-100 text-gray-700 border-gray-200',
}

type PreviewMsg = {
  role: 'bot' | 'user'
  text: string
  buttons?: { label: string; nodeId?: string; action: ButtonActionType }[]
}

function ButtonEditor({
  button, nodes, onChange, onDelete,
}: {
  button: FlowButton; nodes: FlowNode[]
  onChange: (b: FlowButton) => void; onDelete: () => void
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-gray-50 p-2.5">
      <div className="flex-1 space-y-2">
        <input
          value={button.label}
          onChange={e => onChange({ ...button, label: e.target.value })}
          placeholder="Buton etiketi…"
          className="w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <div className="flex gap-2">
          <select
            value={button.actionType}
            onChange={e => onChange({ ...button, actionType: e.target.value as ButtonActionType, nextNodeId: undefined })}
            className="flex-1 rounded border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
          >
            {(Object.keys(BUTTON_ACTION_LABELS) as ButtonActionType[]).map(k => (
              <option key={k} value={k}>{BUTTON_ACTION_LABELS[k]}</option>
            ))}
          </select>
          {button.actionType === 'goto' && (
            <select
              value={button.nextNodeId ?? ''}
              onChange={e => onChange({ ...button, nextNodeId: e.target.value || undefined })}
              className="flex-1 rounded border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
            >
              <option value="">— Düğüm seç —</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <button onClick={onDelete} className="mt-1 rounded p-1 hover:bg-red-50 text-red-400 hover:text-red-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function NodeEditor({ node, allNodes, onChange }: {
  node: FlowNode; allNodes: FlowNode[]; onChange: (n: FlowNode) => void
}) {
  const otherNodes = allNodes.filter(n => n.id !== node.id)

  function addButton() {
    const newBtn: FlowButton = { id: `btn_${Date.now()}`, label: '', actionType: 'goto' }
    onChange({ ...node, buttons: [...node.buttons, newBtn] })
  }

  function updateButton(idx: number, btn: FlowButton) {
    const updated = [...node.buttons]
    updated[idx] = btn
    onChange({ ...node, buttons: updated })
  }

  function removeButton(idx: number) {
    onChange({ ...node, buttons: node.buttons.filter((_, i) => i !== idx) })
  }

  function updateTriggers(raw: string) {
    onChange({ ...node, triggers: raw.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Düğüm Adı</label>
          <input
            value={node.name}
            onChange={e => onChange({ ...node, name: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Örn: Randevu Menüsü"
          />
        </div>
        {node.isWelcome && (
          <div className="mt-5">
            <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
              <Star className="h-3 w-3" /> Giriş
            </Badge>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Bot Mesajı</label>
        <textarea
          value={node.message}
          onChange={e => onChange({ ...node, message: e.target.value })}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          placeholder="Bot bu düğüme geldiğinde ne söylesin?"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Tetikleyici Kelimeler <span className="text-gray-400 font-normal">(virgülle ayır)</span>
        </label>
        <input
          value={node.triggers.join(', ')}
          onChange={e => updateTriggers(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="randevu, rezervasyon, almak istiyorum"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Kullanıcı bu kelimeleri yazarsa bot bu düğüme atlar.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">Seçenek Butonları</label>
          <Button size="sm" variant="outline" onClick={addButton} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Buton Ekle
          </Button>
        </div>
        <div className="space-y-2">
          {node.buttons.map((btn, idx) => (
            <ButtonEditor
              key={btn.id}
              button={btn}
              nodes={otherNodes}
              onChange={b => updateButton(idx, b)}
              onDelete={() => removeButton(idx)}
            />
          ))}
          {node.buttons.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Henüz buton eklenmedi.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewTab({ nodes, fallback }: { nodes: FlowNode[]; fallback: string }) {
  const welcomeNode = nodes.find(n => n.isWelcome) ?? nodes[0]
  const [msgs, setMsgs] = useState<PreviewMsg[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (welcomeNode) setMsgs([nodeToMsg(welcomeNode)])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  function nodeToMsg(node: FlowNode): PreviewMsg {
    return {
      role: 'bot',
      text: node.message,
      buttons: node.buttons.map(b => ({ label: b.label, nodeId: b.nextNodeId, action: b.actionType })),
    }
  }

  function getActionResponse(actionType: ButtonActionType): string {
    const responses: Record<ButtonActionType, string> = {
      'goto': '',
      'list-appointments': '📋 Randevularınız yükleniyor… (Canlı sistemde gerçek randevularınızı getirir)',
      'open-booking': '📅 Randevu takvimi açılıyor… Uygun bir tarih ve saat seçin.',
      'cancel-appointment': '✅ Randevu iptal talebiniz alındı. Onay için size bildirim gönderilecek.',
      'show-services': '💇 Hizmetlerimiz yükleniyor… (Canlı sistemde gerçek hizmet listeniz görünür)',
      'show-prices': '💰 Fiyat listemiz yükleniyor… (Canlı sistemde gerçek fiyatlarınız görünür)',
      'show-contact': '📞 İletişim bilgilerimiz:\n📍 Adresiniz\n📞 Telefon numaranız\n🌐 Web siteniz',
      'human-agent': '👤 Sizi bir müşteri temsilcisine bağlıyoruz. Lütfen bekleyin…',
    }
    return responses[actionType] ?? ''
  }

  function handleButtonClick(btn: { label: string; nodeId?: string; action: ButtonActionType }) {
    const userMsg: PreviewMsg = { role: 'user', text: btn.label }
    const toAdd: PreviewMsg[] = [userMsg]
    if (btn.action === 'goto' && btn.nodeId) {
      const target = nodes.find(n => n.id === btn.nodeId)
      if (target) toAdd.push(nodeToMsg(target))
    } else {
      const response = getActionResponse(btn.action)
      if (response) toAdd.push({ role: 'bot', text: response })
    }
    setMsgs(prev => [...prev, ...toAdd])
  }

  function handleSend() {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    const lower = txt.toLowerCase()
    const matched = nodes.find(n => n.triggers.some(t => lower.includes(t.toLowerCase())))
    const botMsg: PreviewMsg = matched ? nodeToMsg(matched) : { role: 'bot', text: fallback }
    setMsgs(prev => [...prev, { role: 'user', text: txt }, botMsg])
  }

  function reset() {
    setMsgs(welcomeNode ? [nodeToMsg(welcomeNode)] : [])
    setInput('')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Chatbot</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">● Çevrimiçi</p>
            </div>
          </div>
          <button onClick={reset} className="rounded p-1 hover:bg-gray-100 text-gray-400">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 min-h-[320px] max-h-[420px]">
          {msgs.map((m, i) => (
            <div key={i} className={cn('flex flex-col gap-1.5', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed',
                m.role === 'bot' ? 'bg-white border text-gray-800 rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm',
              )}>
                {m.text}
              </div>
              {m.role === 'bot' && m.buttons && m.buttons.length > 0 && (
                <div className="flex flex-col gap-1.5 w-full max-w-[85%]">
                  {m.buttons.map((btn, bi) => (
                    <button
                      key={bi}
                      onClick={() => handleButtonClick(btn)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50 transition-colors text-left"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t bg-white px-3 py-2 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Bir şey yazın veya butonlara tıklayın…"
            className="flex-1 rounded-full border px-3 py-1.5 text-sm outline-none focus:border-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Akış Haritası</p>
            </div>
            {nodes.map(node => (
              <div key={node.id} className="rounded-lg border p-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  {node.isWelcome && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
                  <span className="text-xs font-semibold">{node.name}</span>
                  {node.triggers.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({node.triggers.slice(0, 2).join(', ')}{node.triggers.length > 2 ? '…' : ''})
                    </span>
                  )}
                </div>
                {node.buttons.map(btn => (
                  <div key={btn.id} className="flex items-center gap-1.5 pl-3">
                    <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                    <span className="text-[11px] text-gray-600">{btn.label || '(isimsiz buton)'}</span>
                    <span className={cn('ml-auto text-[10px] rounded border px-1 py-0.5 shrink-0', ACTION_COLORS[btn.actionType])}>
                      {btn.actionType === 'goto' && btn.nextNodeId
                        ? nodes.find(n => n.id === btn.nextNodeId)?.name ?? 'Bilinmiyor'
                        : BUTTON_ACTION_LABELS[btn.actionType]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ChatbotPage() {
  const { data: chatbotSettings, isLoading } = useChatbotSettings()
  const saveMutation = useSaveChatbotSettings()

  const nodes: FlowNode[] = chatbotSettings?.nodes ?? DEFAULT_NODES
  const isEnabled = chatbotSettings?.isEnabled ?? true
  const fallback = chatbotSettings?.fallbackMessage ?? 'Üzgünüm, anlayamadım. Lütfen aşağıdaki seçeneklerden birini deneyin.'

  const [activeTab, setActiveTab] = useState<'flow' | 'preview'>('flow')
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id ?? '')
  const [pendingNodes, setPendingNodes] = useState<FlowNode[] | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const displayNodes = pendingNodes ?? nodes
  const selectedNode = displayNodes.find(n => n.id === selectedNodeId) ?? displayNodes[0]

  function updateNode(updated: FlowNode) {
    const next = displayNodes.map(n => n.id === updated.id ? updated : n)
    setPendingNodes(next)
    setIsDirty(true)
  }

  async function saveChanges() {
    if (!chatbotSettings || !pendingNodes) return
    await saveMutation.mutateAsync({ ...chatbotSettings, nodes: pendingNodes })
    setPendingNodes(null)
    setIsDirty(false)
  }

  function discardChanges() {
    setPendingNodes(null)
    setIsDirty(false)
  }

  function addNode() {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      name: 'Yeni Düğüm',
      message: '',
      buttons: [],
      triggers: [],
    }
    const next = [...displayNodes, newNode]
    setPendingNodes(next)
    setSelectedNodeId(newNode.id)
    setIsDirty(true)
  }

  function deleteNode(id: string) {
    if (displayNodes.length <= 1) return
    const next = displayNodes.filter(n => n.id !== id)
    setPendingNodes(next)
    setSelectedNodeId(next[0]?.id ?? '')
    setIsDirty(true)
  }

  function resetToDefaults() {
    setPendingNodes(DEFAULT_NODES)
    setSelectedNodeId(DEFAULT_NODES[0].id)
    setIsDirty(true)
  }

  async function toggleEnabled() {
    if (!chatbotSettings) return
    await saveMutation.mutateAsync({ ...chatbotSettings, isEnabled: !isEnabled })
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Canlı Chatbot" description="Akış editörüyle botun davranışını adım adım tasarlayın">
        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={discardChanges}>İptal</Button>
              <Button size="sm" onClick={saveChanges} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                Kaydet
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5">
            <span className="text-sm font-medium">Chatbot</span>
            <label className="relative flex shrink-0 cursor-pointer items-center">
              <input type="checkbox" checked={isEnabled} onChange={toggleEnabled} className="sr-only peer" />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
            <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-[10px]">
              {isEnabled ? 'Aktif' : 'Devre Dışı'}
            </Badge>
          </div>
        </div>
      </PageHeader>

      {!isEnabled && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Bot className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">Chatbot şu anda devre dışı. Web sitenizde görünmüyor.</p>
          <Button size="sm" className="ml-auto" onClick={toggleEnabled}>Etkinleştir</Button>
        </div>
      )}

      <div className="flex gap-1 border-b">
        {([
          { key: 'flow', label: 'Akış Editörü', icon: GitBranch },
          { key: 'preview', label: 'Önizleme', icon: MessageSquare },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'flow' && (
        <div className="grid grid-cols-[220px_1fr] gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Düğümler</p>
              <button onClick={addNode} className="rounded p-1 hover:bg-gray-100 text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {displayNodes.map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  selectedNodeId === node.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700',
                )}
              >
                {node.isWelcome && (
                  <Star className={cn('h-3 w-3 shrink-0', selectedNodeId === node.id ? 'text-amber-200' : 'text-amber-500')} />
                )}
                <span className="flex-1 truncate font-medium">{node.name}</span>
                <span className={cn('text-[10px] shrink-0', selectedNodeId === node.id ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                  {node.buttons.length}b
                </span>
              </button>
            ))}
            <button
              onClick={resetToDefaults}
              className="w-full flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-gray-100 mt-2 border border-dashed"
            >
              <RotateCcw className="h-3 w-3" /> Varsayılana Sıfırla
            </button>
          </div>

          {selectedNode && (
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{selectedNode.name}</CardTitle>
                </div>
                {!selectedNode.isWelcome && (
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="rounded p-1 hover:bg-red-50 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </CardHeader>
              <CardContent>
                <NodeEditor node={selectedNode} allNodes={displayNodes} onChange={updateNode} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'preview' && (
        <PreviewTab nodes={displayNodes} fallback={fallback} />
      )}
    </div>
  )
}
