// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, getDoc, query, where } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgRMFGMhKWGT__r51fzNeiwdvlcAcIYZs",
  authDomain: "blockchain-web-27c09.firebaseapp.com",
  databaseURL: "https://blockchain-web-27c09-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "blockchain-web-27c09",
  storageBucket: "blockchain-web-27c09.firebasestorage.app",
  messagingSenderId: "527520522271",
  appId: "1:527520522271:web:896250911821f03e29b52a",
  measurementId: "G-VCXSDBRDPN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  app,
  analytics,
  db,
  auth,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail
};
