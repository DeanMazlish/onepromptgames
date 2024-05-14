const express = require('express');
const path = require('path');
const { admin, db } = require('./firebase'); // Admin SDK import
const firebase = require('firebase/app'); // Import Firebase App
require('firebase/auth'); // Import Firebase Auth
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Register route
app.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });
    await db.collection('users').doc(userRecord.uid).set({
      username,
      email
    });
    res.send('User registered');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await firebase.auth().signInWithEmailAndPassword(email, password);
    const idToken = await user.user.getIdToken();
    res.json({ idToken });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Middleware to verify Firebase ID Token
const authenticate = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).send('Unauthorized');

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('Unauthorized');
  }
};

// High score routes
app.post('/highscore', authenticate, async (req, res) => {
  const { game, score } = req.body;
  try {
    await db.collection('highscores').add({
      userId: req.user.uid,
      game,
      score,
      username: req.user.name || 'Anonymous',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.send('High score saved');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/highscores/:game', async (req, res) => {
  const { game } = req.params;
  try {
    const highScoresSnapshot = await db.collection('highscores')
      .where('game', '==', game)
      .orderBy('score', 'desc')
      .limit(10)
      .get();

    const highScores = highScoresSnapshot.docs.map(doc => doc.data());
    res.json(highScores);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Serve games from their specific directories under the 'games' folder
app.use('/Colors', express.static(path.join(__dirname, 'Games/Colors')));
app.use('/Echo', express.static(path.join(__dirname, 'Games/Echo')));
app.use('/Meteor', express.static(path.join(__dirname, 'Games/Meteor')));
app.use('/Rocket', express.static(path.join(__dirname, 'Games/Rocket')));

// Root route serves the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Listen on the configured port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
