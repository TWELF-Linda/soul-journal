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
        // Migrate v1 data and early v2 custom types accidentally stored in settings.
        const { customTypes: settingsCustomTypes, ...settings } = parsed.settings || {}
        return {
          ...DEFAULT_DATA,
          ...parsed,
          customTypes: parsed.customTypes || settingsCustomTypes || {},
          settings: { ...DEFAULT_DATA.settings, ...settings },
        }
      }
    } catch {}
    return DEFAULT_DATA
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch (e) { console.warn('localStorage save failed:', e) }
  }, [data])

  const saveDiary = useCallback((entry) => {
    setData(prev => ({
      ...prev,
      diaries: [entry, ...prev.diaries.filter(d => d.date !== entry.date)],
    }))
  }, [])

  const getDiaryByDate = useCallback((date) => {
    return data.diaries.find(d => d.date === date) || null
  }, [data.diaries])

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

  const saveSettings = useCallback((patch) => {
    const { customTypes, ...settingsPatch } = patch
    setData(prev => ({
      ...prev,
      customTypes: customTypes !== undefined ? customTypes : prev.customTypes,
      settings: { ...prev.settings, ...settingsPatch },
    }))
  }, [])

  const saveCustomTypes = useCallback((customTypes) => {
    setData(prev => ({ ...prev, customTypes: customTypes || {} }))
  }, [])

  const loadFromCloud = useCallback((cloudData) => {
    const { settings: cloudSettings, ...safeCloudData } = cloudData || {}
    setData(prev => ({
      ...DEFAULT_DATA,
      ...safeCloudData,
      customTypes: cloudData?.customTypes || cloudSettings?.customTypes || {},
      settings: prev.settings,
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
    saveCustomTypes,
    loadFromCloud,
  }
}
