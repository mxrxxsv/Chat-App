// src/api/contact.js
import axios from "axios";
const API = axios.create({ baseURL: "https://chat-app-22wh.onrender.com/api/contacts", withCredentials: true });

export const getContacts = () => API.get("/list");
export const getUsers = () => API.get("/others");
export const addContact = (contactId) => API.post("/add", { contactId });
export const removeContact = (contactId) => API.delete(`/remove/${contactId}`);
