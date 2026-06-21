const express = require("express");
const router = express.Router();

const {
  executeRegex
} = require("../controllers/regexController");

router.post("/test", executeRegex);

module.exports = router;