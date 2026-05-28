// src/hooks/useGistSync.js
// Syncs all app data to a private GitHub Gist for free cross-device storage

import { useState, useCallback } from 'react'

const GIST_API = 'https://api.github.com/gists'
const FILENAME = 'soul-journal-data.json'

export function useGistSync() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [error, setError] = useState(null)

  // Save all data to Gist
  const pushToGist = useCallback(async (data, token, gistId) => {
    if (!token) return { success: false, error: '未設定 GitHub Token' }
    setSyncing(true)
    setError(null)
    try {
      const body = {
        description: 'SoulNote 心靈日記資料',
        public: false,
        files: {
          [FILENAME]: { content: JSON.stringify(data, null, 2) },
        },
      }
      let res
      if (gistId) {
        res = await fetch(`${GIST_API}/${gistId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch(GIST_API, {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
      }
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || '同步失敗')
      setLastSync(new Date())
      return { success: true, gistId: result.id }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  // Load data from Gist
  const pullFromGist = useCallback(async (token, gistId) => {
    if (!token || !gistId) return null
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch(`${GIST_API}/${gistId}`, {
        headers: { Authorization: `token ${token}` },
      })
      if (!res.ok) throw new Error('讀取失敗')
      const gist = await res.json()
      const content = gist.files?.[FILENAME]?.content
      if (!content) return null
      setLastSync(new Date())
      return JSON.parse(content)
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setSyncing(false)
    }
  }, [])

  return { pushToGist, pullFromGist, syncing, lastSync, error }
}
