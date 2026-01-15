import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// 🔹 Firestore (Project A)
const firestoreSA = require("./firestore-beehive.json");

// 🔹 Storage (Project B)
const storageSA = require("./firebase-admin.json");

// App Firestore
const firestoreApp = admin.initializeApp(
  {
    credential: admin.credential.cert(firestoreSA),
  },
  "firestoreApp"
);

// App Storage
const storageApp = admin.initializeApp(
  {
    credential: admin.credential.cert(storageSA),
    storageBucket: "beevraapp.firebasestorage.app",
  },
  "storageApp"
);

export const db = firestoreApp.firestore();
export const bucket = storageApp.storage().bucket();

// import admin from "firebase-admin";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// const serviceAccount = require("./firestore-beehive.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const db = admin.firestore();
// export default db;
