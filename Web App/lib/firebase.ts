import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCjVngsN-2zTMhzG_L3vstc-sWuSVaajeY",
  authDomain: "ag-hackathon.firebaseapp.com",
  databaseURL: "https://ag-hackathon-default-rtdb.firebaseio.com", // Add this for Realtime Database
  projectId: "ag-hackathon",
  storageBucket: "ag-hackathon.firebasestorage.app",
  messagingSenderId: "391075985944",
  appId: "1:391075985944:web:a0c6034b0fb7a5876e616d",
  measurementId: "G-GY4NSJLR9V",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null
