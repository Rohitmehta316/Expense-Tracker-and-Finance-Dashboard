import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Budget, Category, Transaction } from "../models/index.js";
import { asyncRoute, bad, parse, id } from "./common.js";

const router = Router();router.get(
  "/budgets",
  asyncRoute(async (req, res) => {
    const items = await Budget.find({ userId: req.userId })
      .populate("categoryId", "name color")
      .sort({ year: -1, month: -1 });
    const mapped = await Promise.all(
      items.map(async (b) => {
        const start = new Date(b.year, b.month - 1, 1),
          end = new Date(b.year, b.month, 1),
          match = {
            userId: req.userId,
            type: "expense",
            date: { $gte: start, $lt: end },
          };
        if (b.categoryId) match.categoryId = b.categoryId._id;
        const result = await Transaction.aggregate([
          {
            $match: {
              ...match,
              userId: new mongoose.Types.ObjectId(req.userId),
            },
          },
          { $group: { _id: null, spent: { $sum: "$amount" } } },
        ]);
        return { ...b.toObject(), spent: result[0]?.spent || 0 };
      }),
    );
    res.json({ items: mapped });
  }),
);
const budgetInput = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().max(60).optional(),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  threshold: z.coerce.number().int().min(1).max(100).default(80),
});
router.post(
  "/budgets",
  asyncRoute(async (req, res) => {
    const d = parse(budgetInput, req.body);
    if (
      d.categoryId &&
      !(await Category.exists({
        _id: id(d.categoryId),
        userId: req.userId,
        type: "expense",
      }))
    )
      throw bad("Expense category not found.", 404);
    const item = await Budget.create({ ...d, userId: req.userId });
    res.status(201).json({ budget: item });
  }),
);
router.put(
  "/budgets/:id",
  asyncRoute(async (req, res) => {
    const d = parse(budgetInput, req.body);
    if (
      d.categoryId &&
      !(await Category.exists({
        _id: id(d.categoryId),
        userId: req.userId,
        type: "expense",
      }))
    )
      throw bad("Expense category not found.", 404);
    const item = await Budget.findOneAndUpdate(
      { _id: id(req.params.id), userId: req.userId },
      d,
      { new: true, runValidators: true },
    );
    if (!item) throw bad("Budget not found.", 404);
    res.json({ budget: item });
  }),
);
router.delete(
  "/budgets/:id",
  asyncRoute(async (req, res) => {
    const item = await Budget.findOneAndDelete({
      _id: id(req.params.id),
      userId: req.userId,
    });
    if (!item) throw bad("Budget not found.", 404);
    res.json({ message: "Budget deleted" });
  }),
);
export default router;
