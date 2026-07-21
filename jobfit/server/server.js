const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "JobFit API Running", version: "1.0.0" });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 JobFit Server on port ${PORT}`));
});