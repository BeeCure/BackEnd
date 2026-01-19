import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Service Accounts
const firestoreSA = require("./firestore-beehive.json");
const storageSA = require("./firebase-admin.json");

const firestoreApp =
  admin.apps.find((app) => app.name === "firestoreApp") ??
  admin.initializeApp(
    {
      credential: admin.credential.cert(firestoreSA),
    },
    "firestoreApp",
  );

const storageApp =
  admin.apps.find((app) => app.name === "storageApp") ??
  admin.initializeApp(
    {
      credential: admin.credential.cert(storageSA),
      storageBucket: "beevraapp.firebasestorage.app",
    },
    "storageApp",
  );

export const db = firestoreApp.firestore();
export const bucket = storageApp.storage().bucket();
export { admin };

// import admin from "firebase-admin";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// const serviceAccount = require("./firestore-beehive.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const db = admin.firestore();
// export default db;
