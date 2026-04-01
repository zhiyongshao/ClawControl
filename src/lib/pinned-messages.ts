// Pinned messages — client-side message pinning backed by localStorage (v2026.3.12)
// Mirrors the OpenClaw Control UI pinned-messages pattern.

const PREFIX = 'clawcontrol:pinned:'

export class PinnedMessages {
  private key: string
  private _ids = new Set<string>()

  constructor(sessionKey: string) {
    this.key = PREFIX + sessionKey
    this.load()
  }

  get ids(): Set<string> {
    return this._ids
  }

  has(id: string): boolean {
    return this._ids.has(id)
  }

  pin(id: string): void {
    this._ids.add(id)
    this.save()
  }

  unpin(id: string): void {
    this._ids.delete(id)
    this.save()
  }

  toggle(id: string): void {
    if (this._ids.has(id)) {
      this.unpin(id)
    } else {
      this.pin(id)
    }
  }

  clear(): void {
    this._ids.clear()
    this.save()
  }

  get count(): number {
    return this._ids.size
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        this._ids = new Set(arr.filter((s: unknown) => typeof s === 'string'))
      }
    } catch {
      // ignore
    }
  }

  private save(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify([...this._ids]))
    } catch {
      // storage full
    }
  }
}
