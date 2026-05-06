const express = require('express');
const { router } = require('./routes');
const { salespersonRouter } = require('./routes/salesperson.routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const cors = require('cors');

const app = express();


app.use(cors({
  origin: 'https://torchlab.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.options('*', cors());


app.use(express.json());


app.get('/', (req, res) => {
  res.send('API is running 🚀');
});


app.use('/api/salespeople', salespersonRouter);
app.use('/api', router);


app.use(notFound);
app.use(errorHandler);

module.exports = { app };