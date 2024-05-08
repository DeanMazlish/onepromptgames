const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('Colors'));

app.get('/', (req, res) => {
  res.send('Hello from OnePromptGames!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});