import { useEffect, useRef, useState } from "react";
import {
  getContacts,
  getUsers,
  addContact,
  removeContact,
} from "../api/contact";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { withCredentials: true });

export default function Contacts({ currentUser, onSelectContact }) {
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [notifications, setNotifications] = useState({});
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchContacts();

    if (currentUser) {
      socket.emit("register", {
        userId: currentUser.id,
        username: currentUser.username,
      });
    }

    socket.on("onlineUsers", (list) => {
      setOnlineUsers(list);
    });

    socket.on("newMessage", (message) => {
      if (message.receiverId === currentUser.id) {
        setNotifications((prev) => ({
          ...prev,
          [message.senderId]: true,
        }));
      }
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("newMessage");
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      const allUsers = res.data?.users || [];
      const otherUsers = allUsers.filter((u) => u._id !== currentUser.id);
      setUsers(otherUsers);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err.message);
      setUsers([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await getContacts();
      const contactList = res.data?.contacts || [];
      setContacts(contactList);
    } catch (err) {
      console.error("❌ Failed to fetch contacts:", err.message);
      setContacts([]);
    }
  };

  const handleAddContact = async (contactId) => {
    if (isContact(contactId)) return;
    try {
      await addContact(contactId);
      await fetchContacts();
    } catch (err) {
      console.error("❌ Failed to add contact:", err.message);
      alert(err.response?.data?.msg || "Failed to add contact");
    }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      await removeContact(contactId);
      setOpenMenu(null);
      await fetchContacts();
    } catch (err) {
      console.error("❌ Failed to remove contact:", err.message);
    }
  };

  const isContact = (id) => contacts?.some((c) => c._id === id);
  const isOnline = (id) => onlineUsers.some((u) => u.userId === id);

  const handleSelectContact = (contact) => {
    onSelectContact(contact);
    if (contact && notifications[contact._id]) {
      setNotifications((prev) => {
        const updated = { ...prev };
        delete updated[contact._id];
        return updated;
      });
    }
  };

  return (
    <div
      style={{
        borderRight: "1px solid #ccc",
        padding: 10,
        width: "40%",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <button
        onClick={() => handleSelectContact(null)}
        style={{
          marginBottom: 10,
          background: "#524e4eff",
          border: "1px solid #524e4eff",
          borderRadius: 5,
          padding: 6,
          width: "100%",
          fontWeight: "bold",
        }}
      >
        Global Chat
      </button>

      <h4>Your Contacts</h4>
      {contacts.length === 0 && <p>No contacts yet.</p>}
      {contacts.map((c) => (
        <div
          key={c._id}
          style={{
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => handleSelectContact(c)}
            style={{ flexGrow: 1, textAlign: "left", position: "relative" }}
          >
            {c.username}
            {isOnline(c._id) && (
              <span style={{ color: "green", marginLeft: 5 }}>●</span>
            )}
            {notifications[c._id] && (
              <span
                style={{
                  color: "red",
                  fontWeight: "bold",
                  marginLeft: 8,
                }}
              >
                🔴
              </span>
            )}
          </button>

          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() =>
                setOpenMenu((prev) => (prev === c._id ? null : c._id))
              }
            >
              ⋮
            </button>
            {openMenu === c._id && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  padding: "2px 5px",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => handleRemoveContact(c._id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "red",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <h4>Other Users</h4>
      {users.length === 0 && <p>No users found.</p>}
      {users.map((u) => (
        <div key={u._id} style={{ marginBottom: 5 }}>
          {u.username}
          {isOnline(u._id) && (
            <span style={{ color: "green", marginLeft: 5 }}>●</span>
          )}
          {!isContact(u._id) && (
            <button
              onClick={() => handleAddContact(u._id)}
              style={{ marginLeft: 5 }}
            >
              ➕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
