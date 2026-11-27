import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../api/index.js";
import { Field } from "../components/FinanceUI.jsx";

export default function AuthPage({ mode, onAuth }) {
  const location = useLocation(),
    navg = useNavigate(),
    [busy, setBusy] = useState(false),
    [remember, setRemember] = useState(true),
    [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      confirm: "",
    });
  const register = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";

  async function submit(e) {
    e.preventDefault();
    if (register && form.password !== form.confirm)
      return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      if (forgot) {
        await authApi.forgotPassword({ email: form.email });
        toast.success(
          "If the account exists, reset instructions will be sent.",
        );
        navg("/login");
        return;
      }
      if (reset) {
        await authApi.resetPassword({
          token: new URLSearchParams(location.search).get("token"),
          password: form.password,
        });
        toast.success("Password reset");
        navg("/login");
        return;
      }
      const payload = {
        email: form.email.trim(),
        password: form.password,
        remember,
        ...(register ? { name: form.name.trim() } : {}),
      };
      if (register) {
        await authApi.register(payload);
        try {
          await authApi.logout();
        } catch {}
        onAuth(null);
        toast.success("Account created! Please sign in.");
        navg("/login");
        return;
      }
      const r = await authApi.login(payload);
      onAuth(r.data.user);
      navg("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">
            <Activity size={19} />
          </span>
          <span>
            fin<span className="brand-light">track</span>
          </span>
        </Link>
        <div className="auth-message">
          <span className="eyebrow">CLARITY FOR EVERY CURRENCY</span>
          <h1>
            Make your money
            <br />
            <em>make sense.</em>
          </h1>
          <p>
            A calmer way to understand your spending, build better habits, and
            feel in control.
          </p>
          <div className="auth-preview">
            <div className="preview-top">
              <span>Monthly overview</span>
              <span>•••</span>
            </div>
            <b>₹ 84,250</b>
            <small>
              Available balance <i>↑ 12.8%</i>
            </small>
            <div className="preview-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
        <div className="auth-foot">
          Thoughtful tools for your financial life.
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {forgot
              ? "ACCOUNT RECOVERY"
              : reset
                ? "SECURE YOUR ACCOUNT"
                : register
                  ? "GET STARTED"
                  : "WELCOME BACK"}
          </span>
          <h2>
            {forgot
              ? "Reset your password"
              : reset
                ? "Choose a new password"
                : register
                  ? "Create your account"
                  : "Sign in to FinTrack"}
          </h2>
          <p>
            {forgot
              ? "We’ll send you instructions if your account exists."
              : reset
                ? "Set a strong new password for your account."
                : register
                  ? "Start building a clearer picture of your finances."
                  : "Your finances are looking forward to you."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <Field
                label="Full name"
                value={form.name}
                onChange={set("name")}
                placeholder="Alex Morgan"
                required
              />
            )}
            <Field
              label="Email address"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
            />
            <Field
              label={reset ? "New password" : "Password"}
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="At least 8 characters"
              required={!forgot}
              minLength={8}
            />
            {register && (
              <Field
                label="Confirm password"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Repeat your password"
                required
              />
            )}
            {!register && !forgot && !reset && (
              <div className="auth-inline">
                <label>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}
            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : forgot
                  ? "Send reset instructions"
                  : reset
                    ? "Update password"
                    : register
                      ? "Create account"
                      : "Sign in"}
              <ChevronRight size={17} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Already have an account?" : "New to FinTrack?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create account"}
            </Link>
          </div>
          <div className="auth-security">
            <span>⌑</span> Your data is protected with secure encryption
          </div>
        </div>
      </div>
    </div>
  );
}
