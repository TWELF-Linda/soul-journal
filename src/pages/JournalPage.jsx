import { useState, useEffect } from 'react'
import { generateDailyQuestions, generateDiarySummary } from '../api/claude'
import { uploadToImgur } from '../api/imgur'

const MOODS = ['😔 低落', '😐 普通', '🙂 還好', '😊 開心', '🌟 超棒']

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const days = ['日','一','二','三','四','五','六']
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 週${days[d.getDay()]}`
}

export default function JournalPage({ appData }) {
  const { data, saveDiary, getDiaryByDate } = appData
  const { settings } = data
  const date = today()
  const existing = getDiaryByDate(date)

  const [questions, setQuestions] = useState(existing?.questions || [
    '今天有沒有讓你感到「啊，這就是生活」的小瞬間？☀️',
    '今天與人的互動中，有沒有讓你感到溫暖或有點受傷的時刻？🌿',
    '如果今天的心情是一首歌，會是什麼感覺的曲子？🎵',
  ])
  const [answers, setAnswers] = useState(existing?.answers || ['', '', ''])
  const [mood, setMood] = useState(existing?.mood || '🙂 還好')
  const [currentQ, setCurrentQ] = useState(0)
  const [summary, setSummary] = useState(existing?.summary || '')
  const [images, setImages] = useState(existing?.images || [])
  const [loadingQ, setLoadingQ] = useState(false)
  const [loadingSum, setLoadingSum] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(!!existing)
  const [error, setError] = useState('')

  async function fetchQuestions() {
    if (!settings.claudeKey) { setError('請先在設定中填入 Claude API Key'); return }
    setLoadingQ(true)
    setError('')
    try {
      const qs = await generateDailyQuestions(formatDate(date), settings.claudeKey)
      setQuestions(qs)
      setAnswers(['', '', ''])
      setCurrentQ(0)
      setSummary('')
      setSaved(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingQ(false)
    }
  }

  async function fetchSummary() {
    if (!settings.claudeKey) { setError('請先在設定中填入 Claude API Key'); return }
    if (answers.every(a => !a.trim())) { setError('請至少回答一個問題再生成總結'); return }
    setLoadingSum(true)
    setError('')
    try {
      const s = await generateDiarySummary(questions, answers, mood, settings.claudeKey)
      setSummary(s)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingSum(false)
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!settings.imgurClientId) { setError('請先在設定中填入 Imgur Client ID'); return }
    setUploading(true)
    setError('')
    try {
      const result = await uploadToImgur(file, settings.imgurClientId)
      setImages(prev => [...prev, result.url])
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function handleSave() {
    const entry = {
      id: date,
      date,
      questions,
      answers,
      mood,
      summary,
      images,
      createdAt: new Date().toISOString(),
    }
    saveDiary(entry)
    setSaved(true)
  }

  const progress = Math.round((answers.filter(a => a.trim()).length / 3) * 100)

  return (
    <div className="fade-in">
      {/* Date */}
      <div style={{
        background: 'var(--accent)', color: 'white',
        fontSize: 11, fontWeight: 700, padding: '4px 10px',
        borderRadius: 20, display: 'inline-block', marginBottom: 12,
      }}>
        📅 {formatDate(date)}
      </div>

      {error && (
        <div style={{
          background: '#FFF0F0', border: '1px solid #F4C2C2',
          borderRadius: 10, padding: '10px 12px', fontSize: 13,
          color: '#C45A5A', marginBottom: 12,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* AI Questions Card */}
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🤖 今日AI提問
          </div>
          <button
            onClick={fetchQuestions}
            disabled={loadingQ}
            style={{
              fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              background: 'none', border: '1px solid var(--accent)',
              borderRadius: 20, padding: '3px 10px',
              opacity: loadingQ ? 0.6 : 1,
            }}>
            {loadingQ ? '生成中...' : '🔄 換題目'}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--warm)', borderRadius: 2, marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent3)', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>

        {/* Question tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: '1.5px solid ' + (currentQ === i ? 'var(--accent)' : 'var(--border)'),
                background: currentQ === i ? '#FFF0E8' : 'white',
                color: currentQ === i ? 'var(--accent)' : 'var(--text-light)',
                transition: 'all 0.15s',
              }}>
              Q{i + 1} {answers[i]?.trim() ? '✓' : ''}
            </button>
          ))}
        </div>

        {/* Current question */}
        <div style={{
          background: 'var(--warm)', borderRadius: 12, padding: '12px 14px',
          marginBottom: 12, borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>問題 {currentQ + 1}</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{questions[currentQ]}</div>
        </div>

        <textarea
          value={answers[currentQ]}
          onChange={e => {
            const next = [...answers]
            next[currentQ] = e.target.value
            setAnswers(next)
            setSaved(false)
          }}
          placeholder="在這裡寫下你的感受..."
          rows={3}
          style={{
            width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
            padding: '10px 12px', fontSize: 14, color: 'var(--text)',
            background: 'white', resize: 'vertical', outline: 'none',
            transition: 'border-color 0.2s', marginBottom: 12,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Mood */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>今天的心情</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => { setMood(m); setSaved(false) }}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 13,
                border: '1.5px solid ' + (mood === m ? 'var(--accent)' : 'var(--border)'),
                background: mood === m ? 'var(--accent)' : 'white',
                color: mood === m ? 'white' : 'var(--text)',
                transition: 'all 0.15s',
              }}>
              {m}
            </button>
          ))}
        </div>

        {/* Image upload */}
        <label style={{
          display: 'block', border: '2px dashed var(--border)', borderRadius: 12,
          padding: 14, textAlign: 'center', cursor: 'pointer',
          marginBottom: 12, transition: 'all 0.2s',
        }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--warm)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <div style={{ fontSize: 22, marginBottom: 4 }}>{uploading ? '⏳' : '📷'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
            {uploading ? '上傳中...' : images.length > 0 ? `已上傳 ${images.length} 張照片 · 點擊新增` : '上傳今日照片（自動同步至雲端）'}
          </div>
        </label>

        {/* Uploaded images preview */}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--border)' }} />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--accent2)', color: 'white',
                    border: 'none', fontSize: 10, lineHeight: 1,
                  }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {currentQ < 2 && (
            <button
              onClick={() => setCurrentQ(q => Math.min(q + 1, 2))}
              style={{
                padding: '9px 18px', borderRadius: 20, border: '1.5px solid var(--border)',
                background: 'var(--warm)', color: 'var(--text)', fontSize: 13, fontWeight: 700,
              }}>
              下一個問題 →
            </button>
          )}
          <button
            onClick={fetchSummary}
            disabled={loadingSum}
            style={{
              padding: '9px 18px', borderRadius: 20, border: 'none',
              background: loadingSum ? '#ccc' : 'var(--accent)', color: 'white',
              fontSize: 13, fontWeight: 700,
            }}>
            {loadingSum ? '✨ AI生成中...' : '✨ AI生成日記總結'}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="fade-in">
          <div style={{
            background: 'linear-gradient(135deg,#FDF0E8,#F9E4F0)',
            border: '1.5px solid var(--pink)', borderRadius: 16, padding: 16, marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent2)', marginBottom: 10 }}>🌸 今日日記 · AI總結</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{summary}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchSummary}
              disabled={loadingSum}
              style={{
                padding: '9px 18px', borderRadius: 20,
                border: '1.5px solid var(--border)', background: 'var(--warm)',
                color: 'var(--text)', fontSize: 13, fontWeight: 700,
              }}>
              🔄 重新生成
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '9px 18px', borderRadius: 20, border: 'none',
                background: saved ? 'var(--accent3)' : 'var(--accent3)',
                color: 'white', fontSize: 13, fontWeight: 700,
              }}>
              {saved ? '✅ 已儲存' : '💾 儲存日記'}
            </button>
          </div>
        </div>
      )}

      {!settings.claudeKey && (
        <div style={{
          background: '#E8F4FF', border: '1px solid #B8D4F0', borderRadius: 10,
          padding: '10px 12px', fontSize: 12, color: '#4A7FC4', lineHeight: 1.6, marginTop: 12,
        }}>
          <strong>💡 首次使用：</strong>請點右上角 ⚙️ 設定，填入你的 Claude API Key 和 Imgur Client ID，即可啟用所有 AI 功能和圖片上傳。
        </div>
      )}
    </div>
  )
}
