import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
//  STEP: Paste your Firebase config here (see setup guide)
//  Get it from: Firebase Console → Project Settings → Your Apps
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {

  apiKey: "AIzaSyA2zLUCSrVgAFnvxFjocfEADRSrmq2SfIU",

  authDomain: "knb-bioenergy.firebaseapp.com",

  projectId: "knb-bioenergy",

  storageBucket: "knb-bioenergy.firebasestorage.app",

  messagingSenderId: "1040465583384",

  appId: "1:1040465583384:web:438e0d68de71eaa6b1526d",

  measurementId: "G-GP6K9RMQGQ"

};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
