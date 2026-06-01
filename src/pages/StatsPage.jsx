import { useState } from 'react'
import { generateMonthlySummary } from '../api/claude'

const MOOD_SCORE = { '😔 低落':1, '😐 普通':2, '🙂 還好':3, '😊 開心':4, '🌟 超棒':5 }
const MOOD_COLOR = ['#8B9DC3','#B8B8A0','#7BB8A4','#E8956D','#F5A623']

const TYPE_LABELS = { anime:'Anime', book:'Book', drama:'Drama', musical:'Musical', movie:'Movie', variety:'Variety Show' }
const TYPE_EMOJI  = { anime:'⚔️', book:'📚', drama:'📺', musical:'🎭', movie:'🎬', variety:'🎉' }

// ── Achievement definitions ───────────────────────────────────────
const ACHIEVEMENTS = [
  // Diary-based
  { id:'diary_1',   icon:'🌱', label:'初心',     desc:'第一篇日記',          cat:'diary',  check:(d)=>d.diaries.length>=1 },
  { id:'diary_7',   icon:'🌿', label:'一週習慣',  desc:'連續記錄 7 天',        cat:'diary',  check:(d)=>d.diaries.length>=7 },
  { id:'diary_30',  icon:'🌸', label:'一個月',    desc:'累計記錄 30 天',       cat:'diary',  check:(d)=>d.diaries.length>=30 },
  { id:'diary_100', icon:'🌳', label:'百日',      desc:'累計記錄 100 天',      cat:'diary',  check:(d)=>d.diaries.length>=100 },
  // Mood-based
  { id:'mood_happy',icon:'😊', label:'陽光體質',  desc:'心情「開心」超過 10 次', cat:'mood',   check:(d)=>d.diaries.filter(e=>['😊 開心','🌟 超棒'].includes(e.mood)).length>=10 },
  { id:'mood_star', icon:'🌟', label:'閃耀人生',  desc:'心情「超棒」超過 5 次',  cat:'mood',   check:(d)=>d.diaries.filter(e=>e.mood==='🌟 超棒').length>=5 },
  // Media-based
  { id:'media_1',   icon:'🎟', label:'初體驗',    desc:'第一筆娛樂紀錄',        cat:'media',  check:(d)=>d.media.length>=1 },
  { id:'media_5',   icon:'🎫', label:'常客',      desc:'累積 5 筆紀錄',         cat:'media',  check:(d)=>d.media.length>=5 },
  { id:'media_15',  icon:'👑', label:'狂熱粉絲',  desc:'累積 15 筆紀錄',        cat:'media',  check:(d)=>d.media.length>=15 },
  { id:'media_50',  icon:'💎', label:'資深達人',  desc:'累積 50 筆紀錄',        cat:'media',  check:(d)=>d.media.length>=50 },
  // Type collector
  { id:'type_3',    icon:'🎭', label:'博覽群籍',  desc:'記錄 3 種以上類型',     cat:'media',  check:(d)=>new Set(d.media.map(m=>m.type)).size>=3 },
  { id:'type_all',  icon:'🏅', label:'全能體驗',  desc:'6 種類型都記錄過',       cat:'media',  check:(d)=>new Set(d.media.map(m=>m.type)).size>=6 },
  // Rating
  { id:'rate_5',    icon:'⭐', label:'嚴格評審',  desc:'給出第一個五星評分',     cat:'media',  check:(d)=>d.media.some(m=>m.rating===5) },
  { id:'rate_ten5', icon:'✨', label:'品味家',    desc:'累積 10 個五星',         cat:'media',  check:(d)=>d.media.filter(m=>m.rating===5).length>=10 },
]

function getLast7Days(diaries) {
  const result=[]
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i)
    const ds=d.toISOString().split('T')[0]
    const days=['日','一','二','三','四','五','六']
    const label=i===0?'今天':`週${days[d.getDay()]}`
    const entry=diaries.find(e=>e.date===ds)
    result.push({label,score:entry?(MOOD_SCORE[entry.mood]||3):null})
  }
  return result
}

// ── Achievement card ──────────────────────────────────────────────
function AchievementCard({ ach, unlocked }) {
  return (
    <div style={{
      background: unlocked ? 'var(--card)' : 'var(--warm)',
      border: `1.5px solid ${unlocked ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius:14, padding:'12px 10px', textAlign:'center',
      opacity: unlocked ? 1 : 0.45, transition:'all .2s',
      position:'relative', overflow:'hidden',
    }}>
      {unlocked && <div style={{position:'absolute',top:6,right:6,fontSize:10,color:'var(--accent3)',fontWeight:700}}>✓</div>}
      <div style={{fontSize:28,marginBottom:5}}>{ach.icon}</div>
      <div style={{fontSize:12,fontWeight:700,color:'var(--text)',marginBottom:2}}>{ach.label}</div>
      <div style={{fontSize:10,color:'var(--text-light)',lineHeight:1.3}}>{ach.desc}</div>
    </div>
  )
}

export default function StatsPage({ appData, onOpenSettings }) {
  const { data } = appData
  const { diaries, media, settings } = data
  const [monthSummary, setMonthSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [achTab, setAchTab] = useState('all')

  const moodDays = getLast7Days(diaries)
  const happyCount = diaries.filter(d=>['😊 開心','🌟 超棒'].includes(d.mood)).length
  const happyPct = diaries.length>0 ? Math.round((happyCount/diaries.length)*100) : 0
  const totalArtists = new Set(media.map(m=>m.fields?.artist).filter(Boolean)).size
  const totalTypes   = new Set(media.map(m=>m.type)).size

  const typeCounts = media.reduce((acc,m)=>{ acc[m.type]=(acc[m.type]||0)+1; return acc },{})
  const sortedTypes = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])
  const maxCount = sortedTypes[0]?.[1]||1

  const unlockedIds = new Set(ACHIEVEMENTS.filter(a=>a.check(data)).map(a=>a.id))
  const unlockedCount = unlockedIds.size

  const filteredAch = achTab==='all' ? ACHIEVEMENTS
    : achTab==='unlocked' ? ACHIEVEMENTS.filter(a=>unlockedIds.has(a.id))
    : ACHIEVEMENTS.filter(a=>!unlockedIds.has(a.id))

  async function handleMonthSummary() {
    if(!settings.claudeKey){ onOpenSettings(); return }
    setLoading(true)
    try { const s=await generateMonthlySummary(diaries,settings.claudeKey); setMonthSummary(s) }
    catch(e){ setMonthSummary('生成失敗：'+e.message) }
    finally { setLoading(false) }
  }

  const statCard = (num, label, color='var(--accent)') => (
    <div style={{flex:1,background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:14,padding:'14px 10px',textAlign:'center'}}>
      <div style={{fontSize:26,fontWeight:800,color}}>{num}</div>
      <div style={{fontSize:11,color:'var(--text-light)',fontWeight:600,marginTop:2}}>{label}</div>
    </div>
  )

  return (
    <div className="fade-in">

      {/* Summary stats */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {statCard(diaries.length, '日記天數')}
        {statCard(media.length,   '娛樂紀錄', '#7B3FA0')}
        {statCard(happyPct+'%',   '開心指數', 'var(--accent3)')}
      </div>
      {(totalArtists>0||totalTypes>0) && (
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {totalArtists>0 && statCard(totalArtists,'藝人數','#993556')}
          {statCard(totalTypes,'記錄類型','#185FA5')}
          {statCard(unlockedCount+'/'+ACHIEVEMENTS.length,'成就解鎖','#854F0B')}
        </div>
      )}

      {/* Mood chart */}
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--text-light)',marginBottom:14}}>📊 近7日心情走勢</div>
        {diaries.length===0
          ? <div style={{fontSize:12,color:'var(--text-light)',textAlign:'center',padding:'16px 0'}}>開始記錄日記後，心情圖表會在這裡出現</div>
          : <>
            <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,paddingTop:8,marginBottom:6}}>
              {moodDays.map((day,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,height:'100%',justifyContent:'flex-end'}}>
                  <div style={{width:'100%',borderRadius:'4px 4px 0 0',height:day.score?`${(day.score/5)*100}%`:'8%',
                    background:day.score?MOOD_COLOR[day.score-1]:'var(--border)',opacity:day.score?1:0.3,transition:'height .4s'}}/>
                  <div style={{fontSize:9,color:'var(--text-light)'}}>{day.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>
              {['低落','普通','還好','開心','超棒'].map((m,i)=>(
                <div key={m} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--text-light)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:MOOD_COLOR[i]}}/>
                  {m}
                </div>
              ))}
            </div>
          </>}
      </div>

      {/* Media breakdown */}
      {sortedTypes.length>0&&(
        <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text-light)',marginBottom:14}}>🎭 娛樂類型分佈</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {sortedTypes.map(([type,count])=>(
              <div key={type}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span>{TYPE_EMOJI[type]||'✨'} {TYPE_LABELS[type]||type}</span>
                  <span style={{fontWeight:700}}>{count} 筆</span>
                </div>
                <div style={{height:6,background:'var(--warm)',borderRadius:3}}>
                  <div style={{height:'100%',width:`${(count/maxCount)*100}%`,background:'var(--accent)',borderRadius:3,transition:'width .4s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text-light)'}}>🏅 成就徽章</div>
          <div style={{fontSize:12,color:'var(--accent)',fontWeight:700}}>{unlockedCount} / {ACHIEVEMENTS.length} 已解鎖</div>
        </div>

        {/* Progress bar */}
        <div style={{height:6,background:'var(--warm)',borderRadius:3,marginBottom:12}}>
          <div style={{height:'100%',width:`${(unlockedCount/ACHIEVEMENTS.length)*100}%`,background:'linear-gradient(to right,var(--accent),var(--accent2))',borderRadius:3,transition:'width .4s'}}/>
        </div>

        {/* Tab */}
        <div style={{display:'flex',gap:5,marginBottom:12}}>
          {[['all','全部'],['unlocked','已解鎖'],['locked','未解鎖']].map(([v,l])=>(
            <button key={v} onClick={()=>setAchTab(v)} style={{
              padding:'4px 12px',borderRadius:999,fontSize:12,cursor:'pointer',
              border:`0.5px solid ${achTab===v?'var(--accent)':'var(--border)'}`,
              background:achTab===v?'var(--accent)':'none',
              color:achTab===v?'#fff':'var(--text-light)',
              fontWeight:achTab===v?700:400,
            }}>{l}</button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {filteredAch.map(ach=>(
            <AchievementCard key={ach.id} ach={ach} unlocked={unlockedIds.has(ach.id)}/>
          ))}
        </div>
      </div>

      {/* AI Monthly summary */}
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--text-light)',marginBottom:10}}>💬 AI 月度心靈總結</div>
        {monthSummary
          ? <div style={{fontSize:13,color:'var(--text)',lineHeight:1.8,marginBottom:12,whiteSpace:'pre-wrap'}}>{monthSummary}</div>
          : <div style={{fontSize:12,color:'var(--text-light)',marginBottom:12}}>讓 AI 分析你這個月的心靈日記，生成個人化的月度報告 🌸</div>}
        <button onClick={handleMonthSummary} disabled={loading||diaries.length===0} style={{
          padding:'9px 18px',borderRadius:20,border:'none',
          background:diaries.length===0?'#ccc':'var(--accent2)',
          color:'#fff',fontSize:13,fontWeight:700,opacity:loading?.7:1,cursor:'pointer',
        }}>{loading?'✨ 生成中...':monthSummary?'🔄 重新生成':'📊 生成月度報告'}</button>
        {diaries.length===0&&<div style={{fontSize:11,color:'var(--text-light)',marginTop:8}}>至少記錄一篇日記後才能生成報告</div>}
      </div>
    </div>
  )
}
