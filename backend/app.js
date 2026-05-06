const express = require('express');
const { router } = require('./routes');
const { salespersonRouter } = require('./routes/salesperson.routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const cors = require('cors');

const app = express();

app.use(express.json());

// Mounted here (before `/api` router) so `POST /api/salespeople` always resolves reliably.
app.use('/api/salespeople', salespersonRouter);

app.use('/api', router);

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true, 
    })
)

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
