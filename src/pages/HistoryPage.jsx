import { useState } from 'react'

const MOOD_BG = {
  '😔 低落': '#E8F0FF',
  '😐 普通': '#F0EEE8',
  '🙂 還好': '#E8F5F0',
  '😊 開心': '#FFF0E8',
  '🌟 超棒': '#FFF8E0',
}
const MOOD_COLOR = {
  '😔 低落': '#5A7AC4',
  '😐 普通': '#8B7355',
  '🙂 還好': '#3D9B74',
  '😊 開心': '#E8956D',
  '🌟 超棒': '#C4A020',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const days = ['日','一','二','三','四','五','六']
  return `${d.getMonth()+1}月${d.getDate()}日 週${days[d.getDay()]}`
}

function DiaryDetail({ entry, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(74,55,40,0.3)',
      zIndex: 200, overflowY: 'auto', padding: 16,
    }} onClick={onClose}>
      <div
        className="fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 20, padding: 20,
          maxWidth: 480, margin: '40px auto',
          border: '1.5px solid var(--border)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{
              background: MOOD_BG[entry.mood] || 'var(--warm)',
              color: MOOD_COLOR[entry.mood] || 'var(--text)',
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, display: 'inline-block', marginBottom: 6,
            }}>
              {formatDate(entry.date)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>心情：{entry.mood}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--warm)', border: '1.5px solid var(--border)',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {entry.questions?.map((q, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{
              background: 'var(--warm)', borderRadius: 10, padding: '10px 12px',
              borderLeft: '3px solid var(--accent)', marginBottom: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>Q{i+1}</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{q}</div>
            </div>
            {entry.answers?.[i] && (
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, padding: '0 4px' }}>
                {entry.answers[i]}
              </div>
            )}
          </div>
        ))}

        {entry.summary && (
          <div style={{
            background: 'linear-gradient(135deg,#FDF0E8,#F9E4F0)',
            border: '1.5px solid var(--pink)', borderRadius: 14, padding: 14, marginTop: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)', marginBottom: 8 }}>🌸 AI 日記總結</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{entry.summary}</div>
          </div>
        )}

        {entry.images?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>📷 照片</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {entry.images.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage({ appData }) {
  const { data } = appData
  const { diaries } = data
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = diaries.filter(d =>
    !search || d.summary?.includes(search) || d.answers?.some(a => a.includes(search))
  )

  if (diaries.length === 0) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>還沒有日記</div>
        <div style={{ fontSize: 13 }}>到「今日日記」頁面開始記錄你的第一篇吧！</div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 搜尋日記內容..."
        style={{
          width: '100%', padding: '10px 14px',
          border: '1.5px solid var(--border)', borderRadius: 12,
          fontSize: 14, marginBottom: 14, background: 'white',
          outline: 'none', color: 'var(--text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)', fontSize: 13 }}>
          找不到符合的日記
        </div>
      )}

      {filtered.map(entry => (
        <div
          key={entry.id}
          onClick={() => setSelected(entry)}
          className="fade-in"
          style={{
            background: 'var(--card)', border: '1.5px solid var(--border)',
            borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: MOOD_BG[entry.mood] || 'var(--warm)',
                color: MOOD_COLOR[entry.mood] || 'var(--text)',
                fontSize: 10, fontWeight: 700, padding: '3px 8px',
                borderRadius: 20, display: 'inline-block', marginBottom: 8,
              }}>
                {formatDate(entry.date)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>
                {entry.summary
                  ? entry.summary.slice(0, 80) + (entry.summary.length > 80 ? '...' : '')
                  : entry.answers?.find(a => a.trim())?.slice(0, 80) || '（無內容）'}
              </div>
            </div>
            <div style={{ fontSize: 26, marginLeft: 10, flexShrink: 0 }}>
              {entry.mood?.split(' ')[0] || '📝'}
            </div>
          </div>
          {entry.images?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-light)' }}>📷 {entry.images.length} 張照片</div>
          )}
        </div>
      ))}

      {selected && <DiaryDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
