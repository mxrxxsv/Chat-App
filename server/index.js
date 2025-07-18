const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const contactRoutes = require("./routes/contact");
const authRoutes = require("./routes/auth");
const Message = require("./models/Message");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const onlineUsers = new Map(); // socket.id -> { userId, username }

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/contacts", contactRoutes);
app.use("/api/auth", authRoutes);

// GET messages
app.get("/api/messages/:roomId", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("🔌 New Socket Connected:", socket.id);

  // 💡 Register the user once per new connection
  socket.on("register", ({ userId, username }) => {
    if (!userId || !username) return;

    // Only register if not already tracked
    onlineUsers.set(socket.id, { userId, username });
    console.log(`✅ Registered: ${username} (${userId})`);

    // Emit updated list to everyone
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });

  // Join a chat room
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`📥 ${socket.id} joined room ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });

  // Send a message
  socket.on("sendMessage", async ({ text, sender, roomId }) => {
    try {
      const msg = await new Message({ text, sender, room: roomId }).save();
      io.to(roomId).emit("receiveMessage", msg);
    } catch (err) {
      console.error("💥 Send message failed:", err.message);
    }
  });

  // Edit a message
  socket.on("editMessage", async ({ _id, text, roomId }) => {
  try {
    const updated = await Message.findByIdAndUpdate(_id, { text }, { new: true });
    if (updated) {
      io.to(roomId).emit("messageUpdated", updated);
    }
  } catch (err) {
    console.error("✏️ Edit failed:", err.message);
  }
});


  // Delete a message
  socket.on("deleteMessage", async (id) => {
    try {
      const deleted = await Message.findByIdAndDelete(id);
      if (deleted) io.to(deleted.room).emit("messageDeleted", deleted._id);
    } catch (err) {
      console.error("🗑️ Delete failed:", err.message);
    }
  });
});

// Serve frontend (Vite build) if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
