import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { budgetsApi, categoryApi, expensesApi, incomeApi, savingsGoalsApi, transactionsApi, walletsApi } from "../api/index.js";
import { currency, day } from "../utils/format.js";import { Card, Empty, PageHeader, TransactionTable, configs } from '../components/FinanceUI.jsx';
import FormModal from '../components/FormModal.jsx';
const resourceByKind = { transactions: transactionsApi, income: incomeApi, expenses: expensesApi, budgets: budgetsApi, "savings-goals": savingsGoalsApi, wallets: walletsApi };

export default function DataPage({ kind }) {
  const cfg = configs[kind],
    [items, setItems] = useState([]),
    [wallets, setWallets] = useState([]),
    [categories, setCategories] = useState([]),
    [loading, setLoading] = useState(true),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [filter, setFilter] = useState(""),
    [typeFilter, setTypeFilter] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resourceByKind[kind].list();
      setItems(response.data.items || []);
      if (["transactions", "income", "expenses", "budgets"].includes(kind)) {
        const [w, c] = await Promise.all([
          walletsApi.list(),
          categoryApi.list(),
        ]);
        setWallets(w.data.items);
        setCategories(c.data.items);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [kind]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = items.filter(
    (x) =>
      String(x.title || x.name || x.categoryId?.name || "")
        .toLowerCase()
        .includes(filter.toLowerCase()) &&
      (!typeFilter || x.type === typeFilter),
  );
  function open(item = null) {
    setEditing(item);
    setModal(true);
  }
  async function remove(item) {
    if (
      !confirm(
        `Delete “${item.title || item.name}”? This action cannot be undone.`,
      )
    )
      return;
    try {
      const mutations = ["income", "expenses"].includes(kind) ? transactionsApi : resourceByKind[kind];
      await mutations.remove(item._id);
      toast.success("Deleted successfully");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function save(payload) {
    try {
      const mutations = ["income", "expenses"].includes(kind) ? transactionsApi : resourceByKind[kind];
      if (editing) await mutations.update(editing._id, payload);
      else await mutations.create(payload);
      toast.success(editing ? "Changes saved" : "Created successfully");
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }
  const money = ["transactions", "income", "expenses"].includes(kind);
  return (
    <>
      <PageHeader
        eyebrow="YOUR FINANCES"
        title={cfg.title}
        desc={cfg.desc}
        action={
          <button className="btn btn-primary" onClick={() => open()}>
            <Plus size={17} />
            {cfg.button}
          </button>
        }
      />
      <Card className="data-card">
        <div className="data-toolbar">
          <label className="data-search">
            <Search size={16} />
            <input
              placeholder={`Search ${cfg.title.toLowerCase()}…`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          {kind === "transactions" && (
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          )}
          <span className="record-count">{filtered.length} records</span>
        </div>
        {loading ? (
          <div className="table-loading">Loading your data…</div>
        ) : money ? (
          <TransactionTable items={filtered} onEdit={open} onDelete={remove} />
        ) : kind === "wallets" ? (
          <div className="wallet-grid">
            {filtered.map((w) => (
              <div className="wallet-tile" key={w._id}>
                <div className="wallet-top">
                  <span
                    className="wallet-symbol"
                    style={{
                      background: `${w.color || "#6366f1"}20`,
                      color: w.color || "#6366f1",
                    }}
                  >
                    <CreditCard size={20} />
                  </span>
                  <button onClick={() => open(w)}>Edit</button>
                </div>
                <b>{w.name}</b>
                <span>
                  {w.type} · {w.currency}
                </span>
                <strong>{currency(w.balance, w.currency)}</strong>
                <button className="wallet-delete" onClick={() => remove(w)}>
                  Remove wallet
                </button>
              </div>
            ))}
            {!filtered.length && (
              <Empty
                icon={WalletIcon}
                title="No wallets yet"
                text="Add a wallet to start tracking balances."
              />
            )}
          </div>
        ) : kind === "budgets" ? (
          <div className="budget-grid">
            {filtered.map((b) => {
              const pct = Math.min(
                100,
                Math.round(((b.spent || 0) / b.amount) * 100),
              );
              return (
                <article className="budget-tile" key={b._id}>
                  <div className="budget-head">
                    <span
                      className="budget-dot"
                      style={{ background: b.categoryId?.color || "#6366f1" }}
                    />
                    <div>
                      <b>{b.categoryId?.name || b.name || "Monthly budget"}</b>
                      <small>
                        {new Date(b.year, b.month - 1).toLocaleString("en", {
                          month: "long",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                    <button onClick={() => open(b)}>Edit</button>
                  </div>
                  <div className="budget-amount">
                    <b>{currency(b.spent || 0)}</b>
                    <span>of {currency(b.amount)}</span>
                  </div>
                  <div className="progress">
                    <i
                      className={
                        pct >= 100
                          ? "over"
                          : pct >= b.threshold
                            ? "warning"
                            : ""
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="budget-foot">
                    <span>{pct}% used</span>
                    <b>
                      {currency(Math.max(0, b.amount - (b.spent || 0)))} left
                    </b>
                  </div>
                  <button className="remove-inline" onClick={() => remove(b)}>
                    Remove budget
                  </button>
                </article>
              );
            })}
            {!filtered.length && (
              <Empty
                icon={ClipboardList}
                title="No budgets set"
                text="Create a budget to track monthly spending."
              />
            )}
          </div>
        ) : (
          <div className="goal-grid">
            {filtered.map((g) => (
              <div className="goal-tile" key={g._id}>
                <div className="goal-head">
                  <span className="goal-symbol">
                    <Goal size={18} />
                  </span>
                  <button onClick={() => open(g)}>Edit</button>
                </div>
                <h3>{g.title}</h3>
                <p>Target {day(g.targetDate)}</p>
                <div className="goal-amount">
                  <b>{currency(g.currentAmount)}</b>
                  <span>of {currency(g.targetAmount)}</span>
                </div>
                <div className="progress">
                  <i
                    style={{
                      width: `${Math.min(100, (g.currentAmount / g.targetAmount) * 100)}%`,
                    }}
                  />
                </div>
                <div className="goal-foot">
                  <span>
                    {Math.round((g.currentAmount / g.targetAmount) * 100)}%
                    complete
                  </span>
                  <button onClick={() => open({ ...g, _contribute: true })}>
                    + Add money
                  </button>
                </div>
                <button className="remove-inline" onClick={() => remove(g)}>
                  Remove goal
                </button>
              </div>
            ))}
            {!filtered.length && (
              <Empty
                icon={Goal}
                title="No savings goals"
                text="Create a goal and start making progress."
              />
            )}
          </div>
        )}
      </Card>
      {modal && (
        <FormModal
          kind={kind}
          item={editing}
          wallets={wallets}
          categories={categories}
          onClose={() => setModal(false)}
          onSave={save}
          onLoad={load}
        />
      )}
    </>
  );
}
