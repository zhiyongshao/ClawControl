// Slash command definitions and parser for ClawControl
// Mirrors the OpenClaw Control UI slash command system (v2026.3.12)

export type SlashCommandCategory = 'session' | 'model' | 'tools' | 'agents'

export interface SlashCommandDef {
  name: string
  description: string
  args?: string
  category: SlashCommandCategory
  /** When true, the command is executed client-side instead of sent to the agent. */
  executeLocal: boolean
  /** Fixed argument choices for inline hints. */
  argOptions?: string[]
}

export const SLASH_COMMANDS: SlashCommandDef[] = [
  // Session
  { name: 'new', description: 'Start a new session', category: 'session', executeLocal: true },
  { name: 'reset', description: 'Reset current session', category: 'session', executeLocal: true },
  { name: 'compact', description: 'Compact session context', category: 'session', executeLocal: true },
  { name: 'stop', description: 'Stop current run', category: 'session', executeLocal: true },
  { name: 'clear', description: 'Clear chat history', category: 'session', executeLocal: true },

  // Model
  { name: 'model', description: 'Show or set model', args: '<name>', category: 'model', executeLocal: true },
  { name: 'think', description: 'Set thinking level', args: '<level>', category: 'model', executeLocal: true, argOptions: ['off', 'low', 'medium', 'high'] },
  { name: 'fast', description: 'Toggle fast mode', args: '<on|off>', category: 'model', executeLocal: true, argOptions: ['status', 'on', 'off'] },
  { name: 'verbose', description: 'Toggle verbose mode', args: '<on|off|full>', category: 'model', executeLocal: true, argOptions: ['on', 'off', 'full'] },

  // Tools
  { name: 'help', description: 'Show available commands', category: 'tools', executeLocal: true },
  { name: 'export', description: 'Export session to Markdown', category: 'tools', executeLocal: true },
  { name: 'usage', description: 'Show token usage', category: 'tools', executeLocal: true },

  // Agents
  { name: 'agents', description: 'List agents', category: 'agents', executeLocal: true },
  { name: 'kill', description: 'Abort sub-agents', args: '<id|all>', category: 'agents', executeLocal: true },
]

export const CATEGORY_LABELS: Record<SlashCommandCategory, string> = {
  session: 'Session',
  model: 'Model',
  tools: 'Tools',
  agents: 'Agents',
}

const CATEGORY_ORDER: SlashCommandCategory[] = ['session', 'model', 'tools', 'agents']

export interface ParsedSlashCommand {
  command: SlashCommandDef
  args: string
}

/**
 * Parse a message as a slash command. Returns null if it doesn't match.
 * Supports `/command`, `/command args...`, and `/command: args...`.
 */
export function parseSlashCommand(text: string): ParsedSlashCommand | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null

  const body = trimmed.slice(1)
  const firstSeparator = body.search(/[\s:]/)
  const name = (firstSeparator === -1 ? body : body.slice(0, firstSeparator)).toLowerCase()
  let remainder = firstSeparator === -1 ? '' : body.slice(firstSeparator).trimStart()
  if (remainder.startsWith(':')) remainder = remainder.slice(1).trimStart()
  const args = remainder.trim()

  if (!name) return null

  const command = SLASH_COMMANDS.find(cmd => cmd.name === name)
  if (!command) return null

  return { command, args }
}

/** Get slash command completions filtered by a prefix. */
export function getSlashCommandCompletions(filter: string): SlashCommandDef[] {
  const lower = filter.toLowerCase()
  const commands = lower
    ? SLASH_COMMANDS.filter(
        cmd => cmd.name.startsWith(lower) || cmd.description.toLowerCase().includes(lower)
      )
    : SLASH_COMMANDS

  return [...commands].sort((a: SlashCommandDef, b: SlashCommandDef) => {
    const ai = CATEGORY_ORDER.indexOf(a.category)
    const bi = CATEGORY_ORDER.indexOf(b.category)
    if (ai !== bi) return ai - bi
    if (lower) {
      const aExact = a.name.startsWith(lower) ? 0 : 1
      const bExact = b.name.startsWith(lower) ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
    }
    return 0
  })
}
