import React, { useState } from 'react'
import { S, C } from './shared'
import {
  addEmail, updateEmail, deleteEmail,
  addWhatsapp, updateWhatsapp, deleteWhatsapp,
  addMeta, updateMeta, deleteMeta,
  addClient, updateClient, deleteClient,
  bulkAddDocs,
} from '../firebase/firebaseService'

const ADMIN_TABS = ['Emails','WhatsApp','Meta Campaigns','Clients']

// ── DELETE CONFIRM MODAL ─────────────────────────────────────
function DeleteModal({ label, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ background:'#fff',borderRadius:16,padding:28,maxWidth:360,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',textAlign:'center' }}>
        <div style={{ fontSize:32,marginBottom:10 }}>🗑️</div>
        <div style={{ fontSize:15,fontWeight:700,color:'#1e293b',marginBottom:6 }}>Delete Record?</div>
        <div style={{ fontSize:13,color:'#64748b',marginBottom:20,lineHeight:1.5 }}>{label}</div>
        <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
          <button onClick={onCancel} style={{ flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px',color:'#64748b',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1,background:'#ef4444',border:'none',borderRadius:8,padding:'10px',color:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:700 }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── CSV PARSER — robust, handles quotes, semicolons, BOM ────
function parseCSV(text) {
  // Remove BOM if present
  text = text.replace(/^\uFEFF/, '')
  // Detect delimiter (comma or semicolon)
  const firstLine = text.split(/\r?\n/)[0]
  const delim = (firstLine.match(/;/g)||[]).length > (firstLine.match(/,/g)||[]).length ? ';' : ','

  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const parseRow = line => {
    const vals = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === delim && !inQ) {
        vals.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    vals.push(cur.trim())
    return vals
  }

  const rawHeaders = parseRow(lines[0])
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g,'').trim())

  return lines.slice(1).map(line => {
    if (!line.trim()) return null
    const vals = parseRow(line)
    const obj = {}
    headers.forEach((h, i) => {
      // Store both normalized and original key for flexible matching
      obj[h] = (vals[i] !== undefined ? vals[i] : '').trim()
    })
    return obj
  }).filter(Boolean).filter(r => Object.values(r).some(v => v && v.trim()))
}

// ── CSV UPLOAD ────────────────────────────────────────────────
function CSVUpload({ uid, colName, colMap, label }) {
  const [msg, setMsg] = useState('')
  const [ok,  setOk]  = useState(false)

  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setMsg('Reading...')
    const text = await file.text()
    const raw  = parseCSV(text)
    if (!raw.length) { setMsg('❌ No valid rows found. Check your CSV format.'); return }

    // Map CSV columns → Firebase fields using colMap
    const rows = raw.map(r => {
      const mapped = {}
      Object.entries(colMap).forEach(([fbKey, csvKeys]) => {
        for (const k of csvKeys) {
          const norm = k.toLowerCase().replace(/[^a-z0-9]/g,'')
          if (r[norm] !== undefined && r[norm] !== '') { mapped[fbKey] = r[norm]; break }
        }
        if (!mapped[fbKey]) mapped[fbKey] = ''
      })
      return mapped
    })

    try {
      await bulkAddDocs(uid, colName, rows)
      setMsg(`✅ ${rows.length} records imported!`)
      setOk(true)
      e.target.value = ''
    } catch(err) {
      setMsg('❌ Upload failed: ' + err.message)
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:14, padding:'10px 14px', background:'#f0fdf4', border:`1px solid ${C.green}33`, borderRadius:9 }}>
      <label style={{ ...S.btn('#6366f1'), cursor:'pointer', display:'inline-block', fontSize:12 }}>
        ⬆ Upload CSV
        <input type="file" accept=".csv" style={{ display:'none' }} onChange={handleFile}/>
      </label>
      <span style={{ fontSize:11, color:C.muted }}>Expected columns: <strong>{label}</strong></span>
      {msg && <span style={{ fontSize:12, color:ok?C.green:C.red, fontWeight:600 }}>{msg}</span>}
    </div>
  )
}

// ── DATA TABLE ────────────────────────────────────────────────
function DataTable({ cols, rows, onEdit, onDelete, filterKey }) {
  const [search,    setSearch]    = useState('')
  const [filterVal, setFilterVal] = useState('All')
  const [confirmId, setConfirmId] = useState(null)

  const filterOptions = filterKey ? ['All', ...new Set(rows.map(r=>r[filterKey]).filter(Boolean))] : []
  const filtered = rows.filter(r => {
    const ms = Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase())
    const mf = !filterKey || filterVal==='All' || r[filterKey]===filterVal
    return ms && mf
  })

  const exportCSV = () => {
    const hdr  = cols.map(c=>c.label).join(',')
    const body = filtered.map(r => cols.map(c=>`"${(r[c.key]||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const a    = document.createElement('a')
    a.href     = 'data:text/csv,' + encodeURIComponent(hdr+'\n'+body)
    a.download = 'export.csv'; a.click()
  }

  const confirmRow = rows.find(r => r.id === confirmId)

  return (
    <div>
      {confirmId && confirmRow && (
        <DeleteModal
          label={`Delete "${Object.values(confirmRow).filter(v=>typeof v==='string'&&v)[0]||'this record'}"? This cannot be undone.`}
          onConfirm={()=>{ onDelete(confirmId); setConfirmId(null) }}
          onCancel={()=>setConfirmId(null)}/>
      )}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input style={{ ...S.input, flex:1, minWidth:180 }} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {filterKey && (
          <select style={{ ...S.select, minWidth:130 }} value={filterVal} onChange={e=>setFilterVal(e.target.value)}>
            {filterOptions.map(o=><option key={o}>{o}</option>)}
          </select>
        )}
        <button style={S.btn(C.teal)} onClick={exportCSV}>⬇ Export CSV</button>
        <span style={{ fontSize:11, color:C.muted }}>{filtered.length} records</span>
      </div>
      <div style={{ overflowX:'auto', borderRadius:10, border:`1px solid ${C.border}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {cols.map(c=>(
                <th key={c.key} style={{ textAlign:'left', padding:'10px 14px', borderBottom:`1px solid ${C.border}`, fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                  {c.label}
                </th>
              ))}
              <th style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={cols.length+1} style={{ padding:'24px', textAlign:'center', color:C.muted }}>No records found.</td></tr>
              : filtered.map((row,i) => (
                <tr key={row.id} style={{ background:i%2===0?'#fff':'#fafbfc', borderBottom:`1px solid ${C.border}` }}>
                  {cols.map(c=>(
                    <td key={c.key} style={{ padding:'10px 14px', color:C.text, verticalAlign:'middle' }}>
                      {c.render ? c.render(row[c.key], row) : (row[c.key] || '—')}
                    </td>
                  ))}
                  <td style={{ padding:'10px 14px', whiteSpace:'nowrap', textAlign:'right' }}>
                    <button style={{ ...S.btnSm(), marginRight:6 }} onClick={()=>onEdit(row)}>✏️</button>
                    <button style={S.btnDanger} onClick={()=>setConfirmId(row.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── EMAIL SECTION ─────────────────────────────────────────────
function EmailSection({ uid, emails }) {
  const blank  = { email:'', name:'', type:'Local', company:'', status:'Active', notes:'' }
  const [form,   setForm]   = useState(blank)
  const [editId, setEditId] = useState(null)

  const cols = [
    { key:'email',   label:'Email' },
    { key:'name',    label:'Name' },
    { key:'type',    label:'Type',   render:v=><span style={S.badge(v==='Local'?C.blue:C.orange)}>{v||'Local'}</span> },
    { key:'company', label:'Company' },
    { key:'status',  label:'Status', render:v=><span style={S.badge(v==='Active'?C.green:v==='Inactive'?C.red:C.muted)}>{v||'Active'}</span> },
    { key:'notes',   label:'Notes' },
  ]

  const save = async () => {
    if (!form.email.trim()) return
    if (editId) { await updateEmail(uid, editId, form); setEditId(null) }
    else await addEmail(uid, form)
    setForm(blank)
  }
  const edit = row => { setForm({ email:row.email||'', name:row.name||'', type:row.type||'Local', company:row.company||'', status:row.status||'Active', notes:row.notes||'' }); setEditId(row.id) }

  return (
    <div>
      <div style={{ background:editId?'#fffbeb':'#f0fdf4', border:`1px solid ${editId?C.orange:C.green}33`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:editId?C.orange:C.green, fontWeight:700, marginBottom:10 }}>{editId?'✏️ Edit Email':'➕ Add Email'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Email *</label><input style={S.input} placeholder="email@example.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Name</label><input style={S.input} placeholder="Full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Company</label><input style={S.input} placeholder="Company" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/></div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Type</label>
            <select style={{ ...S.select, width:'100%' }} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              <option>Local</option><option>Foreign</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Status</label>
            <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              <option>Active</option><option>Inactive</option><option>Unsubscribed</option><option>Bounced</option>
            </select>
          </div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Notes</label><input style={S.input} placeholder="Notes" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btn(editId?C.orange:C.green)} onClick={save}>{editId?'Update':'+ Add'}</button>
          {editId && <button style={S.btnSm()} onClick={()=>{setEditId(null);setForm(blank)}}>Cancel</button>}
        </div>
      </div>
      <CSVUpload uid={uid} colName="emails"
        colMap={{ email:['email','emailaddress','e-mail'], name:['name','fullname','contactname'], type:['type','emailtype','category'], company:['company','organization','firm'], status:['status','emailstatus'], notes:['notes','note','remarks'] }}
        label="email, name, type, company, status, notes"/>
      <DataTable cols={cols} rows={emails} onEdit={edit} onDelete={id=>deleteEmail(uid,id)} filterKey="type"/>
    </div>
  )
}

// ── WHATSAPP SECTION ──────────────────────────────────────────
function WhatsAppSection({ uid, whatsapp }) {
  const blank  = { phone:'', name:'', type:'Local', company:'', status:'Active', notes:'' }
  const [form,   setForm]   = useState(blank)
  const [editId, setEditId] = useState(null)

  const cols = [
    { key:'phone',   label:'Phone' },
    { key:'name',    label:'Name' },
    { key:'type',    label:'Type',   render:v=><span style={S.badge(v==='Local'?C.blue:C.orange)}>{v||'Local'}</span> },
    { key:'company', label:'Company' },
    { key:'status',  label:'Status', render:v=><span style={S.badge(v==='Active'?C.green:v==='Blocked'?C.red:C.muted)}>{v||'Active'}</span> },
    { key:'notes',   label:'Notes' },
  ]

  const save = async () => {
    if (!form.phone.trim()) return
    if (editId) { await updateWhatsapp(uid, editId, form); setEditId(null) }
    else await addWhatsapp(uid, form)
    setForm(blank)
  }
  const edit = row => { setForm({ phone:row.phone||'', name:row.name||'', type:row.type||'Local', company:row.company||'', status:row.status||'Active', notes:row.notes||'' }); setEditId(row.id) }

  return (
    <div>
      <div style={{ background:editId?'#fffbeb':'#f0fdf4', border:`1px solid ${editId?C.orange:C.green}33`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:editId?C.orange:C.green, fontWeight:700, marginBottom:10 }}>{editId?'✏️ Edit WhatsApp':'➕ Add WhatsApp'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Phone *</label><input style={S.input} placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Name</label><input style={S.input} placeholder="Full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Company</label><input style={S.input} placeholder="Company" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/></div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Type</label>
            <select style={{ ...S.select, width:'100%' }} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              <option>Local</option><option>Foreign</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Status</label>
            <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              <option>Active</option><option>Inactive</option><option>Blocked</option><option>Opted Out</option>
            </select>
          </div>
          <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Notes</label><input style={S.input} placeholder="Notes" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btn(editId?C.orange:C.green)} onClick={save}>{editId?'Update':'+ Add'}</button>
          {editId && <button style={S.btnSm()} onClick={()=>{setEditId(null);setForm(blank)}}>Cancel</button>}
        </div>
      </div>
      <CSVUpload uid={uid} colName="whatsapp"
        colMap={{ phone:['phone','phonenumber','mobile','whatsapp','number'], name:['name','fullname'], type:['type','category'], company:['company','organization'], status:['status'], notes:['notes','note'] }}
        label="phone, name, type, company, status, notes"/>
      <DataTable cols={cols} rows={whatsapp} onEdit={edit} onDelete={id=>deleteWhatsapp(uid,id)} filterKey="type"/>
    </div>
  )
}

// ── META CAMPAIGNS ────────────────────────────────────────────
function MetaSection({ uid, metaCampaigns }) {
  const blank  = { campaignName:'', platform:'Facebook', objective:'', budget:'', spent:'', startDate:'', endDate:'', status:'Active', reach:'', leads:'', notes:'' }
  const [form,   setForm]   = useState(blank)
  const [editId, setEditId] = useState(null)

  const cols = [
    { key:'campaignName', label:'Campaign' },
    { key:'platform',     label:'Platform' },
    { key:'objective',    label:'Objective' },
    { key:'budget',       label:'Budget (₹)' },
    { key:'spent',        label:'Spent (₹)' },
    { key:'reach',        label:'Reach' },
    { key:'leads',        label:'Leads' },
    { key:'startDate',    label:'Start' },
    { key:'endDate',      label:'End' },
    { key:'status',       label:'Status', render:v=><span style={S.badge(v==='Active'?C.green:v==='Paused'?C.orange:C.muted)}>{v||'Active'}</span> },
  ]

  const save = async () => {
    if (!form.campaignName.trim()) return
    if (editId) { await updateMeta(uid, editId, form); setEditId(null) }
    else await addMeta(uid, form)
    setForm(blank)
  }
  const edit = row => { setForm({ campaignName:row.campaignName||'', platform:row.platform||'Facebook', objective:row.objective||'', budget:row.budget||'', spent:row.spent||'', startDate:row.startDate||'', endDate:row.endDate||'', status:row.status||'Active', reach:row.reach||'', leads:row.leads||'', notes:row.notes||'' }); setEditId(row.id) }

  return (
    <div>
      <div style={{ background:editId?'#fffbeb':'#f0fdf4', border:`1px solid ${editId?C.orange:C.green}33`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:editId?C.orange:C.green, fontWeight:700, marginBottom:10 }}>{editId?'✏️ Edit Campaign':'➕ Add Campaign'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
          {[['campaignName','Campaign Name *','text','Campaign name'],['objective','Objective','text','Awareness / Leads'],['budget','Budget (₹)','text','0'],['spent','Spent (₹)','text','0'],['reach','Reach','text','0'],['leads','Leads','text','0']].map(([k,lbl,t,ph])=>(
            <div key={k}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{lbl}</label><input type={t} style={S.input} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Platform</label>
            <select style={{ ...S.select, width:'100%' }} value={form.platform} onChange={e=>setForm(p=>({...p,platform:e.target.value}))}>
              {['Facebook','Instagram','LinkedIn','Google','YouTube'].map(pl=><option key={pl}>{pl}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Status</label>
            <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {['Active','Paused','Completed','Draft'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {[['startDate','Start Date'],['endDate','End Date']].map(([k,lbl])=>(
            <div key={k}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{lbl}</label><input type="date" style={S.input} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btn(editId?C.orange:C.green)} onClick={save}>{editId?'Update':'+ Add'}</button>
          {editId && <button style={S.btnSm()} onClick={()=>{setEditId(null);setForm(blank)}}>Cancel</button>}
        </div>
      </div>
      <CSVUpload uid={uid} colName="meta"
        colMap={{ campaignName:['campaignname','campaign','name','campaignid'], platform:['platform','channel'], objective:['objective','goal'], budget:['budget','totalbudget'], spent:['spent','amountspent'], reach:['reach'], leads:['leads','conversions'], startDate:['startdate','start','from'], endDate:['enddate','end','to'], status:['status'] }}
        label="campaignName, platform, objective, budget, spent, reach, leads, startDate, endDate, status"/>
      <DataTable cols={cols} rows={metaCampaigns} onEdit={edit} onDelete={id=>deleteMeta(uid,id)} filterKey="status"/>
    </div>
  )
}

// ── CLIENTS ───────────────────────────────────────────────────
function ClientsSection({ uid, clients }) {
  const blank  = { name:'', email:'', phone:'', service:'', startDate:'', endDate:'', totalAmount:'', paidAmount:'', status:'Active', notes:'' }
  const [form,   setForm]   = useState(blank)
  const [editId, setEditId] = useState(null)

  const cols = [
    { key:'name',        label:'Client' },
    { key:'email',       label:'Email' },
    { key:'phone',       label:'Phone' },
    { key:'service',     label:'Service' },
    { key:'startDate',   label:'Start' },
    { key:'totalAmount', label:'Total (₹)' },
    { key:'paidAmount',  label:'Paid (₹)' },
    { key:'status',      label:'Status', render:v=><span style={S.badge(v==='Active'?C.green:v==='Pending'?C.orange:v==='Completed'?C.blue:C.muted)}>{v||'Active'}</span> },
    { key:'notes',       label:'Notes' },
  ]

  const total = clients.reduce((a,b)=>a+parseFloat(b.totalAmount||0),0)
  const paid  = clients.reduce((a,b)=>a+parseFloat(b.paidAmount||0),0)

  const save = async () => {
    if (!form.name.trim()) return
    if (editId) { await updateClient(uid, editId, form); setEditId(null) }
    else await addClient(uid, form)
    setForm(blank)
  }
  const edit = row => { setForm({ name:row.name||'', email:row.email||'', phone:row.phone||'', service:row.service||'', startDate:row.startDate||'', endDate:row.endDate||'', totalAmount:row.totalAmount||'', paidAmount:row.paidAmount||'', status:row.status||'Active', notes:row.notes||'' }); setEditId(row.id) }

  return (
    <div>
      <div style={{ ...S.grid(3), marginBottom:16 }}>
        {[{label:'Total Clients',val:clients.length,c:C.blue},{label:'Total Revenue (₹)',val:total.toLocaleString(),c:C.green},{label:'Received (₹)',val:paid.toLocaleString(),c:C.orange}].map(k=>(
          <div key={k.label} style={S.kpi(k.c)}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k.c }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ background:editId?'#fffbeb':'#f0fdf4', border:`1px solid ${editId?C.orange:C.green}33`, borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:editId?C.orange:C.green, fontWeight:700, marginBottom:10 }}>{editId?'✏️ Edit Client':'➕ Add Client'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
          {[['name','Name *','text','Client name'],['email','Email','email','email@example.com'],['phone','Phone','text','Phone'],['service','Service','text','Service type'],['totalAmount','Total (₹)','text','0'],['paidAmount','Paid (₹)','text','0']].map(([k,lbl,t,ph])=>(
            <div key={k}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{lbl}</label><input type={t} style={S.input} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          {[['startDate','Start'],['endDate','End']].map(([k,lbl])=>(
            <div key={k}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{lbl}</label><input type="date" style={S.input} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Status</label>
            <select style={{ ...S.select, width:'100%' }} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {['Active','Pending','Completed','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'span 3' }}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Notes</label>
            <input style={S.input} placeholder="Notes..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btn(editId?C.orange:C.green)} onClick={save}>{editId?'Update':'+ Add Client'}</button>
          {editId && <button style={S.btnSm()} onClick={()=>{setEditId(null);setForm(blank)}}>Cancel</button>}
        </div>
      </div>
      <CSVUpload uid={uid} colName="clients"
        colMap={{ name:['name','clientname','fullname'], email:['email'], phone:['phone','mobile','contact'], service:['service','servicetype'], startDate:['startdate','start','from'], endDate:['enddate','end','to'], totalAmount:['totalamount','total','amount'], paidAmount:['paidamount','paid'], status:['status'], notes:['notes','note'] }}
        label="name, email, phone, service, startDate, endDate, totalAmount, paidAmount, status, notes"/>
      <DataTable cols={cols} rows={clients} onEdit={edit} onDelete={id=>deleteClient(uid,id)} filterKey="status"/>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Admin({ uid, emails=[], whatsapp=[], metaCampaigns=[], clients=[] }) {
  const [active, setActive] = useState('Emails')
  const counts = { Emails:emails.length, WhatsApp:whatsapp.length, 'Meta Campaigns':metaCampaigns.length, Clients:clients.length }
  const icons  = { Emails:'📧', WhatsApp:'💬', 'Meta Campaigns':'📣', Clients:'👤' }

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {ADMIN_TABS.map(t=>(
          <button key={t} onClick={()=>setActive(t)} style={{
            padding:'10px 20px', background:active===t?C.blue:'#fff',
            border:`1px solid ${active===t?C.blue:C.border}`, borderRadius:10,
            color:active===t?'#fff':C.muted, cursor:'pointer', fontSize:13,
            fontFamily:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:8,
            boxShadow:active===t?`0 2px 10px ${C.blue}44`:'0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {icons[t]} {t}
            <span style={{ background:active===t?'rgba(255,255,255,0.25)':C.blue+'18', color:active===t?'#fff':C.blue, borderRadius:20, padding:'1px 8px', fontSize:11, fontWeight:700 }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>
      <div style={S.card}>
        {active==='Emails'         && <EmailSection    uid={uid} emails={emails}/>}
        {active==='WhatsApp'       && <WhatsAppSection uid={uid} whatsapp={whatsapp}/>}
        {active==='Meta Campaigns' && <MetaSection     uid={uid} metaCampaigns={metaCampaigns}/>}
        {active==='Clients'        && <ClientsSection  uid={uid} clients={clients}/>}
      </div>
    </div>
  )
}
