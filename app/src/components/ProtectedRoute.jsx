// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuth(true);
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <p>Loading...</p>;
  return isAuth ? children : <Navigate to="/login" />;
}
