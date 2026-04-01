import { useState } from 'react'
import { useStore } from '../store'
import type { CronScheduleType, CronPayload, CronDelivery, CronSessionTarget, CronWakeMode } from '../lib/openclaw/types'

export function CreateCronJobView() {
    const { client, closeDetailView, fetchCronJobs, agents } = useStore()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    // Schedule
    const [scheduleKind, setScheduleKind] = useState<'cron' | 'every' | 'at'>('cron')
    const [cronExpr, setCronExpr] = useState('0 * * * *')
    const [cronTz, setCronTz] = useState('')
    const [everyMs, setEveryMs] = useState('60000')
    const [atTime, setAtTime] = useState('')

    // Execution
    const [sessionTarget, setSessionTarget] = useState<CronSessionTarget>('isolated')
    const [wakeMode, setWakeMode] = useState<CronWakeMode>('now')
    const [agentId, setAgentId] = useState('')
    const [deleteAfterRun, setDeleteAfterRun] = useState(false)

    // Payload
    const [payloadKind, setPayloadKind] = useState<'agentTurn' | 'systemEvent'>('agentTurn')
    const [payloadText, setPayloadText] = useState('')
    const [payloadModel, setPayloadModel] = useState('')
    const [payloadThinking, setPayloadThinking] = useState('')
    const [payloadTimeout, setPayloadTimeout] = useState('')

    // Delivery
    const [deliveryMode, setDeliveryMode] = useState<'none' | 'announce' | 'webhook'>('none')
    const [deliveryChannel, setDeliveryChannel] = useState('')
    const [deliveryTo, setDeliveryTo] = useState('')
    const [deliveryBestEffort, setDeliveryBestEffort] = useState(false)

    // Content
    const [content, setContent] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!client) return
        if (!name.trim()) {
            setError('Job name is required')
            return
        }
        if (payloadKind === 'agentTurn' && !payloadText.trim()) {
            setError('Payload message is required')
            return
        }
        if (payloadKind === 'systemEvent' && !payloadText.trim()) {
            setError('Payload text is required')
            return
        }

        try {
            setLoading(true)
            setError(null)

            let schedule: CronScheduleType
            if (scheduleKind === 'cron') {
                schedule = { kind: 'cron', expr: cronExpr.trim(), ...(cronTz ? { tz: cronTz } : {}) }
            } else if (scheduleKind === 'every') {
                schedule = { kind: 'every', everyMs: parseInt(everyMs) || 60000 }
            } else {
                schedule = { kind: 'at', at: atTime.trim() }
            }

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

            const delivery: CronDelivery = { mode: deliveryMode }
            if (deliveryMode === 'announce' && deliveryChannel) delivery.channel = deliveryChannel
            if (deliveryMode === 'webhook') {
                if (deliveryTo) delivery.to = deliveryTo
                delivery.bestEffort = deliveryBestEffort
            }

            await client.addCronJob({
                name: name.trim(),
                ...(description.trim() ? { description: description.trim() } : {}),
                schedule,
                sessionTarget,
                wakeMode,
                ...(agentId ? { agentId } : {}),
                deleteAfterRun,
                payload,
                delivery,
                ...(content.trim() ? { content: content.trim() } : {}),
                enabled: true,
            })
            await fetchCronJobs()
            closeDetailView()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create cron job')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="detail-view">
            <div className="detail-header">
                <button className="detail-back" onClick={closeDetailView}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                </button>
                <div className="detail-title-section">
                    <div>
                        <h1 className="detail-title">Create Cron Job</h1>
                        <p className="detail-subtitle">Schedule recurring tasks for OpenClaw</p>
                    </div>
                </div>
            </div>

            <div className="detail-content">
                {error && <div className="settings-error">{error}</div>}

                {/* Basic Info */}
                <div className="create-agent-section">
                    <h3>Basic Info</h3>
                    <div className="settings-row">
                        <div className="settings-row-label">
                            <span className="settings-label">Name</span>
                            <span className="settings-hint">A unique name for this job</span>
                        </div>
                        <div className="settings-row-control">
                            <input
                                type="text"
                                className="settings-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Daily Cleanup"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="settings-row">
                        <div className="settings-row-label">
                            <span className="settings-label">Description</span>
                            <span className="settings-hint">Optional description</span>
                        </div>
                        <div className="settings-row-control">
                            <input
                                type="text"
                                className="settings-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does this job do?"
                            />
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="create-agent-section">
                    <h3>Schedule</h3>
                    <div className="settings-row">
                        <div className="settings-row-label">
                            <span className="settings-label">Kind</span>
                        </div>
                        <div className="settings-row-control">
                            <select className="settings-select" value={scheduleKind} onChange={(e) => setScheduleKind(e.target.value as 'cron' | 'every' | 'at')}>
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
                                    <input className="settings-input" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} placeholder="0 * * * *" />
                                </div>
                            </div>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span className="settings-label">Timezone</span>
                                    <span className="settings-hint">Optional</span>
                                </div>
                                <div className="settings-row-control">
                                    <input className="settings-input" value={cronTz} onChange={(e) => setCronTz(e.target.value)} placeholder="UTC" />
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
                                <input className="settings-input" type="number" value={everyMs} onChange={(e) => setEveryMs(e.target.value)} placeholder="60000" />
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
                                <input className="settings-input" type="datetime-local" value={atTime} onChange={(e) => setAtTime(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Execution */}
                <div className="create-agent-section">
                    <h3>Execution</h3>
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
                </div>

                {/* Payload */}
                <div className="create-agent-section">
                    <h3>Payload</h3>
                    <div className="settings-row">
                        <div className="settings-row-label">
                            <span className="settings-label">Kind</span>
                            <span className="settings-hint">Type of payload to send</span>
                        </div>
                        <div className="settings-row-control">
                            <select className="settings-select" value={payloadKind} onChange={(e) => setPayloadKind(e.target.value as 'agentTurn' | 'systemEvent')}>
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
                                autoCorrect="on"
                                autoCapitalize="sentences"
                                spellCheck={true}
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
                </div>

                {/* Delivery */}
                <div className="create-agent-section">
                    <h3>Delivery</h3>
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
                </div>

                {/* Content */}
                <div className="create-agent-section">
                    <h3>Content</h3>
                    <p className="section-description">Optional notes or script content for this job.</p>
                    <textarea
                        className="settings-textarea"
                        style={{ height: '120px', fontFamily: 'monospace' }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Optional content or notes..."
                    />
                </div>

            </div>

            <div className="detail-footer">
                <button className="settings-button secondary" onClick={closeDetailView}>
                    Cancel
                </button>
                <button
                    className="settings-button primary"
                    onClick={handleCreate}
                    disabled={loading || !name.trim() || !payloadText.trim()}
                >
                    {loading ? 'Creating...' : 'Create Cron Job'}
                </button>
            </div>
        </div>
    )
}
