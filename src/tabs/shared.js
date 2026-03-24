// src/tabs/shared.js
export const C = {
  bg:'#f0f4ff', card:'#ffffff', border:'#e2e8f0', border2:'#cbd5e1',
  text:'#1e293b', muted:'#64748b',
  blue:'#3b82f6', green:'#10b981', orange:'#f59e0b', red:'#ef4444',
  purple:'#8b5cf6', pink:'#ec4899', teal:'#14b8a6', yellow:'#eab308', indigo:'#6366f1',
}
export const CAT_COLOR = {
  'Marketing Work':'#ec4899','Production Work':'#8b5cf6','Admin Work':'#14b8a6','Other':'#94a3b8',
}
// ISO date YYYY-MM-DD — consistent across all timezones
export const today   = () => new Date().toISOString().slice(0,10)
export const fmtDur  = s => { if(!s||s<=0)return'0s'; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h?`${h}h ${m}m`:m?`${m}m ${sec}s`:`${sec}s` }
export const fmtTime = ts => { if(!ts)return'—'; return new Date(typeof ts==='object'?ts.toDate?.()??ts:ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }
export const S = {
  card:         { background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:22, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize:11, color:'#64748b', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 },
  input:        { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', color:'#1e293b', fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' },
  select:       { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', color:'#1e293b', fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' },
  textarea:     { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', color:'#1e293b', fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box', resize:'vertical' },
  btn:          (c='#10b981') => ({ background:c, border:'none', borderRadius:9, padding:'10px 20px', color:'#fff', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600, whiteSpace:'nowrap', boxShadow:`0 2px 8px ${c}44` }),
  btnSm:        (c='#fff')   => ({ background:c, border:'1px solid #e2e8f0', borderRadius:7, padding:'6px 13px', color:'#64748b', cursor:'pointer', fontSize:12, fontFamily:'inherit' }),
  btnDanger:    { background:'#fff', border:'1px solid #fca5a5', borderRadius:7, padding:'6px 13px', color:'#ef4444', cursor:'pointer', fontSize:12, fontFamily:'inherit' },
  grid:         n => ({ display:'grid', gridTemplateColumns:`repeat(${n},1fr)`, gap:16 }),
  row:          { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap' },
  badge:        c => ({ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'18', color:c, border:`1px solid ${c}33`, whiteSpace:'nowrap' }),
  progressWrap: { height:8, background:'#f1f5f9', borderRadius:4, overflow:'hidden' },
  progressFill: (pct,c='#3b82f6') => ({ height:'100%', width:`${Math.min(pct,100)}%`, background:c, borderRadius:4, transition:'width .5s' }),
  kpi:          c => ({ background:'#fff', border:`1px solid ${c}22`, borderRadius:16, padding:20, position:'relative', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }),
  banner:       { background:'linear-gradient(135deg,#1e3a5f,#1e40af)', border:'none', borderRadius:16, padding:36, textAlign:'center', marginBottom:16, color:'#fff', boxShadow:'0 4px 24px rgba(30,64,175,0.3)' },
}
