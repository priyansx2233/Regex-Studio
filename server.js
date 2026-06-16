const express = require("express");
const cors = require("cors");

const regexRoutes = require("./routes/regex");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/regex", regexRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});