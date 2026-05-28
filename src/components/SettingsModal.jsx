import { useState } from 'react'

const FIELDS = [
  {
    key: 'claudeKey',
    label: 'Claude API Key',
    placeholder: 'sk-ant-...',
    emoji: '🤖',
    help: '至 console.anthropic.com 取得',
    link: 'https://console.anthropic.com',
    type: 'password',
  },
  {
    key: 'imgurClientId',
    label: 'Imgur Client ID',
    placeholder: 'xxxxxxxxxxxxxxx',
    emoji: '📷',
    help: '免費圖片上傳 → api.imgur.com/oauth2/addclient',
    link: 'https://api.imgur.com/oauth2/addclient',
    type: 'text',
  },
  {
    key: 'githubToken',
    label: 'GitHub Token',
    placeholder: 'ghp_...',
    emoji: '☁️',
    help: '跨裝置同步 → GitHub Settings > Developer Settings > Tokens（需勾選 gist 權限）',
    link: 'https://github.com/settings/tokens',
    type: 'password',
  },
  {
    key: 'gistId',
    label: 'Gist ID（首次同步自動建立）',
    placeholder: '自動填入...',
    emoji: '🔗',
    help: '第一次點 ☁️ 同步按鈕後會自動建立並填入',
    link: null,
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
              <label style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{f.emoji} {f.label}</label>
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
          background:'#E8F4FF', border:'1px solid #B8D4F0', borderRadius:10,
          padding:'10px 12px', fontSize:12, color:'#4A7FC4', lineHeight:1.6, marginBottom:16,
        }}>
          <strong>📱 跨裝置使用方式：</strong><br/>
          1. Fork 此專案到你的 GitHub<br/>
          2. 啟用 GitHub Pages（Settings → Pages → GitHub Actions）<br/>
          3. 任何裝置開啟 Pages 網址即可使用<br/>
          4. 填入同一組 GitHub Token + Gist ID 即可同步資料與自訂類型
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
