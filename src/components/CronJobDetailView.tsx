import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../store'
import type { CronScheduleType, CronPayload, CronDelivery, CronSessionTarget, CronWakeMode } from '../lib/openclaw/types'

export function CronJobDetailView() {
  const { selectedCronJob, closeDetailView, client, fetchCronJobs, agents } = useStore()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [editingSchedule, setEditingSchedule] = useState(false)
  const [scheduleValue, setScheduleValue] = useState('')
  const [scheduleKind, setScheduleKind] = useState<'cron' | 'every' | 'at'>('cron')
  const [scheduleTz, setScheduleTz] = useState('')
  const [scheduleEveryMs, setScheduleEveryMs] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const scheduleInputRef = useRef<HTMLInputElement>(null)

  const [editingContent, setEditingContent] = useState(false)
  const [contentValue, setContentValue] = useState('')
  const [savingContent, setSavingContent] = useState(false)

  const [editingExecution, setEditingExecution] = useState(false)
  const [sessionTarget, setSessionTarget] = useState<CronSessionTarget>('isolated')
  const [wakeMode, setWakeMode] = useState<CronWakeMode>('now')
  const [agentId, setAgentId] = useState<string>('')
  const [deleteAfterRun, setDeleteAfterRun] = useState(false)
  const [savingExecution, setSavingExecution] = useState(false)

  const [editingPayload, setEditingPayload] = useState(false)
  const [payloadKind, setPayloadKind] = useState<'systemEvent' | 'agentTurn'>('agentTurn')
  const [payloadText, setPayloadText] = useState('')
  const [payloadModel, setPayloadModel] = useState('')
  const [payloadThinking, setPayloadThinking] = useState('')
  const [payloadTimeout, setPayloadTimeout] = useState('')
  const [savingPayload, setSavingPayload] = useState(false)

  const [editingDelivery, setEditingDelivery] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<'none' | 'announce' | 'webhook'>('none')
  const [deliveryChannel, setDeliveryChannel] = useState('')
  const [deliveryTo, setDeliveryTo] = useState('')
  const [deliveryBestEffort, setDeliveryBestEffort] = useState(false)
  const [savingDelivery, setSavingDelivery] = useState(false)

  const [running, setRunning] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    if (editingSchedule) scheduleInputRef.current?.focus()
  }, [editingSchedule])

  if (!selectedCronJob) return null

  const refreshDetail = async () => {
    if (!client) return
    await fetchCronJobs()
    const details = await client.getCronJobDetails(selectedCronJob.id)
    if (details) useStore.setState({ selectedCronJob: details })
  }

  const handleToggle = async () => {
    if (!client) return
    await client.toggleCronJob(selectedCronJob.id, selectedCronJob.status === 'paused')
    await refreshDetail()
  }

  const handleRun = async () => {
    if (!client) return
    setRunning(true)
    try {
      await client.runCronJob(selectedCronJob.id)
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const handleDelete = async () => {
    if (!client) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await client.removeCronJob(selectedCronJob.id)
      await fetchCronJobs()
      closeDetailView()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete cron job')
      setDeleting(false)
    }
  }

  // --- Name editing ---
  const handleStartEditName = () => {
    setNameValue(selectedCronJob.name)
    setEditingName(true)
  }

  const handleSaveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === selectedCronJob.name || !client) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      await client.updateCronJob(selectedCronJob.id, { name: trimmed })
      await refreshDetail()
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') setEditingName(false)
  }

  // --- Schedule editing ---
  const handleStartEditSchedule = () => {
    const raw = selectedCronJob.scheduleRaw
    if (raw) {
      setScheduleKind(raw.kind)
      if (raw.kind === 'cron') {
        setScheduleValue(raw.expr)
        setScheduleTz(raw.tz || '')
      } else if (raw.kind === 'every') {
        setScheduleEveryMs(String(raw.everyMs))
      } else if (raw.kind === 'at') {
        setScheduleAt(raw.at)
      }
    } else {
      setScheduleKind('cron')
      setScheduleValue(selectedCronJob.schedule)
      setScheduleTz('')
    }
    setEditingSchedule(true)
  }

  const handleSaveSchedule = async () => {
    if (!client) { setEditingSchedule(false); return }
    setSavingSchedule(true)
    try {
      let schedule: CronScheduleType
      if (scheduleKind === 'cron') {
        schedule = { kind: 'cron', expr: scheduleValue.trim(), ...(scheduleTz ? { tz: scheduleTz } : {}) }
      } else if (scheduleKind === 'every') {
        schedule = { kind: 'every', everyMs: parseInt(scheduleEveryMs) || 60000 }
      } else {
        schedule = { kind: 'at', at: scheduleAt.trim() }
      }
      await client.updateCronJob(selectedCronJob.id, { schedule })
      await refreshDetail()
    } finally {
      setSavingSchedule(false)
      setEditingSchedule(false)
    }
  }

  const handleScheduleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveSchedule()
    if (e.key === 'Escape') setEditingSchedule(false)
  }

  // --- Content editing ---
  const handleStartEditContent = () => {
    setContentValue(selectedCronJob.content || '')
    setEditingContent(true)
  }

  const handleSaveContent = async () => {
    if (!client) { setEditingContent(false); return }
    setSavingContent(true)
    try {
      await client.updateCronJob(selectedCronJob.id, { content: contentValue })
      await refreshDetail()
    } finally {
      setSavingContent(false)
      setEditingContent(false)
    }
  }

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEditingContent(false)
  }

  // --- Execution editing ---
  const handleStartEditExecution = () => {
    setSessionTarget(selectedCronJob.sessionTarget || 'isolated')
    setWakeMode(selectedCronJob.wakeMode || 'now')
    setAgentId(selectedCronJob.agentId || '')
    setDeleteAfterRun(selectedCronJob.deleteAfterRun || false)
    setEditingExecution(true)
  }

  const handleSaveExecution = async () => {
    if (!client) { setEditingExecution(false); return }
    setSavingExecution(true)
    try {
      await client.updateCronJob(selectedCronJob.id, {
        sessionTarget,
        wakeMode,
        agentId: agentId || null,
        deleteAfterRun,
      })
      await refreshDetail()
    } finally {
      setSavingExecution(false)
      setEditingExecution(false)
    }
  }

  // --- Payload editing ---
  const handleStartEditPayload = () => {
    const p = selectedCronJob.payload
    if (p?.kind === 'systemEvent') {
      setPayloadKind('systemEvent')
      setPayloadText(p.text || '')
    } else if (p?.kind === 'agentTurn') {
      setPayloadKind('agentTurn')
      setPayloadText(p.message || '')
      setPayloadModel(p.model || '')
      setPayloadThinking(p.thinking || '')
      setPayloadTimeout(p.timeoutSeconds ? String(p.timeoutSeconds) : '')
    } else {
      setPayloadKind('agentTurn')
      setPayloadText('')
      setPayloadModel('')
      setPayloadThinking('')
      setPayloadTimeout('')
    }
    setEditingPayload(true)
  }

  const handleSavePayload = async () => {
    if (!client) { setEditingPayload(false); return }
    setSavingPayload(true)
    try {
      let payload: CronPayload
      if (payloadKind === 'systemEvent') {
        payload = { kind: 'systemEvent', text: payloadText }
      } else {
        payload = {
          kind: 'agentTurn',
          message: payloadText,
          ...(payloadModel ? { model: payloadModel } : {}),
          ...(payloadThinking ? { thinking: payloadThinking } : {}),
          ...(payloadTimeout ? { timeoutSeconds: parseInt(payloadTimeout) } : {}),
        }
      }
      await client.updateCronJob(selectedCronJob.id, { payload })
      await refreshDetail()
    } finally {
      setSavingPayload(false)
      setEditingPayload(false)
    }
  }

  // --- Delivery editing ---
  const handleStartEditDelivery = () => {
    const d = selectedCronJob.delivery
    setDeliveryMode(d?.mode || 'none')
    setDeliveryChannel(d?.channel || '')
    setDeliveryTo(d?.to || '')
    setDeliveryBestEffort(d?.bestEffort || false)
    setEditingDelivery(true)
  }

  const handleSaveDelivery = async () => {
    if (!client) { setEditingDelivery(false); return }
    setSavingDelivery(true)
    try {
      const delivery: CronDelivery = { mode: deliveryMode }
      if (deliveryMode === 'announce' && deliveryChannel) delivery.channel = deliveryChannel
      if (deliveryMode === 'webhook') {
        if (deliveryTo) delivery.to = deliveryTo
        delivery.bestEffort = deliveryBestEffort
      }
      await client.updateCronJob(selectedCronJob.id, { delivery })
      await refreshDetail()
    } finally {
      setSavingDelivery(false)
      setEditingDelivery(false)
    }
  }

  const isActive = selectedCronJob.status === 'active'

  const editIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const formatTimestamp = (ms: number) => {
    try { return new Date(ms).toLocaleString() } catch { return String(ms) }
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="detail-back" onClick={closeDetailView} aria-label="Back to chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <div className="detail-title-section">
          <div className="detail-icon cron-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div className="cron-name-row">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  className="cron-name-input"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleSaveName}
                  disabled={savingName}
                />
              ) : (
                <h1 className="detail-title" onClick={handleStartEditName} title="Click to edit name">
                  {selectedCronJob.name}
                </h1>
              )}
              {!editingName && (
                <button className="cron-edit-btn" onClick={handleStartEditName} title="Edit name">
                  {editIcon}
                </button>
              )}
            </div>
            {selectedCronJob.description && (
              <p className="detail-subtitle">{selectedCronJob.description}</p>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRun}
            disabled={running}
            title="Run Now"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {running ? 'Running...' : 'Run'}
          </button>

          <div className={`status-badge ${isActive ? 'enabled' : 'disabled'}`}>
            {isActive ? 'Active' : 'Paused'}
          </div>
          <button
            className={`toggle-button ${isActive ? 'active' : ''}`}
            onClick={handleToggle}
            aria-label={isActive ? 'Pause cron job' : 'Resume cron job'}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="detail-meta">
        <div className="meta-section">
          <h3>Schedule</h3>
          <div className="schedule-display">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {editingSchedule ? (
              <div className="cron-schedule-editor">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-label">Kind</span>
                  </div>
                  <div className="settings-row-control">
                    <select
                      className="settings-select"
                      value={scheduleKind}
                      onChange={(e) => setScheduleKind(e.target.value as 'cron' | 'every' | 'at')}
                    >
                      <option value="cron">Cron Expression</option>
                      <option value="every">Interval</option>
                      <option value="at">One-time</option>
                    </select>
                  </div>
                </div>
                {scheduleKind === 'cron' && (
                  <>
                    <div className="settings-row">
                      <div className="settings-row-label">
                        <span className="settings-label">Expression</span>
                        <span className="settings-hint">e.g. 0 * * * *</span>
                      </div>
                      <div className="settings-row-control">
                        <input
                          ref={scheduleInputRef}
                          className="settings-input"
                          value={scheduleValue}
                          onChange={(e) => setScheduleValue(e.target.value)}
                          onKeyDown={handleScheduleKeyDown}
                          disabled={savingSchedule}
                          placeholder="0 * * * *"
                        />
                      </div>
                    </div>
                    <div className="settings-row">
                      <div className="settings-row-label">
                        <span className="settings-label">Timezone</span>
                        <span className="settings-hint">Optional, e.g. America/New_York</span>
                      </div>
                      <div className="settings-row-control">
                        <input
                          className="settings-input"
                          value={scheduleTz}
                          onChange={(e) => setScheduleTz(e.target.value)}
                          placeholder="UTC"
                        />
                      </div>
                    </div>
                  </>
                )}
                {scheduleKind === 'every' && (
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Interval (ms)</span>
                      <span className="settings-hint">e.g. 60000 for every minute</span>
                    </div>
                    <div className="settings-row-control">
                      <input
                        ref={scheduleInputRef}
                        className="settings-input"
                        type="number"
                        value={scheduleEveryMs}
                        onChange={(e) => setScheduleEveryMs(e.target.value)}
                        onKeyDown={handleScheduleKeyDown}
                        disabled={savingSchedule}
                        placeholder="60000"
                      />
                    </div>
                  </div>
                )}
                {scheduleKind === 'at' && (
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Run At</span>
                      <span className="settings-hint">ISO 8601 datetime</span>
                    </div>
                    <div className="settings-row-control">
                      <input
                        ref={scheduleInputRef}
                        className="settings-input"
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        onKeyDown={handleScheduleKeyDown}
                        disabled={savingSchedule}
                      />
                    </div>
                  </div>
                )}
                <div className="cron-section-actions">
                  <button className="btn btn-secondary" onClick={() => setEditingSchedule(false)} disabled={savingSchedule}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={savingSchedule}>
                    {savingSchedule ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span
                  className="schedule-expression cron-editable"
                  onClick={handleStartEditSchedule}
                  title="Click to edit schedule"
                >
                  {selectedCronJob.schedule}
                  {selectedCronJob.scheduleRaw?.kind === 'cron' && selectedCronJob.scheduleRaw.tz && (
                    <span className="schedule-tz"> ({selectedCronJob.scheduleRaw.tz})</span>
                  )}
                </span>
                <button className="cron-edit-btn" onClick={handleStartEditSchedule} title="Edit schedule">
                  {editIcon}
                </button>
              </>
            )}
          </div>
        </div>
        {selectedCronJob.nextRun && isActive && (
          <div className="meta-section">
            <h3>Next Run</h3>
            <div className="next-run-display">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{selectedCronJob.nextRun}</span>
            </div>
          </div>
        )}
      </div>

      <div className="detail-content">
        {/* Execution Section */}
        <section className="detail-section cron-config-section">
          <div className="cron-content-header">
            <h3>Execution</h3>
            {!editingExecution && (
              <button className="cron-edit-btn" onClick={handleStartEditExecution} title="Edit execution settings">
                {editIcon}
              </button>
            )}
          </div>
          {editingExecution ? (
            <div className="cron-edit-panel">
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Session Target</span>
                  <span className="settings-hint">Run in the main session or an isolated one</span>
                </div>
                <div className="settings-row-control">
                  <select className="settings-select" value={sessionTarget} onChange={(e) => setSessionTarget(e.target.value as CronSessionTarget)}>
                    <option value="isolated">Isolated</option>
                    <option value="main">Main</option>
                  </select>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Wake Mode</span>
                  <span className="settings-hint">When the agent should wake up</span>
                </div>
                <div className="settings-row-control">
                  <select className="settings-select" value={wakeMode} onChange={(e) => setWakeMode(e.target.value as CronWakeMode)}>
                    <option value="now">Immediately</option>
                    <option value="next-heartbeat">Next Heartbeat</option>
                  </select>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Agent</span>
                  <span className="settings-hint">Which agent should execute this job</span>
                </div>
                <div className="settings-row-control">
                  <select className="settings-select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                    <option value="">Default</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name || a.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Delete After Run</span>
                  <span className="settings-hint">Remove this job after it executes once</span>
                </div>
                <div className="settings-row-control">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={deleteAfterRun} onChange={(e) => setDeleteAfterRun(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div className="cron-section-actions">
                <button className="btn btn-secondary" onClick={() => setEditingExecution(false)} disabled={savingExecution}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveExecution} disabled={savingExecution}>
                  {savingExecution ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="cron-config-display">
              <div className="cron-config-row">
                <span className="cron-config-label">Session</span>
                <span className="cron-config-value">{selectedCronJob.sessionTarget || 'isolated'}</span>
              </div>
              <div className="cron-config-row">
                <span className="cron-config-label">Wake</span>
                <span className="cron-config-value">{selectedCronJob.wakeMode === 'next-heartbeat' ? 'Next Heartbeat' : 'Immediately'}</span>
              </div>
              {selectedCronJob.agentId && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Agent</span>
                  <span className="cron-config-value">{agents.find(a => a.id === selectedCronJob.agentId)?.name || selectedCronJob.agentId}</span>
                </div>
              )}
              {selectedCronJob.deleteAfterRun && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Delete After Run</span>
                  <span className="cron-config-value">Yes</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Payload Section */}
        <section className="detail-section cron-config-section">
          <div className="cron-content-header">
            <h3>Payload</h3>
            {!editingPayload && (
              <button className="cron-edit-btn" onClick={handleStartEditPayload} title="Edit payload">
                {editIcon}
              </button>
            )}
          </div>
          {editingPayload ? (
            <div className="cron-edit-panel">
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Kind</span>
                  <span className="settings-hint">Type of payload to send</span>
                </div>
                <div className="settings-row-control">
                  <select className="settings-select" value={payloadKind} onChange={(e) => setPayloadKind(e.target.value as 'systemEvent' | 'agentTurn')}>
                    <option value="agentTurn">Agent Turn</option>
                    <option value="systemEvent">System Event</option>
                  </select>
                </div>
              </div>
              <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                <div className="settings-row-label">
                  <span className="settings-label">{payloadKind === 'systemEvent' ? 'Text' : 'Message'}</span>
                </div>
                <div className="settings-row-control">
                  <textarea
                    className="settings-textarea"
                    style={{ width: 300, height: 80 }}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    placeholder={payloadKind === 'systemEvent' ? 'System event text...' : 'Message to send...'}
                  />
                </div>
              </div>
              {payloadKind === 'agentTurn' && (
                <>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Model</span>
                      <span className="settings-hint">Optional model override</span>
                    </div>
                    <div className="settings-row-control">
                      <input className="settings-input" value={payloadModel} onChange={(e) => setPayloadModel(e.target.value)} placeholder="Default" />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Thinking</span>
                      <span className="settings-hint">Thinking level</span>
                    </div>
                    <div className="settings-row-control">
                      <select className="settings-select" value={payloadThinking} onChange={(e) => setPayloadThinking(e.target.value)}>
                        <option value="">Default</option>
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Timeout (s)</span>
                      <span className="settings-hint">Max execution time</span>
                    </div>
                    <div className="settings-row-control">
                      <input className="settings-input" type="number" value={payloadTimeout} onChange={(e) => setPayloadTimeout(e.target.value)} placeholder="None" />
                    </div>
                  </div>
                </>
              )}
              <div className="cron-section-actions">
                <button className="btn btn-secondary" onClick={() => setEditingPayload(false)} disabled={savingPayload}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSavePayload} disabled={savingPayload}>
                  {savingPayload ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="cron-config-display">
              {selectedCronJob.payload ? (
                <>
                  <div className="cron-config-row">
                    <span className="cron-config-label">Kind</span>
                    <span className="cron-config-value">{selectedCronJob.payload.kind === 'systemEvent' ? 'System Event' : 'Agent Turn'}</span>
                  </div>
                  <div className="cron-config-row">
                    <span className="cron-config-label">{selectedCronJob.payload.kind === 'systemEvent' ? 'Text' : 'Message'}</span>
                    <span className="cron-config-value cron-config-text">
                      {selectedCronJob.payload.kind === 'systemEvent' ? selectedCronJob.payload.text : selectedCronJob.payload.message}
                    </span>
                  </div>
                  {selectedCronJob.payload.kind === 'agentTurn' && selectedCronJob.payload.model && (
                    <div className="cron-config-row">
                      <span className="cron-config-label">Model</span>
                      <span className="cron-config-value">{selectedCronJob.payload.model}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="cron-config-empty">No payload configured</p>
              )}
            </div>
          )}
        </section>

        {/* Delivery Section */}
        <section className="detail-section cron-config-section">
          <div className="cron-content-header">
            <h3>Delivery</h3>
            {!editingDelivery && (
              <button className="cron-edit-btn" onClick={handleStartEditDelivery} title="Edit delivery">
                {editIcon}
              </button>
            )}
          </div>
          {editingDelivery ? (
            <div className="cron-edit-panel">
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Mode</span>
                  <span className="settings-hint">How results are delivered</span>
                </div>
                <div className="settings-row-control">
                  <select className="settings-select" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value as 'none' | 'announce' | 'webhook')}>
                    <option value="none">None</option>
                    <option value="announce">Announce</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
              </div>
              {deliveryMode === 'announce' && (
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-label">Channel</span>
                    <span className="settings-hint">Optional channel to announce in</span>
                  </div>
                  <div className="settings-row-control">
                    <input className="settings-input" value={deliveryChannel} onChange={(e) => setDeliveryChannel(e.target.value)} placeholder="Default" />
                  </div>
                </div>
              )}
              {deliveryMode === 'webhook' && (
                <>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">URL</span>
                      <span className="settings-hint">Webhook endpoint</span>
                    </div>
                    <div className="settings-row-control">
                      <input className="settings-input" value={deliveryTo} onChange={(e) => setDeliveryTo(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <span className="settings-label">Best Effort</span>
                      <span className="settings-hint">Don't fail the job if delivery fails</span>
                    </div>
                    <div className="settings-row-control">
                      <label className="toggle-switch">
                        <input type="checkbox" checked={deliveryBestEffort} onChange={(e) => setDeliveryBestEffort(e.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </>
              )}
              <div className="cron-section-actions">
                <button className="btn btn-secondary" onClick={() => setEditingDelivery(false)} disabled={savingDelivery}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveDelivery} disabled={savingDelivery}>
                  {savingDelivery ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="cron-config-display">
              <div className="cron-config-row">
                <span className="cron-config-label">Mode</span>
                <span className="cron-config-value">{selectedCronJob.delivery?.mode || 'none'}</span>
              </div>
              {selectedCronJob.delivery?.mode === 'announce' && selectedCronJob.delivery.channel && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Channel</span>
                  <span className="cron-config-value">{selectedCronJob.delivery.channel}</span>
                </div>
              )}
              {selectedCronJob.delivery?.mode === 'webhook' && (
                <>
                  {selectedCronJob.delivery.to && (
                    <div className="cron-config-row">
                      <span className="cron-config-label">URL</span>
                      <span className="cron-config-value cron-config-text">{selectedCronJob.delivery.to}</span>
                    </div>
                  )}
                  {selectedCronJob.delivery.bestEffort && (
                    <div className="cron-config-row">
                      <span className="cron-config-label">Best Effort</span>
                      <span className="cron-config-value">Yes</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* State Section (read-only) */}
        {selectedCronJob.state && (
          <section className="detail-section cron-config-section">
            <h3>Last Run State</h3>
            <div className="cron-config-display">
              {selectedCronJob.state.lastRunStatus && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Status</span>
                  <span className={`cron-config-value cron-state-${selectedCronJob.state.lastRunStatus}`}>
                    {selectedCronJob.state.lastRunStatus}
                  </span>
                </div>
              )}
              {selectedCronJob.state.lastRunAtMs && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Last Run</span>
                  <span className="cron-config-value">{formatTimestamp(selectedCronJob.state.lastRunAtMs)}</span>
                </div>
              )}
              {selectedCronJob.state.lastDurationMs != null && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Duration</span>
                  <span className="cron-config-value">{formatMs(selectedCronJob.state.lastDurationMs)}</span>
                </div>
              )}
              {selectedCronJob.state.nextRunAtMs && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Next Run</span>
                  <span className="cron-config-value">{formatTimestamp(selectedCronJob.state.nextRunAtMs)}</span>
                </div>
              )}
              {selectedCronJob.state.lastError && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Error</span>
                  <span className="cron-config-value cron-state-error">{selectedCronJob.state.lastError}</span>
                </div>
              )}
              {(selectedCronJob.state.consecutiveErrors ?? 0) > 0 && (
                <div className="cron-config-row">
                  <span className="cron-config-label">Consecutive Errors</span>
                  <span className="cron-config-value cron-state-error">{selectedCronJob.state.consecutiveErrors}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Content Section */}
        {editingContent ? (
          <div className="cron-content-editor">
            <textarea
              className="cron-content-textarea"
              value={contentValue}
              onChange={(e) => setContentValue(e.target.value)}
              onKeyDown={handleContentKeyDown}
              disabled={savingContent}
              placeholder="Enter script content..."
            />
            <div className="cron-content-editor-actions">
              <button className="btn btn-secondary" onClick={() => setEditingContent(false)} disabled={savingContent}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveContent} disabled={savingContent}>
                {savingContent ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="cron-content-header">
              <h3>Content</h3>
              <button className="cron-edit-btn" onClick={handleStartEditContent} title="Edit content">
                {editIcon}
              </button>
            </div>
            {selectedCronJob.content ? (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedCronJob.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="empty-content" onClick={handleStartEditContent} style={{ cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No content yet. Click to add.</p>
              </div>
            )}
          </>
        )}

        {/* Danger Zone */}
        <section className="detail-section cron-danger-zone">
          <h2>Danger Zone</h2>
          {!showDeleteConfirm ? (
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Cron Job
            </button>
          ) : (
            <div className="delete-confirm">
              <p className="delete-confirm-text">
                Are you sure you want to delete <strong>{selectedCronJob.name}</strong>? This action cannot be undone.
              </p>
              {deleteError && (
                <p className="delete-confirm-error">{deleteError}</p>
              )}
              <div className="delete-confirm-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
