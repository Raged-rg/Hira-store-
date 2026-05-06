import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPEiHvUDZWwxQwjHNkT2M4F2vvcUx8lb4",
    authDomain: "hira-2002.firebaseapp.com",
    projectId: "hira-2002",
    storageBucket: "hira-2002.firebasestorage.app",
    messagingSenderId: "644691804373",
    appId: "1:644691804373:web:021aab40ba0c993ae1225c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc };
