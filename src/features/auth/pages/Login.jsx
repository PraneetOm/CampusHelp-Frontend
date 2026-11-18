import { useEffect, useState } from "react";
import {
  ArrowUpRight, Bell, CalendarDays, CheckCircle2, Eye, EyeOff,
  HelpCircle, LockKeyhole, Mail, MapPin, ShieldCheck, Ticket,
  UserRound, XCircle
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

const features = [
  {
    icon: Ticket,
    title: "Helpdesk tickets",
    description: "Raise a campus issue and follow its progress from open to resolved."
  },
  {
    icon: CalendarDays,
    title: "Resource booking",
    description: "Find and request labs, seminar halls, rooms and shared equipment."
  },
  {
    icon: Bell,
    title: "Campus updates",
    description: "Receive in-app updates when a ticket or booking changes."
  },
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description: "Your account permissions are determined securely after sign-in."
  }
];

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (active && data.session?.access_token) {
        await loadProfile(data.session.access_token, false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  function showMessage(type, message) {
    setNotice({ type, message });
  }

  async function loadProfile(accessToken, showErrors = true) {
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut();
          if (showErrors) showMessage("error", "Your session could not be verified. Please sign in again.");
          return;
        }
        if (response.status === 404) {
          if (showErrors) showMessage("error", "Your sign-in is valid, but your campus profile was not found. Contact your campus administrator.");
          return;
        }
        throw new Error(`Profile request failed (${response.status}).`);
      }

      const userProfile = await response.json();
      setProfile(userProfile);
      setNotice(null);
    } catch (error) {
      if (showErrors) {
        showMessage("error", error.message || "Could not connect to the campus server. Check that the backend is running.");
      }
    }
  }

  const { signIn, resetPassword, isAuthenticated, loadings } = useAuth();
  const navigate = useNavigate();

  async function handleSignIn(event) {
    event.preventDefault();

    try {
      await signIn(email, password);
      // AuthContext will load the campus profile.
      // ProtectedRoute will allow access once it is ready.
      navigate("/", { replace: true });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to sign in.",
      });
    }
  }

  async function handlePasswordReset() {
    try {
      await resetPassword(email);
      setNotice({
        type: "success",
        message: "If an account exists for this email, a reset link has been sent.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    }
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setPassword("");
    setNotice({ type: "success", message: "You have been signed out." });
  }

  if (profile) {
    return (
      <main className="signed-in-shell">
        <section className="signed-in-card">
          <div className="brand-mark"><MapPin size={22} /></div>
          <CheckCircle2 className="success-icon" size={34} />
          <p className="eyebrow">Authentication complete</p>
          <h1>Welcome, {profile.name || profile.email}</h1>
          <p className="signed-copy">Your identity was verified by Supabase and your campus profile was loaded from the Smart Campus backend.</p>
          <div className="profile-list">
            <div><span>Name</span><strong>{profile.name || "Not provided"}</strong></div>
            <div><span>Email</span><strong>{profile.email}</strong></div>
            <div><span>Account status</span><strong>{profile.status || "—"}</strong></div>
            <div><span>Campus profile ID</span><code>{profile.id}</code></div>
          </div>
          <p className="role-note">Your application role is checked by the backend from your campus profile. You do not need to choose a role on this screen.</p>
          <button className="button button-primary full-width" onClick={handleSignOut}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <aside className="intro-panel">
        <div className="brand">
          <div className="brand-mark"><MapPin size={21} strokeWidth={2.2} /></div>
          <div><strong>Smart Campus</strong><span>HELPDESK & RESOURCES</span></div>
        </div>

        <div className="intro-content">
          <div className="location-line"><span className="location-dot" /> One campus. One connected service desk.</div>
          <h1>Campus support,<br /><em>in one place.</em></h1>
          <p className="intro-lead">A single place to get help, access shared facilities and stay informed about campus services.</p>

          <div className="feature-list">
            {features.map(({ icon: Icon, title, description }) => (
              <div className="feature-row" key={title}>
                <div className="feature-icon"><Icon size={19} strokeWidth={1.8} /></div>
                <div><h2>{title}</h2><p>{description}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-footer">
          <span>SMART CAMPUS · SERVICE ACCESS</span>
          <span>Built for your campus community</span>
        </div>
      </aside>

      <section className="form-panel">
        <div className="mobile-brand brand">
          <div className="brand-mark"><MapPin size={21} /></div>
          <div><strong>Smart Campus</strong><span>HELPDESK & RESOURCES</span></div>
        </div>

        <div className="form-wrap">
          <div className="form-heading">
            <div className="form-icon"><LockKeyhole size={20} /></div>
            <p className="eyebrow">Campus account access</p>
            <h2>{resetMode ? "Reset your password" : "Sign in to your account"}</h2>
            <p>{resetMode ? "Enter your campus email and we’ll send a secure reset link." : "Use your registered campus email to continue."}</p>
          </div>

          {notice && (
            <div className={`notice ${notice.type}`} role="status">
              {notice.type === "error" ? <XCircle size={17} /> : <CheckCircle2 size={17} />}
              <span>{notice.message}</span>
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <label htmlFor="email">Campus email</label>
            <div className="input-wrap">
              <Mail size={17} />
              <input
                id="email" type="email" autoComplete="username"
                placeholder="name@yourcollege.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!resetMode && <>
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button className="text-button" type="button" onClick={handlePasswordReset} disabled={loading}>Forgot password?</button>
              </div>
              <div className="input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="password" type={showPassword ? "text" : "password"}
                  autoComplete="current-password" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="icon-button" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </>}

            {resetMode ? (
              <button className="button button-primary full-width" type="button" onClick={handlePasswordReset} disabled={loading}>
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            ) : (
              <button className="button button-primary full-width" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : <>Sign in <ArrowUpRight size={17} /></>}
              </button>
            )}
          </form>

          {resetMode && <button className="back-link" type="button" onClick={() => { setResetMode(false); setNotice(null); }}>Back to sign in</button>}

          <div className="secure-note"><ShieldCheck size={16} /><span>Secure sign-in. Access is based on your campus account permissions.</span></div>
          <div className="help-line"><HelpCircle size={15} /><span>Having trouble? Contact your campus administrator.</span></div>
        </div>

        <footer className="form-footer">
          <span>© {new Date().getFullYear()} Smart Campus Helpdesk</span>
          <span>Secure campus access</span>
        </footer>
      </section>
    </main>
  );
}

export default App;