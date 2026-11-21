import { Router } from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/index.js";
import { asyncRoute, bad, parse, id } from "./common.js";
import { transactionInput, adjustWallets, validateCategory, checkBudgetAlerts } from "./transaction.service.js";

const router = Router();router.get(
  "/transactions",
  asyncRoute(async (req, res) => {
    const {
      type,
      categoryId,
      from,
      to,
      search,
      sort = "date",
      order = "desc",
      page = "1",
      limit = "20",
    } = req.query;
    const q = { userId: req.userId };
    if (type) q.type = type;
    if (categoryId) q.categoryId = id(categoryId);
    if (from || to)
      q.date = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    if (search)
      q.title = {
        $regex: String(search)
          .slice(0, 80)
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    const p = Math.max(1, +page || 1),
      n = Math.min(100, Math.max(1, +limit || 20));
    const [items, total] = await Promise.all([
      Transaction.find(q)
        .sort({
          [sort === "amount" ? "amount" : "date"]: order === "asc" ? 1 : -1,
        })
        .skip((p - 1) * n)
        .limit(n)
        .populate("categoryId", "name color")
        .populate("walletId", "name")
        .populate("toWalletId", "name"),
      Transaction.countDocuments(q),
    ]);
    res.json({ items, total, page: p, pages: Math.ceil(total / n) });
  }),
);
router.post(
  "/transactions",
  asyncRoute(async (req, res) => {
    const d = parse(transactionInput, req.body);
    const session = await mongoose.startSession();
    let doc;
    try {
      await session.withTransaction(async () => {
        await validateCategory(req.userId, d, session);
        await adjustWallets(req.userId, null, d, session);
        [doc] = await Transaction.create([{ ...d, userId: req.userId }], {
          session,
        });
      });
    } finally {
      await session.endSession();
    }
    await checkBudgetAlerts(req.userId, doc);
    res.status(201).json({ transaction: doc });
  }),
);
router.get(
  "/transactions/:id",
  asyncRoute(async (req, res) => {
    const item = await Transaction.findOne({
      _id: id(req.params.id),
      userId: req.userId,
    }).populate("categoryId walletId toWalletId");
    if (!item) throw bad("Transaction not found.", 404);
    res.json({ transaction: item });
  }),
);
router.put(
  "/transactions/:id",
  asyncRoute(async (req, res) => {
    const d = parse(transactionInput, req.body);
    const session = await mongoose.startSession();
    let item;
    try {
      await session.withTransaction(async () => {
        const old = await Transaction.findOne({
          _id: id(req.params.id),
          userId: req.userId,
        }).session(session);
        if (!old) throw bad("Transaction not found.", 404);
        await validateCategory(req.userId, d, session);
        await adjustWallets(req.userId, old.toObject(), d, session);
        Object.assign(old, d);
        await old.save({ session });
        item = old;
      });
    } finally {
      await session.endSession();
    }
    res.json({ transaction: item });
  }),
);
router.delete(
  "/transactions/:id",
  asyncRoute(async (req, res) => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const old = await Transaction.findOne({
          _id: id(req.params.id),
          userId: req.userId,
        }).session(session);
        if (!old) throw bad("Transaction not found.", 404);
        await adjustWallets(req.userId, old.toObject(), null, session);
        await old.deleteOne({ session });
      });
    } finally {
      await session.endSession();
    }
    res.json({ message: "Transaction deleted" });
  }),
);
router.get(
  "/income",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Transaction.find({ userId: req.userId, type: "income" })
        .sort({ date: -1 })
        .limit(200)
        .populate("categoryId walletId"),
    }),
  ),
);
router.post(
  "/income",
  asyncRoute(async (req, res) => {
    req.body.type = "income";
    req.body.toWalletId = null;
    const d = parse(transactionInput, req.body),
      session = await mongoose.startSession();
    let transaction;
    try {
      await session.withTransaction(async () => {
        await validateCategory(req.userId, d, session);
        await adjustWallets(req.userId, null, d, session);
        [transaction] = await Transaction.create(
          [{ ...d, userId: req.userId }],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({ transaction });
  }),
);
router.get(
  "/expenses",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Transaction.find({ userId: req.userId, type: "expense" })
        .sort({ date: -1 })
        .limit(200)
        .populate("categoryId walletId"),
    }),
  ),
);
router.post(
  "/expenses",
  asyncRoute(async (req, res) => {
    req.body.type = "expense";
    req.body.toWalletId = null;
    const d = parse(transactionInput, req.body),
      session = await mongoose.startSession();
    let transaction;
    try {
      await session.withTransaction(async () => {
        await validateCategory(req.userId, d, session);
        await adjustWallets(req.userId, null, d, session);
        [transaction] = await Transaction.create(
          [{ ...d, userId: req.userId }],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    await checkBudgetAlerts(req.userId, transaction);
    res.status(201).json({ transaction });
  }),
);
export default router;
