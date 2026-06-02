import { useState } from 'react'

const FIELDS = [
  {
    key: 'claudeKey',
    label: 'Claude API Key',
    placeholder: 'sk-ant-...',
    emoji: '🤖',
    badge: '免費額度',
    help: '新帳號有免費額度，一般日記用量極少。至 console.anthropic.com 取得',
    link: 'https://console.anthropic.com',
    type: 'password',
  },
  {
    key: 'githubToken',
    label: 'GitHub Token',
    placeholder: 'ghp_...',
    emoji: '☁️',
    badge: '完全免費',
    help: '跨裝置同步資料用。GitHub Settings → Developer Settings → Tokens，勾選 gist 權限',
    link: 'https://github.com/settings/tokens',
    type: 'password',
  },
  {
    key: 'gistId',
    label: 'Gist ID（首次同步自動建立）',
    placeholder: '自動填入...',
    emoji: '🔗',
    badge: null,
    help: '第一次點 ☁️ 同步按鈕後自動建立並填入，不需要手動設定',
    link: null,
    type: 'text',
  },
  {
    key: 'imgurClientId',
    label: 'Imgur Client ID（選填）',
    placeholder: '不填也能上傳圖片',
    emoji: '📷',
    badge: '選填',
    help: '不填：圖片自動壓縮後存本地（完全免費）。填入後改用 Imgur 雲端，Gist 容量較小',
    link: 'https://api.imgur.com/oauth2/addclient',
    type: 'text',
  },
]

export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSave(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  const inputStyle = {
    width:'100%', padding:'9px 12px',
    border:'1.5px solid var(--border)', borderRadius:10,
    fontSize:13, color:'var(--text)', background:'var(--card)', outline:'none',
    marginBottom:4,
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(74,55,40,0.3)', zIndex:300,
      display:'flex', alignItems:'flex-end', justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background:'var(--card)', borderRadius:'20px 20px 0 0',
        padding:20, width:'100%', maxWidth:480,
        maxHeight:'90vh', overflowY:'auto',
        animation:'slideUp 0.3s ease',
      }}>
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>⚙️ 設定</div>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:20, lineHeight:1.5 }}>
          所有 API Key 只儲存在你的裝置本地，不會傳送到任何伺服器。
        </div>

        {FIELDS.map(f => (
          <div key={f.key} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:13, fontWeight:700, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}>
                {f.emoji} {f.label}
                {f.badge && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:999,
                    background: f.badge==='選填' ? 'var(--warm)' : '#E8F5EE',
                    color: f.badge==='選填' ? 'var(--text-light)' : '#0F6E56',
                    border: '0.5px solid ' + (f.badge==='選填' ? 'var(--border)' : '#0F6E56'),
                  }}>{f.badge}</span>
                )}
              </label>
              {f.link && (
                <a href={f.link} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>
                  取得 →
                </a>
              )}
            </div>
            <input
              type={f.type}
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ fontSize:11, color:'var(--text-light)' }}>{f.help}</div>
          </div>
        ))}

        <div style={{
          background:'#E8F5EE', border:'1px solid #A8D4BC', borderRadius:10,
          padding:'10px 12px', fontSize:12, color:'#0F6E56', lineHeight:1.6, marginBottom:16,
        }}>
          <strong>✅ 所有功能完全免費：</strong><br/>
          🤖 Claude API — 新帳號有免費額度，日記用量極少<br/>
          ☁️ GitHub Gist — 完全免費，無限儲存<br/>
          📷 圖片 — 不需任何 Key，自動壓縮存本地<br/><br/>
          <strong>📱 跨裝置使用：</strong>填入同一組 GitHub Token + Gist ID 即可
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{
            flex:1, padding:10, borderRadius:20,
            border:'1.5px solid var(--border)', background:'var(--warm)',
            color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer',
          }}>取消</button>
          <button onClick={handleSave} style={{
            flex:1, padding:10, borderRadius:20, border:'none',
            background: saved ? 'var(--accent3)' : 'var(--accent)',
            color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
            transition:'background .3s',
          }}>{saved ? '✅ 已儲存！' : '💾 儲存設定'}</button>
        </div>
      </div>
    </div>
  )
}
