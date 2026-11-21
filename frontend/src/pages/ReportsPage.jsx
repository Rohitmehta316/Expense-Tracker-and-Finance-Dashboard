import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { reportsApi } from "../api/index.js";
import { currency } from "../utils/format.js";

import { Card, Empty, PageHeader } from "../components/FinanceUI.jsx";
export default function ReportsPage({ user }) {
  const [year, setYear] = useState(new Date().getFullYear()),
    [month, setMonth] = useState(new Date().getMonth() + 1),
    [data, setData] = useState([]),
    [type, setType] = useState("monthly");
  useEffect(() => {
    reportsApi[type === "yearly" ? "yearly" : type === "categories" ? "categories" : "monthly"]({ year, month })
      .then((r) => setData(r.data.items || []))
      .catch((e) => toast.error(e.message));
  }, [year, month, type]);
  const csv = () => {
    const rows = [
      ["Type", "Category/Period", "Amount", "Count"],
      ...data.map((x) => [
        x._id.type || "",
        x._id.categoryId || x._id.period || "",
        x.total,
        x.count,
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((r) =>
            r
              .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n"),
      ],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fintrack-${type}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <PageHeader
        eyebrow="FINANCIAL INSIGHTS"
        title="Reports"
        desc="A clearer view of where your money moves."
        action={
          <div className="report-actions">
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              Print report
            </button>
            <button className="btn btn-primary" onClick={csv}>
              Export CSV
            </button>
          </div>
        }
      />
      <Card className="report-card">
        <div className="report-filters">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="monthly">Monthly report</option>
            <option value="yearly">Yearly report</option>
            <option value="categories">Category report</option>
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)}>
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          {type === "monthly" && (
            <select value={month} onChange={(e) => setMonth(+e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option value={i + 1} key={i}>
                  {new Date(2025, i).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
          )}
        </div>
        {data.length ? (
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>PERIOD / CATEGORY</th>
                  <th>TRANSACTIONS</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`pill ${r._id.type}`}>{r._id.type}</span>
                    </td>
                    <td>
                      {r._id.period
                        ? type === "yearly"
                          ? new Date(2025, r._id.period - 1).toLocaleString(
                              "en",
                              { month: "long" },
                            )
                          : `Day ${r._id.period}`
                        : r.categoryName || "Uncategorized"}
                    </td>
                    <td>{r.count}</td>
                    <td className="amount">
                      {currency(r.total, r._id.currency || user.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={ChartNoAxesCombined}
            title="No report data"
            text="Transactions will appear here once you record some activity."
          />
        )}
      </Card>
      <div className="report-note">
        Reports use saved transactions. Amounts are grouped by currency as
        entered; currencies are not converted.
      </div>
    </>
  );
}
