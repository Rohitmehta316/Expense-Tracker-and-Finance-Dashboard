import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Command, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, Wallet as WalletIcon, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { notificationApi } from "../api/index.js";
import { day } from "../utils/format.js";
import { Card, Empty, PageHeader } from "../components/FinanceUI.jsx";
export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  async function load() {
    try {
      const r = await notificationApi.list();
      setItems(r.data.items);
    } catch (e) {
      toast.error(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function read(item) {
    try {
      await notificationApi.markRead(item._id);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function all() {
    await notificationApi.markAllRead();
    load();
  }
  return (
    <>
      <PageHeader
        eyebrow="STAY IN THE LOOP"
        title="Notifications"
        desc="Budget alerts, goal milestones, and account activity."
        action={
          <button className="btn btn-secondary" onClick={all}>
            Mark all as read
          </button>
        }
      />
      <Card className="notifications-card">
        {items.length ? (
          items.map((n) => (
            <article
              className={`notification-row ${n.isRead ? "read" : ""}`}
              key={n._id}
            >
              <span className={`notif-icon ${n.type}`}>
                <Bell size={17} />
              </span>
              <div>
                <b>{n.title}</b>
                <p>{n.message}</p>
                <small>{day(n.createdAt)}</small>
              </div>
              {!n.isRead && <button onClick={() => read(n)}>Mark read</button>}
            </article>
          ))
        ) : (
          <Empty
            icon={Bell}
            title="All caught up"
            text="New notifications will appear here."
          />
        )}
      </Card>
    </>
  );
}
