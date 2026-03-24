import React, { useState, useEffect, useRef } from 'react'
import { S, C, fmtDur, today } from './shared'
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

// Fixed daily tasks — 20 min each
const FIXED_TASKS = [
  { id:'wapp',   label:'WhatsApp Messages',    icon:'💬', color:'#25D366' },
  { id:'email',  label:'Email Send',            icon:'📧', color:'#3b82f6' },
  { id:'social', label:'Social Media Handle',   icon:'📱', color:'#E1306C' },
  { id:'dm',     label:'DM Directly',           icon:'✉️', color:'#8b5cf6' },
  { id:'li',     label:'LinkedIn / Newsletter', icon:'💼', color:'#0A66C2' },
  { id:'sms',    label:'SMS Send',              icon:'📲', color:'#f59e0b' },
  { id:'review', label:'Content Review',        icon:'👁️', color:'#14b8a6' },
]

const TASK_DURATION = 20 * 60 // 20 minutes in seconds
const isoDay = () => new Date().toISOString().slice(0,10)

// Save/load daily checklist from Firestore
const getChecklistRef  = (uid, date) => doc(db, 'users', uid, 'dailyChecklist', date)

export default function Checklist({ uid, timeLogs, setTimeLogs }) {
  const [checks,    setChecks]    = useState({}) // { taskId: { done, doneAt, duration } }
  const [running,   setRunning]   = useState(null) // taskId currently running
  const [elapsed,   setElapsed]   = useState(0)
  const [weekData,  setWeekData]  = useState([]) // last 7 days completion data
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const tod = isoDay()

  // Load today's checklist from Firestore
  useEffect(() => {
    if (!uid) return
    const ref = getChecklistRef(uid, tod)
    const loadData = async () => {
      try {
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setChecks(snap.data().tasks || {})
        }
      } catch(e) {}
    }
    loadData()
  }, [uid, tod])

  // Load last 7 days for weekly report
  useEffect(() => {
    if (!uid) return
    const loadWeek = async () => {
      const data = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate()-i)
        const ds = d.toISOString().slice(0,10)
        try {
          const snap = await getDoc(getChecklistRef(uid, ds))
          const tasks = snap.exists() ? snap.data().tasks || {} : {}
          const done  = FIXED_TASKS.filter(t => tasks[t.id]?.done).length
          data.push({ date:ds, day:d.toLocaleDateString([],{weekday:'short'}), done, total:FIXED_TASKS.length })
        } catch {
          data.push({ date:ds, day:d.toLocaleDateString([],{weekday:'short'}), done:0, total:FIXED_TASKS.length })
        }
      }
      setWeekData(data)
    }
    loadWeek()
  }, [uid, checks]) // reload when checks change

  // Save checklist to Firestore
  const saveChecks = async (newChecks) => {
    try {
      await setDoc(getChecklistRef(uid, tod), { tasks:newChecks, date:tod, updatedAt:new Date().toISOString() })
    } catch(e) {}
  }

  // Timer tick
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        const el = Math.floor((Date.now() - startRef.current) / 1000)
        setElapsed(el)
        // Auto-complete at 20 min
        if (el >= TASK_DURATION) {
          clearInterval(timerRef.current)
          handleComplete(running, TASK_DURATION)
        }
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running])

  const handleStart = (taskId) => {
    if (running) return // already running
    if (checks[taskId]?.done) return // already done
    setRunning(taskId)
    setElapsed(0)
    startRef.current = Date.now()
  }

  const handleComplete = async (taskId, dur) => {
    clearInterval(timerRef.current)
    const finalDur = dur || Math.min(elapsed, TASK_DURATION)
    const now = new Date().toISOString()

    const newChecks = { ...checks, [taskId]: { done:true, doneAt:now, duration:finalDur } }
    setChecks(newChecks)
    setRunning(null)
    setElapsed(0)

    // Save checklist record
    await saveChecks(newChecks)

    // Add to time logs so it shows in daily work progress and reports
    const task = FIXED_TASKS.find(t => t.id===taskId)
    try {
      await addDoc(collection(db,'users',uid,'timeLogs'), {
        taskId:   `checklist_${taskId}`,
        taskName: task.label,
        category: 'Marketing Work',
        subType:  task.label,
        start:    Date.now() - finalDur*1000,
        end:      Date.now(),
        duration: finalDur,  // SECONDS
        date:     tod,
        source:   'checklist',
        createdAt: serverTimestamp(),
      })
    } catch(e) {}
  }

  const doneCount  = FIXED_TASKS.filter(t => checks[t.id]?.done).length
  const totalCount = FIXED_TASKS.length
  const allDone    = doneCount === totalCount
  const pct        = Math.round(doneCount/totalCount*100)

  const fmtCd = s => {
    const rem = Math.max(0, TASK_DURATION - s)
    const m = Math.floor(rem/60), sec = rem%60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div>
      {/* Today's progress header */}
      <div style={{...S.card, background: allDone ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)', border:`1px solid ${allDone?'#86efac':'#bfdbfe'}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div>
            <div style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:4}}>Daily Checklist</div>
            <div style={{fontSize:22,fontWeight:700,color:allDone?'#15803d':'#1d4ed8'}}>
              {doneCount}/{totalCount} Tasks
              {allDone && ' 🎉'}
            </div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Today · {new Date().toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})}</div>
          </div>
          <div style={{width:72,height:72,position:'relative'}}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke={allDone?'#10b981':'#3b82f6'} strokeWidth="8"
                strokeDasharray={`${pct*1.885} 188.5`} strokeDashoffset="47.1" strokeLinecap="round" style={{transition:'stroke-dasharray .5s'}}/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:allDone?'#15803d':'#1d4ed8'}}>{pct}%</div>
          </div>
        </div>
        <div style={{...S.progressWrap,height:10}}>
          <div style={{...S.progressFill(pct, allDone?'#10b981':'#3b82f6'),height:'100%'}}/>
        </div>
        <div style={{fontSize:12,color:C.muted,marginTop:6}}>Each task = 20 min · Auto-adds to daily work progress</div>
      </div>

      {/* Task list */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📋 Today's Fixed Tasks</div>
        {FIXED_TASKS.map(task => {
          const isDone    = !!checks[task.id]?.done
          const isRunning = running === task.id
          const doneAt    = checks[task.id]?.doneAt
          const pctRun    = isRunning ? Math.min(elapsed/TASK_DURATION*100,100) : 0
          const remSecs   = isRunning ? Math.max(0,TASK_DURATION-elapsed) : 0

          return (
            <div key={task.id} style={{
              display:'flex',alignItems:'center',gap:12,padding:'14px 12px',
              marginBottom:8,borderRadius:12,
              background: isDone ? '#f0fdf4' : isRunning ? '#eff6ff' : '#fafafa',
              border: isDone ? '1px solid #86efac' : isRunning ? `1px solid ${C.blue}` : '1px solid #e2e8f0',
              transition:'all .2s',
            }}>
              {/* Icon */}
              <div style={{width:40,height:40,borderRadius:10,background:task.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                {task.icon}
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:isDone?'#15803d':C.text,textDecoration:isDone?'line-through':'none'}}>{task.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                  {isDone ? `✓ Done at ${new Date(doneAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · 20 min logged`
                           : isRunning ? `⏱ ${fmtDur(elapsed)} / 20m · ${fmtCd(elapsed)} left`
                           : '20 min · Click Start'}
                </div>
                {isRunning && (
                  <div style={{marginTop:6,...S.progressWrap,height:5}}>
                    <div style={{...S.progressFill(pctRun,task.color),height:'100%'}}/>
                  </div>
                )}
              </div>

              {/* Action button */}
              {isDone ? (
                <div style={{...S.badge('#10b981'),fontSize:12,padding:'4px 12px'}}>✓ Done</div>
              ) : isRunning ? (
                <button onClick={()=>handleComplete(task.id,elapsed)}
                  style={{...S.btn('#10b981'),padding:'8px 16px',fontSize:12}}>
                  ✓ Done
                </button>
              ) : (
                <button onClick={()=>handleStart(task.id)} disabled={!!running}
                  style={{...S.btn(running?C.muted:task.color),padding:'8px 16px',fontSize:12,cursor:running?'not-allowed':'pointer'}}>
                  ▶ Start
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Weekly report */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📅 Weekly Report — Last 7 Days</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:16}}>
          {weekData.map((d,i) => {
            const isToday = d.date === tod
            const allD    = d.done === d.total && d.total > 0
            return (
              <div key={i} style={{textAlign:'center',padding:'10px 4px',borderRadius:10,background:isToday?'#eff6ff':allD?'#f0fdf4':'#f8fafc',border:`1px solid ${isToday?C.blue:allD?'#86efac':'#e2e8f0'}`}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:4,fontWeight:isToday?700:400}}>{d.day}</div>
                <div style={{fontSize:18,fontWeight:700,color:allD?'#15803d':d.done>0?C.blue:C.muted}}>{d.done}</div>
                <div style={{fontSize:10,color:C.muted}}>/{d.total}</div>
                {allD && <div style={{fontSize:12}}>⭐</div>}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {[
            { label:'Days All Done', val:weekData.filter(d=>d.done===d.total&&d.total>0).length, c:C.green },
            { label:'Tasks This Week', val:weekData.reduce((a,d)=>a+d.done,0), c:C.blue },
            { label:'Weekly Rate', val:weekData.length ? Math.round(weekData.reduce((a,d)=>a+d.done,0)/(weekData.length*FIXED_TASKS.length)*100)+'%' : '0%', c:C.purple },
          ].map(k=>(
            <div key={k.label} style={{flex:1,minWidth:100,background:'#f8fafc',borderRadius:10,padding:'12px',textAlign:'center',border:`1px solid ${k.c}22`}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📌 Checklist Rules</div>
        {[
          '20 min fixed per task — timer counts up, auto-completes at 20 min',
          'Click ✓ Done early if you finish before 20 min — saves actual time',
          'Resets automatically every day at midnight',
          'All completed tasks add to your daily work progress & reports',
          'Weekly report shows completion for last 7 days',
        ].map((r,i)=>(
          <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:13,display:'flex',gap:10}}>
            <span style={{color:C.blue,flexShrink:0}}>{i+1}.</span><span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
