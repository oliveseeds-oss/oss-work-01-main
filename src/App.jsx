import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import {
  listenTasks, addTask, updateTask, deleteTask,
  listenTimeLogs, addTimeLog,
  listenClients, listenDistractions, listenReviews,
  listenEmails, listenWhatsapp, listenMeta, listenSocialUrls,
} from './firebase/firebaseService'
import Dashboard from './tabs/Dashboard'
import Tasks     from './tabs/Tasks'
import Focus     from './tabs/Focus'
import Marketing from './tabs/Marketing'
import Admin     from './tabs/Admin'
import Reports   from './tabs/Reports'
import Review     from './tabs/Review'
import Checklist  from './tabs/Checklist'

const TABS = [
  { id:'dashboard', label:'Dashboard', icon:'⚡' },
  { id:'tasks',     label:'Tasks',     icon:'✓'  },
  { id:'focus',     label:'Focus',     icon:'🎯' },
  { id:'marketing', label:'Marketing', icon:'📣' },
  { id:'admin',     label:'Admin DB',  icon:'🗄️'  },
  { id:'reports',   label:'Reports',   icon:'📊' },
  { id:'review',    label:'Review',    icon:'🔍' },
  { id:'checklist', label:'Checklist',  icon:'☑️'  },
]
const TODAY_KEY    = 'os_today'
const SESSION_KEY  = 'os_sess'
const REMINDER_KEY = 'os_remind'
const CRASH_KEY    = 'os_crash'

const isoDay  = () => new Date().toISOString().slice(0,10)
const fmtDur  = s => {
  if (!s || s <= 0) return '0s'
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`
}
const fmtSess = s => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60
  return h
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function Popup({ isOpen, children }) {
  if (!isOpen) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.65)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      {children}
    </div>
  )
}

function Toast({ msg, type='success', onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,4000); return()=>clearTimeout(t) },[])
  const bg = type==='success'?'#10b981':type==='warning'?'#f59e0b':'#ef4444'
  return (
    <div style={{position:'fixed',bottom:16,right:16,left:16,maxWidth:380,margin:'0 auto',zIndex:99999,background:bg,color:'#fff',borderRadius:12,padding:'13px 18px',fontSize:13,fontWeight:600,fontFamily:'inherit',boxShadow:'0 8px 30px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:10,animation:'slideUp .25s ease'}}>
      {type==='success'?'✅':type==='warning'?'⚠️':'❌'} {msg}
      <button onClick={onClose} style={{marginLeft:'auto',background:'rgba(255,255,255,0.3)',border:'none',borderRadius:5,padding:'2px 8px',color:'#fff',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>✕</button>
    </div>
  )
}

// KEY DESIGN: when confirmation popup shows, timer is FROZEN at planned time.
// +Xmin buttons extend the PLAN and resume timer.
// Complete saves the FROZEN time (not time wasted in popup).
function CompletePopup({ taskName, frozenSecs, plannedSecs, onYes, onNo, onAddTime, saving }) {
  const pct    = plannedSecs>0 ? Math.min(frozenSecs/plannedSecs*100,100) : 0
  const overBy = plannedSecs>0 && frozenSecs>plannedSecs ? frozenSecs-plannedSecs : 0
  return (
    <div style={{background:'#fff',borderRadius:20,padding:28,maxWidth:380,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',animation:'popIn .18s ease'}}>
      <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>✅</div>
      <div style={{fontSize:15,fontWeight:700,color:'#1e293b',textAlign:'center',marginBottom:4}}>Task Complete?</div>
      <div style={{fontSize:13,color:'#64748b',textAlign:'center',marginBottom:12,wordBreak:'break-word'}}><strong>{taskName}</strong></div>

      {/* Time at popup — FROZEN, not counting */}
      <div style={{background:'#f0fdf4',borderRadius:10,padding:'12px',marginBottom:12,textAlign:'center'}}>
        <div style={{fontSize:11,color:'#15803d',marginBottom:4}}>⏱ Time worked (frozen)</div>
        <div style={{fontSize:32,fontWeight:700,color:'#10b981'}}>{fmtDur(frozenSecs)}</div>
        {plannedSecs>0&&(
          <>
            <div style={{height:5,background:'#dcfce7',borderRadius:3,overflow:'hidden',margin:'8px 0 4px'}}>
              <div style={{height:'100%',width:`${pct}%`,background:overBy>0?'#f59e0b':'#10b981',borderRadius:3}}/>
            </div>
            <div style={{fontSize:11,color:overBy>0?'#f59e0b':'#10b981'}}>
              {overBy>0 ? `${fmtDur(overBy)} over plan` : `Plan: ${fmtDur(plannedSecs)}`}
            </div>
          </>
        )}
      </div>

      {/* Need more time — resumes timer with extended plan */}
      <div style={{fontSize:12,color:'#64748b',textAlign:'center',marginBottom:8}}>Need more time? (resumes timer)</div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[5,10,15].map(m=>(
          <button key={m} onClick={()=>onAddTime(m)} disabled={saving}
            style={{flex:1,background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:9,padding:'9px',color:'#3b82f6',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
            +{m}m
          </button>
        ))}
      </div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={onYes} disabled={saving}
          style={{flex:2,background:saving?'#94a3b8':'#10b981',border:'none',borderRadius:9,padding:'12px',color:'#fff',cursor:saving?'not-allowed':'pointer',fontSize:14,fontFamily:'inherit',fontWeight:700}}>
          {saving?'⏳ Saving...':'✓ Complete & Save'}
        </button>
        <button onClick={onNo} disabled={saving}
          style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'12px',color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
          Cancel
        </button>
      </div>
      <div style={{fontSize:11,color:'#94a3b8',textAlign:'center',marginTop:8}}>
        Saves {fmtDur(frozenSecs)} — time frozen when popup opened
      </div>
    </div>
  )
}

function ReminderPopup({ tasks, onClose, onGoTasks }) {
  const tod     = isoDay()
  const pending = tasks.filter(t=>t.date===tod&&t.status==='Pending')
  const done    = tasks.filter(t=>t.date===tod&&t.status==='Completed').length
  return (
    <div style={{background:'#fff',borderRadius:20,padding:28,maxWidth:400,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',animation:'popIn .18s ease'}}>
      <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>{pending.length?'⏰':'🎉'}</div>
      <div style={{fontSize:16,fontWeight:700,color:'#1e293b',textAlign:'center',marginBottom:6}}>
        {pending.length?'Task Reminder':'All Tasks Done!'}
      </div>
      <div style={{fontSize:13,color:'#64748b',textAlign:'center',marginBottom:14}}>
        {pending.length
          ?<><strong style={{color:'#ef4444'}}>{pending.length}</strong> task{pending.length!==1?'s':''} pending</>
          :`${done} task${done!==1?'s':''} completed 💪`}
      </div>
      {pending.length>0&&(
        <div style={{maxHeight:160,overflowY:'auto',marginBottom:14}}>
          {pending.slice(0,5).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#f8fafc',borderRadius:9,marginBottom:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:t.priority==='High'?'#ef4444':t.priority==='Medium'?'#f59e0b':'#10b981',flexShrink:0}}/>
              <span style={{fontSize:13,flex:1}}>{t.name}</span>
              <span style={{fontSize:10,color:'#64748b',background:'#e2e8f0',padding:'1px 6px',borderRadius:4}}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',gap:10}}>
        {pending.length>0&&<button onClick={onGoTasks} style={{flex:1,background:'#3b82f6',border:'none',borderRadius:9,padding:12,color:'#fff',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:700}}>Go to Tasks →</button>}
        <button onClick={onClose} style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:12,color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>{pending.length?'Later':'Close'}</button>
      </div>
    </div>
  )
}

function LogoutPopup({ reviewDone, onLogout, onCancel, onGoReview }) {
  const [emerg,setEmerg]=useState(false)
  const [note,setNote]=useState('')
  if(emerg) return (
    <div style={{background:'#fff',borderRadius:20,padding:28,maxWidth:380,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',animation:'popIn .18s ease'}}>
      <div style={{fontSize:28,textAlign:'center',marginBottom:8}}>⚡</div>
      <div style={{fontSize:15,fontWeight:700,color:'#1e293b',textAlign:'center',marginBottom:8}}>Emergency Logout</div>
      <textarea style={{width:'100%',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'10px 14px',color:'#1e293b',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical',marginBottom:12,boxSizing:'border-box'}}
        rows={3} placeholder="Leave a note..." value={note} onChange={e=>setNote(e.target.value)} autoFocus/>
      <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#92400e',marginBottom:12}}>⚠️ Review not saved. Fill it next session.</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>onLogout(note||'Emergency')} style={{flex:1,background:'#ef4444',border:'none',borderRadius:9,padding:12,color:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:700}}>Logout Now</button>
        <button onClick={()=>setEmerg(false)} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'12px 14px',color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Back</button>
      </div>
    </div>
  )
  return (
    <div style={{background:'#fff',borderRadius:20,padding:28,maxWidth:380,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',animation:'popIn .18s ease'}}>
      <div style={{fontSize:32,textAlign:'center',marginBottom:8}}>{reviewDone?'✅':'📋'}</div>
      <div style={{fontSize:16,fontWeight:700,color:'#1e293b',textAlign:'center',marginBottom:6}}>{reviewDone?'Ready to Logout':'Daily Review Pending'}</div>
      <div style={{fontSize:13,color:'#64748b',textAlign:'center',marginBottom:16,lineHeight:1.6}}>{reviewDone?'Great work today!':'Fill your daily review first — 2 minutes.'}</div>
      {reviewDone?(
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>onLogout('')} style={{flex:1,background:'#10b981',border:'none',borderRadius:9,padding:12,color:'#fff',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:700}}>✓ Logout</button>
          <button onClick={onCancel} style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:12,color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button onClick={onGoReview} style={{background:'#3b82f6',border:'none',borderRadius:9,padding:12,color:'#fff',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:700}}>📝 Fill Daily Review</button>
          <button onClick={()=>setEmerg(true)} style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:9,padding:10,color:'#92400e',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>⚡ Emergency Logout</button>
          <button onClick={onCancel} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:10,color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
        </div>
      )}
    </div>
  )
}

function CrashBanner({ data, onComplete, onResume, onDismiss }) {
  const [busy,setBusy]=useState(false)
  if(busy) return null
  return (
    <div style={{background:'#fff7ed',borderBottom:'2px solid #fb923c',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
      <span>⚡</span>
      <div style={{flex:1,minWidth:120}}>
        <div style={{fontSize:13,fontWeight:700,color:'#92400e'}}>"{data.taskName}" was interrupted</div>
        <div style={{fontSize:12,color:'#b45309'}}>What happened?</div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button onClick={async()=>{setBusy(true);await onComplete()}} style={{background:'#10b981',border:'none',borderRadius:7,padding:'7px 12px',color:'#fff',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:600}}>✓ Complete</button>
        <button onClick={()=>{setBusy(true);onResume()}} style={{background:'#f59e0b',border:'none',borderRadius:7,padding:'7px 12px',color:'#fff',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:600}}>↺ Resume</button>
        <button onClick={()=>{setBusy(true);onDismiss()}} style={{background:'none',border:'1px solid #fed7aa',borderRadius:7,padding:'7px 10px',color:'#92400e',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Dismiss</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const { user, logout } = useAuth()
  const uid = user?.uid

  const [tasks,        setTasks]      = useState([])
  const [timeLogs,     setTimeLogs]   = useState([])
  const [clients,      setClients]    = useState([])
  const [distracts,    setDistracts]  = useState([])
  const [reviews,      setReviews]    = useState([])
  const [emails,       setEmails]     = useState([])
  const [whatsapp,     setWhatsapp]   = useState([])
  const [metaCampaigns,setMeta]       = useState([])
  const [socialUrls,   setSocialUrls] = useState([])
  const [dbOk,         setDbOk]       = useState(false)

  const [tab,          setTab]         = useState('dashboard')
  const [target,       setTarget]      = useState({ hours:6, tasks:5 })
  const [sessionTime,  setSession]     = useState(0)
  const [showRemind,   setShowRemind]  = useState(false)
  const [showLogout,   setShowLogout]  = useState(false)
  const [showComplete, setShowComplete]= useState(false)
  const [crashData,    setCrashData]   = useState(null)
  const [toast,        setToast]       = useState(null)
  const [saving,       setSaving]      = useState(false)

  // Display state
  const [activeTask,   setActiveTask]  = useState(null)
  const [elapsedSecs,  setElapsedSecs] = useState(0)
  const [isPaused,     setIsPaused]    = useState(false)
  const [plannedSecs,  setPlannedSecs] = useState(0)
  const [extraPlan,    setExtraPlan]   = useState(0)
  // frozenSecs: the time that was frozen when popup opened — THIS is what gets saved
  const [frozenSecs,   setFrozenSecs]  = useState(0)

  // Single ref object — interval reads directly, never stale
  const R = useRef({
    active:   null,
    startMs:  null,
    paused:   false,
    frozen:   0,      // seconds when popup was shown / task paused
    plan:     0,      // total planned seconds
    popShown: false,
    saving:   false,
    popFrozen:false,  // true when popup is open and timer is frozen
  })

  const timerRef = useRef(null)
  const toast$   = (msg, type='success') => setToast({ msg, type, k:Date.now() })

  // ── SINGLE MASTER INTERVAL ────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const r = R.current
      // Stop if: no task, paused, popup frozen, saving
      if (!r.active || !r.startMs || r.paused || r.popFrozen || r.saving) return

      const el = Math.floor((Date.now() - r.startMs) / 1000)
      setElapsedSecs(el)

      // When planned time reached: FREEZE timer, show popup
      if (r.plan > 0 && el >= r.plan && !r.popShown) {
        r.popShown  = true
        r.popFrozen = true    // ← FREEZE timer at this moment
        r.frozen    = el      // ← store frozen elapsed
        setFrozenSecs(el)
        setElapsedSecs(el)    // show frozen value
        setShowComplete(true)
        setToast({ msg:`⏰ ${r.active.name} — planned time reached!`, type:'warning', k:Date.now() })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Firebase
  useEffect(() => {
    if (!uid) return
    const u = [
      listenTasks(uid,        d=>{ setTasks(d); setDbOk(true) }),
      listenTimeLogs(uid,     setTimeLogs),
      listenClients(uid,      setClients),
      listenDistractions(uid, setDistracts),
      listenReviews(uid,      setReviews),
      listenEmails(uid,       setEmails),
      listenWhatsapp(uid,     setWhatsapp),
      listenMeta(uid,         setMeta),
      listenSocialUrls(uid,   setSocialUrls),
    ]
    return () => u.forEach(fn => fn())
  }, [uid])

  // Session timer
  useEffect(() => {
    if (!uid) return
    const now = isoDay()
    if (localStorage.getItem(TODAY_KEY) !== now) {
      localStorage.setItem(TODAY_KEY, now)
      localStorage.setItem(SESSION_KEY, '0')
      setSession(0)
    } else {
      setSession(parseInt(localStorage.getItem(SESSION_KEY)||'0'))
    }
    const t = setInterval(() => {
      setSession(s => { const n=s+1; localStorage.setItem(SESSION_KEY,String(n)); return n })
    }, 1000)
    return () => clearInterval(t)
  }, [uid])

  // Crash recovery
  useEffect(() => {
    if (!uid) return
    try {
      const raw = localStorage.getItem(CRASH_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.uid === uid) setCrashData(d)
      else localStorage.removeItem(CRASH_KEY)
    } catch { localStorage.removeItem(CRASH_KEY) }
  }, [uid])

  // Reminder — only after 2hr gap
  useEffect(() => {
    if (!uid) return
    const check = () => {
      const last = parseInt(localStorage.getItem(REMINDER_KEY)||'0')
      if (Date.now()-last >= 2*60*60*1000) {
        setShowRemind(true)
        localStorage.setItem(REMINDER_KEY, String(Date.now()))
      }
    }
    const t1 = setTimeout(check, 5000)
    const t2 = setInterval(check, 2*60*60*1000)
    return () => { clearTimeout(t1); clearInterval(t2) }
  }, [uid])

  // Crash data save
  useEffect(() => {
    const r = R.current
    if (r.active && r.startMs && uid) {
      localStorage.setItem(CRASH_KEY, JSON.stringify({
        uid, taskId:r.active.id, taskName:r.active.name,
        category:r.active.category, subType:r.active.subType||'',
        startMs:r.startMs, plan:r.plan
      }))
    }
  }, [elapsedSecs, uid])

  // ── START ──────────────────────────────────────────────────
  const startTask = async (task) => {
    if (R.current.active) { toast$('Finish current task first!', 'warning'); return }
    const ps  = (task.planned||0) * 60
    const now = Date.now()
    R.current = { active:task, startMs:now, paused:false, frozen:0, plan:ps, popShown:false, saving:false, popFrozen:false }
    setActiveTask(task)
    setElapsedSecs(0)
    setFrozenSecs(0)
    setIsPaused(false)
    setPlannedSecs(ps)
    setExtraPlan(0)
    setShowComplete(false)
    try { await updateTask(uid, task.id, { status:'Active' }) } catch {}
    toast$(`▶ Started: ${task.name}`)
  }

  // ── PAUSE / RESUME ─────────────────────────────────────────
  const pauseTask = () => {
    const r = R.current
    if (!r.active) return
    if (!r.paused && !r.popFrozen) {
      const frozen = Math.floor((Date.now()-r.startMs)/1000)
      R.current = { ...r, paused:true, frozen }
      setIsPaused(true)
      setElapsedSecs(frozen)
      toast$('⏸ Paused', 'warning')
    } else if (r.paused) {
      const newStart = Date.now() - r.frozen*1000
      R.current = { ...r, paused:false, startMs:newStart }
      setIsPaused(false)
      toast$('▶ Resumed')
    }
  }

  // ── ADD EXTRA PLAN — extends plan, resumes timer ───────────
  const addExtraPlan = (mins) => {
    const added = mins * 60
    const r = R.current
    const newPlan = r.plan + added
    // If timer was frozen by popup, resume it from where it was frozen
    const newStart = r.popFrozen ? Date.now() - r.frozen*1000 : r.startMs
    R.current = { ...r, plan:newPlan, popShown:false, popFrozen:false, startMs:newStart }
    setExtraPlan(e => e + added)
    setPlannedSecs(p => { return p }) // keep same, plan is tracked in R
    setShowComplete(false)
    toast$(`Plan extended +${mins} min — timer resumed`)
  }

  // ── COMPLETE TASK ──────────────────────────────────────────
  // Saves FROZEN time (the time when popup opened or task completed)
  // NOT the current clock time — so no extra seconds from popup delay
  const completeTask = async () => {
    const r = R.current
    if (!r.active || r.saving) return
    R.current.saving = true
    setSaving(true)

    // Use frozen time if popup was shown, else current elapsed
    const duration = Math.max(1, r.popFrozen ? r.frozen : (r.paused ? r.frozen : Math.floor((Date.now()-r.startMs)/1000)))
    const endMs    = Date.now()
    const taskSnap = r.active
    const startMs  = r.startMs

    // Clear everything
    R.current = { active:null, startMs:null, paused:false, frozen:0, plan:0, popShown:false, saving:false, popFrozen:false }
    localStorage.removeItem(CRASH_KEY)
    setActiveTask(null); setElapsedSecs(0); setFrozenSecs(0); setIsPaused(false)
    setPlannedSecs(0); setExtraPlan(0); setShowComplete(false); setSaving(false)

    try {
      await addTimeLog(uid, { taskId:taskSnap.id, taskName:taskSnap.name, category:taskSnap.category||'', subType:taskSnap.subType||'', start:startMs, end:endMs, duration, date:isoDay() })
      await updateTask(uid, taskSnap.id, { status:'Completed' })
      toast$(`✅ ${taskSnap.name} — ${fmtDur(duration)} saved`)
    } catch { toast$('Save failed — check internet', 'error') }
  }

  // ── CRASH ──────────────────────────────────────────────────
  const crashComplete = async () => {
    if (!crashData) return
    const endMs = Date.now()
    const dur   = Math.max(1, Math.floor((endMs-(crashData.startMs||endMs))/1000))
    try {
      await addTimeLog(uid, { taskId:crashData.taskId, taskName:crashData.taskName, category:crashData.category||'', subType:crashData.subType||'', start:crashData.startMs||endMs, end:endMs, duration:dur, date:isoDay() })
      await updateTask(uid, crashData.taskId, { status:'Completed' })
      toast$(`✅ ${crashData.taskName} logged`)
    } catch { toast$('Save failed','error') }
    setCrashData(null); localStorage.removeItem(CRASH_KEY)
  }

  const crashResume = () => {
    if (!crashData) return
    const task = tasks.find(t=>t.id===crashData.taskId)
    if (task) {
      const ps = crashData.plan||(task.planned||0)*60
      R.current = { active:task, startMs:crashData.startMs||Date.now(), paused:false, frozen:0, plan:ps, popShown:false, saving:false, popFrozen:false }
      setActiveTask(task); setIsPaused(false); setPlannedSecs(ps); setExtraPlan(0); setElapsedSecs(0); setFrozenSecs(0)
      toast$(`▶ Resumed: ${task.name}`)
    }
    setCrashData(null); localStorage.removeItem(CRASH_KEY)
  }

  const doLogout = async (note) => {
    if (note) localStorage.setItem('os_emerg', JSON.stringify({ note, date:isoDay(), time:new Date().toLocaleTimeString() }))
    setShowLogout(false)
    await logout()
  }

  // ── COMPUTED ───────────────────────────────────────────────
  const tod          = isoDay()
  const todayLogs    = timeLogs.filter(l=>l.date===tod)
  const totalSecs    = todayLogs.reduce((a,b)=>a+(Number(b.duration)||0),0)
  const distractSecs = distracts.filter(d=>d.date===tod).reduce((a,b)=>a+(Number(b.duration)||0),0)
  const todayTasks   = tasks.filter(t=>t.date===tod)
  const doneToday    = todayTasks.filter(t=>t.status==='Completed').length
  const prodPct      = todayTasks.length ? Math.round(doneToday/todayTasks.length*100) : 0
  const focusScore   = Math.max(0,Math.min(100,Math.round((totalSecs/(target.hours*3600))*40+prodPct*0.4+Math.max(0,1-distractSecs/3600)*20)))
  const reviewDone   = reviews.some(r=>r.date===tod)
  const totalPlan    = plannedSecs + extraPlan
  const openComplete = () => {
    const r = R.current
    if (!r.active || r.saving) return
    // Freeze timer when popup opens manually too
    const frozen = r.paused ? r.frozen : Math.floor((Date.now()-r.startMs)/1000)
    R.current = { ...r, popFrozen:true, frozen }
    setFrozenSecs(frozen)
    setElapsedSecs(frozen)
    setShowComplete(true)
  }
  const pauseOrResume = () => pauseTask()

  const shared = {
    uid, tasks, timeLogs, distracts, reviews,
    activeTask, elapsedSecs, isPaused, plannedSecs:totalPlan,
    startTask, pauseTask:pauseOrResume, openComplete,
    target, setTarget, focusScore, totalSecs, doneToday, distractSecs, sessionTime,
  }

  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff',color:'#1e293b',fontFamily:"'DM Mono','Courier New',monospace"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {toast && <Toast key={toast.k} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <Popup isOpen={showComplete && !!activeTask}>
        <CompletePopup
          taskName={activeTask?.name||''} frozenSecs={frozenSecs} plannedSecs={totalPlan}
          onYes={completeTask} onNo={()=>{
            // Cancel popup — unfreeze timer and keep working
            R.current.popFrozen = false
            R.current.popShown  = false
            // Adjust startMs so timer continues from frozen point
            if (R.current.startMs) {
              R.current.startMs = Date.now() - frozenSecs*1000
            }
            setShowComplete(false)
          }}
          onAddTime={addExtraPlan} saving={saving}/>
      </Popup>

      <Popup isOpen={showRemind}>
        <ReminderPopup tasks={tasks} onClose={()=>setShowRemind(false)} onGoTasks={()=>{setShowRemind(false);setTab('tasks')}}/>
      </Popup>

      <Popup isOpen={showLogout}>
        <LogoutPopup reviewDone={reviewDone} onLogout={doLogout} onCancel={()=>setShowLogout(false)} onGoReview={()=>{setShowLogout(false);setTab('review')}}/>
      </Popup>

      {crashData && !activeTask && (
        <CrashBanner data={crashData} onComplete={crashComplete} onResume={crashResume} onDismiss={()=>{setCrashData(null);localStorage.removeItem(CRASH_KEY)}}/>
      )}

      {/* HEADER — mobile responsive */}
      <header style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',minHeight:56,position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 6px rgba(0,0,0,0.08)',flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:14,fontWeight:700,color:'#3b82f6',display:'flex',alignItems:'center',gap:6}}>🫒 OliveSeeds OS</div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {activeTask&&(
            <div style={{display:'flex',alignItems:'center',gap:5,background:isPaused?'#fff7ed':'#eff6ff',border:`1px solid ${isPaused?'#fed7aa':'#bfdbfe'}`,borderRadius:8,padding:'4px 10px',maxWidth:200}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:isPaused?'#f59e0b':'#3b82f6',display:'inline-block',animation:isPaused?'none':'pulse 1.2s infinite',flexShrink:0}}/>
              <span style={{fontSize:11,color:isPaused?'#92400e':'#3b82f6',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {isPaused?'⏸ ':''}{activeTask.name} · {fmtDur(elapsedSecs)}
              </span>
            </div>
          )}
          <span style={{fontSize:11,background:'#f1f5f9',borderRadius:6,padding:'3px 8px',color:'#1e293b',fontWeight:700}}>🕐 {fmtSess(sessionTime)}</span>
          <span style={{fontSize:10,color:dbOk?'#10b981':'#f59e0b',fontWeight:600}}>●{dbOk?'Live':'...'}</span>
          <button onClick={()=>setShowLogout(true)} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:7,padding:'5px 12px',color:'#64748b',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:600}}>Logout</button>
        </div>
      </header>

      {/* NAV — scrollable on mobile */}
      <nav style={{display:'flex',gap:0,background:'#fff',borderBottom:'1px solid #e2e8f0',overflowX:'auto',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',WebkitOverflowScrolling:'touch'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'11px 12px',background:'none',border:'none',borderBottom:tab===t.id?'2px solid #3b82f6':'2px solid transparent',color:tab===t.id?'#3b82f6':'#64748b',cursor:'pointer',fontSize:12,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',fontWeight:tab===t.id?700:400,flexShrink:0}}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* MAIN — responsive padding */}
      <main style={{padding:'16px',maxWidth:1140,margin:'0 auto'}}>
        {tab==='dashboard' && <Dashboard {...shared} elapsed={elapsedSecs}/>}
        {tab==='tasks'     && <Tasks uid={uid} tasks={tasks} timeLogs={timeLogs} activeTask={activeTask} isPaused={isPaused} startTask={startTask} pauseTask={pauseOrResume} openComplete={openComplete} target={target}/>}
        {tab==='focus'     && <Focus activeTask={activeTask} elapsed={elapsedSecs} plannedSecs={totalPlan} isPaused={isPaused} openComplete={openComplete} pauseTask={pauseOrResume}/>}
        {tab==='marketing' && <Marketing uid={uid} socialUrls={socialUrls}/>}
        {tab==='admin'     && <Admin uid={uid} emails={emails} whatsapp={whatsapp} metaCampaigns={metaCampaigns} clients={clients}/>}
        {tab==='reports'   && <Reports uid={uid} tasks={tasks} timeLogs={timeLogs} distracts={distracts}/>}
        {tab==='checklist' && <Checklist uid={uid} timeLogs={timeLogs} setTimeLogs={setTimeLogs}/>}
        {tab==='review'    && <Review uid={uid} reviews={reviews} tasks={tasks} timeLogs={timeLogs} distracts={distracts} focusScore={focusScore} totalSecs={totalSecs} doneToday={doneToday} distractSecs={distractSecs}/>}
      </main>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes popIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        button:hover:not(:disabled){opacity:.85}
        select option{background:#fff}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f0f4ff}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
        input:focus,textarea:focus,select:focus{border-color:#3b82f6!important;outline:none;box-shadow:0 0 0 3px rgba(59,130,246,0.1)}

        /* ── MOBILE RESPONSIVE ── */
        @media(max-width:640px){
          main { padding: 10px !important; }
          /* Stack grids to single column */
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2,1fr) !important; }
          div[style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 2fr"]  { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"]  { grid-template-columns: 1fr !important; }
          /* Card padding */
          div[style*="padding:22"] { padding: 14px !important; }
          div[style*="padding: 22"]{ padding: 14px !important; }
          /* Tables scroll */
          table { font-size: 12px !important; }
          /* Banner padding */
          div[style*="padding:36"] { padding: 20px !important; }
          div[style*="padding: 36"]{ padding: 20px !important; }
          /* Font adjustments */
          div[style*="fontSize:26"] { font-size: 20px !important; }
          div[style*="fontSize:56"] { font-size: 36px !important; }
        }
        @media(max-width:400px){
          div[style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
