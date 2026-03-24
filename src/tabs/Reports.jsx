import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend, PieChart, Pie } from 'recharts'
import { S, C, CAT_COLOR, fmtDur, fmtTime, today } from './shared'

const TT = { background:'#13151c', border:'1px solid #1e2130', borderRadius:8, fontFamily:'inherit', fontSize:12 }
const PERIODS = ['Daily','Weekly','Monthly']
const CATS = ['All','Marketing Work','Production Work','Admin Work','Other']

export default function Reports({ uid, tasks, timeLogs, distracts }) {
  const [period, setPeriod] = useState('Daily')
  const [catFilter, setCatFilter] = useState('All')
  const tod = today()

  // Filter by period
  const filterByPeriod = (logs) => {
    const now = new Date()
    return logs.filter(l => {
      const d = new Date(l.date?.split('/').reverse().join('-') || l.date)
      if (period === 'Daily')   return l.date === tod
      if (period === 'Weekly')  return (now - d) / 86400000 <= 7
      if (period === 'Monthly') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()
      return true
    })
  }

  const filteredLogs  = filterByPeriod(timeLogs).filter(l => catFilter==='All' || l.category===catFilter)
  const filteredTasks = filterByPeriod(tasks.map(t=>({...t,date:t.date}))).filter(t => catFilter==='All' || t.category===catFilter)

  const totalSecs  = filteredLogs.reduce((a,b) => a+(b.duration||0), 0)
  const doneTasks  = filteredTasks.filter(t => t.status==='Completed').length
  const distractT  = filterByPeriod(distracts).reduce((a,b) => a+(b.duration||0)*60, 0)
  const prodPct    = filteredTasks.length ? Math.round(doneTasks/filteredTasks.length*100) : 0

  // Bar chart — daily breakdown for weekly/monthly
  const getDailyData = () => {
    const days = period==='Monthly' ? 30 : 7
    return Array.from({length:days}).map((_,i) => {
      const d = new Date(); d.setDate(d.getDate()-i)
      const ds = d.toLocaleDateString()
      const secs = timeLogs.filter(l=>l.date===ds&&(catFilter==='All'||l.category===catFilter)).reduce((a,b)=>a+(b.duration||0),0)
      return { day: d.toLocaleDateString([],{month:'short',day:'numeric'}), hours: +(secs/3600).toFixed(1) }
    }).reverse()
  }

  // Category breakdown for period
  const catBreakdown = ['Marketing Work','Production Work','Admin Work','Other'].map(cat => ({
    name: cat.replace(' Work',''),
    minutes: Math.floor(filteredLogs.filter(l=>l.category===cat).reduce((a,b)=>a+(b.duration||0),0)/60),
    color: CAT_COLOR[cat]||C.muted,
  })).filter(d=>d.minutes>0)

  // Sub-type breakdown
  const subBreakdown = {}
  filteredLogs.forEach(l => { if(l.subType) subBreakdown[l.subType]=(subBreakdown[l.subType]||0)+(l.duration||0) })
  const subChart = Object.entries(subBreakdown).map(([name,secs])=>({name,minutes:Math.floor(secs/60)})).sort((a,b)=>b.minutes-a.minutes).slice(0,10)

  const exportCSV = () => {
    const rows = [['Date','Task','Category','SubType','Duration(min)','Start','End']]
    filteredLogs.forEach(l => rows.push([l.date,l.taskName,l.category||'',l.subType||'',Math.floor((l.duration||0)/60),fmtTime(l.start),fmtTime(l.end)]))
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'))
    a.download = `oliveseeds_${period.toLowerCase()}_report.csv`; a.click()
  }

  return (
    <div>
      {/* Filters */}
      <div style={{...S.card,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:16}}>
        <div style={{display:'flex',gap:4}}>
          {PERIODS.map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              style={{padding:'8px 18px',background:period===p?C.blue:'none',border:`1px solid ${period===p?C.blue:C.border2}`,borderRadius:8,color:period===p?'#fff':C.muted,cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
              {p}
            </button>
          ))}
        </div>
        <select style={{...S.select,minWidth:160}} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <button style={{...S.btn(C.green),marginLeft:'auto'}} onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {/* KPIs */}
      <div style={S.grid(4)}>
        {[{label:'Total Work Time',val:fmtDur(totalSecs),c:C.blue},{label:'Tasks Completed',val:`${doneTasks}/${filteredTasks.length}`,c:C.green},{label:'Productivity',val:prodPct+'%',c:C.orange},{label:'Time Lost',val:fmtDur(distractT),c:C.red}].map(k=>(
          <div key={k.label} style={S.kpi(k.c)}>
            <div style={{position:'absolute',top:0,right:0,width:46,height:46,background:k.c+'12',borderRadius:'0 14px 0 46px'}}/>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:k.c}}>{k.val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{period}</div>
          </div>
        ))}
      </div>

      {/* Daily/weekly line */}
      {period !== 'Daily' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>📈 {period} Work Hours Trend</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={getDailyData()} margin={{top:4,right:8,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="day" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TT}/>
              <Line type="monotone" dataKey="hours" stroke={C.blue} strokeWidth={2} dot={{fill:C.blue,r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={S.grid(2)}>
        {/* Category bar */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📊 Time by Category (minutes)</div>
          {catBreakdown.length===0?<div style={{color:C.muted,fontSize:13,padding:'20px 0',textAlign:'center'}}>No data for this period.</div>:
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={catBreakdown} margin={{top:4,right:8,bottom:0,left:-20}}>
                <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="minutes" radius={[6,6,0,0]}>{catBreakdown.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        </div>

        {/* Sub-type bar */}
        <div style={S.card}>
          <div style={S.sectionTitle}>🔍 Time by Task Type (minutes)</div>
          {subChart.length===0?<div style={{color:C.muted,fontSize:13,padding:'20px 0',textAlign:'center'}}>No data for this period.</div>:
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={subChart} layout="vertical" margin={{top:4,right:20,bottom:0,left:110}}>
                <XAxis type="number" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={106}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="minutes" fill={C.purple} radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Log table */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Time Log — {period} ({filteredLogs.length} sessions)</div>
        {filteredLogs.length===0?<div style={{color:C.muted,fontSize:13}}>No logs for this period.</div>:
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr>{['Date','Task','Category','Type','Duration','Start','End'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0,50).map(l=>(
                  <tr key={l.id} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'9px 10px',color:C.muted,fontSize:12}}>{l.date}</td>
                    <td style={{padding:'9px 10px'}}>{l.taskName}</td>
                    <td style={{padding:'9px 10px'}}><span style={S.badge(CAT_COLOR[l.category]||C.muted)}>{(l.category||'').replace(' Work','')}</span></td>
                    <td style={{padding:'9px 10px',color:C.muted,fontSize:12}}>{l.subType||'—'}</td>
                    <td style={{padding:'9px 10px',color:C.green,fontWeight:600}}>{fmtDur(l.duration||0)}</td>
                    <td style={{padding:'9px 10px',color:C.muted,fontSize:12}}>{fmtTime(l.start)}</td>
                    <td style={{padding:'9px 10px',color:C.muted,fontSize:12}}>{fmtTime(l.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Distraction log */}
      {distracts.length>0&&(
        <div style={S.card}>
          <div style={S.sectionTitle}>⚠️ Distraction Log</div>
          {filterByPeriod(distracts).slice(0,20).map(d=>(
            <div key={d.id} style={S.row}>
              <span style={{fontSize:11,color:C.muted,minWidth:76}}>{d.date}</span>
              <span style={{flex:1,fontSize:13}}>{d.type}</span>
              <span style={S.badge(C.red)}>{d.duration} min lost</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
