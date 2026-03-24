import React, { useState } from 'react'
import { S, C } from './shared'
import { addSocialUrl, deleteSocialUrl } from '../firebase/firebaseService'

const DEFAULT_PLATFORMS = [
  { name:'Instagram', url:'https://instagram.com',    color:'#E1306C', icon:'📸' },
  { name:'Facebook',  url:'https://facebook.com',     color:'#1877F2', icon:'👥' },
  { name:'LinkedIn',  url:'https://linkedin.com',     color:'#0A66C2', icon:'💼' },
  { name:'WhatsApp',  url:'https://web.whatsapp.com', color:'#25D366', icon:'💬' },
  { name:'YouTube',   url:'https://youtube.com',      color:'#FF0000', icon:'▶️' },
  { name:'Pinterest', url:'https://pinterest.com',    color:'#E60023', icon:'📌' },
  { name:'Twitter/X', url:'https://twitter.com',      color:'#1DA1F2', icon:'🐦' },
]

// Inline confirm — self-contained, dismisses itself after delete
function DeleteBtn({ onDelete }) {
  const [ask,    setAsk]    = useState(false)
  const [busy,   setBusy]   = useState(false)

  if (busy) return <span style={{fontSize:12,color:C.muted}}>Deleting...</span>

  if (!ask) return (
    <button style={{...S.btnDanger,padding:'6px 10px'}} onClick={()=>setAsk(true)}>🗑️</button>
  )

  return (
    <div style={{display:'flex',gap:6,alignItems:'center',background:'#fff1f2',border:'1px solid #fca5a5',borderRadius:8,padding:'4px 8px'}}>
      <span style={{fontSize:12,color:'#ef4444',fontWeight:600}}>Delete?</span>
      <button onClick={async()=>{ setBusy(true); await onDelete() }}
        style={{background:'#ef4444',border:'none',borderRadius:6,padding:'3px 10px',color:'#fff',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:700}}>
        Yes
      </button>
      <button onClick={()=>setAsk(false)}
        style={{background:'none',border:'1px solid #fca5a5',borderRadius:6,padding:'3px 8px',color:'#ef4444',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
        No
      </button>
    </div>
  )
}

export default function Marketing({ uid, socialUrls=[] }) {
  const [newUrl, setNewUrl] = useState({ name:'', url:'' })
  const [adding, setAdding] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleAdd = async () => {
    if (!newUrl.name.trim() || !newUrl.url.trim()) return
    let url = newUrl.url.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    await addSocialUrl(uid, { name:newUrl.name.trim(), url })
    setNewUrl({ name:'', url:'' })
    setAdding(false)
    setSaved(true)
    setTimeout(()=>setSaved(false), 3000)
  }

  // Delete and automatically dismiss — no stuck popup
  const handleDelete = async (id) => {
    await deleteSocialUrl(uid, id)
    // Firebase realtime will remove it from socialUrls immediately
  }

  return (
    <div>
      {/* Side by side: Quick Launch | Custom URLs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>

        {/* Quick Launch */}
        <div style={S.card}>
          <div style={S.sectionTitle}>🚀 Quick Launch</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>One click → new tab → do your task → close it.</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {DEFAULT_PLATFORMS.map(p=>(
              <button key={p.name} onClick={()=>window.open(p.url,'_blank')}
                style={{background:'#fff',border:`1px solid ${p.color}33`,borderRadius:11,padding:'14px 8px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,color:p.color,fontFamily:'inherit',boxShadow:'0 2px 6px rgba(0,0,0,0.05)'}}>
                <span style={{fontSize:22}}>{p.icon}</span>
                <span style={{fontSize:12,fontWeight:600}}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom URLs */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div>
              <div style={S.sectionTitle}>🔗 My Custom URLs</div>
              <div style={{fontSize:12,color:C.muted,marginTop:-8}}>Your specific business pages</div>
            </div>
            <button style={S.btn(C.blue)} onClick={()=>setAdding(v=>!v)}>
              {adding?'✕ Cancel':'+ Add URL'}
            </button>
          </div>

          {adding&&(
            <div style={{background:'#eff6ff',border:`1px solid ${C.blue}33`,borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{marginBottom:8}}>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>Name *</label>
                <input style={S.input} placeholder="e.g. My Facebook Page" value={newUrl.name}
                  onChange={e=>setNewUrl(p=>({...p,name:e.target.value}))} autoFocus/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:4}}>URL *</label>
                <input style={S.input} placeholder="https://facebook.com/yourpage" value={newUrl.url}
                  onChange={e=>setNewUrl(p=>({...p,url:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button style={S.btn(C.green)} onClick={handleAdd}>✓ Save</button>
                <button style={S.btnSm()} onClick={()=>{setAdding(false);setNewUrl({name:'',url:''})}}>Cancel</button>
              </div>
            </div>
          )}

          {saved&&<div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'8px 12px',fontSize:13,color:'#166534',marginBottom:10}}>✅ URL saved!</div>}

          {socialUrls.length===0
            ?<div style={{color:C.muted,fontSize:13,padding:'16px 0',textAlign:'center'}}>No custom URLs yet. Click "+ Add URL".</div>
            :<div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:320,overflowY:'auto'}}>
              {socialUrls.map(u=>(
                <div key={u.id} style={{background:'#f8fafc',border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:16,flexShrink:0}}>🔗</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{u.name}</div>
                    <div style={{fontSize:11,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.url}</div>
                  </div>
                  <button style={{...S.btn(C.blue),padding:'6px 12px',fontSize:12,flexShrink:0}} onClick={()=>window.open(u.url,'_blank')}>Open</button>
                  <DeleteBtn onDelete={()=>handleDelete(u.id)}/>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* SOP */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📋 Marketing SOP</div>
        {['Open platform → execute ONLY the planned task','Post / reply / send DMs — then CLOSE the tab','No scrolling feeds. No reels. Mission only.','Log time as a Marketing task in your tracker'].map((r,i)=>(
          <div key={i} style={{padding:'9px 0',borderBottom:`1px solid ${C.border}`,fontSize:13,display:'flex',gap:10}}>
            <span style={{color:C.pink,flexShrink:0}}>→</span><span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
