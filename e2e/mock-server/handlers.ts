// RPC method handlers for the mock OpenClaw v3 server

import {
  MOCK_AGENTS,
  MOCK_SESSIONS,
  MOCK_MESSAGES,
  MOCK_SKILLS,
  MOCK_CRON_JOBS,
  MOCK_HOOKS,
  MOCK_NODES,
  MOCK_CONFIG,
  MOCK_USAGE,
  MOCK_IDENTITY,
} from './fixtures'

export type RpcHandler = (params: any) => any

/** Default RPC handlers that return fixture data. */
export function createDefaultHandlers(): Map<string, RpcHandler> {
  const handlers = new Map<string, RpcHandler>()

  // Connection
  handlers.set('connect', (params) => ({
    ok: true,
    payload: {
      type: 'hello-ok',
      agent: MOCK_AGENTS[0],
      policy: { tickIntervalMs: 30000 },
    },
  }))

  // Sessions
  handlers.set('sessions.list', () => ({
    ok: true,
    payload: { sessions: MOCK_SESSIONS },
  }))

  handlers.set('sessions.spawn', (params) => {
    const key = params?.key || `session-${Date.now()}`
    return {
      ok: true,
      payload: {
        key,
        id: key,
        title: params?.title || 'New Session',
        agentId: params?.agentId || 'agent-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  })

  handlers.set('sessions.patch', () => ({ ok: true, payload: {} }))
  handlers.set('sessions.delete', () => ({ ok: true, payload: {} }))

  // Chat
  handlers.set('chat.send', (params) => ({
    ok: true,
    payload: {
      sessionKey: params?.sessionKey || 'session-1',
      messageId: `msg-${Date.now()}`,
    },
  }))

  handlers.set('chat.history', (params) => ({
    ok: true,
    payload: {
      messages: params?.sessionKey === 'session-2'
        ? [{ id: 'msg-s2-1', role: 'user', content: 'How are you?', timestamp: '2025-01-02T00:00:00Z' }]
        : MOCK_MESSAGES,
    },
  }))

  handlers.set('chat.abort', () => ({ ok: true, payload: {} }))

  // Agents
  handlers.set('agents.list', () => ({
    ok: true,
    payload: { agents: MOCK_AGENTS },
  }))

  handlers.set('agent.identity.get', () => ({
    ok: true,
    payload: MOCK_IDENTITY,
  }))

  handlers.set('agents.create', (params) => ({
    ok: true,
    payload: {
      id: `agent-${Date.now()}`,
      name: params?.name || 'New Agent',
      status: 'offline',
    },
  }))

  handlers.set('agents.delete', () => ({ ok: true, payload: {} }))

  handlers.set('agents.files.list', () => ({
    ok: true,
    payload: {
      files: [
        { name: 'AGENT.md', path: '/agents/claw/AGENT.md', missing: false, size: 1024 },
        { name: 'config.yaml', path: '/agents/claw/config.yaml', missing: false, size: 256 },
      ],
    },
  }))

  handlers.set('agents.files.get', (params) => ({
    ok: true,
    payload: {
      name: params?.name || 'AGENT.md',
      content: '# Agent Configuration\n\nThis is the agent identity file.',
    },
  }))

  handlers.set('agents.files.set', () => ({ ok: true, payload: {} }))

  // Skills
  handlers.set('skills.status', () => ({
    ok: true,
    payload: { skills: MOCK_SKILLS },
  }))

  handlers.set('skills.update', () => ({ ok: true, payload: {} }))
  handlers.set('skills.install', () => ({ ok: true, payload: {} }))

  // Cron jobs
  handlers.set('cron.list', () => ({
    ok: true,
    payload: { jobs: MOCK_CRON_JOBS },
  }))

  handlers.set('cron.get', (params) => {
    const job = MOCK_CRON_JOBS.find((j) => j.id === params?.jobId)
    return { ok: true, payload: job || MOCK_CRON_JOBS[0] }
  })

  handlers.set('cron.update', () => ({ ok: true, payload: {} }))
  handlers.set('cron.create', (params) => ({
    ok: true,
    payload: {
      id: `cron-${Date.now()}`,
      name: params?.name || 'New Cron',
      schedule: params?.schedule || '* * * * *',
      status: 'active',
    },
  }))
  handlers.set('cron.delete', () => ({ ok: true, payload: {} }))

  // Hooks
  handlers.set('hooks.list', () => ({
    ok: true,
    payload: { hooks: MOCK_HOOKS },
  }))

  handlers.set('hooks.update', () => ({ ok: true, payload: {} }))

  // Config
  handlers.set('config.get', () => ({
    ok: true,
    payload: {
      config: MOCK_CONFIG.config,
      hash: MOCK_CONFIG.baseHash,
    },
  }))

  handlers.set('config.patch', () => ({
    ok: true,
    payload: { baseHash: 'def456' },
  }))

  // Features
  handlers.set('features.list', () => ({
    ok: true,
    payload: { features: {} },
  }))

  // Nodes
  handlers.set('nodes.list', () => ({
    ok: true,
    payload: { nodes: MOCK_NODES },
  }))

  handlers.set('nodes.approve', () => ({ ok: true, payload: {} }))
  handlers.set('nodes.reject', () => ({ ok: true, payload: {} }))
  handlers.set('nodes.remove', () => ({ ok: true, payload: {} }))

  // Exec approvals
  handlers.set('exec.approvals', () => ({
    ok: true,
    payload: { pending: [], history: [] },
  }))

  handlers.set('exec.resolve', () => ({ ok: true, payload: {} }))

  // Device pairing
  handlers.set('device.pair.list', () => ({
    ok: true,
    payload: { requests: [], devices: MOCK_NODES },
  }))

  handlers.set('device.pair.approve', () => ({ ok: true, payload: {} }))
  handlers.set('device.pair.reject', () => ({ ok: true, payload: {} }))
  handlers.set('device.pair.remove', () => ({ ok: true, payload: {} }))

  // Usage
  handlers.set('usage.get', () => ({
    ok: true,
    payload: MOCK_USAGE,
  }))

  return handlers
}
