import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAd9_2snywHDgvc5QA3VnYmZ1ZbkjKRwUQ",
  authDomain: "budgee-21e17.firebaseapp.com",
  projectId: "budgee-21e17",
  storageBucket: "budgee-21e17.firebasestorage.app",
  messagingSenderId: "64765552234",
  appId: "1:64765552234:web:71f6b512b620fe58e3cc13"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
