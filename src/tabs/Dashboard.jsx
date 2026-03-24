import React, { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { S, C, CAT_COLOR, fmtDur, today } from './shared'
import { addDistraction } from '../firebase/firebaseService'

const DIST_TYPES = ['Social Media','Phone','Random Browsing','Conversation','Other']
const TT = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, fontFamily:'inherit', fontSize:12, color:'#1e293b' }
const isoDay = () => new Date().toISOString().slice(0,10)

export default function Dashboard({ uid, tasks, timeLogs, distracts, target, setTarget, focusScore, totalSecs, doneToday, distractSecs, activeTask, elapsed, isPaused=false, openComplete, sessionTime=0 }) {
  const [distForm,  setDistForm]  = useState({ type:'Social Media', duration:5 })
  const [distPhase, setDistPhase] = useState('idle')  // idle | running | done
  const [distCd,    setDistCd]    = useState(0)
  const cdRef = useRef(null)
  const tod   = isoDay()

  const todayLogs  = timeLogs.filter(l => l.date===tod)
  const todayTasks = tasks.filter(t => t.date===tod)
  const hPct = Math.min(totalSecs/(target.hours*3600)*100,100)
  const tPct = target.tasks ? Math.min(doneToday/target.tasks*100,100) : 0

  const catData = ['Marketing Work','Production Work','Admin Work','Other'].map(cat=>({
    name:cat.replace(' Work',''),
    minutes:Math.floor(todayLogs.filter(l=>l.category===cat).reduce((a,b)=>a+(b.duration||0),0)/60),
    color:CAT_COLOR[cat]||C.muted
  })).filter(d=>d.minutes>0)

  const subData = {}
  todayLogs.forEach(l=>{ if(l.subType) subData[l.subType]=(subData[l.subType]||0)+(l.duration||0) })
  const subChart = Object.entries(subData).map(([name,secs])=>({name,minutes:Math.floor(secs/60)})).sort((a,b)=>b.minutes-a.minutes).slice(0,8)

  const last7 = Array.from({length:7}).map((_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-i)
    const ds=d.toISOString().slice(0,10)
    return { day:d.toLocaleDateString([],{weekday:'short'}), hours:+(timeLogs.filter(l=>l.date===ds).reduce((a,b)=>a+(b.duration||0),0)/3600).toFixed(1) }
  }).reverse()

  const pieData = ['Marketing Work','Production Work','Admin Work','Other'].map(cat=>({
    name:cat.replace(' Work',''), value:Math.floor(timeLogs.filter(l=>l.category===cat).reduce((a,b)=>a+(b.duration||0),0)/60), color:CAT_COLOR[cat]||C.muted
  })).filter(d=>d.value>0)
  const totalMin = pieData.reduce((a,b)=>a+b.value,0)

  const fmtSess = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` }
  const fmtCd   = s => { const m=Math.floor(s/60),sec=s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` }

  // Distraction: counts UP 0→duration, then shows DONE banner
  const logDistraction = async () => {
    if (distPhase==='running') return
    const maxSecs = distForm.duration * 60
    // Save duration in SECONDS (consistent with timeLogs)
    await addDistraction(uid, { ...distForm, duration: distForm.duration * 60 })
    setDistCd(0)
    setDistPhase('running')
    clearInterval(cdRef.current)
    cdRef.current = setInterval(() => {
      setDistCd(c => {
        const n = c+1
        if (n >= maxSecs) {
          clearInterval(cdRef.current)
          setDistPhase('done')
          return maxSecs
        }
        return n
      })
    }, 1000)
  }

  const dismissDist = () => { clearInterval(cdRef.current); setDistPhase('idle'); setDistCd(0) }
  useEffect(() => () => clearInterval(cdRef.current), [])

  const cdMax = distForm.duration*60
  const cdPct = distCd ? distCd/cdMax*100 : 0

  return (
    <div>
      {/* Distraction running banner */}
      {distPhase==='running' && (
        <div style={{background:'#fff7ed',border:'2px solid #fb923c',borderRadius:14,padding:20,marginBottom:16,textAlign:'center',position:'relative'}}>
          <button onClick={dismissDist} style={{position:'absolute',top:10,right:14,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#92400e'}}>✕</button>
          <div style={{fontSize:12,color:'#92400e',fontWeight:700,marginBottom:6}}>⚠️ BREAK TIME — Work paused</div>
          <div style={{fontSize:52,fontWeight:700,color:'#ea580c',lineHeight:1,marginBottom:6,fontFamily:'monospace'}}>{fmtCd(distCd)}</div>
          <div style={{fontSize:13,color:'#b45309',marginBottom:10}}>{distForm.type} — {distForm.duration} min break</div>
          <div style={{height:8,background:'#fed7aa',borderRadius:4,overflow:'hidden',maxWidth:280,margin:'0 auto 6px'}}>
            <div style={{height:'100%',width:`${cdPct}%`,background:'#f97316',borderRadius:4,transition:'width 1s linear'}}/>
          </div>
          <div style={{fontSize:11,color:'#92400e'}}>{distForm.duration-Math.floor(distCd/60)} min remaining</div>
        </div>
      )}

      {/* Distraction DONE banner */}
      {distPhase==='done' && (
        <div style={{background:'#f0fdf4',border:'2px solid #86efac',borderRadius:14,padding:24,marginBottom:16,textAlign:'center',position:'relative',animation:'popIn .3s ease'}}>
          <button onClick={dismissDist} style={{position:'absolute',top:10,right:14,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#166534'}}>✕</button>
          <div style={{fontSize:40,marginBottom:10}}>✅</div>
          <div style={{fontSize:17,fontWeight:700,color:'#166534',marginBottom:6}}>Break Over! Back to Work.</div>
          <div style={{fontSize:13,color:'#15803d',marginBottom:16}}>
            {distForm.duration} min {distForm.type} break recorded. Your time is valuable — let's focus!
          </div>
          <button onClick={dismissDist} style={{background:'#10b981',border:'none',borderRadius:10,padding:'11px 32px',color:'#fff',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:700}}>
            ▶ Back to Work
          </button>
        </div>
      )}

      {/* Active task banner */}
      {activeTask && distPhase==='idle' && (
        <div style={S.banner}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.7)',letterSpacing:'0.14em',marginBottom:8}}>{isPaused?'⏸ PAUSED':'🎯 DEEP WORK ACTIVE'}</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:4,color:'#fff'}}>{activeTask.name}</div>
          <div style={{fontSize:44,fontWeight:700,color:isPaused?'#fbbf24':'#60a5fa',lineHeight:1}}>{fmtDur(elapsed)}</div>
          <button style={{...S.btn('#ef4444'),marginTop:16,padding:'11px 36px'}} onClick={openComplete}>■ Complete Task</button>
        </div>
      )}

      {/* KPIs */}
      <div style={S.grid(4)}>
        {[
          {label:'Focus Score',  val:focusScore+'%',          c:C.blue,   icon:'🎯'},
          {label:'Work Today',   val:fmtDur(totalSecs),       c:C.green,  icon:'⏱️'},
          {label:'Tasks Done',   val:`${doneToday}/${target.tasks}`, c:C.orange, icon:'✅'},
          {label:'Session Time', val:fmtSess(sessionTime),    c:C.purple, icon:'🕐'},
        ].map(k=>(
          <div key={k.label} style={S.kpi(k.c)}>
            <div style={{position:'absolute',top:0,right:0,width:52,height:52,background:k.c+'12',borderRadius:'0 14px 0 52px'}}/>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{k.icon} {k.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:k.c,lineHeight:1}}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Progress + controls */}
      <div style={S.grid(2)}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Work Hours Progress</div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:13}}>
            <span style={{fontWeight:600}}>{fmtDur(totalSecs)}</span>
            <span style={{color:C.muted}}>Target: {target.hours}h</span>
          </div>
          <div style={S.progressWrap}><div style={S.progressFill(hPct,C.green)}/></div>
          <div style={{fontSize:11,color:C.muted,marginTop:4,marginBottom:14}}>{Math.round(hPct)}% of daily goal</div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:13}}>
            <span>Task Completion</span><span style={{color:C.muted}}>{doneToday}/{target.tasks}</span>
          </div>
          <div style={S.progressWrap}><div style={S.progressFill(tPct,C.orange)}/></div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{Math.round(tPct)}% complete</div>
        </div>

        <div style={S.card}>
          <div style={S.sectionTitle}>Daily Targets</div>
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            {[['hours','Work Hours',1,14],['tasks','Tasks Goal',1,30]].map(([k,lbl,mn,mx])=>(
              <div key={k} style={{flex:1}}>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>{lbl}</label>
                <input type="number" style={S.input} value={target[k]} min={mn} max={mx} onChange={e=>setTarget(p=>({...p,[k]:+e.target.value}))}/>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
            <div style={{fontSize:11,color:C.red,fontWeight:600,marginBottom:8}}>⚠️ Log Break / Distraction</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <select style={{...S.select,flex:1,fontSize:12}} value={distForm.type} onChange={e=>setDistForm(p=>({...p,type:e.target.value}))}>
                {DIST_TYPES.map(d=><option key={d}>{d}</option>)}
              </select>
              <input type="number" style={{...S.input,width:66}} value={distForm.duration} min={1} onChange={e=>setDistForm(p=>({...p,duration:+e.target.value}))}/>
              <button style={S.btn(distPhase==='running'?C.muted:C.red)} onClick={logDistraction} disabled={distPhase==='running'}>
                {distPhase==='running'?'Running...':'Log'}
              </button>
            </div>
            {distractSecs>0&&<div style={{fontSize:12,color:C.red,marginTop:6}}>Total lost today: {fmtDur(distractSecs)}</div>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📈 Last 7 Days — Work Hours</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={last7} margin={{top:4,right:8,bottom:0,left:-20}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="day" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={TT}/>
            <Line type="monotone" dataKey="hours" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:4}} activeDot={{r:6}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={S.grid(2)}>
        <div style={S.card}>
          <div style={S.sectionTitle}>📊 Today — Minutes by Category</div>
          {catData.length===0
            ?<div style={{color:C.muted,fontSize:13,padding:'20px 0',textAlign:'center'}}>No work logged today yet.</div>
            :<ResponsiveContainer width="100%" height={180}>
              <BarChart data={catData} margin={{top:4,right:8,bottom:0,left:-20}}>
                <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="minutes" radius={[6,6,0,0]}>{catData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>🥧 All-Time Category Split</div>
          {pieData.length===0
            ?<div style={{color:C.muted,fontSize:13,padding:'20px 0',textAlign:'center'}}>No data yet.</div>
            :<div style={{display:'flex',alignItems:'center',gap:16}}>
              <PieChart width={150} height={150}>
                <Pie data={pieData} cx={70} cy={70} innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
                  {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
              </PieChart>
              <div>{pieData.map(d=>(
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:d.color}}/>
                  <span style={{fontSize:12}}>{d.name}</span>
                  <span style={{fontSize:11,color:d.color,fontWeight:600}}>{totalMin?Math.round(d.value/totalMin*100):0}%</span>
                </div>
              ))}</div>
            </div>
          }
        </div>
      </div>

      {subChart.length>0&&(
        <div style={S.card}>
          <div style={S.sectionTitle}>🔍 Today — Minutes by Task Type</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={subChart} layout="vertical" margin={{top:4,right:20,bottom:0,left:100}}>
              <XAxis type="number" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} width={96}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="minutes" fill={C.blue} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={S.card}>
        <div style={S.sectionTitle}>Today's Tasks ({todayTasks.length})</div>
        {todayTasks.length===0
          ?<div style={{color:C.muted,fontSize:13}}>No tasks yet — go to Tasks tab.</div>
          :todayTasks.slice(0,7).map(t=>(
            <div key={t.id} style={S.row}>
              <span style={S.badge(CAT_COLOR[t.category]||C.muted)}>{(t.category||'').replace(' Work','')}</span>
              {t.subType&&<span style={{fontSize:11,color:C.muted}}>/ {t.subType}</span>}
              <span style={{flex:1,fontSize:13}}>{t.name}</span>
              <span style={S.badge(t.status==='Completed'?C.green:t.status==='Active'?C.blue:C.muted)}>{t.status}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
