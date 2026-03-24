import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

// --- SHARED UTILS & CONSTANTS ---
const C = {
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  text: '#1f2937',
  muted: '#6b7280',
};

const CAT_COLOR = {
  'Marketing Work': '#3b82f6',
  'Production Work': '#8b5cf6',
  'Admin Work': '#f59e0b',
  'Other': '#6b7280',
};

const S = {
  card: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  badge: (bg) => ({ background: `${bg}15`, color: bg, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }),
  btn: (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }),
  btnDanger: { background: 'transparent', color: C.red, border: 'none', cursor: 'pointer', fontSize: 14 },
  input: { padding: '10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, width: '100%' },
  select: { padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' },
  progressWrap: { height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill: (p, bg) => ({ width: `${p}%`, height: '100%', background: bg, transition: 'width 0.3s' }),
  grid: (n) => ({ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 16 }),
};

const today = () => new Date().toISOString().split('T')[0];
const fmtDur = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// --- DATABASE CONFIG ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- COMPONENTS ---
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ ...S.card, width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</div>
        <div style={{ color: C.muted, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btn('#eee'), color: C.text, flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.btn(C.red), flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const CATEGORIES = {
  'Marketing Work':  ['Social Media','WhatsApp','Email','Other'],
  'Production Work': ['Promotion Design','Video Editing','Graphic Design','Website Update','Financial Work','Other'],
  'Admin Work':      ['Planning','Reporting','Client Follow-up','Team Meeting','Other'],
  'Other':           ['General','Research','Learning','Other'],
};
const PRI_CLR = { High: C.red, Medium: C.orange, Low: C.green };

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [form, setForm] = useState({ name: '', category: 'Marketing Work', subType: 'Social Media', priority: 'High', planned: 30 });
  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });
  
  const tod = today();

  // AUTH INIT
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // DATA FETCHING
  useEffect(() => {
    if (!user) return;
    const qTasks = query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'));
    const qLogs = query(collection(db, 'artifacts', appId, 'users', user.uid, 'timelogs'));
    
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setTimeLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    return () => { unsubTasks(); unsubLogs(); };
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.name.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), { 
      ...form, 
      date: tod, 
      status: 'Pending',
      createdAt: Date.now()
    });
    setForm(p => ({ ...p, name: '' }));
  };

  const handleDelete = async () => {
    if (!user || !confirm.id) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', confirm.id));
    setConfirm({ open: false, id: null, name: '' });
  };

  // Mocked actions for demo purposes (usually linked to more complex logic)
  const startTask = (task) => setActiveTask(task);
  const pauseTask = () => setIsPaused(!isPaused);
  const openComplete = () => setActiveTask(null);

  const todayTasks = tasks.filter(t => t.date === tod);
  const oldTasks = tasks.filter(t => t.date !== tod);
  const taskTime = id => timeLogs.filter(l => l.taskId === id).reduce((a, b) => a + (b.duration || 0), 0);

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Connecting...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <ConfirmDialog isOpen={confirm.open} title="Delete Task?"
        message={`Delete "${confirm.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '' })} />

      {/* 1. TOP: Category summary panels (4 mini panels) */}
      <div style={{ ...S.grid(4), marginBottom: 20 }}>
        {Object.entries(CATEGORIES).map(([cat]) => {
          const ct = todayTasks.filter(t => t.category === cat);
          const done = ct.filter(t => t.status === 'Completed').length;
          const secs = timeLogs.filter(l => l.category === cat && l.date === tod).reduce((a, b) => a + (b.duration || 0), 0);
          const col = CAT_COLOR[cat] || C.muted;
          return (
            <div key={cat} style={{ background: '#fff', borderTop: `3px solid ${col}`, borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, color: col, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>{cat.replace(' Work', '')}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{ct.length}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDur(secs)}</div>
              </div>
              <div style={{ marginTop: 8, ...S.progressWrap }}><div style={S.progressFill(ct.length ? done / ct.length * 100 : 0, col)} /></div>
            </div>
          );
        })}
      </div>

      {/* 2. MAIN AREA: 3:1 Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT SIDE (3): Task Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {['High', 'Medium', 'Low'].map(pri => {
            const group = todayTasks.filter(t => t.priority === pri);
            if (!group.length) return null;
            return (
              <div key={pri} style={{ ...S.card, margin: 0 }}>
                <div style={{ ...S.sectionTitle, color: PRI_CLR[pri] }}>● {pri} Priority — {group.length} tasks</div>
                {group.map(task => {
                  const spent = taskTime(task.id);
                  const eff = task.planned && spent > 0 ? Math.round(task.planned * 60 / spent * 100) : null;
                  const isActive = activeTask?.id === task.id;
                  return (
                    <div key={task.id} style={{ ...S.row,
                      background: isActive ? (isPaused ? '#fffbeb' : '#eff6ff') : 'transparent',
                      borderLeft: isActive ? (isPaused ? `3px solid ${C.orange}` : `3px solid ${C.blue}`) : '3px solid transparent',
                      borderRadius: isActive ? 10 : 0,
                      padding: isActive ? '12px 12px 12px 10px' : '10px 0 10px 3px',
                      transition: 'all .15s',
                    }}>
                      <span style={S.badge(CAT_COLOR[task.category] || C.muted)}>{task.category.replace(' Work', '')}</span>
                      <span style={{ flex: 1, fontSize: 13, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? C.muted : C.text }}>{task.name}</span>
                      {spent > 0 && <span style={{ fontSize: 11, color: C.muted }}>{fmtDur(spent)}</span>}
                      {eff && <span style={S.badge(eff >= 80 ? C.green : eff >= 50 ? C.orange : C.red)}>{eff}%</span>}
                      
                      <div style={{ display: 'flex', gap: 6 }}>
                        {task.status === 'Pending' && (
                          <button style={{ ...S.btn(C.green), padding: '6px 12px' }} onClick={() => startTask(task)}>▶ Start</button>
                        )}
                        {task.status === 'Active' && isActive && (
                          <>
                            <button style={{ ...S.btn(isPaused ? C.green : C.orange), padding: '6px 12px' }} onClick={pauseTask}>{isPaused ? '▶' : '⏸'}</button>
                            <button style={{ ...S.btn(C.red), padding: '6px 12px' }} onClick={openComplete}>■</button>
                          </>
                        )}
                        <button style={{ ...S.btnDanger, padding: '6px 10px' }} onClick={() => setConfirm({ open: true, id: task.id, name: task.name })}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {oldTasks.length > 0 && (
            <div style={{ ...S.card, margin: 0 }}>
              <div style={S.sectionTitle}>Recent History ({oldTasks.length})</div>
              {oldTasks.slice(0, 8).map(t => (
                <div key={t.id} style={S.row}>
                  <span style={{ fontSize: 11, color: C.muted, minWidth: 76 }}>{t.date}</span>
                  <span style={S.badge(CAT_COLOR[t.category] || C.muted)}>{(t.category || '').replace(' Work', '')}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.muted }}>{t.name}</span>
                  <button style={{ ...S.btnDanger, padding: '6px 10px' }} onClick={() => setConfirm({ open: true, id: t.id, name: t.name })}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE (1): Add new task panel */}
        <div style={{ ...S.card, margin: 0, position: 'sticky', top: 20 }}>
          <div style={S.sectionTitle}>➕ New Task</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Task Name *</label>
              <textarea 
                style={{ ...S.input, height: 60, resize: 'none' }} 
                placeholder="What needs to be done?" 
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Category</label>
              <select style={{ ...S.select, width: '100%' }} value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {Object.keys(CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Priority & Time</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select style={{ ...S.select, flex: 1 }} value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="number" style={{ ...S.input, width: 60 }} value={form.planned} min={1}
                  onChange={e => setForm(p => ({ ...p, planned: +e.target.value }))} />
              </div>
            </div>
            <button style={{ ...S.btn(C.blue), width: '100%', marginTop: 10 }} onClick={handleAdd}>Add Task</button>
          </div>
        </div>
      </div>
    </div>
  );
}
