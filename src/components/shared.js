// src/components/shared.js
export const C={bg:'#0a0a0f',bg2:'#0d1117',card:'#161b22',card2:'#1c2128',border:'#21262d',border2:'#30363d',text:'#e8e8f0',text2:'#c9d1d9',muted:'#8b949e',blue:'#58a6ff',green:'#3fb950',orange:'#f0883e',red:'#f85149',purple:'#8b5cf6',pink:'#ec4899',yellow:'#f59e0b'}
export const CAT_COLOR={'Marketing Work':'#ec4899','Production Work':'#8b5cf6','Admin Work':'#3b82f6','Other':'#6b7280'}
export const SUB_COLOR={'Social Media':'#E1306C','WhatsApp':'#25D366','Email':'#f0883e','Promotion Design':'#8b5cf6','Video Editing':'#f97316','Graphic Design':'#ec4899','Website Update':'#3b82f6','Financial Work':'#10b981','Other':'#6b7280','Data Entry':'#58a6ff','Email Management':'#f59e0b','Reporting':'#3fb950','General':'#8b949e','Meeting':'#a78bfa','Research':'#34d399'}
export const PRI_COLOR={High:'#ef4444',Medium:'#f59e0b',Low:'#22c55e'}
export const TASK_CATS={'Marketing Work':['Social Media','WhatsApp','Email','Other'],'Production Work':['Promotion Design','Video Editing','Graphic Design','Website Update','Financial Work','Other'],'Admin Work':['Data Entry','Email Management','Reporting','Other'],'Other':['General','Meeting','Research','Other']}
export const today=()=>new Date().toLocaleDateString()
export const fmtDur=secs=>{const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;return h?`${h}h ${m}m`:m?`${m}m ${s}s`:`${s}s`}
export const fmtTime=ts=>ts?new Date(typeof ts==='object'?ts.toDate?.()??ts:ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'
export const fmtDate=ts=>ts?new Date(typeof ts==='object'?ts.toDate?.()??ts:ts).toLocaleDateString():'—'
export const S={
  card:{background:'#161b22',border:'1px solid #21262d',borderRadius:12,padding:20,marginBottom:16},
  cardTitle:{fontSize:11,color:'#8b949e',marginBottom:14,textTransform:'uppercase',letterSpacing:'0.09em',fontWeight:700},
  input:{background:'#0d1117',border:'1px solid #30363d',borderRadius:8,padding:'10px 14px',color:'#e8e8f0',fontSize:13,fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'},
  select:{background:'#0d1117',border:'1px solid #30363d',borderRadius:8,padding:'10px 14px',color:'#e8e8f0',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'},
  btn:(c='#238636')=>({background:c,border:'none',borderRadius:8,padding:'10px 18px',color:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}),
  btnSm:{background:'none',border:'1px solid #30363d',borderRadius:6,padding:'5px 10px',color:'#8b949e',cursor:'pointer',fontSize:11,fontFamily:'inherit'},
  grid:n=>({display:'grid',gridTemplateColumns:`repeat(${n},1fr)`,gap:16}),
  badge:c=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:c+'22',color:c,border:`1px solid ${c}44`}),
  row:{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid #21262d',flexWrap:'wrap'},
  kpi:c=>({background:'#161b22',border:`1px solid ${c}33`,borderRadius:12,padding:20,position:'relative',overflow:'hidden'}),
  bar:{height:7,background:'#21262d',borderRadius:4,overflow:'hidden'},
  fill:(pct,c='#58a6ff')=>({height:'100%',width:`${Math.min(pct,100)}%`,background:c,borderRadius:4,transition:'width .5s'}),
  banner:{background:'linear-gradient(135deg,#1a2332,#0f2027)',border:'1px solid #58a6ff44',borderRadius:12,padding:28,textAlign:'center',marginBottom:16},
  bigTimer:{fontSize:52,fontWeight:700,color:'#58a6ff',letterSpacing:'0.06em',lineHeight:1},
  label:{fontSize:11,color:'#8b949e',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'},
  tabBar:{display:'flex',gap:0,marginBottom:16,borderBottom:'1px solid #21262d'},
  tabBtn:a=>({padding:'9px 16px',background:'none',border:'none',borderBottom:a?'2px solid #58a6ff':'2px solid transparent',color:a?'#58a6ff':'#8b949e',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:a?700:400}),
}
