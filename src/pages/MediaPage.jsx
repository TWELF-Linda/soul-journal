import { useState, useRef } from 'react'

// ── Preset types ──────────────────────────────────────────────────
const PRESET_TYPES = {
  anime:   { label:'Anime',        icon:'⚔️',  color:'#534AB7', bg:'#EEEDFE', text:'#3C3489',
    fields:[{id:'creator',label:'原作 / 製作',required:false},{id:'episodes',label:'集數',required:false},{id:'platform',label:'觀看平台',required:false}], quote:false },
  book:    { label:'Book',         icon:'📚',  color:'#0F6E56', bg:'#E1F5EE', text:'#085041',
    fields:[{id:'author',label:'作者',required:true},{id:'pages',label:'頁數',required:false},{id:'publisher',label:'出版社',required:false}], quote:true },
  drama:   { label:'Drama',        icon:'📺',  color:'#185FA5', bg:'#E6F1FB', text:'#0C447C',
    fields:[{id:'cast',label:'主演',required:false},{id:'episodes',label:'集數',required:false},{id:'country',label:'國家 / 語言',required:false},{id:'platform',label:'觀看平台',required:false}], quote:false },
  musical: { label:'Musical',      icon:'🎭',  color:'#993556', bg:'#FBEAF0', text:'#72243E',
    fields:[{id:'cast',label:'演員',required:false},{id:'fav_song',label:'最喜歡的歌',required:false},{id:'theater',label:'劇團 / 導演',required:false},{id:'duration',label:'時長',required:false},{id:'country',label:'國家 / 語言',required:false},{id:'ticket_price',label:'票價',required:false}], quote:false },
  movie:   { label:'Movie',        icon:'🎬',  color:'#993C1D', bg:'#FAECE7', text:'#712B13',
    fields:[{id:'director',label:'導演',required:true},{id:'cast',label:'主演',required:false},{id:'country',label:'國家',required:false},{id:'duration',label:'時長',required:false}], quote:true },
  variety: { label:'Variety Show', icon:'🎉',  color:'#854F0B', bg:'#FAEEDA', text:'#633806',
    fields:[{id:'host',label:'主持 / 卡司',required:false},{id:'episodes',label:'集數 / 季數',required:false},{id:'platform',label:'平台 / 頻道',required:false}], quote:false },
}

const COLOR_OPTIONS = [
  { color:'#534AB7', bg:'#EEEDFE', text:'#3C3489' },
  { color:'#0F6E56', bg:'#E1F5EE', text:'#085041' },
  { color:'#185FA5', bg:'#E6F1FB', text:'#0C447C' },
  { color:'#993556', bg:'#FBEAF0', text:'#72243E' },
  { color:'#993C1D', bg:'#FAECE7', text:'#712B13' },
  { color:'#854F0B', bg:'#FAEEDA', text:'#633806' },
  { color:'#3B6D11', bg:'#EAF3DE', text:'#27500A' },
  { color:'#5F5E5A', bg:'#F1EFE8', text:'#444441' },
]
const ICON_OPTIONS = ['🎤','🎵','🎧','📻','🎙️','🎮','🎨','📷','✈️','⚽','🏋️','🎪','🌟','✨','🎲','🎯']

// ── Stars ─────────────────────────────────────────────────────────
function Stars({ n, size = 16, onChange }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange && onChange(i)} style={{
          background:'none', border:'none',
          cursor: onChange ? 'pointer' : 'default',
          fontSize: size, padding:0, lineHeight:1,
          color: i <= n ? '#BA7517' : '#D1C9B8',
        }}>★</button>
      ))}
    </div>
  )
}

function TypePill({ label, color, bg, text, size = 10 }) {
  return (
    <span style={{
      fontSize: size, fontWeight:500, padding:'2px 8px', borderRadius:999,
      border:`0.5px solid ${color}`, background: bg, color: text, whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

// ── Ticket (list row) — poster is 2:3 ratio ───────────────────────
function Ticket({ record, typesCfg, isOpen, onToggle }) {
  const t = typesCfg[record.type] || { label:record.type, color:'#888', bg:'#eee', text:'#555' }
  // poster: width 54, height 81 → 2:3
  return (
    <div onClick={onToggle} role="button" aria-expanded={isOpen} style={{
      display:'flex', alignItems:'stretch',
      background:'var(--card)', border:`0.5px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius:14, overflow:'hidden', cursor:'pointer',
      transition:'border-color .15s', marginBottom:8, minHeight:81,
    }}>
      {/* Poster 2:3 */}
      <div style={{
        width:54, flexShrink:0, background:'var(--warm)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, position:'relative', overflow:'hidden',
        alignSelf:'stretch',
      }}>
        {record.coverImg
          ? <img src={record.coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
          : record.emoji}
      </div>

      {/* Tear */}
      <div style={{
        width:1, flexShrink:0, margin:'8px 0',
        background:'repeating-linear-gradient(to bottom,var(--border) 0,var(--border) 4px,transparent 4px,transparent 8px)',
      }} />

      {/* Body */}
      <div style={{ flex:1, padding:'9px 10px', display:'flex', flexDirection:'column', justifyContent:'center', gap:3, minWidth:0 }}>
        <div style={{ fontSize:10, color:'var(--text-light)', fontFamily:'monospace' }}>
          #{String(record.id).padStart(3,'0')}
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {record.title}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <TypePill label={t.label} color={t.color} bg={t.bg} text={t.text} />
          {record.date && <span style={{ fontSize:11, color:'var(--text-light)' }}>{record.date}</span>}
        </div>
      </div>

      {/* Right: stars top, chevron bottom */}
      <div style={{
        flexShrink:0, padding:'9px 10px 9px 6px',
        display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'space-between', gap:4,
      }}>
        {record.rating ? <Stars n={record.rating} size={13} /> : <span />}
        <span style={{ fontSize:13, color:'var(--text-light)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────
function DetailPanel({ record, typesCfg, onEdit, onDelete }) {
  const t = typesCfg[record.type] || { label:record.type, color:'#888', bg:'#eee', text:'#555', fields:[], icon:'✨' }
  return (
    <div style={{
      marginLeft:8, marginTop:-6, marginBottom:10,
      background:'var(--warm)', border:'0.5px solid var(--border)',
      borderRadius:'0 0 14px 14px', overflow:'hidden',
    }}>
      <div style={{ display:'flex', borderBottom:'0.5px solid var(--border)' }}>
        {/* Big poster 2:3 — fixed width 88, height 132 */}
        <div style={{
          width:88, height:132, flexShrink:0, background:'var(--card)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:38, position:'relative', overflow:'hidden',
        }}>
          {record.coverImg
            ? <img src={record.coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
            : record.emoji}
        </div>
        <div style={{ flex:1, padding:12 }}>
          <div style={{ fontSize:10, color:'var(--text-light)', fontFamily:'monospace', marginBottom:2 }}>
            #{String(record.id).padStart(3,'0')}
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>{record.title}</div>
          <TypePill label={t.label} color={t.color} bg={t.bg} text={t.text} />
          {record.date && <div style={{ fontSize:12, color:'var(--text-light)', marginTop:6 }}>📅 {record.date}</div>}
          {record.rating > 0 && <div style={{ marginTop:4 }}><Stars n={record.rating} size={14} /></div>}
        </div>
      </div>
      <div style={{ padding:12 }}>
        {(t.fields || []).map(f =>
          record.fields?.[f.id] ? (
            <div key={f.id} style={{ display:'flex', gap:6, marginBottom:5, fontSize:13 }}>
              <span style={{ color:'var(--text-light)', flexShrink:0, minWidth:72 }}>{f.label}</span>
              <span style={{ color:'var(--text)' }}>{record.fields[f.id]}</span>
            </div>
          ) : null
        )}
        {record.quote && (
          <div style={{ borderLeft:'2px solid var(--border)', padding:'6px 10px', marginTop:8, fontSize:13, color:'var(--text-light)', fontStyle:'italic' }}>
            {record.quote}
          </div>
        )}
        {record.notes && (
          <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7, marginTop:8, whiteSpace:'pre-wrap' }}>
            {record.notes}
          </div>
        )}
        <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
          <button onClick={onEdit} style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:12, cursor:'pointer' }}>✏️ 編輯</button>
          <button onClick={onDelete} style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid #F4C2C2', background:'none', color:'#C45A5A', fontSize:12, cursor:'pointer' }}>🗑 刪除</button>
        </div>
      </div>
    </div>
  )
}

// ── FieldEditor — with required toggle ───────────────────────────
function FieldEditor({ fields, onChange }) {
  const add = () => onChange([...fields, { id:'f_'+Date.now(), label:'新欄位', required:false }])
  const remove = i => onChange(fields.filter((_, j) => j !== i))
  const update = (i, patch) => {
    const next = [...fields]; next[i] = { ...next[i], ...patch }; onChange(next)
  }
  return (
    <div>
      {fields.map((f, i) => (
        <div key={f.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
          {/* Field name */}
          <input
            value={f.label}
            onChange={e => update(i, { label: e.target.value })}
            style={{
              flex:1, fontSize:13, padding:'6px 10px',
              border:'1.5px solid var(--border)', borderRadius:8,
              background:'var(--card)', color:'var(--text)', outline:'none',
            }}
          />
          {/* Required toggle */}
          <button
            onClick={() => update(i, { required: !f.required })}
            title={f.required ? '必填（點擊改為選填）' : '選填（點擊改為必填）'}
            style={{
              flexShrink:0, padding:'4px 8px', borderRadius:20, fontSize:11, fontWeight:700,
              cursor:'pointer', transition:'all .12s',
              border: f.required ? '1.5px solid #993C1D' : '1.5px solid var(--border)',
              background: f.required ? '#FAECE7' : 'none',
              color: f.required ? '#993C1D' : 'var(--text-light)',
              whiteSpace:'nowrap',
            }}
          >{f.required ? '必填' : '選填'}</button>
          {/* Remove */}
          <button onClick={() => remove(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-light)', fontSize:18, padding:0, lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{
        width:'100%', padding:'7px', border:'1.5px dashed var(--border)',
        borderRadius:8, background:'none', color:'var(--text-light)', fontSize:12, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:4,
      }}>＋ 新增欄位</button>
    </div>
  )
}

// ── New Type Modal ────────────────────────────────────────────────
function NewTypeModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🎤')
  const [colorIdx, setColorIdx] = useState(0)
  const [fields, setFields] = useState([{ id:'f1', label:'備註', required:false }])

  function save() {
    if (!name.trim()) return
    const key = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    onSave(key, { label:name, icon, ...COLOR_OPTIONS[colorIdx], fields, quote:false })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(74,55,40,0.3)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--card)', borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>建立自訂類型</div>

        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:4 }}>類型名稱 *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：Concert、Podcast..."
            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--text)', background:'var(--card)', outline:'none' }} />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:6 }}>圖示</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ width:38, height:38, borderRadius:8, cursor:'pointer', fontSize:18, border: ic===icon ? '2px solid var(--accent)' : '1.5px solid var(--border)', background: ic===icon ? 'var(--warm)' : 'var(--card)' }}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:6 }}>顏色</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {COLOR_OPTIONS.map((c, i) => (
              <button key={i} onClick={() => setColorIdx(i)} style={{ width:28, height:28, borderRadius:'50%', background:c.color, cursor:'pointer', border: colorIdx===i ? '3px solid var(--text)' : '2px solid transparent' }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:6 }}>
            預設欄位
            <span style={{ fontSize:11, fontWeight:400, color:'var(--text-light)', marginLeft:6 }}>點「選填」可切換為「必填」</span>
          </label>
          <FieldEditor fields={fields} onChange={setFields} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button onClick={onClose} style={{ padding:10, borderRadius:20, border:'1.5px solid var(--border)', background:'var(--warm)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer' }}>取消</button>
          <button onClick={save} style={{ padding:10, borderRadius:20, border:'none', background:'var(--accent3)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>✓ 建立</button>
        </div>
      </div>
    </div>
  )
}

// ── Record Form Modal ─────────────────────────────────────────────
function RecordFormModal({ typesCfg, editRecord, nextId, settings, onSave, onClose }) {
  const isEdit = !!editRecord
  const initType = editRecord?.type || Object.keys(typesCfg)[0]
  const [selType, setSelType] = useState(initType)
  const [title, setTitle] = useState(editRecord?.title || '')
  const [date, setDate] = useState(editRecord?.date || new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(editRecord?.rating || 0)
  const [fieldVals, setFieldVals] = useState(editRecord?.fields || {})
  const [quote, setQuote] = useState(editRecord?.quote || '')
  const [notes, setNotes] = useState(editRecord?.notes || '')
  const [coverImg, setCoverImg] = useState(editRecord?.coverImg || null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localFields, setLocalFields] = useState(null)
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  // FIX: derive t directly from selType so it always reflects current selection
  const t = typesCfg[selType] || typesCfg[Object.keys(typesCfg)[0]]
  const activeFields = localFields !== null ? localFields : (t?.fields || [])

  function switchType(k) {
    setSelType(k)
    setLocalFields(null)
    setShowFieldEditor(false)
    setErrors({})
  }

  function setFv(id, val) { setFieldVals(prev => ({ ...prev, [id]: val })) }

  async function handleCover(e) {
    const f = e.target.files?.[0]; if (!f) return
    if (settings?.imgurClientId) {
      setUploading(true)
      try {
        const { uploadToImgur: up } = await import('../api/imgur')
        const res = await up(f, settings.imgurClientId)
        setCoverImg(res.url)
      } catch { readLocal(f) } finally { setUploading(false) }
    } else { readLocal(f) }
  }

  function readLocal(f) {
    const r = new FileReader()
    r.onload = ev => setCoverImg(ev.target.result)
    r.readAsDataURL(f)
  }

  function handleSave() {
    // Validate required fields
    const newErrors = {}
    if (!title.trim()) newErrors['_title'] = true
    activeFields.forEach(f => {
      if (f.required && !fieldVals[f.id]?.trim()) newErrors[f.id] = true
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    const defaultEmojis = { anime:'⚔️', book:'📚', drama:'📺', musical:'🎭', movie:'🎬', variety:'🎉' }
    if (localFields) t.fields = localFields
    onSave({
      id: editRecord?.id || nextId,
      type: selType, title, date, rating, coverImg,
      emoji: editRecord?.emoji || defaultEmojis[selType] || t?.icon || '✨',
      fields: fieldVals, quote, notes,
    })
  }

  const displayId = isEdit ? editRecord.id : nextId

  const inputStyle = (hasError) => ({
    width:'100%', padding:'8px 10px',
    border: hasError ? '1.5px solid #C45A5A' : '1.5px solid var(--border)',
    borderRadius:9, fontSize:13, color:'var(--text)', background:'var(--card)', outline:'none',
  })

  if (!t) return null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(74,55,40,0.3)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--card)', borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 14px' }} />

        {/* Header — FIX: reads from t which is derived from selType */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'var(--text)', flex:1 }}>
            {t.icon} {t.label}
          </span>
          <span style={{ fontSize:11, color:'var(--text-light)', fontFamily:'monospace' }}>
            #{String(displayId).padStart(3,'0')}
          </span>
        </div>

        {/* Type switcher */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
          {Object.entries(typesCfg).map(([k, ty]) => (
            <button key={k} onClick={() => switchType(k)} style={{
              padding:'3px 10px', borderRadius:999, fontSize:11, cursor:'pointer',
              border:`0.5px solid ${selType===k ? ty.color : 'var(--border)'}`,
              background: selType===k ? ty.bg : 'none',
              color: selType===k ? ty.text : 'var(--text-light)',
              fontWeight: selType===k ? 700 : 400,
              transition:'all .12s',
            }}>{ty.label}</button>
          ))}
        </div>

        {/* Cover (2:3) + Title/Date/Stars aligned */}
        <div style={{ display:'flex', gap:12, marginBottom:12 }}>
          {/* Poster: width 72, height 108 = 2:3 */}
          <div onClick={() => fileRef.current?.click()} style={{
            width:72, height:108, flexShrink:0,
            border:'1.5px dashed var(--border)', borderRadius:10,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:3, cursor:'pointer', position:'relative', overflow:'hidden', background:'var(--warm)',
          }}>
            {coverImg
              ? <img src={coverImg} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              : <><span style={{ fontSize:22 }}>📷</span><span style={{ fontSize:10, color:'var(--text-light)' }}>{uploading ? '上傳中...' : '封面'}</span></>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCover} style={{ display:'none' }} />
          </div>

          {/* Right column: title + date + stars — all same height as poster */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:0, height:108 }}>
            {/* Title */}
            <div style={{ flex:'0 0 auto', marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:700, color: errors['_title'] ? '#C45A5A' : 'var(--text-light)', display:'block', marginBottom:3 }}>
                標題 {errors['_title'] && <span style={{ fontSize:10 }}>（必填）</span>}
              </label>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({...p, _title:false})) }}
                placeholder="作品名稱"
                style={inputStyle(errors['_title'])}
              />
            </div>
            {/* Date */}
            <div style={{ flex:'0 0 auto', marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:3 }}>觀看日期</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle(false)} />
            </div>
            {/* Stars */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:3 }}>評分</label>
              <Stars n={rating} size={22} onChange={setRating} />
            </div>
          </div>
        </div>

        {/* Dynamic fields */}
        {(() => {
          const fs = activeFields; const rows = []
          for (let i = 0; i < fs.length; i += 2) {
            const a = fs[i], b = fs[i+1]
            rows.push(
              <div key={i} style={{ display:'grid', gridTemplateColumns:b?'1fr 1fr':'1fr', gap:8, marginBottom:8 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color: errors[a.id] ? '#C45A5A' : 'var(--text-light)', display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                    {a.label}
                    {a.required
                      ? <span style={{ fontSize:10, color:'#993C1D' }}>*</span>
                      : <span style={{ fontSize:10, color:'var(--text-light)', opacity:.6 }}>選填</span>}
                    {errors[a.id] && <span style={{ fontSize:10, color:'#C45A5A' }}>（必填）</span>}
                  </label>
                  <input value={fieldVals[a.id]||''} onChange={e => { setFv(a.id, e.target.value); setErrors(p=>({...p,[a.id]:false})) }} style={inputStyle(errors[a.id])} />
                </div>
                {b && <div>
                  <label style={{ fontSize:11, fontWeight:700, color: errors[b.id] ? '#C45A5A' : 'var(--text-light)', display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                    {b.label}
                    {b.required
                      ? <span style={{ fontSize:10, color:'#993C1D' }}>*</span>
                      : <span style={{ fontSize:10, color:'var(--text-light)', opacity:.6 }}>選填</span>}
                    {errors[b.id] && <span style={{ fontSize:10, color:'#C45A5A' }}>（必填）</span>}
                  </label>
                  <input value={fieldVals[b.id]||''} onChange={e => { setFv(b.id, e.target.value); setErrors(p=>({...p,[b.id]:false})) }} style={inputStyle(errors[b.id])} />
                </div>}
              </div>
            )
          }
          return rows
        })()}

        {/* Quote */}
        {t.quote && (
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:3 }}>最喜歡的一句話 / 台詞</label>
            <textarea value={quote} onChange={e => setQuote(e.target.value)} placeholder='"  "' rows={2} style={{ ...inputStyle(false), resize:'vertical', fontStyle:'italic' }} />
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', display:'block', marginBottom:3 }}>心得筆記</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="自由書寫感受..." rows={3} style={{ ...inputStyle(false), resize:'vertical' }} />
        </div>

        {/* Field editor */}
        <button onClick={() => setShowFieldEditor(v => !v)} style={{
          width:'100%', padding:'7px', marginBottom:10,
          border:'1.5px dashed var(--border)', borderRadius:9,
          background:'none', color:'var(--text-light)', fontSize:12, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:4,
        }}>
          ⚙️ {showFieldEditor ? '收起欄位編輯' : '編輯此類型的欄位（可設必填）'}
        </button>
        {showFieldEditor && (
          <div style={{ marginBottom:12, background:'var(--warm)', borderRadius:10, padding:12 }}>
            <div style={{ fontSize:11, color:'var(--text-light)', marginBottom:8 }}>
              點「選填 / 必填」按鈕切換，儲存後套用到此類型
            </div>
            <FieldEditor fields={activeFields} onChange={f => setLocalFields(f)} />
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button onClick={onClose} style={{ padding:10, borderRadius:20, border:'1.5px solid var(--border)', background:'var(--warm)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer' }}>取消</button>
          <button onClick={handleSave} style={{ padding:10, borderRadius:20, border:'none', background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{isEdit ? '✓ 更新' : '✓ 儲存'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main MediaPage ────────────────────────────────────────────────
export default function MediaPage({ appData }) {
  const { data, addMedia, updateMedia, deleteMedia, saveSettings } = appData
  const { settings } = data

  const [typesCfg, setTypesCfg] = useState(() => ({
    ...PRESET_TYPES,
    ...(data.customTypes || {}),
  }))

  const [filter, setFilter] = useState('all')
  const [activeDetail, setActiveDetail] = useState(null)
  const [modal, setModal] = useState(null)
  const [editRecord, setEditRecord] = useState(null)

  const media = data.media || []
  const nextId = media.length > 0 ? Math.max(...media.map(m => m.id || 0)) + 1 : 1
  const filtered = filter === 'all' ? media : media.filter(r => r.type === filter)

  function persistTypes(next) {
    setTypesCfg(next)
    const custom = {}
    Object.entries(next).forEach(([k, v]) => { if (!PRESET_TYPES[k]) custom[k] = v })
    saveSettings({ customTypes: custom })
  }

  function handleSave(rec) {
    if (editRecord) { updateMedia(rec) }
    else { addMedia(rec); setActiveDetail(rec.id) }
    if (rec.type && typesCfg[rec.type]) persistTypes({ ...typesCfg })
    setModal(null); setEditRecord(null)
  }

  function handleDelete(id) {
    if (!confirm('確定刪除這筆紀錄？')) return
    deleteMedia(id); setActiveDetail(null)
  }

  function addCustomType(key, cfg) {
    persistTypes({ ...typesCfg, [key]: cfg })
    setModal(null)
  }

  function deleteType(key) {
    if (!confirm(`刪除「${typesCfg[key]?.label}」類型？相關紀錄不會被刪除。`)) return
    const next = { ...typesCfg }; delete next[key]
    persistTypes(next)
    if (filter === key) setFilter('all')
  }

  const filterBtnStyle = (active) => ({
    padding:'4px 11px', borderRadius:999, fontSize:12, cursor:'pointer',
    border:`0.5px solid ${active ? 'var(--text)' : 'var(--border)'}`,
    background: active ? 'var(--text)' : 'none',
    color: active ? 'var(--card)' : 'var(--text-light)',
    fontWeight: active ? 700 : 400,
    transition:'all .12s',
    display:'inline-flex', alignItems:'center', gap:4,
  })

  return (
    <div className="fade-in">
      {/* Filter bar */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
        <button style={filterBtnStyle(filter==='all')} onClick={() => { setFilter('all'); setActiveDetail(null) }}>
          全部 <span style={{ fontSize:10, opacity:.7 }}>{media.length}</span>
        </button>
        {Object.entries(typesCfg).map(([k, ty]) => {
          const cnt = media.filter(r => r.type === k).length
          return (
            <button key={k} style={filterBtnStyle(filter===k)} onClick={() => { setFilter(k); setActiveDetail(null) }}>
              {ty.icon} {ty.label}
              {cnt > 0 && <span style={{ fontSize:10, opacity:.6 }}>{cnt}</span>}
              {!PRESET_TYPES[k] && (
                <span onClick={e => { e.stopPropagation(); deleteType(k) }}
                  style={{ marginLeft:1, fontSize:11, opacity:.5, cursor:'pointer' }} title="刪除此類型">×</span>
              )}
            </button>
          )
        })}
        <button onClick={() => setModal('newtype')} style={{
          padding:'4px 10px', borderRadius:999, fontSize:12, cursor:'pointer',
          border:'1.5px dashed var(--border)', background:'none', color:'var(--text-light)',
        }}>＋ 自訂類型</button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', color:'var(--text-light)', fontSize:13, padding:'40px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
          <div style={{ fontWeight:700, marginBottom:4 }}>
            {filter === 'all' ? '還沒有紀錄' : `還沒有 ${typesCfg[filter]?.label} 紀錄`}
          </div>
          <div>點下方 ＋ 新增第一筆</div>
        </div>
      )}

      {/* Ticket list */}
      {filtered.map(r => (
        <div key={r.id}>
          <Ticket record={r} typesCfg={typesCfg} isOpen={activeDetail===r.id}
            onToggle={() => setActiveDetail(activeDetail===r.id ? null : r.id)} />
          {activeDetail===r.id && (
            <DetailPanel record={r} typesCfg={typesCfg}
              onEdit={() => { setEditRecord(r); setModal('edit') }}
              onDelete={() => handleDelete(r.id)} />
          )}
        </div>
      ))}

      {/* Add button */}
      <button onClick={() => { setEditRecord(null); setModal('add') }} style={{
        width:'100%', padding:11, border:'1.5px dashed var(--border)',
        borderRadius:14, background:'none', color:'var(--text-light)', fontSize:13, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        transition:'all .15s', marginTop:4,
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-light)' }}>
        ＋ 新增紀錄
      </button>

      {(modal==='add' || modal==='edit') && (
        <RecordFormModal typesCfg={typesCfg} editRecord={modal==='edit'?editRecord:null}
          nextId={nextId} settings={settings} onSave={handleSave}
          onClose={() => { setModal(null); setEditRecord(null) }} />
      )}
      {modal==='newtype' && (
        <NewTypeModal onSave={addCustomType} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
