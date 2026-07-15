import { FormEvent, useState } from "react";
import { BriefcaseBusiness, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "./AuthContext";

export function AuthView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("Demo Candidate");
  const [email, setEmail] = useState("demo@interntracker.dev");
  const [password, setPassword] = useState("DemoPassword123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="logo-mark">
            <BriefcaseBusiness size={22} />
          </span>
          <div>
            <p className="eyebrow">My Internship Tracker</p>
            <h1>Run a tighter personalized internship search.</h1>
          </div>
        </div>
        <div className="auth-stats" aria-label="Tracker highlights">
          <div>
            <strong>Pipeline</strong>
            <span>track every stage</span>
          </div>
          <div>
            <strong>Follow-ups</strong>
            <span>never miss a next step</span>
          </div>
          <div>
            <strong>Insights</strong>
            <span>see what needs attention</span>
          </div>
        </div>
      </section>

      <section className="auth-card" aria-label="Authentication form">
        <div className="segmented-control">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" ? (
            <label>
              <span>Name</span>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <KeyRound size={18} />
            {isSubmitting ? "Working" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
