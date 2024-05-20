const express = require('express');
const path = require('path');
const { admin, db } = require('./firebase'); // Import Firebase Admin SDK
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

app.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  });
});

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

    // Log the user in immediately after registration
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    res.status(200).json({ message: 'User registered', customToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Middleware to verify Firebase ID Token
const authenticate = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    console.log('No ID token provided');
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    //console.log('User authenticated:', decodedToken); // Log user info
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log('Error verifying ID token:', error); // Log token verification error
    return res.status(401).send('Unauthorized');
  }
};

// High score routes
app.post('/highscore', authenticate, async (req, res) => {
  const { game, score } = req.body;
  //('Incoming request data:', req.body); // Log request data

  try {
    await db.collection('highscores').add({
      userId: req.user.uid,
      game,
      score,
      username: req.user.name || 'Anonymous',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    //console.log('High score saved'); // Log success
    res.send('High score saved');
  } catch (error) {
    console.error('Error saving high score:', error); // Log error
    res.status(400).send(error.message);
  }
});

// Endpoint for fetching general high scores
app.get('/highscores/:game', async (req, res) => {
  const { game } = req.params;
  //console.log(`Fetching high scores for game: ${game}`); // Log game parameter

  try {
    const highScoresSnapshot = await db.collection('highscores')
      .where('game', '==', game)
      .orderBy('score', 'desc')
      .get();

    const highScores = highScoresSnapshot.docs.map(doc => doc.data());
    //console.log('Fetched high scores:', highScores); // Log fetched high scores
    res.json(highScores);
  } catch (error) {
    console.error('Error fetching high scores:', error); // Log error
    res.status(400).send(error.message);
  }
});

// Endpoint for fetching user high scores
app.get('/user-highscores', authenticate, async (req, res) => {
  const { game } = req.query; // Get the game from the query parameter

  try {
      const userHighScoresSnapshot = await db.collection('highscores')
          .where('userId', '==', req.user.uid)
          .where('game', '==', game) // Filter by game
          .orderBy('score', 'desc')
          .get();

      const userHighScores = userHighScoresSnapshot.docs.map(doc => doc.data());
      res.json(userHighScores);
  } catch (error) {
      res.status(400).send(error.message);
  }
});





// Serve games from their specific directories under the 'games' folder
app.use('/Colors', express.static(path.join(__dirname, 'Games/Colors')));
app.use('/Echo', express.static(path.join(__dirname, 'Games/Echo')));
app.use('/Meteor', express.static(path.join(__dirname, 'Games/Meteor')));
app.use('/SpaceDefender', express.static(path.join(__dirname, 'Games/SpaceDefender')));

// Root route serves the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Listen on the configured port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
