const app = require('./app'); // імпортуємо створений вами файл app.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Mongo Connection
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("Database connection successful");

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running. Use our API on port: ${port}`);
  });
}).catch((err) => {
  console.log(err);
  process.exit(1);
});
