const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve games from their specific directories under the 'games' folder
app.use('/Color', express.static(path.join(__dirname, 'games/Color')));
app.use('/Echo', express.static(path.join(__dirname, 'games/Echo')));
app.use('/Meteor', express.static(path.join(__dirname, 'games/Meteor')));


// Root route serves the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Additional routes for each game
app.get('/Color', (req, res) => {
  res.sendFile(path.join(__dirname, 'games/Color/index.html'));
});

app.get('/Echo', (req, res) => {
  res.sendFile(path.join(__dirname, 'games/Echo/index.html'));
});

app.get('/Meteor', (req, res) => {
  res.sendFile(path.join(__dirname, 'games/Meteor/index.html'));
});


// Listen on the configured port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});