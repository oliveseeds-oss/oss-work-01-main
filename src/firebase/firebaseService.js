// src/firebase/firebaseService.js
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const col = (uid, name) => collection(db, 'users', uid, name)
const ref = (uid, name, id) => doc(db, 'users', uid, name, id)

// Use ISO date YYYY-MM-DD — consistent across timezones and devices
const todayISO = () => new Date().toISOString().slice(0, 10)

// ── TASKS ────────────────────────────────────────────────────
export const listenTasks  = (uid,cb) => onSnapshot(query(col(uid,'tasks'),    orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addTask      = (uid,d)  => addDoc(col(uid,'tasks'),    {...d, status:'Pending', createdAt:serverTimestamp(), date:todayISO()})
export const updateTask   = (uid,id,d)=>updateDoc(ref(uid,'tasks',id), d)
export const deleteTask   = (uid,id) => deleteDoc(ref(uid,'tasks',id))

// ── TIME LOGS ────────────────────────────────────────────────
export const listenTimeLogs = (uid,cb) => onSnapshot(query(col(uid,'timeLogs'), orderBy('start','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addTimeLog     = (uid,d)  => addDoc(col(uid,'timeLogs'), {...d, createdAt:serverTimestamp()})

// ── CLIENTS ──────────────────────────────────────────────────
export const listenClients  = (uid,cb) => onSnapshot(query(col(uid,'clients'),  orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addClient      = (uid,d)  => addDoc(col(uid,'clients'),  {...d, createdAt:serverTimestamp()})
export const updateClient   = (uid,id,d)=>updateDoc(ref(uid,'clients',id), d)
export const deleteClient   = (uid,id) => deleteDoc(ref(uid,'clients',id))

// ── CAMPAIGNS ────────────────────────────────────────────────
export const listenCampaigns  = (uid,cb) => onSnapshot(query(col(uid,'campaigns'), orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addCampaign      = (uid,d)  => addDoc(col(uid,'campaigns'), {...d, createdAt:serverTimestamp()})
export const updateCampaign   = (uid,id,d)=>updateDoc(ref(uid,'campaigns',id), d)
export const deleteCampaign   = (uid,id) => deleteDoc(ref(uid,'campaigns',id))

// ── DISTRACTIONS ─────────────────────────────────────────────
export const listenDistractions = (uid,cb) => onSnapshot(query(col(uid,'distractions'), orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addDistraction     = (uid,d)  => addDoc(col(uid,'distractions'), {...d, date:todayISO(), createdAt:serverTimestamp()})

// ── REVIEWS ──────────────────────────────────────────────────
export const listenReviews  = (uid,cb) => onSnapshot(query(col(uid,'reviews'),  orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const saveReview     = (uid,d)  => addDoc(col(uid,'reviews'),  {...d, date:todayISO(), createdAt:serverTimestamp()})

// ── EMAILS ───────────────────────────────────────────────────
export const listenEmails   = (uid,cb) => onSnapshot(query(col(uid,'emails'),   orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addEmail       = (uid,d)  => addDoc(col(uid,'emails'),   {...d, createdAt:serverTimestamp()})
export const updateEmail    = (uid,id,d)=>updateDoc(ref(uid,'emails',id), d)
export const deleteEmail    = (uid,id) => deleteDoc(ref(uid,'emails',id))

// ── WHATSAPP ─────────────────────────────────────────────────
export const listenWhatsapp = (uid,cb) => onSnapshot(query(col(uid,'whatsapp'), orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addWhatsapp    = (uid,d)  => addDoc(col(uid,'whatsapp'), {...d, createdAt:serverTimestamp()})
export const updateWhatsapp = (uid,id,d)=>updateDoc(ref(uid,'whatsapp',id), d)
export const deleteWhatsapp = (uid,id) => deleteDoc(ref(uid,'whatsapp',id))

// ── META CAMPAIGNS ───────────────────────────────────────────
export const listenMeta     = (uid,cb) => onSnapshot(query(col(uid,'meta'),     orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addMeta        = (uid,d)  => addDoc(col(uid,'meta'),     {...d, createdAt:serverTimestamp()})
export const updateMeta     = (uid,id,d)=>updateDoc(ref(uid,'meta',id), d)
export const deleteMeta     = (uid,id) => deleteDoc(ref(uid,'meta',id))

// ── SOCIAL URLS ──────────────────────────────────────────────
export const listenSocialUrls = (uid,cb) => onSnapshot(query(col(uid,'socialUrls'), orderBy('createdAt','desc')), s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))
export const addSocialUrl     = (uid,d)  => addDoc(col(uid,'socialUrls'), {...d, createdAt:serverTimestamp()})
export const deleteSocialUrl  = (uid,id) => deleteDoc(ref(uid,'socialUrls',id))

// ── BULK CSV ─────────────────────────────────────────────────
export const bulkAddDocs = async (uid, colName, rows) => {
  // Firebase batch limit is 500 — split into chunks
  const CHUNK = 400
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = writeBatch(db)
    rows.slice(i, i+CHUNK).forEach(row => {
      const r = doc(col(uid, colName))
      batch.set(r, { ...row, createdAt: serverTimestamp() })
    })
    await batch.commit()
  }
}
