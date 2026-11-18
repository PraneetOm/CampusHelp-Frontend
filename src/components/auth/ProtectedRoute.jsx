import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const {
    loading,
    isAuthenticated,
    status,
    authError,
    signOut,
  } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading your campus account...</div>;
  }

  if (status === "configuration_error") {
    return <div className="auth-error">{authError}</div>;
  }

  if (status === "profile_error") {
    return (
      <div className="auth-error">
        <h2>Unable to load your campus profile</h2>
        <p>{authError}</p>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}