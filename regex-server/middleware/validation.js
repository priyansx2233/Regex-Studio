exports.validateRegexInput =
(req, res, next) => {

  const { pattern, text } = req.body;

  if (!pattern) {
    return res.status(400).json({
      error: "Pattern required"
    });
  }

  if (text.length > 1024 * 1024) {
    return res.status(400).json({
      error: "Text too large"
    });
  }

  next();
};