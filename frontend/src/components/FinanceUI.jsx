
import { Link, NavLink } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


import { currency, day } from "../utils/format.js";
export function PageHeader({ eyebrow, title, desc, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}
export function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Quick({ label, icon: Icon, tone, href }) {
  return (
    <Link className="quick-item" to={href}>
      <span className={`quick-icon ${tone}`}>
        <Icon size={17} />
      </span>
      <span>{label}</span>
      <ChevronRight size={15} />
    </Link>
  );
}
export function Empty({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={21} />
      </span>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}
export function TransactionTable({
  items,
  currencyCode = "INR",
  compact = false,
  onEdit,
  onDelete,
}) {
  if (!items?.length)
    return (
      <Empty
        icon={ArrowLeftRight}
        title="Nothing here yet"
        text="Your transactions will show up here."
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>WALLET</th>
            <th>AMOUNT</th>
            {!compact && <th />}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t._id}>
              <td>
                <div className="transaction-name">
                  <span className={`transaction-icon ${t.type}`}>
                    <TypeIcon type={t.type} />
                  </span>
                  <span>
                    <b>{t.title}</b>
                    <small>{t.description || t.paymentMethod || t.type}</small>
                  </span>
                </div>
              </td>
              <td>
                {t.categoryId?.name || <span className="muted">Transfer</span>}
              </td>
              <td>{day(t.date)}</td>
              <td>{t.walletId?.name || "—"}</td>
              <td className={`amount ${t.type}`}>
                {t.type === "expense" ? "−" : t.type === "income" ? "+" : ""}
                {currency(t.amount, currencyCode)}
              </td>
              {!compact && (
                <td className="row-actions">
                  <button onClick={() => onEdit?.(t)}>Edit</button>
                  <button onClick={() => onDelete?.(t)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function TypeIcon({ type }) {
  const C =
    type === "income"
      ? ArrowDownLeft
      : type === "expense"
        ? ArrowUpRight
        : ArrowLeftRight;
  return <C size={15} />;
}
export function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}export const configs = {
  transactions: {
    title: "Transactions",
    desc: "Track and manage every movement of money.",
    button: "Add transaction",
  },
  income: {
    title: "Income",
    desc: "Your income streams and their history.",
    button: "Add income",
  },
  expenses: {
    title: "Expenses",
    desc: "Understand and manage your spending.",
    button: "Add expense",
  },
  budgets: {
    title: "Budgets",
    desc: "Set thoughtful limits and track your progress.",
    button: "Create budget",
  },
  "savings-goals": {
    title: "Savings goals",
    desc: "Turn your plans into achievable milestones.",
    button: "New goal",
  },
  wallets: {
    title: "Wallets",
    desc: "All your accounts and available balances.",
    button: "Add wallet",
  },
};
