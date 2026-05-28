import { useState, useEffect } from 'react'
import { useAppData } from './hooks/useAppData'
import { useGistSync } from './hooks/useGistSync'
import JournalPage from './pages/JournalPage'
import HistoryPage from './pages/HistoryPage'
import MediaPage from './pages/MediaPage'
import StatsPage from './pages/StatsPage'
import SettingsModal from './components/SettingsModal'

const TABS = [
  { id:'journal', label:'今日日記', emoji:'🌿' },
  { id:'history', label:'日記回顧', emoji:'📖' },
  { id:'media',   label:'娛樂紀錄', emoji:'🎬' },
  { id:'stats',   label:'統計',     emoji:'✨' },
]

export default function App() {
  const [tab, setTab] = useState('journal')
  const [showSettings, setShowSettings] = useState(false)
  const appData = useAppData()
  const { pushToGist, pullFromGist, syncing, lastSync } = useGistSync()
  const { data, saveSettings, loadFromCloud } = appData
  const { settings } = data

  // Pull from Gist on first load if configured
  useEffect(() => {
    if (settings.githubToken && settings.gistId) {
      pullFromGist(settings.githubToken, settings.gistId).then(cloud => {
        if (cloud) loadFromCloud(cloud)
      })
    }
  }, []) // eslint-disable-line

  async function handleSync() {
    if (!settings.githubToken) { setShowSettings(true); return }
    const syncData = { diaries: data.diaries, media: data.media, customTypes: data.customTypes || {} }
    const result = await pushToGist(syncData, settings.githubToken, settings.gistId)
    if (result.success && result.gistId && !settings.gistId) {
      saveSettings({ gistId: result.gistId })
    }
  }

  const tabStyle = (active) => ({
    flexShrink:0, padding:'10px 12px',
    fontSize:13, fontWeight:600,
    color: active ? 'var(--accent)' : 'var(--text-light)',
    background:'none', border:'none',
    borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
    display:'flex', alignItems:'center', gap:5,
    whiteSpace:'nowrap', transition:'all 0.2s', cursor:'pointer',
  })

  const iconBtnStyle = {
    width:36, height:36, borderRadius:'50%',
    background:'var(--warm)', border:'1.5px solid var(--border)',
    fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', transition:'transform 0.2s',
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'var(--cream)', position:'relative' }}>

      {/* Header */}
      <div style={{
        background:'var(--card)', borderBottom:'1.5px solid var(--border)',
        padding:'14px 20px 10px', display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🌸</span>
          <div>
            <div style={{ fontSize:18, fontWeight:800 }}>心靈日記</div>
            <div style={{ fontSize:10, color:'var(--text-light)', fontWeight:500, letterSpacing:'0.05em' }}>SoulNote</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {syncing && <span style={{ fontSize:11, color:'var(--text-light)', animation:'pulse 1s infinite' }}>同步中...</span>}
          {lastSync && !syncing && <span style={{ fontSize:10, color:'var(--accent3)' }}>✓ 已同步</span>}
          <button onClick={handleSync} title="同步至雲端" style={{ ...iconBtnStyle, animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
            ☁️
          </button>
          <button onClick={() => setShowSettings(true)} style={iconBtnStyle}>⚙️</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        background:'var(--card)', display:'flex',
        borderBottom:'1.5px solid var(--border)',
        overflowX:'auto', padding:'0 8px',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(tab === t.id)}>
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Pages */}
      <div style={{ padding:16, paddingBottom:80 }}>
        {tab === 'journal' && <JournalPage  appData={appData} />}
        {tab === 'history' && <HistoryPage  appData={appData} />}
        {tab === 'media'   && <MediaPage    appData={appData} />}
        {tab === 'stats'   && <StatsPage    appData={appData} onOpenSettings={() => setShowSettings(true)} />}
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
