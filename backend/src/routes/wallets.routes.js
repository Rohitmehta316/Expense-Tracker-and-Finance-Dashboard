import { Router } from "express";
import { z } from "zod";
import { Category, Transaction, Wallet } from "../models/index.js";
import { asyncRoute, bad, parse, id } from "./common.js";

const router = Router();const walletInput = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["cash", "bank", "savings", "digital"]).default("cash"),
  currency: z.string().length(3).default("INR"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
router.get(
  "/wallets",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Wallet.find({ userId: req.userId }).sort({ createdAt: 1 }),
    }),
  ),
);
router.post(
  "/wallets",
  asyncRoute(async (req, res) => {
    const d = parse(walletInput, req.body);
    const item = await Wallet.create({ ...d, userId: req.userId });
    res.status(201).json({ wallet: item });
  }),
);
router.put(
  "/wallets/:id",
  asyncRoute(async (req, res) => {
    const walletId = id(req.params.id),
      d = parse(walletInput, req.body),
      current = await Wallet.findOne({ _id: walletId, userId: req.userId });
    if (!current) throw bad("Wallet not found.", 404);
    if (
      current.currency !== d.currency &&
      (await Transaction.exists({
        userId: req.userId,
        $or: [{ walletId }, { toWalletId: walletId }],
      }))
    )
      throw bad(
        "Wallet currency cannot change after transactions are recorded.",
      );
    const item = await Wallet.findOneAndUpdate(
      { _id: walletId, userId: req.userId },
      d,
      { new: true, runValidators: true },
    );
    res.json({ wallet: item });
  }),
);
router.delete(
  "/wallets/:id",
  asyncRoute(async (req, res) => {
    const walletId = id(req.params.id);
    if (
      await Transaction.exists({
        userId: req.userId,
        $or: [{ walletId }, { toWalletId: walletId }],
      })
    )
      throw bad(
        "Move or delete this wallet’s transactions before removing it.",
        409,
      );
    const deleted = await Wallet.findOneAndDelete({
      _id: walletId,
      userId: req.userId,
    });
    if (!deleted) throw bad("Wallet not found.", 404);
    res.json({ message: "Wallet deleted" });
  }),
);
router.get(
  "/categories",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Category.find({ userId: req.userId }).sort({
        type: 1,
        name: 1,
      }),
    }),
  ),
);
router.post(
  "/categories",
  asyncRoute(async (req, res) => {
    const d = parse(
      z.object({
        name: z.string().trim().min(1).max(60),
        type: z.enum(["income", "expense"]),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
      req.body,
    );
    const item = await Category.create({ ...d, userId: req.userId });
    res.status(201).json({ category: item });
  }),
);
router.delete(
  "/categories/:id",
  asyncRoute(async (req, res) => {
    const categoryId = id(req.params.id);
    if (await Transaction.exists({ userId: req.userId, categoryId }))
      throw bad("This category is in use by transactions.", 409);
    const deleted = await Category.findOneAndDelete({
      _id: categoryId,
      userId: req.userId,
      isDefault: false,
    });
    if (!deleted) throw bad("Custom category not found.", 404);
    res.json({ message: "Category deleted" });
  }),
);
export default router;
