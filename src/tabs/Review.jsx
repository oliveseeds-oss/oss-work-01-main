import React, { useState, useEffect } from 'react'
import { S, C, fmtDur, today } from './shared'
import { saveReview } from '../firebase/firebaseService'

export default function Review({ uid, reviews, tasks, timeLogs, distracts, focusScore, totalSecs, doneToday, distractSecs }) {
  const [form, setForm]           = useState({ wrong:'', improve:'', highlight:'', rating:'3' })
  const [emergNote, setEmergNote] = useState(null)
  const tod         = today()
  const todayReview = reviews.find(r => r.date === tod)

  useEffect(() => {
    const saved = localStorage.getItem('lastEmergencyNote')
    if (saved) { try { setEmergNote(JSON.parse(saved)) } catch(e) {} }
  }, [])

  const dismissEmergNote = () => { setEmergNote(null); localStorage.removeItem('lastEmergencyNote') }

  const handleSave = async () => {
    if (!form.wrong && !form.improve && !form.highlight) return
    await saveReview(uid, form)
    setForm({ wrong:'', improve:'', highlight:'', rating:'3' })
  }

  const stars = n => Array.from({length:5}).map((_,i) => i<n?'⭐':'☆').join('')

  return (
    <div>
      {emergNote && (
        <div style={{ background:'#fff7ed', border:'2px solid #fb923c', borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#92400e', marginBottom:4 }}>⚡ Last Session Emergency Note ({emergNote.date} {emergNote.time})</div>
              <div style={{ fontSize:13, color:'#b45309' }}>{emergNote.note}</div>
              <div style={{ fontSize:12, color:'#92400e', marginTop:8 }}>Please fill today's review to complete your pending reflection.</div>
            </div>
            <button onClick={dismissEmergNote} style={{ background:'none', border:'none', color:'#92400e', cursor:'pointer', fontSize:16, padding:4 }}>✕</button>
          </div>
        </div>
      )}

      <div style={S.banner}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', letterSpacing:'0.14em', marginBottom:10 }}>END OF DAY REVIEW</div>
        <div style={{ fontSize:18, fontWeight:700 }}>Daily Performance Check</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:4 }}>{new Date().toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      </div>

      <div style={S.grid(4)}>
        {[{label:'Work Time',val:fmtDur(totalSecs),c:C.green},{label:'Tasks Done',val:doneToday,c:C.orange},{label:'Focus Score',val:focusScore+'%',c:C.blue},{label:'Time Lost',val:fmtDur(distractSecs),c:C.red}].map(k=>(
          <div key={k.label} style={S.kpi(k.c)}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.val}</div>
          </div>
        ))}
      </div>

      {!todayReview ? (
        <div style={S.card}>
          <div style={S.sectionTitle}>📝 Daily Reflection</div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:C.muted, display:'block', marginBottom:8 }}>How was your day overall?</label>
            <div style={{ display:'flex', gap:8 }}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setForm(p=>({...p,rating:String(n)}))}
                  style={{ background:parseInt(form.rating)>=n?'#fefce8':'#f8fafc', border:`1px solid ${parseInt(form.rating)>=n?C.yellow:C.border}`, borderRadius:9, padding:'10px 18px', cursor:'pointer', fontSize:20, fontFamily:'inherit' }}>
                  {parseInt(form.rating)>=n?'⭐':'☆'}
                </button>
              ))}
              <span style={{ alignSelf:'center', fontSize:13, color:C.muted, marginLeft:4 }}>
                {['','Very Bad','Bad','OK','Good','Excellent!'][parseInt(form.rating)]}
              </span>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.muted, display:'block', marginBottom:6 }}>🏆 Best achievement today?</label>
            <textarea style={{ ...S.textarea, minHeight:60 }} placeholder="What went well?" value={form.highlight} onChange={e=>setForm(p=>({...p,highlight:e.target.value}))}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.muted, display:'block', marginBottom:6 }}>❌ What wasted time? What took too long?</label>
            <textarea style={{ ...S.textarea, minHeight:80 }} placeholder="Be honest. This builds awareness." value={form.wrong} onChange={e=>setForm(p=>({...p,wrong:e.target.value}))}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:C.muted, display:'block', marginBottom:6 }}>✅ What will you do better tomorrow?</label>
            <textarea style={{ ...S.textarea, minHeight:80 }} placeholder="One specific, actionable change." value={form.improve} onChange={e=>setForm(p=>({...p,improve:e.target.value}))}/>
          </div>
          <button style={S.btn(C.blue)} onClick={handleSave}>✓ Save Review</button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={S.sectionTitle}>Today's Review — Saved ✓</div>
            <div style={{ fontSize:20 }}>{stars(parseInt(todayReview.rating||3))}</div>
          </div>
          {[['🏆 Best achievement',todayReview.highlight],['❌ What went wrong',todayReview.wrong],["✅ Tomorrow's plan",todayReview.improve]].map(([lbl,val])=>(
            <div key={lbl} style={{ marginBottom:14, padding:'12px 14px', background:'#f8fafc', borderRadius:9 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{lbl}</div>
              <div style={{ fontSize:14, color:C.text }}>{val||'—'}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.card}>
        <div style={S.sectionTitle}>Non-Negotiable Rules</div>
        {['❌ No multitasking','❌ No working without time tracking','❌ No unplanned work','❌ No skipping daily review','✅ One task. Full focus. Complete it.'].map((r,i)=>(
          <div key={i} style={{ padding:'9px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>{r}</div>
        ))}
      </div>

      {reviews.length>0&&(
        <div style={S.card}>
          <div style={S.sectionTitle}>Past Reviews ({reviews.length})</div>
          {reviews.slice(0,10).map(r=>(
            <div key={r.id} style={{ padding:'12px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:C.muted }}>{r.date}</span>
                <span style={{ fontSize:14 }}>{stars(parseInt(r.rating||3))}</span>
              </div>
              {r.highlight&&<div style={{ fontSize:13, color:C.green, marginBottom:3 }}>🏆 {r.highlight}</div>}
              {r.wrong    &&<div style={{ fontSize:13, color:C.muted, marginBottom:3 }}>❌ {r.wrong}</div>}
              {r.improve  &&<div style={{ fontSize:13, color:C.blue }}>✅ {r.improve}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
