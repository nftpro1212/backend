const express = require('express');
const router = express.Router();
router.get('/draws', (req,res)=> res.json([]));
module.exports = router;
