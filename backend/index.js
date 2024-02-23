const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes/router');
const mongoose = require('mongoose');
require('dotenv/config');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const corsOptions = {
  origin: 'https://frontend-delta-six-53.vercel.app', 
  credentials: true,
  methods: ["POST","GET","DELETE"],
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use('/', router);

const dbOptions = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose
  .connect(process.env.DB_URI, dbOptions)
  .then(() => console.log('DB Connected!'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Stop the server on database connection error
  });

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Generic error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Gracefully handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
