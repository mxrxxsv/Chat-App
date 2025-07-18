const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Signup Route
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ msg: "Username taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });

    res.status(201).json({ msg: "User created" });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 86400000,
    });

    res.json({ user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get Current User
router.get("/me", authenticate, (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username } });
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ msg: "Logged out" });
});

module.exports = router;
