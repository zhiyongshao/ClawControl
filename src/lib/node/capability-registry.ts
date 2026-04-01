// Capability registry — declares what this node can do, sent during connect handshake.
// Driven by the command catalog and filtered by user permissions.

import type { NodeCapability } from './types'
import { getPlatform } from '../platform'
import { getCommandsForPlatform } from './command-catalog'

/** All capabilities this node advertises, filtered by platform + permissions. */
export function getCapabilities(permissions: Record<string, boolean>): NodeCapability[] {
  const platform = getPlatform()
  const available = getCommandsForPlatform(platform)

  // Group enabled commands by category
  const groups = new Map<string, string[]>()
  for (const cmd of available) {
    if (!permissions[cmd.command]) continue
    const key = cmd.category.toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(cmd.command)
  }

  return Array.from(groups.entries()).map(([name, commands]) => ({
    name,
    commands,
    available: () => true
  }))
}

/** Flat list of capability group names for the connect handshake. */
export function getCapNames(permissions: Record<string, boolean>): string[] {
  return getCapabilities(permissions).map(c => c.name)
}

/** Flat list of all commands for the connect handshake. */
export function getCommands(permissions: Record<string, boolean>): string[] {
  return getCapabilities(permissions).flatMap(c => c.commands)
}

/** Permissions map — grants each enabled command explicitly. */
export function getPermissions(permissions: Record<string, boolean>): Record<string, boolean> {
  const perms: Record<string, boolean> = {}
  for (const cmd of getCommands(permissions)) {
    perms[cmd] = true
  }
  return perms
}
