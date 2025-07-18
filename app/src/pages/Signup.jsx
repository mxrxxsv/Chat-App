import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser, getCurrentUser } from "../api/auth";

export default function Signup() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect to /chat if already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        navigate("/chat");
      } catch {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signupUser(form);
      alert("Signup successful. You can now login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Signup failed");
    }
  };

  if (loading) return <p>Checking session...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <h2>Signup</h2>
      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
        style={{ margin: 2 }}
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        style={{ margin: 2 }}
      />
      <br />
      <button type="submit" style={{ margin: 5 }}>
        Signup
      </button>

      <p style={{ marginTop: 10, fontSize: 14 }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#408ddf" }}>
          Log in
        </Link>
      </p>
    </form>
  );
}
