import React from 'react'
import { S, C, CAT_COLOR, fmtDur } from './shared'

export default function Focus({ activeTask, elapsed, plannedSecs, isPaused, openComplete, pauseTask }) {
  const pct     = plannedSecs > 0 ? Math.min(elapsed/plannedSecs*100, 100) : 0
  const overBy  = plannedSecs > 0 && elapsed > plannedSecs ? elapsed-plannedSecs : 0
  const remSecs = plannedSecs > 0 && elapsed < plannedSecs ? plannedSecs-elapsed : 0

  return (
    <div>
      <div style={{...S.banner,padding:48}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.7)',letterSpacing:'0.16em',marginBottom:16}}>DEEP WORK ENGINE</div>
        {activeTask ? (
          <>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8,color:'#fff'}}>{activeTask.name}</div>
            <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:20}}>
              <span style={{...S.badge(CAT_COLOR[activeTask.category]||C.muted),fontSize:12}}>{activeTask.category}</span>
              {activeTask.subType&&<span style={{...S.badge(C.blue),fontSize:12}}>{activeTask.subType}</span>}
            </div>

            {isPaused&&<div style={{background:'#f59e0b',color:'#fff',borderRadius:8,padding:'4px 18px',fontSize:12,fontWeight:700,display:'inline-block',marginBottom:14}}>⏸ PAUSED</div>}

            <div style={{fontSize:56,fontWeight:700,color:isPaused?'#fbbf24':'#60a5fa',letterSpacing:'0.06em',lineHeight:1,marginBottom:8}}>
              {fmtDur(elapsed)}
            </div>

            {plannedSecs>0&&(
              <div style={{maxWidth:320,margin:'0 auto 24px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>
                    {overBy>0 ? `⚠️ ${fmtDur(overBy)} over plan` : remSecs>0 ? `${fmtDur(remSecs)} remaining` : 'Time reached!'}
                  </span>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{Math.round(pct)}%</span>
                </div>
                <div style={{height:8,background:'rgba(255,255,255,0.15)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:overBy>0?'#f87171':'#34d399',borderRadius:4,transition:'width .5s'}}/>
                </div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:5,textAlign:'center'}}>
                  Plan: {fmtDur(plannedSecs)}
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button style={{...S.btn(isPaused?C.green:C.orange),fontSize:14,padding:'12px 28px'}} onClick={pauseTask}>
                {isPaused?'▶ Resume':'⏸ Pause'}
              </button>
              <button style={{...S.btn('#ef4444'),fontSize:14,padding:'12px 28px'}} onClick={openComplete}>
                ■ Complete Task
              </button>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:10}}>
              "Complete" saves time once — shows confirmation first
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:48,marginBottom:16}}>🎯</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8,color:'#fff'}}>No Active Task</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:13}}>Go to Tasks → click ▶ Start</div>
          </>
        )}
      </div>

      <div style={S.grid(2)}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Deep Work Rules</div>
          {[
            'ONE task active at a time — no switching',
            'Pause with ⏸ if you need a break',
            'Resume with ▶ — timer continues from where stopped',
            '+min buttons extend the PLAN (not the elapsed time)',
            '"Complete" shows confirmation — time saved only once',
          ].map((r,i)=>(
            <div key={i} style={{padding:'9px 0',borderBottom:`1px solid ${C.border}`,fontSize:13,display:'flex',gap:10}}>
              <span style={{color:C.blue,flexShrink:0}}>{i+1}.</span><span>{r}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Recommended Time Blocks</div>
          {[
            {block:'09:00–11:00',label:'Deep Work — Design / Creative',c:C.purple},
            {block:'11:00–12:00',label:'Marketing Execution',c:C.pink},
            {block:'12:00–13:00',label:'Break',c:C.muted},
            {block:'14:00–16:00',label:'Client Work / Delivery',c:C.blue},
            {block:'16:00–17:00',label:'Admin / Finance / Reports',c:C.teal},
          ].map((b,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'9px 0',borderBottom:`1px solid ${C.border}`,alignItems:'center'}}>
              <span style={{...S.badge(b.c),minWidth:110,textAlign:'center',fontSize:10}}>{b.block}</span>
              <span style={{fontSize:13}}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
