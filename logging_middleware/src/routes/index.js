const express = require('express');
const { Log } = require('../utils/log');

const router = express.Router();

router.get('/', (req, res) => {
  Log("backend", "info", "root", "Root endpoint hit");
  res.send("Hello, Logging Middleware!");
});

router.get('/error', (req, res) => {
  Log("backend", "error", "handler", "received string, expected bool");
  res.status(500).send("An error occurred");
});

module.exports = router;
