import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { authApi, notificationApi } from "../api/index.js";
const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Transactions", "/transactions", ArrowLeftRight],
  ["Income", "/income", ArrowDownLeft],
  ["Expenses", "/expenses", ArrowUpRight],
  ["Budgets", "/budgets", ClipboardList],
  ["Savings Goals", "/savings-goals", Goal],
  ["Wallets", "/wallets", WalletIcon],
  ["Reports", "/reports", ChartNoAxesCombined],
  ["Settings", "/settings", Settings],
];
export function Shell({ children, user, setUser, dark, setDark }) {
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [profile, setProfile] = useState(false),
    [query, setQuery] = useState(""),
    [unread, setUnread] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const title = nav.find((x) => x[1] === location.pathname)?.[0] || "Overview";
  useEffect(() => {
    notificationApi.list()
      .then((r) => setUnread(r.data.items.filter((x) => !x.isRead).length))
      .catch(() => {});
  }, []);
  async function logout() {
    await authApi.logout();
    setUser(null);
    toast.success("You are signed out");
  }
  return (
    <div className={`app-frame ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">
            <Activity size={19} />
          </span>
          {!collapsed && (
            <span>
              fin<span className="brand-light">track</span>
            </span>
          )}
        </Link>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse navigation"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([name, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleDollarSign size={17} />
            </div>
            {!collapsed && (
              <>
                <b>Stay on track</b>
                <small>Your money, in focus.</small>
              </>
            )}
          </div>
          <button className="user-mini" onClick={() => setProfile(!profile)}>
            <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <>
                <span className="user-label">
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </span>
                <ChevronDown size={15} />
              </>
            )}
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="top-left">
            <button
              className="mobile-menu icon-btn"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="eyebrow">PERSONAL FINANCE</div>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Search anything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(
                    `/transactions?search=${encodeURIComponent(query)}`,
                  )
                }
              />
              <kbd>⌘ K</kbd>
            </label>
            <Link
              className="icon-btn notification-btn"
              to="/notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && <i />}
            </Link>
            <button
              className="icon-btn"
              onClick={() => setDark(!dark)}
              title="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() => setProfile(!profile)}
              >
                <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
                <ChevronDown size={14} />
              </button>
              {profile && (
                <div className="profile-menu">
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                  <Link to="/settings" onClick={() => setProfile(false)}>
                    <Settings size={15} /> Settings
                  </Link>
                  <button onClick={logout}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
      {mobile && (
        <button
          className="mobile-overlay"
          onClick={() => setMobile(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
      )}
    </div>
  );
}
