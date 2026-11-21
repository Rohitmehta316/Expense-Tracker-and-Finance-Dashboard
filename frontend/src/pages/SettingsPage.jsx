import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { userApi } from "../api/index.js";

import { Field, PageHeader } from "../components/FinanceUI.jsx";
export default function SettingsPage({ user, setUser }) {
  const [form, setForm] = useState({
      name: user.name,
      email: user.email,
      currency: user.currency || "INR",
      theme: user.theme || "light",
      notifications: user.preferences?.notifications ?? true,
    }),
    [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  async function save(e) {
    e.preventDefault();
    try {
      const r = await userApi.updateProfile({
        name: form.name,
        email: form.email,
        currency: form.currency,
        theme: form.theme,
        preferences: { notifications: form.notifications },
      });
      setUser(r.data.user);
      document.documentElement.classList.toggle("dark", form.theme === "dark");
      localStorage.setItem("fintrack-theme", form.theme);
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function change(e) {
    e.preventDefault();
    try {
      await userApi.changePassword(pwd);
      setPwd({ currentPassword: "", newPassword: "" });
      toast.success("Password updated");
    } catch (e) {
      toast.error(e.message);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Settings"
        desc="Personalize your FinTrack experience."
      />
      <div className="settings-grid">
        <form className="card settings-card" onSubmit={save}>
          <div className="card-heading">
            <div>
              <h3>Profile & preferences</h3>
              <p>How FinTrack works for you</p>
            </div>
          </div>
          <Field
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Field
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <div className="form-row">
            <label className="field">
              <span>Display currency</span>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {[
                  ["INR", "Indian Rupee"],
                  ["USD", "US Dollar"],
                  ["EUR", "Euro"],
                  ["GBP", "Pound Sterling"],
                  ["JPY", "Japanese Yen"],
                ].map(([c, n]) => (
                  <option value={c} key={c}>
                    {c} — {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Theme</span>
              <select
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
          <label className="check-setting">
            <input
              type="checkbox"
              checked={form.notifications}
              onChange={(e) =>
                setForm({ ...form, notifications: e.target.checked })
              }
            />
            <span>
              <b>In-app notifications</b>
              <small>Budget alerts and goal milestones</small>
            </span>
          </label>
          <button className="btn btn-primary">Save preferences</button>
        </form>
        <form className="card settings-card" onSubmit={change}>
          <div className="card-heading">
            <div>
              <h3>Security</h3>
              <p>Keep your account protected</p>
            </div>
          </div>
          <Field
            label="Current password"
            type="password"
            value={pwd.currentPassword}
            onChange={(e) =>
              setPwd({ ...pwd, currentPassword: e.target.value })
            }
            required
          />
          <Field
            label="New password"
            type="password"
            value={pwd.newPassword}
            onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            minLength={8}
            required
          />
          <button className="btn btn-secondary">Update password</button>
          <div className="security-note">
            <span>⌑</span>
            <p>Your password is hashed with bcrypt before it is stored.</p>
          </div>
        </form>
      </div>
    </>
  );
}
