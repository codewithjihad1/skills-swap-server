const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Database Connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Database connected");
}).catch((err) => {
    console.log("Database connection error: ", err);
});

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
