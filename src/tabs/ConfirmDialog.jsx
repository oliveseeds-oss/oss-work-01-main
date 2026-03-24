// src/tabs/ConfirmDialog.jsx
import React from 'react'

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel='Delete', confirmColor='#ef4444' }) {
  if (!isOpen) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div style={{
        background:'#fff', borderRadius:18, padding:32, maxWidth:400, width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', animation:'popIn .18s ease',
      }}>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:12 }}>🗑️</div>
        <div style={{ fontSize:17, fontWeight:700, color:'#1e293b', textAlign:'center', marginBottom:8 }}>
          {title || 'Confirm Delete'}
        </div>
        <div style={{ fontSize:13, color:'#64748b', textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
          {message || 'Are you sure you want to delete this? This action cannot be undone.'}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={onCancel}
            style={{ flex:1, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'11px', color:'#64748b', cursor:'pointer', fontSize:14, fontFamily:'inherit', fontWeight:600 }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, background:confirmColor, border:'none', borderRadius:9, padding:'11px', color:'#fff', cursor:'pointer', fontSize:14, fontFamily:'inherit', fontWeight:700, boxShadow:`0 2px 10px ${confirmColor}55` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}
