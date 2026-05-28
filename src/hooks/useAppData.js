// src/hooks/useAppData.js
// Central state: diary entries, media records, custom types, settings
// Persists to localStorage; syncs to GitHub Gist via useGistSync

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'soul-journal-v2'

const DEFAULT_DATA = {
  diaries: [],
  media: [],
  customTypes: {},
  settings: {
    claudeKey: '',
    imgurClientId: '',
    githubToken: '',
    gistId: '',
  },
}

export function useAppData() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Migrate v1 data (no customTypes key)
        return { ...DEFAULT_DATA, ...parsed, customTypes: parsed.customTypes || {} }
      }
    } catch {}
    return DEFAULT_DATA
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch (e) { console.warn('localStorage save failed:', e) }
  }, [data])

  // ── Diary ────────────────────────────────────────────────────────
  const saveDiary = useCallback((entry) => {
    setData(prev => ({
      ...prev,
      diaries: [entry, ...prev.diaries.filter(d => d.date !== entry.date)],
    }))
  }, [])

  const getDiaryByDate = useCallback((date) => {
    return data.diaries.find(d => d.date === date) || null
  }, [data.diaries])

  // ── Media ────────────────────────────────────────────────────────
  const addMedia = useCallback((record) => {
    setData(prev => ({
      ...prev,
      media: [{ ...record, id: record.id || Date.now() }, ...prev.media],
    }))
  }, [])

  const updateMedia = useCallback((record) => {
    setData(prev => ({
      ...prev,
      media: prev.media.map(m => m.id === record.id ? record : m),
    }))
  }, [])

  const deleteMedia = useCallback((id) => {
    setData(prev => ({ ...prev, media: prev.media.filter(m => m.id !== id) }))
  }, [])

  // ── Settings (includes customTypes) ─────────────────────────────
  const saveSettings = useCallback((patch) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const loadFromCloud = useCallback((cloudData) => {
    setData(prev => ({
      ...cloudData,
      customTypes: cloudData.customTypes || {},
      settings: prev.settings, // always keep local keys
    }))
  }, [])

  return {
    data,
    saveDiary,
    getDiaryByDate,
    addMedia,
    updateMedia,
    deleteMedia,
    saveSettings,
    loadFromCloud,
  }
}
