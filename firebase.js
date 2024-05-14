// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Update the path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://onepromptgames.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };