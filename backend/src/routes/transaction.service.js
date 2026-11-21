import mongoose from "mongoose";
import { z } from "zod";
import { Budget, Category, Notification, Transaction, Wallet } from "../models/index.js";
import { bad, id } from "./common.js";
const transactionInput = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive().finite(),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.string().optional().nullable(),
  walletId: z.string(),
  toWalletId: z.string().optional().nullable(),
  date: z.coerce.date(),
  description: z.string().max(500).optional(),
  paymentMethod: z.string().max(80).optional(),
  notes: z.string().max(1000).optional(),
});
async function ownedWallet(userId, walletId, session) {
  const w = await Wallet.findOne({ _id: id(walletId), userId }).session(
    session || null,
  );
  if (!w) throw bad("Wallet not found.", 404);
  return w;
}
async function adjustWallets(userId, oldData, newData, session) {
  const updates = new Map();
  const add = async (walletId, delta) => {
    if (!walletId) return;
    const key = String(walletId);
    updates.set(key, (updates.get(key) || 0) + delta);
  };
  if (oldData) {
    if (oldData.type === "income") await add(oldData.walletId, -oldData.amount);
    else if (oldData.type === "expense")
      await add(oldData.walletId, oldData.amount);
    else {
      await add(oldData.walletId, oldData.amount);
      await add(oldData.toWalletId, -oldData.amount);
    }
  }
  if (newData) {
    if (newData.type === "income") await add(newData.walletId, newData.amount);
    else if (newData.type === "expense")
      await add(newData.walletId, -newData.amount);
    else {
      if (
        !newData.toWalletId ||
        String(newData.toWalletId) === String(newData.walletId)
      )
        throw bad("Choose a different destination wallet.");
      await add(newData.walletId, -newData.amount);
      await add(newData.toWalletId, newData.amount);
    }
  }
  const checked = new Map();
  for (const [walletId, delta] of updates) {
    const wallet = await ownedWallet(userId, walletId, session);
    checked.set(walletId, wallet);
    if (delta < 0 && wallet.balance < -delta)
      throw bad("Wallet has insufficient funds for this transaction.");
  }
  if (newData?.type === "transfer") {
    const from = checked.get(String(newData.walletId)),
      to = checked.get(String(newData.toWalletId));
    if (from.currency !== to.currency)
      throw bad("Transfers between different currencies are not supported.");
  }
  for (const [walletId, delta] of updates) {
    const result = await Wallet.updateOne(
      {
        _id: walletId,
        userId,
        ...(delta < 0 ? { balance: { $gte: -delta } } : {}),
      },
      { $inc: { balance: delta } },
      { session },
    );
    if (!result.modifiedCount)
      throw bad("Wallet has insufficient funds for this transaction.");
  }
}
async function validateCategory(userId, d, session) {
  if (!d.categoryId) return;
  if (d.type === "transfer") throw bad("Transfers cannot have a category.");
  const category = await Category.findOne({
    _id: id(d.categoryId),
    userId,
    type: d.type,
  }).session(session || null);
  if (!category)
    throw bad("Category not found for this transaction type.", 404);
}
async function checkBudgetAlerts(userId, transaction) {
  if (transaction.type !== "expense") return;
  const date = new Date(transaction.date),
    month = date.getMonth() + 1,
    year = date.getFullYear(),
    start = new Date(year, month - 1, 1),
    end = new Date(year, month, 1),
    budgets = await Budget.find({
      userId,
      month,
      year,
      $or: [
        { categoryId: transaction.categoryId || null },
        { categoryId: null },
      ],
    });
  for (const budget of budgets) {
    const match = { userId, type: "expense", date: { $gte: start, $lt: end } };
    if (budget.categoryId) match.categoryId = budget.categoryId;
    const [result] = await Transaction.aggregate([
      { $match: { ...match, userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, spent: { $sum: "$amount" } } },
    ]);
    const spent = result?.spent || 0;
    if (spent >= (budget.amount * budget.threshold) / 100) {
      const title =
        spent >= budget.amount ? "Budget exceeded" : "Budget threshold reached";
      const category = budget.categoryId
        ? await Category.findOne({ _id: budget.categoryId, userId })
        : null;
      const message = `${category?.name || budget.name || "Monthly"} budget is ${Math.round((spent / budget.amount) * 100)}% used (${spent.toFixed(2)} of ${budget.amount.toFixed(2)}).`;
      const recent = await Notification.exists({
        userId,
        title,
        message,
        createdAt: { $gte: start },
      });
      if (!recent)
        await Notification.create({ userId, title, message, type: "budget" });
    }
  }
}
export { transactionInput, ownedWallet, adjustWallets, validateCategory, checkBudgetAlerts };
