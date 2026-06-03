import { useState, useRef, useCallback } from 'react'
import { uploadToImgur } from '../api/imgur'

// ── Preset types ──────────────────────────────────────────────────
const PRESET_TYPES = {
  anime:   { label:'Anime',        icon:'⚔️',  color:'#534AB7', bg:'#EEEDFE', text:'#3C3489', gradient:'linear-gradient(135deg,#534AB7,#8B7FD4)',
    fields:[{id:'creator',label:'原作 / 製作',required:false},{id:'episodes',label:'集數',required:false},{id:'platform',label:'觀看平台',required:false}], quote:false, ticketFields:[] },
  book:    { label:'Book',         icon:'📚',  color:'#0F6E56', bg:'#E1F5EE', text:'#085041', gradient:'linear-gradient(135deg,#0F6E56,#3DAB8A)',
    fields:[{id:'author',label:'作者',required:true},{id:'pages',label:'頁數',required:false},{id:'publisher',label:'出版社',required:false}], quote:true, ticketFields:[] },
  drama:   { label:'Drama',        icon:'📺',  color:'#185FA5', bg:'#E6F1FB', text:'#0C447C', gradient:'linear-gradient(135deg,#185FA5,#4A8FD4)',
    fields:[{id:'cast',label:'主演',required:false},{id:'episodes',label:'集數',required:false},{id:'country',label:'國家 / 語言',required:false},{id:'platform',label:'觀看平台',required:false}], quote:false, ticketFields:[] },
  musical: { label:'Musical',      icon:'🎭',  color:'#993556', bg:'#FBEAF0', text:'#72243E', gradient:'linear-gradient(135deg,#993556,#C4607A)',
    fields:[{id:'cast',label:'演員',required:false},{id:'fav_song',label:'最喜歡的歌',required:false},{id:'theater',label:'劇團 / 導演',required:false},{id:'duration',label:'時長',required:false},{id:'country',label:'國家',required:false},{id:'ticket_price',label:'票價',required:false}], quote:false,
    ticketFields:[{id:'venue',label:'場館'},{id:'zone',label:'區域'},{id:'row',label:'排'},{id:'seat',label:'座位'}] },
  movie:   { label:'Movie',        icon:'🎬',  color:'#993C1D', bg:'#FAECE7', text:'#712B13', gradient:'linear-gradient(135deg,#993C1D,#C4653D)',
    fields:[{id:'director',label:'導演',required:true},{id:'cast',label:'主演',required:false},{id:'country',label:'國家',required:false},{id:'duration',label:'時長',required:false}], quote:true,
    ticketFields:[{id:'cinema',label:'影院'},{id:'hall',label:'廳'},{id:'row',label:'排'},{id:'seat',label:'座位'}] },
  variety: { label:'Variety Show', icon:'🎉',  color:'#854F0B', bg:'#FAEEDA', text:'#633806', gradient:'linear-gradient(135deg,#854F0B,#B8832A)',
    fields:[{id:'host',label:'主持 / 卡司',required:false},{id:'episodes',label:'集數 / 季數',required:false},{id:'platform',label:'平台 / 頻道',required:false}], quote:false, ticketFields:[] },
}

const COLOR_OPTIONS = [
  {color:'#534AB7',bg:'#EEEDFE',text:'#3C3489',gradient:'linear-gradient(135deg,#534AB7,#8B7FD4)'},
  {color:'#0F6E56',bg:'#E1F5EE',text:'#085041',gradient:'linear-gradient(135deg,#0F6E56,#3DAB8A)'},
  {color:'#185FA5',bg:'#E6F1FB',text:'#0C447C',gradient:'linear-gradient(135deg,#185FA5,#4A8FD4)'},
  {color:'#993556',bg:'#FBEAF0',text:'#72243E',gradient:'linear-gradient(135deg,#993556,#C4607A)'},
  {color:'#993C1D',bg:'#FAECE7',text:'#712B13',gradient:'linear-gradient(135deg,#993C1D,#C4653D)'},
  {color:'#854F0B',bg:'#FAEEDA',text:'#633806',gradient:'linear-gradient(135deg,#854F0B,#B8832A)'},
  {color:'#7B3FA0',bg:'#F3E8FF',text:'#5B2880',gradient:'linear-gradient(135deg,#7B3FA0,#A86CC4)'},
  {color:'#3B6D11',bg:'#EAF3DE',text:'#27500A',gradient:'linear-gradient(135deg,#3B6D11,#6AAD2A)'},
]
const ICON_OPTIONS = ['🎤','🎵','🎧','📻','🎙️','🎮','🎨','📷','✈️','⚽','🏋️','🎪','🌟','✨','🎲','🎯']
const RATING_LABELS = ['','普通','還好','不錯','很好','超棒！']

// ── Stars ─────────────────────────────────────────────────────────
function Stars({ n, size=16, onChange }) {
  return (
    <div style={{display:'flex',gap:3}}>
      {[1,2,3,4,5].map(i=>(
        <button key={i}
          onClick={()=>onChange&&onChange(n===i?0:i)}
          style={{background:'none',border:'none',cursor:onChange?'pointer':'default',
            fontSize:size,padding:0,lineHeight:1,color:i<=n?'#BA7517':'#D1C9B8',transition:'color .1s'}}>★</button>
      ))}
    </div>
  )
}

function TypePill({label,color,bg,text,size=10}) {
  return <span style={{fontSize:size,fontWeight:600,padding:'2px 8px',borderRadius:999,
    border:`0.5px solid ${color}`,background:bg,color:text,whiteSpace:'nowrap'}}>{label}</span>
}

// ── Image helper — no dynamic import, always works ────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        try {
          const MAX = 800
          const ratio = Math.min(MAX/img.width, MAX/img.height, 1)
          const canvas = document.createElement('canvas')
          canvas.width  = Math.round(img.width  * ratio)
          canvas.height = Math.round(img.height * ratio)
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        } catch(e) { reject(e) }
      }
      img.onerror = () => reject(new Error('圖片載入失敗'))
      img.src = ev.target.result
    }
    reader.onerror = () => reject(new Error('讀取圖片失敗'))
    reader.readAsDataURL(file)
  })
}

// ── Ticket list row ───────────────────────────────────────────────
function TicketRow({ record, typesCfg, isSelected, onSelect }) {
  const t = typesCfg[record.type] || {label:record.type,color:'#888',bg:'#eee',text:'#555',gradient:'linear-gradient(135deg,#888,#aaa)'}
  const d = record.date ? new Date(record.date+'T00:00:00') : null
  const month = d ? (d.getMonth()+1)+'月' : ''
  const day   = d ? String(d.getDate()).padStart(2,'0') : ''
  const year  = d ? d.getFullYear()+'年' : ''

  return (
    <div onClick={onSelect} role="button" aria-expanded={isSelected}
      style={{display:'flex',alignItems:'stretch',borderRadius:16,overflow:'hidden',
        marginBottom:10,cursor:'pointer',minHeight:90,position:'relative',
        boxShadow:isSelected?'0 4px 20px rgba(0,0,0,0.22)':'0 2px 8px rgba(0,0,0,0.10)',
        transition:'box-shadow .2s, transform .15s',transform:isSelected?'scale(1.01)':'scale(1)'}}>

      {/* BG */}
      <div style={{position:'absolute',inset:0,borderRadius:16,overflow:'hidden',zIndex:0}}>
        {record.coverImg
          ? <img src={record.coverImg} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:'blur(14px) brightness(0.5)',transform:'scale(1.15)'}}/>
          : <div style={{width:'100%',height:'100%',background:t.gradient}}/>}
      </div>

      {/* Poster */}
      <div style={{width:60,flexShrink:0,position:'relative',zIndex:1,overflow:'hidden',alignSelf:'stretch',borderRadius:'16px 0 0 16px'}}>
        {record.coverImg
          ? <img src={record.coverImg} alt={record.title} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{record.emoji||'🎬'}</div>}
      </div>

      {/* Tear */}
      <div style={{width:1,flexShrink:0,margin:'10px 0',position:'relative',zIndex:1,
        background:'repeating-linear-gradient(to bottom,rgba(255,255,255,0.45) 0,rgba(255,255,255,0.45) 4px,transparent 4px,transparent 8px)'}}/>

      {/* Body */}
      <div style={{flex:1,padding:'10px 10px',position:'relative',zIndex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:3,minWidth:0}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',fontFamily:'monospace'}}>#{String(record.id).padStart(3,'0')}</div>
        <div style={{fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.3,
          overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
          {record.title||'（未命名）'}
        </div>
        {record.fields?.artist
          ? <div style={{fontSize:12,color:'rgba(255,255,255,0.8)'}}>{record.fields.artist}</div>
          : <TypePill label={t.label} color="rgba(255,255,255,0.3)" bg="rgba(255,255,255,0.15)" text="#fff"/>}
        {record.fields?.venue&&<div style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>📍 {record.fields.venue}</div>}
      </div>

      {/* Tear */}
      <div style={{width:1,flexShrink:0,margin:'10px 0',position:'relative',zIndex:1,
        background:'repeating-linear-gradient(to bottom,rgba(255,255,255,0.45) 0,rgba(255,255,255,0.45) 4px,transparent 4px,transparent 8px)'}}/>

      {/* Date + stars */}
      <div style={{width:52,flexShrink:0,position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'8px 4px',gap:0}}>
        {d ? <>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.7)',fontWeight:600}}>{month}</div>
          <div style={{fontSize:24,fontWeight:800,color:'#fff',lineHeight:1}}>{day}</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',writingMode:'vertical-rl',letterSpacing:1,marginTop:1}}>{year}</div>
        </> : <div style={{fontSize:20,color:'rgba(255,255,255,0.4)'}}>—</div>}
        {record.rating>0&&<div style={{marginTop:4,fontSize:10,color:'#FFD966',letterSpacing:0.5}}>{'★'.repeat(record.rating)}</div>}
      </div>
    </div>
  )
}

// ── Full ticket detail modal ──────────────────────────────────────
function TicketDetail({ record, typesCfg, onEdit, onDelete, onClose }) {
  const t = typesCfg[record.type] || {label:record.type,color:'#888',bg:'#eee',text:'#555',gradient:'linear-gradient(135deg,#888,#aaa)',fields:[],ticketFields:[]}

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(10,8,20,0.8)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',
      animation:'fadeIn .2s ease'}}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{width:'100%',maxWidth:380,borderRadius:24,overflow:'hidden',
          boxShadow:'0 24px 80px rgba(0,0,0,0.6)',animation:'fadeIn .2s ease',
          maxHeight:'92vh',display:'flex',flexDirection:'column'}}>

        {/* Poster */}
        <div style={{position:'relative',background:t.gradient,minHeight:220,flexShrink:0}}>
          {record.coverImg
            ? <img src={record.coverImg} alt="" style={{width:'100%',maxHeight:320,objectFit:'cover',display:'block'}}/>
            : <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',fontSize:72}}>{record.emoji||'🎬'}</div>}
          <div style={{position:'absolute',bottom:0,left:0,right:0,
            background:'linear-gradient(transparent,rgba(0,0,0,0.85))',padding:'32px 16px 14px'}}>
            <div style={{fontSize:17,fontWeight:800,color:'#fff',lineHeight:1.3,marginBottom:record.fields?.artist?4:0}}>{record.title}</div>
            {record.fields?.artist&&<div style={{fontSize:14,color:'rgba(255,255,255,0.8)'}}>{record.fields.artist}</div>}
          </div>
          <button onClick={onClose}
            style={{position:'absolute',top:12,right:12,width:32,height:32,borderRadius:'50%',
              background:'rgba(0,0,0,0.45)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
        </div>

        {/* Tear */}
        <div style={{background:'#F5EFE8',display:'flex',alignItems:'center',overflow:'visible',flexShrink:0,zIndex:1,position:'relative'}}>
          <div style={{width:18,height:18,borderRadius:'50%',background:'rgba(10,8,20,0.8)',flexShrink:0,marginLeft:-9}}/>
          <div style={{flex:1,borderTop:'2px dashed #D0C8BE'}}/>
          <div style={{width:18,height:18,borderRadius:'50%',background:'rgba(10,8,20,0.8)',flexShrink:0,marginRight:-9}}/>
        </div>

        {/* Info */}
        <div style={{background:'#F5EFE8',padding:'14px 16px 20px',overflowY:'auto'}}>
          {/* Ticket fields grid */}
          {((t.ticketFields||[]).some(tf=>record.fields?.[tf.id])||record.date)&&(
            <div style={{background:'#fff',borderRadius:12,padding:'10px 14px',marginBottom:12,
              display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 14px'}}>
              {record.date&&(
                <div style={{gridColumn:'1/-1'}}>
                  <div style={{fontSize:10,color:'#B0A090',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:2}}>日期</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#3A2E24'}}>{record.date}</div>
                </div>
              )}
              {(t.ticketFields||[]).map(tf=>record.fields?.[tf.id]?(
                <div key={tf.id}>
                  <div style={{fontSize:10,color:'#B0A090',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:2}}>{tf.label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#3A2E24'}}>{record.fields[tf.id]}</div>
                </div>
              ):null)}
            </div>
          )}

          {/* Other fields */}
          {(t.fields||[]).some(f=>record.fields?.[f.id])&&(
            <div style={{marginBottom:10}}>
              {(t.fields||[]).map(f=>record.fields?.[f.id]?(
                <div key={f.id} style={{display:'flex',gap:8,marginBottom:5,fontSize:13}}>
                  <span style={{color:'#8B7355',flexShrink:0,minWidth:68}}>{f.label}</span>
                  <span style={{color:'#3A2E24',fontWeight:500}}>{record.fields[f.id]}</span>
                </div>
              ):null)}
            </div>
          )}

          {record.rating>0&&<div style={{marginBottom:8}}><Stars n={record.rating} size={18}/></div>}

          {record.quote&&(
            <div style={{borderLeft:'3px solid '+t.color,paddingLeft:10,marginBottom:10,
              fontSize:13,color:'#5A4A3A',fontStyle:'italic',lineHeight:1.6}}>{record.quote}</div>
          )}
          {record.notes&&(
            <div style={{fontSize:13,color:'#5A4A3A',lineHeight:1.7,marginBottom:12,whiteSpace:'pre-wrap'}}>{record.notes}</div>
          )}

          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={onEdit}
              style={{padding:'8px 18px',borderRadius:20,border:'1.5px solid #D0C8BE',
                background:'#fff',color:'#3A2E24',fontSize:13,cursor:'pointer',fontWeight:600}}>✏️ 編輯</button>
            <button onClick={onDelete}
              style={{padding:'8px 18px',borderRadius:20,border:'1.5px solid #F4C2C2',
                background:'none',color:'#C45A5A',fontSize:13,cursor:'pointer',fontWeight:600}}>🗑 刪除</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FieldEditor ───────────────────────────────────────────────────
function FieldEditor({ fields, onChange, ticketFields, onTicketFieldsChange }) {
  function addField() {
    onChange([...fields, {id:'f_'+Date.now(), label:'新欄位', required:false}])
  }
  function removeField(i) { onChange(fields.filter((_,j)=>j!==i)) }
  function updateField(i, patch) {
    const next=[...fields]; next[i]={...next[i],...patch}; onChange(next)
  }
  function addTicketField() {
    if(onTicketFieldsChange)
      onTicketFieldsChange([...ticketFields, {id:'tf_'+Date.now(), label:'新票根欄位'}])
  }
  function removeTicketField(i) {
    if(onTicketFieldsChange) onTicketFieldsChange(ticketFields.filter((_,j)=>j!==i))
  }
  function updateTicketField(i, val) {
    if(!onTicketFieldsChange) return
    const next=[...ticketFields]; next[i]={...next[i],label:val}; onTicketFieldsChange(next)
  }

  const inp = {width:'100%',fontSize:13,padding:'6px 10px',border:'1.5px solid var(--border)',
    borderRadius:8,background:'var(--card)',color:'var(--text)',outline:'none'}

  return (
    <div>
      {onTicketFieldsChange && <>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-light)',marginBottom:6}}>🎟 票根固定欄位</div>
        {ticketFields.map((f,i)=>(
          <div key={f.id} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
            <input value={f.label} onChange={e=>updateTicketField(i,e.target.value)} style={inp}/>
            <button onClick={()=>removeTicketField(i)}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',fontSize:18,padding:0,flexShrink:0}}>×</button>
          </div>
        ))}
        <button onClick={addTicketField}
          style={{width:'100%',padding:'6px',border:'1.5px dashed #B8A888',borderRadius:8,
            background:'none',color:'#8B7355',fontSize:11,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:3,marginBottom:12}}>＋ 新增票根欄位</button>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-light)',marginBottom:6}}>📋 其他欄位</div>
      </>}
      {fields.map((f,i)=>(
        <div key={f.id} style={{display:'flex',gap:6,marginBottom:7,alignItems:'center'}}>
          <input value={f.label} onChange={e=>updateField(i,{label:e.target.value})} style={inp} placeholder="欄位名稱"/>
          <button onClick={()=>updateField(i,{required:!f.required})}
            style={{flexShrink:0,padding:'4px 8px',borderRadius:20,fontSize:11,fontWeight:700,
              cursor:'pointer',whiteSpace:'nowrap',transition:'all .12s',
              border:f.required?'1.5px solid #993C1D':'1.5px solid var(--border)',
              background:f.required?'#FAECE7':'none',color:f.required?'#993C1D':'var(--text-light)'}}>
            {f.required?'必填':'選填'}
          </button>
          <button onClick={()=>removeField(i)}
            style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',fontSize:18,padding:0,lineHeight:1,flexShrink:0}}>×</button>
        </div>
      ))}
      <button onClick={addField}
        style={{width:'100%',padding:'7px',border:'1.5px dashed var(--border)',borderRadius:8,
          background:'none',color:'var(--text-light)',fontSize:12,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>＋ 新增欄位</button>
    </div>
  )
}

// ── New Type Modal ────────────────────────────────────────────────
function NewTypeModal({ onSave, onClose }) {
  const [name, setName]       = useState('')
  const [nameErr, setNameErr] = useState(false)
  const [icon, setIcon]       = useState('🎤')
  const [colorIdx, setColorIdx] = useState(6)
  const [fields, setFields]   = useState([{id:'f1',label:'備註',required:false}])
  const [ticketFields, setTicketFields] = useState([{id:'tf1',label:'場館'},{id:'tf2',label:'區域'},{id:'tf3',label:'排'},{id:'tf4',label:'座位'}])

  function save() {
    if (!name.trim()) { setNameErr(true); return }
    const key = name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now()
    onSave(key, {label:name.trim(), icon, ...COLOR_OPTIONS[colorIdx], fields, ticketFields, quote:false})
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(74,55,40,0.3)',zIndex:200,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'var(--card)',borderRadius:'20px 20px 0 0',padding:20,
          width:'100%',maxWidth:480,maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 16px'}}/>
        <div style={{fontSize:16,fontWeight:700,marginBottom:14}}>建立自訂類型</div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:700,color:nameErr?'#C45A5A':'var(--text-light)',display:'block',marginBottom:4}}>
            類型名稱 * {nameErr&&<span style={{fontSize:11}}>（請填寫）</span>}
          </label>
          <input value={name}
            onChange={e=>{setName(e.target.value);setNameErr(false)}}
            placeholder="例如：Concert、Podcast..."
            style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${nameErr?'#C45A5A':'var(--border)'}`,
              borderRadius:10,fontSize:14,color:'var(--text)',background:'var(--card)',outline:'none'}}/>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:6}}>圖示</label>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {ICON_OPTIONS.map(ic=>(
              <button key={ic} onClick={()=>setIcon(ic)}
                style={{width:38,height:38,borderRadius:8,cursor:'pointer',fontSize:18,
                  border:ic===icon?'2.5px solid var(--accent)':'1.5px solid var(--border)',
                  background:ic===icon?'var(--warm)':'var(--card)'}}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:6}}>顏色</label>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {COLOR_OPTIONS.map((c,i)=>(
              <button key={i} onClick={()=>setColorIdx(i)}
                style={{width:30,height:30,borderRadius:'50%',background:c.gradient,cursor:'pointer',
                  border:colorIdx===i?'3px solid var(--text)':'2px solid transparent',transition:'border .1s'}}/>
            ))}
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:6}}>
            欄位設定 <span style={{fontSize:11,fontWeight:400}}>（點「選填/必填」可切換）</span>
          </label>
          <FieldEditor fields={fields} onChange={setFields} ticketFields={ticketFields} onTicketFieldsChange={setTicketFields}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <button onClick={onClose}
            style={{padding:10,borderRadius:20,border:'1.5px solid var(--border)',background:'var(--warm)',color:'var(--text)',fontSize:13,fontWeight:600,cursor:'pointer'}}>取消</button>
          <button onClick={save}
            style={{padding:10,borderRadius:20,border:'none',background:'var(--accent3)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>✓ 建立</button>
        </div>
      </div>
    </div>
  )
}

// ── Record Form Modal ─────────────────────────────────────────────
function RecordFormModal({ typesCfg, editRecord, nextId, settings, onSave, onClose, onTypeFieldsChange }) {
  const isEdit   = !!editRecord
  const initType = editRecord?.type || Object.keys(typesCfg)[0]

  const [selType,  setSelType]  = useState(initType)
  const [title,    setTitle]    = useState(editRecord?.title  || '')
  const [date,     setDate]     = useState(editRecord?.date   || new Date().toISOString().split('T')[0])
  const [rating,   setRating]   = useState(editRecord?.rating || 0)
  const [fieldVals,setFieldVals]= useState(editRecord?.fields || {})
  const [quote,    setQuote]    = useState(editRecord?.quote  || '')
  const [notes,    setNotes]    = useState(editRecord?.notes  || '')
  const [coverImg, setCoverImg] = useState(editRecord?.coverImg || null)
  const [uploading,setUploading]= useState(false)
  const [uploadErr,setUploadErr]= useState('')
  const [showFieldEd, setShowFieldEd] = useState(false)
  // Local copies of fields so edits don't mutate shared PRESET_TYPES
  const [localFields,       setLocalFields]       = useState(null)
  const [localTicketFields, setLocalTicketFields] = useState(null)
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  // Always derive t from selType — never stale
  const t = typesCfg[selType] || typesCfg[Object.keys(typesCfg)[0]]
  // Use local overrides if user edited fields this session
  const activeFields       = localFields       ?? [...(t?.fields       || [])]
  const activeTicketFields = localTicketFields ?? [...(t?.ticketFields || [])]

  function switchType(k) {
    setSelType(k)
    setLocalFields(null)
    setLocalTicketFields(null)
    setShowFieldEd(false)
    setErrors({})
  }

  function setFv(id, val) {
    setFieldVals(p => ({...p, [id]: val}))
  }

  // Image upload — no dynamic import, direct call
  async function handleCover(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadErr('請選擇圖片檔案（JPG / PNG / WebP）'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('圖片太大，請選擇 10MB 以下的檔案'); return
    }
    setUploading(true)
    setUploadErr('')
    try {
      // Try Imgur if Client ID provided; fall back to local compress
      if (settings?.imgurClientId) {
        try {
          const res = await uploadToImgur(file, settings.imgurClientId)
          setCoverImg(res.url)
          setUploading(false)
          return
        } catch { /* fall through to local */ }
      }
      const dataUrl = await compressImage(file)
      setCoverImg(dataUrl)
    } catch (err) {
      setUploadErr('圖片處理失敗，請重試')
    } finally {
      setUploading(false)
    }
  }

  function removeCover(e) {
    e.stopPropagation()
    setCoverImg(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSave() {
    // Validate
    const errs = {}
    if (!title.trim()) errs['_title'] = true
    activeFields.forEach(f => {
      if (f.required && !(fieldVals[f.id]||'').trim()) errs[f.id] = true
    })
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const defaultEmojis = {anime:'⚔️',book:'📚',drama:'📺',musical:'🎭',movie:'🎬',variety:'🎉'}

    // If fields were edited locally, persist back via callback so parent can update typesCfg
    if (localFields !== null || localTicketFields !== null) {
      onTypeFieldsChange?.(selType, {
        fields:       localFields       ?? activeFields,
        ticketFields: localTicketFields ?? activeTicketFields,
      })
    }

    onSave({
      id:       editRecord?.id || nextId,
      type:     selType,
      title:    title.trim(),
      date,
      rating,
      coverImg,
      emoji:    editRecord?.emoji || defaultEmojis[selType] || t?.icon || '✨',
      fields:   fieldVals,
      quote,
      notes,
    })
  }

  const inpStyle = (hasErr) => ({
    width:'100%', padding:'8px 10px',
    border:`1.5px solid ${hasErr?'#C45A5A':'var(--border)'}`,
    borderRadius:9, fontSize:13, color:'var(--text)', background:'var(--card)', outline:'none',
  })

  if (!t) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(74,55,40,0.3)',zIndex:200,
      display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'var(--card)',borderRadius:'20px 20px 0 0',padding:20,
          width:'100%',maxWidth:480,maxHeight:'93vh',overflowY:'auto'}}>
        <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 14px'}}/>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:16,fontWeight:700,color:'var(--text)',flex:1}}>{t.icon} {t.label}</span>
          <span style={{fontSize:11,color:'var(--text-light)',fontFamily:'monospace'}}>
            #{String(isEdit ? editRecord.id : nextId).padStart(3,'0')}
          </span>
        </div>

        {/* Type switcher */}
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
          {Object.entries(typesCfg).map(([k,ty])=>(
            <button key={k} onClick={()=>switchType(k)}
              style={{padding:'3px 10px',borderRadius:999,fontSize:11,cursor:'pointer',
                border:`0.5px solid ${selType===k?ty.color:'var(--border)'}`,
                background:selType===k?ty.bg:'none',
                color:selType===k?ty.text:'var(--text-light)',
                fontWeight:selType===k?700:400,transition:'all .12s'}}>{ty.label}</button>
          ))}
        </div>

        {/* Cover + title/date */}
        <div style={{display:'flex',gap:12,marginBottom:12}}>
          {/* Poster 2:3 */}
          <div style={{width:74,height:111,flexShrink:0,position:'relative',cursor:'pointer',borderRadius:10,overflow:'hidden',
            border:'1.5px dashed var(--border)',background:'var(--warm)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3}}>
            {coverImg
              ? <>
                  <img src={coverImg} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                  <button onClick={removeCover}
                    style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',
                      background:'rgba(0,0,0,0.55)',border:'none',color:'#fff',fontSize:13,cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,zIndex:2}}>×</button>
                </>
              : <>
                  <span style={{fontSize:22}}>📷</span>
                  <span style={{fontSize:10,color:'var(--text-light)',textAlign:'center',lineHeight:1.3}}>
                    {uploading?'處理中...':'點擊上傳\n封面'}
                  </span>
                </>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCover}
              style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:1}}/>
          </div>

          {/* Title + Date */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:errors['_title']?'#C45A5A':'var(--text-light)',display:'block',marginBottom:3}}>
                標題 * {errors['_title']&&<span style={{fontSize:10}}>← 請填寫</span>}
              </label>
              <input value={title} onChange={e=>{setTitle(e.target.value);setErrors(p=>({...p,_title:false}))}}
                placeholder="作品名稱" style={inpStyle(errors['_title'])}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:3}}>觀看日期</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inpStyle(false)}/>
            </div>
          </div>
        </div>

        {/* Upload error */}
        {uploadErr&&(
          <div style={{background:'#FFF0F0',border:'1px solid #F4C2C2',borderRadius:8,padding:'8px 12px',
            fontSize:12,color:'#C45A5A',marginBottom:10}}>⚠️ {uploadErr}</div>
        )}

        {/* Rating row — always visible */}
        <div style={{background:'var(--warm)',borderRadius:10,padding:'10px 14px',marginBottom:12,
          display:'flex',alignItems:'center',gap:12}}>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-light)',flexShrink:0}}>評分</label>
          <Stars n={rating} size={26} onChange={setRating}/>
          {rating>0
            ? <span style={{fontSize:12,color:'var(--text-light)',marginLeft:'auto'}}>{RATING_LABELS[rating]}</span>
            : <span style={{fontSize:11,color:'var(--text-light)',marginLeft:'auto',opacity:.6}}>點星星評分</span>}
        </div>

        {/* Ticket fields */}
        {activeTicketFields.length>0&&(
          <div style={{background:'var(--warm)',borderRadius:10,padding:'10px 12px',marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-light)',marginBottom:8}}>🎟 票根資訊</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {activeTicketFields.map(tf=>(
                <div key={tf.id}>
                  <label style={{fontSize:11,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:3}}>{tf.label}</label>
                  <input value={fieldVals[tf.id]||''} onChange={e=>setFv(tf.id,e.target.value)} style={inpStyle(false)}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic fields in pairs */}
        {(()=>{
          const fs = activeFields
          const rows = []
          for (let i=0; i<fs.length; i+=2) {
            const a=fs[i], b=fs[i+1]
            rows.push(
              <div key={i} style={{display:'grid',gridTemplateColumns:b?'1fr 1fr':'1fr',gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:3,marginBottom:3,
                    color:errors[a.id]?'#C45A5A':'var(--text-light)'}}>
                    {a.label}
                    {a.required?<span style={{color:'#993C1D',fontSize:10}}>*</span>:<span style={{opacity:.5,fontSize:10}}>選填</span>}
                    {errors[a.id]&&<span style={{fontSize:10,color:'#C45A5A'}}>← 必填</span>}
                  </label>
                  <input value={fieldVals[a.id]||''} onChange={e=>{setFv(a.id,e.target.value);setErrors(p=>({...p,[a.id]:false}))}} style={inpStyle(errors[a.id])}/>
                </div>
                {b&&<div>
                  <label style={{fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:3,marginBottom:3,
                    color:errors[b.id]?'#C45A5A':'var(--text-light)'}}>
                    {b.label}
                    {b.required?<span style={{color:'#993C1D',fontSize:10}}>*</span>:<span style={{opacity:.5,fontSize:10}}>選填</span>}
                    {errors[b.id]&&<span style={{fontSize:10,color:'#C45A5A'}}>← 必填</span>}
                  </label>
                  <input value={fieldVals[b.id]||''} onChange={e=>{setFv(b.id,e.target.value);setErrors(p=>({...p,[b.id]:false}))}} style={inpStyle(errors[b.id])}/>
                </div>}
              </div>
            )
          }
          return rows
        })()}

        {/* Quote */}
        {t.quote&&(
          <div style={{marginBottom:8}}>
            <label style={{fontSize:11,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:3}}>最喜歡的一句話 / 台詞</label>
            <textarea value={quote} onChange={e=>setQuote(e.target.value)} rows={2}
              placeholder='"  "' style={{...inpStyle(false),resize:'vertical',fontStyle:'italic'}}/>
          </div>
        )}

        {/* Notes */}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:700,color:'var(--text-light)',display:'block',marginBottom:3}}>心得筆記</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
            placeholder="自由書寫感受..." style={{...inpStyle(false),resize:'vertical'}}/>
        </div>

        {/* Field editor toggle */}
        <button onClick={()=>setShowFieldEd(v=>!v)}
          style={{width:'100%',padding:'7px',marginBottom:10,border:'1.5px dashed var(--border)',
            borderRadius:9,background:'none',color:'var(--text-light)',fontSize:12,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
          ⚙️ {showFieldEd?'收起欄位編輯':'編輯此類型的欄位（可設必填）'}
        </button>
        {showFieldEd&&(
          <div style={{marginBottom:12,background:'var(--warm)',borderRadius:10,padding:12}}>
            <div style={{fontSize:11,color:'var(--text-light)',marginBottom:8}}>
              修改欄位後儲存，自動套用到此類型
            </div>
            <FieldEditor
              fields={activeFields}
              onChange={f=>setLocalFields(f)}
              ticketFields={activeTicketFields}
              onTicketFieldsChange={f=>setLocalTicketFields(f)}/>
          </div>
        )}

        {/* Actions */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <button onClick={onClose}
            style={{padding:10,borderRadius:20,border:'1.5px solid var(--border)',background:'var(--warm)',color:'var(--text)',fontSize:13,fontWeight:600,cursor:'pointer'}}>取消</button>
          <button onClick={handleSave}
            style={{padding:10,borderRadius:20,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {isEdit?'✓ 更新':'✓ 儲存'}
          </button>
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
  const [filter,       setFilter]       = useState('all')
  const [detailRecord, setDetailRecord] = useState(null)
  const [modal,        setModal]        = useState(null) // null | 'add' | 'edit' | 'newtype'
  const [editRecord,   setEditRecord]   = useState(null)

  const media    = data.media || []
  const nextId   = media.length > 0 ? Math.max(...media.map(m => m.id || 0)) + 1 : 1
  const filtered = filter === 'all' ? media : media.filter(r => r.type === filter)

  function persistTypes(next) {
    setTypesCfg(next)
    const custom = {}
    Object.entries(next).forEach(([k,v]) => { if (!PRESET_TYPES[k]) custom[k] = v })
    saveSettings({ customTypes: custom })
  }

  // Called when form edits field definitions for a type
  function handleTypeFieldsChange(typeKey, { fields, ticketFields }) {
    const updated = {
      ...typesCfg,
      [typeKey]: { ...typesCfg[typeKey], fields, ticketFields },
    }
    persistTypes(updated)
  }

  function handleSave(rec) {
    if (editRecord) {
      updateMedia(rec)
    } else {
      addMedia(rec)
    }
    // Always close detail overlay after save/update
    setDetailRecord(null)
    setModal(null)
    setEditRecord(null)
  }

  function handleDelete(id) {
    if (!confirm('確定刪除這筆紀錄？\n此操作無法復原。')) return
    deleteMedia(id)
    setDetailRecord(null)
  }

  function openEdit(record) {
    setEditRecord(record)
    setDetailRecord(null) // ← close detail BEFORE opening form
    setModal('edit')
  }

  function addCustomType(key, cfg) {
    persistTypes({ ...typesCfg, [key]: cfg })
    setModal(null)
  }

  function deleteType(key) {
    if (!confirm(`刪除「${typesCfg[key]?.label}」類型？\n相關紀錄不會被刪除。`)) return
    const next = { ...typesCfg }
    delete next[key]
    persistTypes(next)
    if (filter === key) setFilter('all')
  }

  const fBtn = (active) => ({
    padding:'4px 11px', borderRadius:999, fontSize:12, cursor:'pointer',
    border:`0.5px solid ${active?'var(--text)':'var(--border)'}`,
    background: active ? 'var(--text)' : 'none',
    color: active ? 'var(--card)' : 'var(--text-light)',
    fontWeight: active ? 700 : 400, transition:'all .12s',
    display:'inline-flex', alignItems:'center', gap:4,
  })

  return (
    <div className="fade-in">

      {/* Filter bar */}
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14,alignItems:'center'}}>
        <button style={fBtn(filter==='all')} onClick={()=>setFilter('all')}>
          全部 <span style={{fontSize:10,opacity:.7}}>{media.length}</span>
        </button>
        {Object.entries(typesCfg).map(([k,ty]) => {
          const cnt = media.filter(r=>r.type===k).length
          return (
            <button key={k} style={fBtn(filter===k)} onClick={()=>setFilter(k)}>
              {ty.icon} {ty.label}
              {cnt>0&&<span style={{fontSize:10,opacity:.6}}>{cnt}</span>}
              {!PRESET_TYPES[k]&&(
                <span onClick={e=>{e.stopPropagation();deleteType(k)}}
                  style={{marginLeft:2,fontSize:12,opacity:.5,cursor:'pointer',lineHeight:1}}>×</span>
              )}
            </button>
          )
        })}
        <button onClick={()=>setModal('newtype')}
          style={{padding:'4px 10px',borderRadius:999,fontSize:12,cursor:'pointer',
            border:'1.5px dashed var(--border)',background:'none',color:'var(--text-light)'}}>＋ 自訂類型</button>
      </div>

      {/* Empty state */}
      {filtered.length===0&&(
        <div style={{textAlign:'center',color:'var(--text-light)',fontSize:13,padding:'40px 0'}}>
          <div style={{fontSize:40,marginBottom:12}}>🎬</div>
          <div style={{fontWeight:700,marginBottom:4}}>
            {filter==='all' ? '還沒有紀錄' : `還沒有 ${typesCfg[filter]?.label} 紀錄`}
          </div>
          <div>點下方 ＋ 新增第一筆</div>
        </div>
      )}

      {/* Ticket list */}
      {filtered.map(r => (
        <TicketRow key={r.id} record={r} typesCfg={typesCfg}
          isSelected={detailRecord?.id === r.id}
          onSelect={() => setDetailRecord(detailRecord?.id===r.id ? null : r)}/>
      ))}

      {/* Add button */}
      <button onClick={()=>{setEditRecord(null);setModal('add')}}
        style={{width:'100%',padding:11,border:'1.5px dashed var(--border)',borderRadius:14,
          background:'none',color:'var(--text-light)',fontSize:13,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          transition:'all .15s',marginTop:4}}
        onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
        onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-light)'}}>
        ＋ 新增紀錄
      </button>

      {/* Ticket detail overlay */}
      {detailRecord && (
        <TicketDetail
          record={detailRecord}
          typesCfg={typesCfg}
          onEdit={() => openEdit(detailRecord)}
          onDelete={() => handleDelete(detailRecord.id)}
          onClose={() => setDetailRecord(null)}/>
      )}

      {/* Add / Edit form */}
      {(modal==='add' || modal==='edit') && (
        <RecordFormModal
          typesCfg={typesCfg}
          editRecord={modal==='edit' ? editRecord : null}
          nextId={nextId}
          settings={settings}
          onSave={handleSave}
          onTypeFieldsChange={handleTypeFieldsChange}
          onClose={()=>{setModal(null);setEditRecord(null)}}/>
      )}

      {/* New type modal */}
      {modal==='newtype' && (
        <NewTypeModal onSave={addCustomType} onClose={()=>setModal(null)}/>
      )}
    </div>
  )
}
