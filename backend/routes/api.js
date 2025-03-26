const express = require('express');
const router = express.Router();
const { generateRandomDataset } = require('../dataGenerator');

router.get('/dataset', (req, res) => {
  const dataset = generateRandomDataset();
  res.json(dataset);
});

module.exports = router;