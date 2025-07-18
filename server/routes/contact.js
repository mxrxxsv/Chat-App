const express = require("express");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// ✅ Add contact
router.post("/add", authenticate, async (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ msg: "Contact ID is required" });
  }

  if (contactId === req.user._id.toString()) {
    return res.status(400).json({ msg: "You can't add yourself" });
  }

  try {
    const contactUser = await User.findById(contactId);
    if (!contactUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (req.user.contacts.includes(contactId)) {
      return res.status(400).json({ msg: "User already in contacts" });
    }

    req.user.contacts.push(contactId);
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).populate("contacts", "username");
    res.json({ msg: "Contact added", contacts: updatedUser.contacts });
  } catch (err) {
    console.error("Add contact error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Remove contact
router.delete("/remove/:contactId", authenticate, async (req, res) => {
  const { contactId } = req.params;

  try {
    req.user.contacts = req.user.contacts.filter(
      (id) => id.toString() !== contactId
    );
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).populate("contacts", "username");
    res.json({ msg: "Contact removed", contacts: updatedUser.contacts });
  } catch (err) {
    console.error("Remove contact error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ List current user's contacts with usernames
router.get("/list", authenticate, async (req, res) => {
  try {
    const userWithContacts = await User.findById(req.user._id).populate("contacts", "username");
    res.json({ contacts: userWithContacts.contacts });
  } catch (err) {
    console.error("List contacts error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ List all other users (for adding)
router.get("/others", authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("_id username");
    res.json({ users });
  } catch (err) {
    console.error("List others error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
