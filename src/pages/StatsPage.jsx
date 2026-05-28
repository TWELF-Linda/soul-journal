import { useState } from 'react'
import { generateMonthlySummary } from '../api/claude'

const MOOD_SCORE = { '😔 低落': 1, '😐 普通': 2, '🙂 還好': 3, '😊 開心': 4, '🌟 超棒': 5 }
const MOOD_COLOR = ['#8B9DC3','#B8B8A0','#7BB8A4','#E8956D','#F5A623']
const TYPE_LABELS = { movie:'電影', tv:'影集', concert:'演唱會', musical:'音樂劇', music:'音樂', anime:'動漫', book:'書籍', game:'遊戲', other:'其他' }
const TYPE_EMOJI = { movie:'🎬', tv:'📺', concert:'🎤', musical:'🎪', music:'🎵', anime:'🌟', book:'📚', game:'🎮', other:'✨' }

function getLast7Days(diaries) {
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const days = ['日','一','二','三','四','五','六']
    const label = i === 0 ? '今天' : `週${days[d.getDay()]}`
    const entry = diaries.find(e => e.date === dateStr)
    result.push({ label, score: entry ? (MOOD_SCORE[entry.mood] || 3) : null })
  }
  return result
}

export default function StatsPage({ appData, onOpenSettings }) {
  const { data } = appData
  const { diaries, media, settings } = data
  const [monthSummary, setMonthSummary] = useState('')
  const [loading, setLoading] = useState(false)

  const moodDays = getLast7Days(diaries)
  const happyCount = diaries.filter(d => ['😊 開心','🌟 超棒'].includes(d.mood)).length
  const happyPct = diaries.length > 0 ? Math.round((happyCount / diaries.length) * 100) : 0

  const typeCounts = media.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc }, {})
  const sortedTypes = Object.entries(typeCounts).sort((a,b) => b[1]-a[1])
  const maxCount = sortedTypes[0]?.[1] || 1

  async function handleMonthSummary() {
    if (!settings.claudeKey) { onOpenSettings(); return }
    setLoading(true)
    try {
      const s = await generateMonthlySummary(diaries, settings.claudeKey)
      setMonthSummary(s)
    } catch (e) {
      setMonthSummary('生成失敗：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { num: diaries.length, label: '日記天數' },
          { num: media.length,   label: '娛樂紀錄' },
          { num: happyPct + '%', label: '開心指數' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--warm)', borderRadius: 12, padding: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{s.num}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mood chart */}
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', marginBottom: 14 }}>📊 近7日心情走勢</div>
        {diaries.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', padding: '20px 0' }}>開始記錄日記後，心情圖表會在這裡出現</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, paddingTop: 8, marginBottom: 6 }}>
              {moodDays.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: day.score ? `${(day.score / 5) * 100}%` : '8%',
                    background: day.score ? MOOD_COLOR[day.score - 1] : 'var(--border)',
                    transition: 'height 0.4s',
                    opacity: day.score ? 1 : 0.3,
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--text-light)' }}>{day.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {['低落','普通','還好','開心','超棒'].map((m, i) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-light)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: MOOD_COLOR[i] }} />
                  {m}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Media breakdown */}
      {sortedTypes.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', marginBottom: 14 }}>🎭 娛樂類型分佈</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedTypes.map(([type, count]) => (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span>{TYPE_EMOJI[type] || '✨'} {TYPE_LABELS[type] || type}</span>
                  <span style={{ fontWeight: 700 }}>{count}次</span>
                </div>
                <div style={{ height: 6, background: 'var(--warm)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', width: `${(count / maxCount) * 100}%`,
                    background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Monthly summary */}
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', marginBottom: 10 }}>💬 AI月度心靈總結</div>
        {monthSummary ? (
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
            {monthSummary}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>
            讓 AI 分析你這個月的心靈日記，生成個人化的月度報告 🌸
          </div>
        )}
        <button
          onClick={handleMonthSummary}
          disabled={loading || diaries.length === 0}
          style={{
            padding: '9px 18px', borderRadius: 20, border: 'none',
            background: diaries.length === 0 ? '#ccc' : 'var(--accent2)',
            color: 'white', fontSize: 13, fontWeight: 700,
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? '✨ 生成中...' : monthSummary ? '🔄 重新生成' : '📊 生成月度報告'}
        </button>
        {diaries.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>至少記錄一篇日記後才能生成報告</div>
        )}
      </div>
    </div>
  )
}
