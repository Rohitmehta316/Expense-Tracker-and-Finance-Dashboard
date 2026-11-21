import { Router } from "express";
import mongoose from "mongoose";
import { SavingsGoal, Transaction, User, Wallet } from "../models/index.js";
import { asyncRoute } from "./common.js";

const router = Router();async function dashboard(req, res) {
  const now = new Date(),
    monthStart = new Date(now.getFullYear(), now.getMonth(), 1),
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1),
    user = await User.findById(req.userId).select("currency");
  const walletTotal = await Wallet.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
    {
      $group: {
        _id: "$currency",
        balance: { $sum: "$balance" },
        wallets: { $push: { currency: "$currency", balance: "$balance" } },
      },
    },
  ]);
  const sums = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.userId),
        type: { $in: ["income", "expense"] },
        date: { $gte: prevStart },
      },
    },
    {
      $lookup: {
        from: "wallets",
        localField: "walletId",
        foreignField: "_id",
        as: "wallet",
      },
    },
    { $unwind: "$wallet" },
    { $match: { "wallet.currency": user?.currency || "INR" } },
    {
      $group: {
        _id: {
          month: {
            $cond: [{ $gte: ["$date", monthStart] }, "current", "previous"],
          },
          type: "$type",
        },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const value = (m, t) =>
    sums.find((x) => x._id.month === m && x._id.type === t)?.amount || 0;
  const income = value("current", "income"),
    expenses = value("current", "expense"),
    prevIncome = value("previous", "income"),
    prevExpenses = value("previous", "expense");
  const series = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.userId),
        date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        type: { $in: ["income", "expense"] },
      },
    },
    {
      $lookup: {
        from: "wallets",
        localField: "walletId",
        foreignField: "_id",
        as: "wallet",
      },
    },
    { $unwind: "$wallet" },
    { $match: { "wallet.currency": user?.currency || "INR" } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const find = (t) =>
      series.find(
        (x) =>
          x._id.year === d.getFullYear() &&
          x._id.month === d.getMonth() + 1 &&
          x._id.type === t,
      )?.amount || 0;
    return {
      month: d.toLocaleString("en", { month: "short" }),
      income: find("income"),
      expenses: find("expense"),
    };
  });
  const categories = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.userId),
        type: "expense",
        date: { $gte: monthStart },
      },
    },
    {
      $lookup: {
        from: "wallets",
        localField: "walletId",
        foreignField: "_id",
        as: "wallet",
      },
    },
    { $unwind: "$wallet" },
    { $match: { "wallet.currency": user?.currency || "INR" } },
    { $group: { _id: "$categoryId", amount: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$category.name", "Other"] },
        color: { $ifNull: ["$category.color", "#6366F1"] },
        amount: 1,
      },
    },
    { $sort: { amount: -1 } },
  ]);
  const [recent, goals] = await Promise.all([
    Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(8)
      .populate("categoryId", "name color")
      .populate("walletId", "name"),
    SavingsGoal.find({ userId: req.userId, status: "active" }).limit(4),
  ]);
  res.json({
    summary: {
      wallets: walletTotal.flatMap((x) => x.wallets),
      income,
      expenses,
      savings: Math.max(0, income - expenses),
      previous: { income: prevIncome, expenses: prevExpenses },
      currencies: [
        ...new Set(
          walletTotal.flatMap((x) => x.wallets.map((w) => w.currency)),
        ),
      ],
    },
    series: byMonth,
    categories,
    recent,
    goals,
  });
}
router.get("/dashboard/summary", asyncRoute(dashboard));
router.get("/dashboard/analytics", asyncRoute(dashboard));
router.get(
  "/dashboard/recent-transactions",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Transaction.find({ userId: req.userId })
        .sort({ date: -1 })
        .limit(20)
        .populate("categoryId walletId"),
    }),
  ),
);
router.get(
  "/reports/monthly",
  asyncRoute(async (req, res) => report(req, res, "month")),
);
router.get(
  "/reports/yearly",
  asyncRoute(async (req, res) => report(req, res, "year")),
);
router.get(
  "/reports/categories",
  asyncRoute(async (req, res) => report(req, res, "category")),
);
async function report(req, res, mode) {
  const year = Number(req.query.year) || new Date().getFullYear(),
    month = Number(req.query.month) || new Date().getMonth() + 1;
  const match = {
    userId: new mongoose.Types.ObjectId(req.userId),
    type: { $in: ["income", "expense"] },
  };
  if (mode === "month") {
    match.date = {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    };
  } else if (mode === "year") {
    match.date = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) };
  }
  const group =
    mode === "category"
      ? { type: "$type", categoryId: "$categoryId" }
      : {
          period:
            mode === "month" ? { $dayOfMonth: "$date" } : { $month: "$date" },
          type: "$type",
        };
  group.currency = "$wallet.currency";
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "wallets",
        localField: "walletId",
        foreignField: "_id",
        as: "wallet",
      },
    },
    { $unwind: "$wallet" },
    { $group: { _id: group, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ];
  if (mode === "category")
    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "_id.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
          categoryColor: { $ifNull: ["$category.color", "#6366F1"] },
        },
      },
    );
  pipeline.push({ $sort: { "_id.period": 1, "_id.currency": 1 } });
  const items = await Transaction.aggregate(pipeline);
  res.json({ year, month, items });
}
export default router;
