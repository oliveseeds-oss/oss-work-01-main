import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAebpeJM6v7VCrpHj1o16gYwz-CC5ft14Q",
  authDomain: "oss-database-1bc5f.firebaseapp.com",
  projectId: "oss-database-1bc5f",
  storageBucket: "oss-database-1bc5f.firebasestorage.app",
  messagingSenderId: "702944013261",
  appId: "1:702944013261:web:32c6770677541f38cb7284"
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app
 