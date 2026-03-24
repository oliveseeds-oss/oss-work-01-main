import React, { useState } from 'react'
import { S, C, CAT_COLOR, fmtDur, today } from './shared'
import { addTask, deleteTask } from '../firebase/firebaseService'
import ConfirmDialog from './ConfirmDialog'

const CATEGORIES = {
  'Marketing Work':  ['Social Media','WhatsApp','Email','Other'],
  'Production Work': ['Promotion Design','Video Editing','Graphic Design','Website Update','Financial Work','Other'],
  'Admin Work':      ['Planning','Reporting','Client Follow-up','Team Meeting','Other'],
  'Other':           ['General','Research','Learning','Other'],
}
const PRI_CLR = { High:C.red, Medium:C.orange, Low:C.green }

export default function Tasks({ uid, tasks, timeLogs, activeTask, isPaused, startTask, pauseTask, openComplete, target }) {
  const [form,    setForm]    = useState({ name:'', category:'Marketing Work', subType:'Social Media', priority:'High', planned:30 })
  const [confirm, setConfirm] = useState({ open:false, id:null, name:'' })
  const tod = today()

  const todayTasks = tasks.filter(t => t.date===tod)
  const oldTasks   = tasks.filter(t => t.date!==tod)

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await addTask(uid, { ...form, status:'Pending' })
    setForm(p => ({ ...p, name:'' }))
  }

  const handleDelete = async () => {
    await deleteTask(uid, confirm.id)
    setConfirm({ open:false, id:null, name:'' })
  }

  const taskTime = id => timeLogs.filter(l=>l.taskId===id).reduce((a,b)=>a+(b.duration||0),0)

  return (
    <div>
      <ConfirmDialog isOpen={confirm.open} title="Delete Task?"
        message={`Delete "${confirm.name}"?`}
        onConfirm={handleDelete}
        onCancel={()=>setConfirm({open:false,id:null,name:''})}/>

      {/* Add form */}
      <div style={S.card}>
        <div style={S.sectionTitle}>➕ Add New Task</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Task Name *</label>
            <input style={S.input} placeholder="Describe the task..." value={form.name}
              onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Category</label>
            <select style={{...S.select,width:'100%'}} value={form.category}
              onChange={e=>setForm(p=>({...p,category:e.target.value,subType:CATEGORIES[e.target.value][0]}))}>
              {Object.keys(CATEGORIES).map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Sub-Type</label>
            <select style={{...S.select,width:'100%'}} value={form.subType}
              onChange={e=>setForm(p=>({...p,subType:e.target.value}))}>
              {(CATEGORIES[form.category]||[]).map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Priority</label>
            <select style={{...S.select,width:'100%'}} value={form.priority}
              onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
              {['High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Planned (min)</label>
            <input type="number" style={S.input} value={form.planned} min={1}
              onChange={e=>setForm(p=>({...p,planned:+e.target.value}))}/>
          </div>
        </div>
        <button style={S.btn(C.blue)} onClick={handleAdd}>+ Add Task</button>
      </div>

      {/* Category summary */}
      <div style={S.grid(4)}>
        {Object.entries(CATEGORIES).map(([cat])=>{
          const ct=todayTasks.filter(t=>t.category===cat)
          const done=ct.filter(t=>t.status==='Completed').length
          const secs=timeLogs.filter(l=>l.category===cat&&l.date===tod).reduce((a,b)=>a+(b.duration||0),0)
          const col=CAT_COLOR[cat]||C.muted
          return (
            <div key={cat} style={{background:'#fff',border:`1px solid ${col}22`,borderRadius:14,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:11,color:col,marginBottom:6,fontWeight:700}}>{cat}</div>
              <div style={{fontSize:22,fontWeight:700,color:C.text}}>{ct.length}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{done} done · {fmtDur(secs)}</div>
              <div style={{marginTop:8,...S.progressWrap}}><div style={S.progressFill(ct.length?done/ct.length*100:0,col)}/></div>
            </div>
          )
        })}
      </div>

      {/* Today tasks by priority */}
      {['High','Medium','Low'].map(pri => {
        const group = todayTasks.filter(t=>t.priority===pri)
        if (!group.length) return null
        return (
          <div key={pri} style={S.card}>
            <div style={{...S.sectionTitle,color:PRI_CLR[pri]}}>● {pri} Priority — {group.length} tasks</div>
            {group.map(task => {
              const spent    = taskTime(task.id)
              const eff      = task.planned&&spent>0 ? Math.round(task.planned*60/spent*100) : null
              const isActive = activeTask?.id===task.id
              return (
                <div key={task.id} style={{...S.row,
                  background:isActive?(isPaused?'#fffbeb':'#eff6ff'):'transparent',
                  borderLeft:isActive?(isPaused?`3px solid ${C.orange}`:`3px solid ${C.blue}`):'3px solid transparent',
                  borderRadius:isActive?10:0,
                  padding:isActive?'12px 12px 12px 10px':'10px 0 10px 3px',
                  transition:'all .15s',
                }}>
                  <span style={S.badge(CAT_COLOR[task.category]||C.muted)}>{task.category.replace(' Work','')}</span>
                  {task.subType&&<span style={{...S.badge(C.muted),fontSize:10}}>{task.subType}</span>}
                  <span style={{flex:1,fontSize:13,textDecoration:task.status==='Completed'?'line-through':'none',color:task.status==='Completed'?C.muted:C.text}}>{task.name}</span>
                  {spent>0&&<span style={{fontSize:11,color:C.muted}}>{fmtDur(spent)}</span>}
                  {eff&&<span style={S.badge(eff>=80?C.green:eff>=50?C.orange:C.red)}>{eff}%</span>}
                  <span style={S.badge(task.status==='Completed'?C.green:task.status==='Active'?C.blue:C.muted)}>{task.status}</span>

                  {task.status==='Pending' && (
                    <button style={S.btn(C.green)} onClick={()=>startTask(task)}>▶ Start</button>
                  )}
                  {task.status==='Active' && isActive && (
                    <>
                      <button style={S.btn(isPaused?C.green:C.orange)} onClick={pauseTask}>
                        {isPaused?'▶ Resume':'⏸ Pause'}
                      </button>
                      <button style={S.btn(C.red)} onClick={openComplete}>■ Complete</button>
                    </>
                  )}
                  <button style={{...S.btnDanger,padding:'6px 10px'}} onClick={()=>setConfirm({open:true,id:task.id,name:task.name})}>🗑️</button>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Previous tasks */}
      {oldTasks.length>0&&(
        <div style={S.card}>
          <div style={S.sectionTitle}>Previous Tasks ({oldTasks.length})</div>
          {oldTasks.slice(0,15).map(t=>(
            <div key={t.id} style={S.row}>
              <span style={{fontSize:11,color:C.muted,minWidth:76}}>{t.date}</span>
              <span style={S.badge(CAT_COLOR[t.category]||C.muted)}>{(t.category||'').replace(' Work','')}</span>
              <span style={{flex:1,fontSize:13,color:C.muted}}>{t.name}</span>
              <span style={S.badge(t.status==='Completed'?C.green:C.muted)}>{t.status}</span>
              <button style={{...S.btnDanger,padding:'6px 10px'}} onClick={()=>setConfirm({open:true,id:t.id,name:t.name})}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
