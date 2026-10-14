
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    setError("");
    setSubmitting(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError(
        "Logout could not be confirmed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="brand-mark">FD</div>
        <h1>Welcome, {user?.name}!</h1>
        <p>You are successfully logged in.</p>

        <div className="user-details">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleLogout} disabled={submitting}>
          {submitting ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
}
