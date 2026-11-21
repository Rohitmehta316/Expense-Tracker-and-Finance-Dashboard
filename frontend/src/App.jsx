import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { Shell } from "./components/AppShell.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import BudgetsPage from "./pages/BudgetsPage.jsx";
import WalletsPage from "./pages/WalletsPage.jsx";
import IncomePage from "./pages/IncomePage.jsx";
import SavingsGoalsPage from "./pages/SavingsGoalsPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import { authApi } from "./api/index.js";
export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [dark, setDark] = useState(
      localStorage.getItem("fintrack-theme") === "dark",
    );
  const loc = useLocation();
  useEffect(() => {
    authApi.me()
      .then((r) => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fintrack-theme", dark ? "dark" : "light");
  }, [dark]);
  if (loading)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <Activity />
        </div>
        <span>Preparing your finances…</span>
      </div>
    );
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <AuthPage mode="login" onAuth={setUser} />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <AuthPage mode="register" onAuth={setUser} />
          )
        }
      />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />
      <Route
        path="*"
        element={
          user ? (
            <Shell user={user} setUser={setUser} dark={dark} setDark={setDark}>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<OverviewPage user={user} />} />
                <Route
                  path="/transactions"
                  element={<TransactionsPage />}
                />
                <Route path="/income" element={<IncomePage />} />
                <Route
                  path="/expenses"
                  element={<ExpensesPage />}
                />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route
                  path="/savings-goals"
                  element={<SavingsGoalsPage />}
                />
                <Route path="/wallets" element={<WalletsPage />} />
                <Route path="/reports" element={<ReportsPage user={user} />} />
                <Route
                  path="/settings"
                  element={<SettingsPage user={user} setUser={setUser} />}
                />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Routes>
            </Shell>
          ) : (
            <Navigate to="/login" state={{ from: loc }} replace />
          )
        }
      />
    </Routes>
  );
}
