// Mock data for OpenClaw v3 protocol tests

import type { Session, Agent, Skill, CronJob, Hook, Message, Node } from '../../src/lib/openclaw/types'

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Claw',
    description: 'Default AI assistant',
    status: 'online',
    emoji: '🤖',
    model: 'gpt-4',
    configured: true,
  },
  {
    id: 'agent-2',
    name: 'Researcher',
    description: 'Research-focused agent',
    status: 'offline',
    emoji: '🔬',
    model: 'gpt-4',
    configured: true,
  },
]

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1',
    key: 'session-1',
    title: 'First conversation',
    agentId: 'agent-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T01:00:00Z',
    lastMessage: 'Hello there!',
  },
  {
    id: 'session-2',
    key: 'session-2',
    title: 'Second conversation',
    agentId: 'agent-1',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T01:00:00Z',
    lastMessage: 'How are you?',
  },
]

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello there!',
    timestamp: '2025-01-01T00:00:00Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: '2025-01-01T00:00:01Z',
  },
]

export const MOCK_SKILLS: Skill[] = [
  {
    id: 'skill-web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    triggers: ['search', 'find'],
    enabled: true,
    bundled: true,
    emoji: '🔍',
  },
  {
    id: 'skill-code-exec',
    name: 'Code Execution',
    description: 'Execute code in a sandbox',
    triggers: ['run', 'execute'],
    enabled: false,
    bundled: true,
    emoji: '💻',
  },
  {
    id: 'skill-file-ops',
    name: 'File Operations',
    description: 'Read and write files',
    triggers: ['read', 'write', 'file'],
    enabled: true,
    bundled: false,
    emoji: '📁',
  },
]

export const MOCK_CRON_JOBS: CronJob[] = [
  {
    id: 'cron-1',
    name: 'Daily Summary',
    schedule: '0 9 * * *',
    status: 'active',
    description: 'Generate daily summary at 9am',
    agentId: 'agent-1',
  },
  {
    id: 'cron-2',
    name: 'Weekly Report',
    schedule: '0 0 * * 1',
    status: 'paused',
    description: 'Generate weekly report on Monday',
    agentId: 'agent-1',
  },
]

export const MOCK_HOOKS: Hook[] = [
  {
    id: 'hook-1',
    name: 'Pre-response Filter',
    enabled: true,
    events: ['chat.response'],
    description: 'Filters responses before delivery',
    source: 'bundled',
    emoji: '🔒',
  },
  {
    id: 'hook-2',
    name: 'Notification Relay',
    enabled: false,
    events: ['chat.send'],
    description: 'Sends notifications on new messages',
    source: 'workspace',
    emoji: '🔔',
    env: { WEBHOOK_URL: 'https://example.com/hook' },
  },
]

export const MOCK_NODES: Node[] = [
  {
    nodeId: 'node-1',
    displayName: 'My Desktop',
    platform: 'win32',
    version: '1.0.0',
    caps: ['exec', 'file'],
    commands: ['bash', 'node'],
    paired: true,
    connected: true,
  },
  {
    nodeId: 'node-2',
    displayName: 'My Laptop',
    platform: 'darwin',
    version: '1.0.0',
    caps: ['exec'],
    commands: ['zsh'],
    paired: true,
    connected: false,
  },
]

export const MOCK_CONFIG = {
  baseHash: 'abc123',
  config: {
    agent: {
      model: 'gpt-4',
      thinking: { enabled: false, budget: 5000 },
      timeout: 120,
      maxTurns: 25,
    },
    tools: {
      web: { enabled: true },
      exec: { enabled: true, approval: 'auto' },
    },
    memory: {
      backend: 'sqlite',
    },
    channels: {
      discord: { enabled: false, policies: {} },
      slack: { enabled: false, policies: {} },
    },
    hooks: {
      enabled: true,
      internal: {
        enabled: true,
        entries: {
          'hook-1': {
            enabled: true,
            events: ['chat.response'],
            description: 'Filters responses before delivery',
            emoji: '🔒',
            source: 'bundled',
          },
          'hook-2': {
            enabled: false,
            events: ['chat.send'],
            description: 'Sends notifications on new messages',
            emoji: '🔔',
            source: 'workspace',
            env: { WEBHOOK_URL: 'https://example.com/hook' },
          },
        },
      },
    },
    features: {},
  },
}

export const MOCK_USAGE = {
  daily: [
    { date: '2025-01-01', tokens: 15000, cost: 0.45 },
    { date: '2025-01-02', tokens: 22000, cost: 0.66 },
    { date: '2025-01-03', tokens: 18000, cost: 0.54 },
  ],
  agents: [
    { agentId: 'agent-1', name: 'Claw', tokens: 45000, cost: 1.35 },
    { agentId: 'agent-2', name: 'Researcher', tokens: 10000, cost: 0.30 },
  ],
  total: { tokens: 55000, cost: 1.65 },
}

export const MOCK_IDENTITY = {
  name: 'Claw',
  emoji: '🤖',
  description: 'Default AI assistant',
  model: 'gpt-4',
  thinkingLevel: 'medium',
}

export const MOCK_CLAWHUB_SKILLS = [
  {
    id: 'clawhub-skill-1',
    name: 'Advanced Search',
    description: 'Enhanced web search with multiple sources',
    author: 'clawhub',
    version: '1.0.0',
    downloads: 1500,
    rating: 4.5,
  },
  {
    id: 'clawhub-skill-2',
    name: 'Image Generator',
    description: 'Generate images from text prompts',
    author: 'clawhub',
    version: '2.1.0',
    downloads: 3000,
    rating: 4.8,
  },
]
