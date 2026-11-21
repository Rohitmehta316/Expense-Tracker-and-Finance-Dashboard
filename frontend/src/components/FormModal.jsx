import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { savingsApi } from "../api/index.js";
import { Field, configs } from "./FinanceUI.jsx";
export default function FormModal({
  kind,
  item,
  wallets,
  categories,
  onClose,
  onSave,
  onLoad,
}) {
  const today = new Date().toISOString().slice(0, 10),
    [busy, setBusy] = useState(false),
    [data, setData] = useState(() => ({
      title: item?.title || "",
      amount: item?.amount ?? "",
      type:
        item?.type ||
        (kind === "income"
          ? "income"
          : kind === "expenses"
            ? "expense"
            : "expense"),
      categoryId: item?.categoryId?._id || item?.categoryId || "",
      walletId: item?.walletId?._id || item?.walletId || wallets[0]?._id || "",
      toWalletId: item?.toWalletId?._id || item?.toWalletId || "",
      date: item?.date ? new Date(item.date).toISOString().slice(0, 10) : today,
      description: item?.description || "",
      name: item?.name || "",
      currency: item?.currency || "INR",
      walletType: item?.type || "cash",
      month: item?.month || new Date().getMonth() + 1,
      year: item?.year || new Date().getFullYear(),
      threshold: item?.threshold || 80,
      targetAmount: item?.targetAmount || "",
      currentAmount: item?.currentAmount || 0,
      targetDate: item?.targetDate
        ? new Date(item.targetDate).toISOString().slice(0, 10)
        : "",
      goalTitle: item?.title || "",
      goalContribution: "",
    }));
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (kind === "savings-goals" && item?._contribute) {
        await savingsApi.contribute(item._id, {
          amount: data.goalContribution,
        });
        toast.success("Goal updated");
        onClose();
        onLoad();
        return;
      }
      let out;
      if (["transactions", "income", "expenses"].includes(kind)) {
        out = {
          title: data.title,
          amount: +data.amount,
          type:
            kind === "income"
              ? "income"
              : kind === "expenses"
                ? "expense"
                : data.type,
          categoryId: data.categoryId || undefined,
          walletId: data.walletId,
          toWalletId: data.toWalletId || undefined,
          date: data.date,
          description: data.description,
        };
      } else if (kind === "wallets")
        out = {
          name: data.name,
          type: data.walletType,
          currency: data.currency,
        };
      else if (kind === "budgets")
        out = {
          categoryId: data.categoryId || undefined,
          name:
            categories.find((c) => c._id === data.categoryId)?.name ||
            data.name,
          amount: +data.amount,
          month: +data.month,
          year: +data.year,
          threshold: +data.threshold,
        };
      else if (kind === "savings-goals")
        out = {
          title: data.goalTitle,
          targetAmount: +data.targetAmount,
          currentAmount: +data.currentAmount,
          targetDate: data.targetDate || undefined,
        };
      await onSave(out);
    } finally {
      setBusy(false);
    }
  }
  const label = configs[kind].title.toLowerCase().replace(/s$/, "");
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">FINTRACK</span>
            <h2>
              {item?._contribute
                ? "Add to goal"
                : `${item ? "Edit" : "Create"} ${label}`}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {["transactions", "income", "expenses"].includes(kind) ? (
          <>
            <Field
              label="Title"
              value={data.title}
              onChange={set("title")}
              placeholder="e.g. Grocery shopping"
              required
            />
            <div className="form-row">
              <Field
                label="Amount"
                type="number"
                min="0.01"
                step="0.01"
                value={data.amount}
                onChange={set("amount")}
                required
              />
              <label className="field">
                <span>Type</span>
                <select
                  value={
                    kind === "income"
                      ? "income"
                      : kind === "expenses"
                        ? "expense"
                        : data.type
                  }
                  disabled={kind !== "transactions"}
                  onChange={set("type")}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Category</span>
                <select value={data.categoryId} onChange={set("categoryId")}>
                  <option value="">
                    {data.type === "transfer"
                      ? "No category"
                      : "Choose category"}
                  </option>
                  {categories
                    .filter(
                      (c) =>
                        c.type ===
                        (data.type === "income" ? "income" : "expense"),
                    )
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>
                  {data.type === "transfer" ? "From wallet" : "Wallet"}
                </span>
                <select
                  value={data.walletId}
                  onChange={set("walletId")}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} · {w.currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {data.type === "transfer" && (
              <label className="field">
                <span>To wallet</span>
                <select
                  value={data.toWalletId}
                  onChange={set("toWalletId")}
                  required
                >
                  <option value="">Select destination</option>
                  {wallets
                    .filter((w) => w._id !== data.walletId)
                    .map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} · {w.currency}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="form-row">
              <Field
                label="Date"
                type="date"
                value={data.date}
                onChange={set("date")}
                required
              />
              <Field
                label="Description"
                value={data.description}
                onChange={set("description")}
                placeholder="Optional"
              />
            </div>
          </>
        ) : kind === "wallets" ? (
          <>
            <Field
              label="Wallet name"
              value={data.name}
              onChange={set("name")}
              placeholder="e.g. Main bank account"
              required
            />
            <div className="form-row">
              <label className="field">
                <span>Account type</span>
                <select value={data.walletType} onChange={set("walletType")}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="savings">Savings</option>
                  <option value="digital">Digital wallet</option>
                </select>
              </label>
              <label className="field">
                <span>Currency</span>
                <select value={data.currency} onChange={set("currency")}>
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>JPY</option>
                </select>
              </label>
            </div>
            {item && (
              <p className="form-note">
                Wallet balances are calculated from transactions. Use an opening
                balance transaction to add funds.
              </p>
            )}
          </>
        ) : kind === "budgets" ? (
          <>
            <label className="field">
              <span>Expense category</span>
              <select value={data.categoryId} onChange={set("categoryId")}>
                <option value="">Overall budget</option>
                {categories
                  .filter((c) => c.type === "expense")
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <Field
              label="Monthly limit"
              type="number"
              min="0.01"
              step="0.01"
              value={data.amount}
              onChange={set("amount")}
              required
            />
            <div className="form-row">
              <label className="field">
                <span>Month</span>
                <select value={data.month} onChange={set("month")}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option value={i + 1} key={i}>
                      {new Date(2025, i).toLocaleString("en", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Year"
                type="number"
                min="2000"
                max="2100"
                value={data.year}
                onChange={set("year")}
                required
              />
            </div>
            <Field
              label="Alert threshold (%)"
              type="number"
              min="1"
              max="100"
              value={data.threshold}
              onChange={set("threshold")}
            />
          </>
        ) : kind === "savings-goals" ? (
          <>
            {item?._contribute ? (
              <Field
                label="Contribution amount"
                type="number"
                min="0.01"
                step="0.01"
                value={data.goalContribution}
                onChange={set("goalContribution")}
                required
              />
            ) : (
              <>
                <Field
                  label="Goal name"
                  value={data.goalTitle}
                  onChange={set("goalTitle")}
                  placeholder="e.g. Emergency fund"
                  required
                />
                <div className="form-row">
                  <Field
                    label="Target amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={data.targetAmount}
                    onChange={set("targetAmount")}
                    required
                  />
                  <Field
                    label="Already saved"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.currentAmount}
                    onChange={set("currentAmount")}
                  />
                </div>
                <Field
                  label="Target date"
                  type="date"
                  value={data.targetDate}
                  onChange={set("targetDate")}
                />
              </>
            )}
          </>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : item ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
