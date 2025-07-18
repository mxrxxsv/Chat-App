import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { getCurrentUser, logoutUser } from "../api/auth";
import Contacts from "../components/Contacts";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const roomId = activeChat
    ? [user?.id, activeChat?._id].sort().join("_")
    : "global";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data.user);

        socketRef.current = io("http://localhost:5000", {
          withCredentials: true,
        });

        socketRef.current.emit("register", {
          userId: res.data.user.id,
          username: res.data.user.username,
        });

        socketRef.current.on("receiveMessage", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        socketRef.current.on("onlineUsers", (users) => {
          setOnlineUsers(users);
        });

        socketRef.current.on("messageDeleted", (msgId) => {
          setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
        });

        socketRef.current
          .off("messageUpdated")
          .on("messageUpdated", (updatedMsg) => {
            setMessages((prev) =>
              prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg))
            );
          });
      } catch {
        navigate("/login");
      }
    };

    fetchUser();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !roomId || !socketRef.current) return;

    socketRef.current.emit("join", roomId);

    axios
      .get(`http://localhost:5000/api/messages/${roomId}`, {
        withCredentials: true,
      })
      .then((res) => setMessages(res.data))
      .catch(console.error);
  }, [roomId, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;

    if (editingMessageId) {
      socketRef.current.emit("editMessage", {
        _id: editingMessageId,
        text: message,
        roomId,
      });
      setEditingMessageId(null);
    } else {
      socketRef.current.emit("sendMessage", {
        text: message,
        sender: user.username,
        roomId,
      });
    }

    setMessage("");
  };

  const handleEdit = (msg) => {
    setEditingMessageId(msg._id);
    setMessage(msg.text);
    setDropdownOpenId(null);
  };

  const handleDelete = (msgId) => {
    if (socketRef.current) {
      socketRef.current.emit("deleteMessage", {
        _id: msgId,
        roomId,
      });
    }
    setDropdownOpenId(null);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Contacts currentUser={user} onSelectContact={setActiveChat} />

      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>
            Chatting with {activeChat ? activeChat.username : "everyone (Global)"}
          </h3>
          <button
            style={{ width: "43%", height: "100%", fontSize: "12px", marginTop: "20px" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            height: 350,
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: 10,
            marginTop: 10,
            marginBottom: 10,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg._id || Math.random()}
              style={{
                textAlign: msg.sender === user.username ? "right" : "left",
                backgroundColor: "#444",
                color: "#fff",
                padding: "10px",
                borderRadius: "10px",
                margin: "10px 0",
                maxWidth: "70%",
                marginLeft: msg.sender === user.username ? "auto" : "0",
                marginRight: msg.sender === user.username ? "0" : "auto",
                position: "relative",
              }}
            >
              <strong>{msg.sender}:</strong> {msg.text}

              {msg.sender === user.username && (
                <>
                  <button
                    onClick={() =>
                      setDropdownOpenId(dropdownOpenId === msg._id ? null : msg._id)
                    }
                    style={{
                      position: "absolute",
                      top: "5px",
                      left: "-15px",
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "20px",
                      padding: "2px 5px",
                    }}
                  >
                    ⋮
                  </button>

                  {dropdownOpenId === msg._id && (
                    <div
                      ref={dropdownRef}
                      style={{
                        position: "absolute",
                        top: "30px",
                        right: "5px",
                        backgroundColor: "#222",
                        border: "1px solid #555",
                        borderRadius: "5px",
                        padding: "5px",
                        zIndex: 10,
                      }}
                    >
                      <div
                        onClick={() => handleEdit(msg)}
                        style={{
                          cursor: "pointer",
                          color: "#fff",
                          padding: "5px",
                          borderBottom: "1px solid #555",
                        }}
                      >
                        Edit
                      </div>
                      <div
                        onClick={() => handleDelete(msg._id)}
                        style={{ cursor: "pointer", color: "#fff", padding: "5px" }}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>


        <div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
            style={{ width: "80%", padding: 10, borderRadius: 5 }}
          />
          <button onClick={sendMessage}>
            {editingMessageId ? "Update" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
