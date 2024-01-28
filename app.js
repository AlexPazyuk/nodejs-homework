const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const contactsRouter = require('./routes/api/contacts');
const usersRouter = require('./routes/api/users');




const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';
dotenv.config();

// Mongo Connection
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("Database connection successful");
  app.listen(3000, () => {
    console.log("Server running. Use our API on port: 3000")
});
}).catch((err) => {
  console.log(err);
  process.exit(1);
})

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());


app.use('/api/contacts', contactsRouter);
app.use('/api/users', usersRouter);

// Error handling middleware

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message });
});

module.exports = app;



