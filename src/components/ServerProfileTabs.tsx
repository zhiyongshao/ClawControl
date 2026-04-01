import { useState } from 'react'
import { useStore } from '../store'

export function ServerProfileTabs() {
  const {
    serverProfiles,
    activeProfileId,
    connected,
    connecting,
    switchProfile,
    updateServerProfile,
    setShowSettings
  } = useStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Only show tabs when disconnected and there are 2+ profiles
  if (connected || connecting || serverProfiles.length < 2) return null

  const handleStartRename = (e: React.MouseEvent, profile: { id: string; name: string }) => {
    e.stopPropagation()
    setEditingId(profile.id)
    setEditName(profile.name)
  }

  const handleFinishRename = (profileId: string) => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== serverProfiles.find(p => p.id === profileId)?.name) {
      updateServerProfile(profileId, { name: trimmed })
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, profileId: string) => {
    if (e.key === 'Enter') {
      handleFinishRename(profileId)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="server-profile-tabs">
      {serverProfiles.map(profile => (
        <button
          key={profile.id}
          className={`profile-tab ${profile.id === activeProfileId ? 'active' : ''}`}
          onClick={() => switchProfile(profile.id)}
          title={profile.serverUrl}
        >
          {editingId === profile.id ? (
            <input
              className="profile-tab-rename"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleFinishRename(profile.id)}
              onKeyDown={(e) => handleKeyDown(e, profile.id)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="profile-tab-name"
              onDoubleClick={(e) => handleStartRename(e, profile)}
            >
              {profile.name}
            </span>
          )}
        </button>
      ))}
      <button
        className="profile-tab add-tab"
        onClick={() => setShowSettings(true)}
        title="Add server profile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
