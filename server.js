const express = require("express");
const cors = require("cors");

const regexRoutes = require("./routes/regex");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/regex", regexRoutes);

app.listen(3000,()=>{
    console.log("http://localhost:3000")
})