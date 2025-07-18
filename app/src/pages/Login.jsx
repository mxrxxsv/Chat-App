import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, getCurrentUser } from "../api/auth";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // If already logged in, redirect to chat
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
      await loginUser(form);
      navigate("/chat");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  if (loading) return <p>Checking session...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <h2>Login</h2>
      <input
        required
        placeholder="Username"
        value={form.username}
        style={{ margin: 2 }}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        required
        type="password"
        placeholder="Password"
        value={form.password}
        style={{ margin: 2 }}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <br />
      <button style={{ margin: 5 }}>Login</button>

      <p style={{ marginTop: 10, fontSize: 14 }}>
        No account?{" "}
        <Link to="/" style={{ color: "#408ddf" }}>
          Sign up
        </Link>
      </p>
    </form>
  );
}
