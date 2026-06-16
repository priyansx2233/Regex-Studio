const { runRegex } = require("../services/regexService");

exports.executeRegex = (req, res) => {
  try {
    const result = runRegex(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
};