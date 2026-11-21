import { Router } from "express";
import { z } from "zod";
import { Notification, SavingsGoal } from "../models/index.js";
import { asyncRoute, bad, parse, id } from "./common.js";

const router = Router();router.get(
  "/savings-goals",
  asyncRoute(async (req, res) =>
    res.json({
      items: await SavingsGoal.find({ userId: req.userId }).sort({
        createdAt: -1,
      }),
    }),
  ),
);
const goalInput = z.object({
  title: z.string().trim().min(1).max(100),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.coerce.date().optional().nullable(),
  status: z.enum(["active", "completed", "paused"]).optional(),
});
router.post(
  "/savings-goals",
  asyncRoute(async (req, res) => {
    const d = parse(goalInput, req.body);
    const item = await SavingsGoal.create({
      ...d,
      userId: req.userId,
      status: d.currentAmount >= d.targetAmount ? "completed" : d.status,
    });
    res.status(201).json({ goal: item });
  }),
);
router.put(
  "/savings-goals/:id",
  asyncRoute(async (req, res) => {
    const d = parse(goalInput, req.body);
    if (d.currentAmount >= d.targetAmount) d.status = "completed";
    const item = await SavingsGoal.findOneAndUpdate(
      { _id: id(req.params.id), userId: req.userId },
      d,
      { new: true, runValidators: true },
    );
    if (!item) throw bad("Savings goal not found.", 404);
    res.json({ goal: item });
  }),
);
router.post(
  "/savings-goals/:id/contributions",
  asyncRoute(async (req, res) => {
    const { amount } = parse(
      z.object({ amount: z.coerce.number().positive() }),
      req.body,
    );
    const item = await SavingsGoal.findOneAndUpdate(
      { _id: id(req.params.id), userId: req.userId, status: "active" },
      [
        {
          $set: {
            currentAmount: {
              $min: [{ $add: ["$currentAmount", amount] }, "$targetAmount"],
            },
          },
        },
      ],
      { new: true },
    );
    if (!item) throw bad("Active savings goal not found.", 404);
    if (item.currentAmount >= item.targetAmount) {
      item.status = "completed";
      await item.save();
      await Notification.create({
        userId: req.userId,
        title: "Savings goal completed",
        message: `You reached your ${item.title} goal.`,
        type: "goal",
      });
    }
    res.json({ goal: item });
  }),
);
router.delete(
  "/savings-goals/:id",
  asyncRoute(async (req, res) => {
    const item = await SavingsGoal.findOneAndDelete({
      _id: id(req.params.id),
      userId: req.userId,
    });
    if (!item) throw bad("Savings goal not found.", 404);
    res.json({ message: "Goal deleted" });
  }),
);
export default router;
