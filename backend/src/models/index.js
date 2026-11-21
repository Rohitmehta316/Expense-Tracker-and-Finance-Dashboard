import mongoose from "mongoose";
const { Schema, model } = mongoose;
const opts = { timestamps: true };
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    profileImage: String,
    currency: { type: String, default: "INR" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    preferences: {
      dateFormat: { type: String, default: "dd MMM yyyy" },
      notifications: { type: Boolean, default: true },
    },
  },
  opts,
);
const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cash", "bank", "savings", "digital"],
      default: "cash",
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    color: { type: String, default: "#6366F1" },
  },
  opts,
);
const categorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    icon: String,
    color: { type: String, default: "#6366F1" },
    isDefault: { type: Boolean, default: false },
  },
  opts,
);
const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    toWalletId: { type: Schema.Types.ObjectId, ref: "Wallet" },
    date: { type: Date, required: true },
    description: String,
    paymentMethod: String,
    notes: String,
  },
  opts,
);
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
const budgetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    name: String,
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    threshold: { type: Number, default: 80, min: 1, max: 100 },
  },
  opts,
);
budgetSchema.index(
  { userId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true, sparse: true },
);
const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: Date,
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
  },
  opts,
);
const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: String,
    type: {
      type: String,
      enum: ["budget", "payment", "goal", "transaction", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
  },
  opts,
);
export const User = model("User", userSchema);
export const Wallet = model("Wallet", walletSchema);
export const Category = model("Category", categorySchema);
export const Transaction = model("Transaction", transactionSchema);
export const Budget = model("Budget", budgetSchema);
export const SavingsGoal = model("SavingsGoal", goalSchema);
export const Notification = model("Notification", notificationSchema);
