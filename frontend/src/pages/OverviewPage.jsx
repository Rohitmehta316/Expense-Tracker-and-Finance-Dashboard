import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { dashboardApi } from "../api/index.js";
import { currency } from "../utils/format.js";
import { Card, Empty, PageHeader, Quick, TransactionTable } from "../components/FinanceUI.jsx";
export default function OverviewPage({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null),
    [range, setRange] = useState("6 months"),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    dashboardApi.summary()
      .then((r) => setData(r.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setBusy(false));
  }, []);
  if (busy)
    return (
      <div className="skeleton-grid">
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    );
  const summary = data?.summary || {},
    wallets = summary.wallets || [],
    total = wallets
      .filter((w) => w.currency === user.currency)
      .reduce((a, w) => a + w.balance, 0),
    prev = summary.previous || {},
    percent = (cur, old) =>
      old ? `${Math.round(((cur - old) / old) * 100)}%` : "—";
  const stats = [
    [
      "Total balance",
      total,
      user.currency,
      WalletIcon,
      "Net across your wallets",
    ],
    [
      "Income",
      summary.income,
      user.currency,
      ArrowDownLeft,
      `${percent(summary.income, prev.income)} vs last month`,
    ],
    [
      "Expenses",
      summary.expenses,
      user.currency,
      ArrowUpRight,
      `${percent(summary.expenses, prev.expenses)} vs last month`,
    ],
    [
      "Savings",
      summary.savings,
      user.currency,
      Goal,
      "Income less expenses this month",
    ],
  ];
  return (
    <>
      <PageHeader
        eyebrow="SATURDAY, 21 NOVEMBER 2026"
        title={`Good morning, ${user.name?.split(" ")[0]}`}
        desc="Here’s what’s happening with your money today."
        action={
          <button
            className="btn btn-primary"
            onClick={() => navigate("/transactions")}
          >
            <Plus size={17} /> Add transaction
          </button>
        }
      />
      <div className="stats-grid">
        {stats.map(([label, val, cur, Icon, sub], i) => (
          <Card className="stat-card" key={label}>
            <div className="stat-head">
              <span>{label}</span>
              <span className={`stat-icon tone-${i}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong>{currency(val, cur)}</strong>
            <div className="stat-foot">
              <span className={i === 2 ? "down" : "up"}>
                {i === 2 ? (
                  <ArrowDownLeft size={13} />
                ) : (
                  <ArrowUpRight size={13} />
                )}{" "}
                {sub}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="card-heading">
            <div>
              <h3>Cash flow</h3>
              <p>Income and expenses over time</p>
            </div>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option>6 months</option>
              <option>3 months</option>
            </select>
          </div>
          <div className="legend">
            <span>
              <i className="legend-income" /> Income
            </span>
            <span>
              <i className="legend-expense" /> Expenses
            </span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={(data?.series || []).slice(range === "3 months" ? -3 : 0)}
                margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.13} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="var(--line)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => currency(v, user.currency)} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#incomeFill)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  fill="url(#expenseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="breakdown-card">
          <div className="card-heading">
            <div>
              <h3>Where it goes</h3>
              <p>This month’s spending</p>
            </div>
            <button
              className="text-action"
              onClick={() => navigate("/reports")}
            >
              Details <ChevronRight size={14} />
            </button>
          </div>
          {data?.categories?.length ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius="65%"
                      outerRadius="88%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {data.categories.map((x, i) => (
                        <Cell
                          key={i}
                          fill={
                            x.color ||
                            ["#6366F1", "#14B8A6", "#F59E0B", "#F472B6"][i % 4]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => currency(v, user.currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <b>{currency(summary.expenses, user.currency)}</b>
                  <span>Total spent</span>
                </div>
              </div>
              <div className="category-list">
                {data.categories.slice(0, 4).map((x, i) => (
                  <div key={x.name}>
                    <span>
                      <i
                        style={{
                          background:
                            x.color ||
                            ["#6366F1", "#14B8A6", "#F59E0B", "#F472B6"][i % 4],
                        }}
                      />
                      {x.name}
                    </span>
                    <b>{currency(x.amount, user.currency)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty
              icon={ChartNoAxesCombined}
              title="No spending yet"
              text="Expense categories will appear here when transactions are added."
            />
          )}
        </Card>
        <Card className="recent-card">
          <div className="card-heading">
            <div>
              <h3>Recent transactions</h3>
              <p>Your latest activity</p>
            </div>
            <Link className="text-action" to="/transactions">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <TransactionTable
            items={data?.recent || []}
            currencyCode={user.currency}
            compact
          />
        </Card>
        <Card className="quick-card">
          <div className="card-heading">
            <div>
              <h3>Quick actions</h3>
              <p>Make a move</p>
            </div>
          </div>
          <div className="quick-actions">
            <Quick
              label="Add income"
              icon={ArrowDownLeft}
              tone="green"
              href="/income"
            />
            <Quick
              label="Add expense"
              icon={ArrowUpRight}
              tone="red"
              href="/expenses"
            />
            <Quick
              label="Create budget"
              icon={ClipboardList}
              tone="blue"
              href="/budgets"
            />
            <Quick
              label="Savings goal"
              icon={Goal}
              tone="purple"
              href="/savings-goals"
            />
          </div>
          <div className="mini-goals">
            <div className="mini-goal-title">
              <span>Active goals</span>
              <Link to="/savings-goals">See all</Link>
            </div>
            {data?.goals?.length ? (
              data.goals.slice(0, 2).map((g) => (
                <div className="goal-mini" key={g._id}>
                  <div>
                    <b>{g.title}</b>
                    <span>
                      {currency(g.currentAmount, user.currency)} of{" "}
                      {currency(g.targetAmount, user.currency)}
                    </span>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (g.currentAmount / g.targetAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <small className="muted">
                Create a goal to start tracking progress.
              </small>
            )}
          </div>
          <button
            id="quick-add"
            className="sr-only"
            onClick={() => document.querySelector(".quick-actions a")?.click()}
          />
        </Card>
      </div>
    </>
  );
}
