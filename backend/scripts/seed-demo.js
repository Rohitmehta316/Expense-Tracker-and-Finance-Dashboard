import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import {
  Budget,
  Category,
  Notification,
  SavingsGoal,
  Transaction,
  User,
  Wallet,
} from "../src/models/index.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const DEMO_EMAIL = "demo@fintrack.example.com";
const DEMO_PASSWORD = "FinTrackDemo2026!";
const SEED_NOTE = "FinTrack demo sample data";
const COLORS = {
  Salary: "#16A34A",
  Freelancing: "#6366F1",
  Food: "#F97316",
  Rent: "#6366F1",
  Bills: "#0EA5E9",
  Transportation: "#14B8A6",
  Shopping: "#EC4899",
  Entertainment: "#8B5CF6",
  Healthcare: "#EF4444",
  "Other income": "#64748B",
};

function dateAt(monthOffset, day) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const lastDay = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const dayLimit = monthOffset === 0 ? Math.min(lastDay, now.getDate()) : lastDay;
  return new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    Math.min(day, dayLimit),
    12,
  );
}

async function seedDemo() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("Set MONGODB_URI and JWT_SECRET in backend/.env first.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo data seeding is disabled in production.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const session = await mongoose.startSession();
  let alreadySeeded = false;

  try {
    await session.withTransaction(async () => {
      let user = await User.findOne({ email: DEMO_EMAIL }).session(session);
      if (user && user.name !== "FinTrack Demo") {
        throw new Error(`Refusing to change existing account ${DEMO_EMAIL}.`);
      }
      if (user) {
        const [hasSeedTransactions, hasOtherTransactions, hasBudgets, hasGoals] = await Promise.all([
          Transaction.exists({ userId: user._id, notes: SEED_NOTE }).session(
            session,
          ),
          Transaction.exists({ userId: user._id, notes: { $ne: SEED_NOTE } }).session(
            session,
          ),
          Budget.exists({ userId: user._id }).session(session),
          SavingsGoal.exists({ userId: user._id }).session(session),
        ]);
        if (hasSeedTransactions) {
          alreadySeeded = true;
          return;
        }
        if (hasOtherTransactions || hasBudgets || hasGoals) {
          throw new Error(
            "The demo account already contains finance data; leaving it unchanged.",
          );
        }
      } else {
        [user] = await User.create(
          [
            {
              name: "FinTrack Demo",
              email: DEMO_EMAIL,
              password: await bcrypt.hash(DEMO_PASSWORD, 12),
              currency: "INR",
              theme: "light",
            },
          ],
          { session, ordered: true },
        );
      }

      const categories = {};
      const categoryDefinitions = [
        ["Salary", "income"],
        ["Freelancing", "income"],
        ["Other income", "income"],
        ["Food", "expense"],
        ["Rent", "expense"],
        ["Bills", "expense"],
        ["Transportation", "expense"],
        ["Shopping", "expense"],
        ["Entertainment", "expense"],
        ["Healthcare", "expense"],
      ];
      for (const [name, type] of categoryDefinitions) {
        let category = await Category.findOne({
          userId: user._id,
          name,
          type,
        }).session(session);
        if (!category) {
          [category] = await Category.create(
            [
              {
                userId: user._id,
                name,
                type,
                color: COLORS[name],
                isDefault: true,
              },
            ],
            { session, ordered: true },
          );
        }
        categories[name] = category;
      }

      const walletDefinitions = [
        ["Main Bank", "bank", "#6366F1", 150000],
        ["Cash Wallet", "cash", "#16A34A", 12000],
        ["Savings Account", "savings", "#0EA5E9", 0],
      ];
      const wallets = {};
      for (const [name, type, color, openingBalance] of walletDefinitions) {
        let wallet = await Wallet.findOne({ userId: user._id, name }).session(
          session,
        );
        if (!wallet) {
          [wallet] = await Wallet.create(
            [{ userId: user._id, name, type, currency: "INR", color, balance: openingBalance }],
            { session, ordered: true },
          );
        } else if (wallet.balance !== 0) {
          throw new Error(
            `The demo account wallet “${name}” already has a balance; leaving it unchanged.`,
          );
        } else {
          wallet.balance = openingBalance;
        }
        wallets[name] = wallet;
      }

      const walletBalances = new Map(
        Object.values(wallets).map((wallet) => [String(wallet._id), wallet.balance]),
      );
      const transactions = [];
      function addTransaction({
        title,
        amount,
        type,
        category,
        wallet,
        date,
        toWallet,
      }) {
        transactions.push({
          userId: user._id,
          title,
          amount,
          type,
          categoryId: category?._id,
          walletId: wallet._id,
          toWalletId: toWallet?._id,
          date,
          paymentMethod: wallet.type === "cash" ? "Cash" : "Bank transfer",
          notes: SEED_NOTE,
        });
        const fromId = String(wallet._id);
        if (type === "income") {
          walletBalances.set(fromId, walletBalances.get(fromId) + amount);
        } else if (type === "expense") {
          walletBalances.set(fromId, walletBalances.get(fromId) - amount);
        } else {
          const toId = String(toWallet._id);
          walletBalances.set(fromId, walletBalances.get(fromId) - amount);
          walletBalances.set(toId, walletBalances.get(toId) + amount);
        }
      }

      const salaryAmounts = [78000, 81000, 80000, 85000, 82000, 88000];
      for (let i = 0; i < 6; i += 1) {
        const offset = i - 5;
        addTransaction({
          title: "Monthly salary",
          amount: salaryAmounts[i],
          type: "income",
          category: categories.Salary,
          wallet: wallets["Main Bank"],
          date: dateAt(offset, 1),
        });
        if ([0, 2, 4, 5].includes(i)) {
          addTransaction({
            title: "Freelance project",
            amount: [12000, 18000, 22000, 16000][[0, 2, 4, 5].indexOf(i)],
            type: "income",
            category: categories.Freelancing,
            wallet: wallets["Main Bank"],
            date: dateAt(offset, 12),
          });
        }

        const expenses = [
          ["Monthly rent", 22000, "Rent", "Main Bank", 2],
          ["Groceries · weekly shop", 3500, "Food", "Cash Wallet", 4],
          ["Groceries · fresh market", 3200, "Food", "Cash Wallet", 10],
          ["Groceries · household", 2800, "Food", "Main Bank", 16],
          ["Groceries · top-up", 2400, "Food", "Cash Wallet", 20],
          ["Electricity and internet", 4500, "Bills", "Main Bank", 5],
          ["Local commute", 1200, "Transportation", "Cash Wallet", 8],
          ["Transit pass", 900, "Transportation", "Cash Wallet", 14],
          ["Taxi and rideshare", 1100, "Transportation", "Main Bank", 19],
          ["Dining out", 2200, "Entertainment", "Cash Wallet", 17],
        ];
        for (const [title, amount, category, wallet, day] of expenses) {
          addTransaction({
            title,
            amount,
            type: "expense",
            category: categories[category],
            wallet: wallets[wallet],
            date: dateAt(offset, day),
          });
        }
        if (i % 2 === 0) {
          addTransaction({
            title: "Clothing and essentials",
            amount: 5600,
            type: "expense",
            category: categories.Shopping,
            wallet: wallets["Main Bank"],
            date: dateAt(offset, 22),
          });
        }
        if (i === 2 || i === 5) {
          addTransaction({
            title: "Pharmacy and health check",
            amount: 1850,
            type: "expense",
            category: categories.Healthcare,
            wallet: wallets["Main Bank"],
            date: dateAt(offset, 24),
          });
        }
        if (i > 0) {
          addTransaction({
            title: "Monthly savings transfer",
            amount: 8000,
            type: "transfer",
            wallet: wallets["Main Bank"],
            toWallet: wallets["Savings Account"],
            date: dateAt(offset, 25),
          });
        }
      }

      await Transaction.insertMany(transactions, { session, ordered: true });
      for (const wallet of Object.values(wallets)) {
        wallet.balance = walletBalances.get(String(wallet._id));
        await wallet.save({ session });
      }

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      for (const [categoryName, amount, threshold] of [
        ["Food", 14000, 80],
        ["Rent", 24000, 90],
        ["Transportation", 4000, 80],
        ["Bills", 6000, 85],
      ]) {
        await Budget.create(
          [
            {
              userId: user._id,
              categoryId: categories[categoryName]._id,
              amount,
              threshold,
              month,
              year,
            },
          ],
          { session, ordered: true },
        );
      }

      await SavingsGoal.create(
        [
          {
            userId: user._id,
            title: "New laptop",
            targetAmount: 60000,
            currentAmount: 25000,
            targetDate: dateAt(3, 1),
          },
          {
            userId: user._id,
            title: "Weekend getaway",
            targetAmount: 30000,
            currentAmount: 11500,
            targetDate: dateAt(5, 1),
          },
        ],
          { session, ordered: true },
      );

      await Notification.create(
        [
          {
            userId: user._id,
            title: "Demo budget alert",
            message: "Your current-month Food budget is close to its limit.",
            type: "budget",
            isRead: false,
          },
        ],
          { session, ordered: true },
      );
    });
  } finally {
    await session.endSession();
  }

  if (alreadySeeded) {
    console.log("Demo data is already present; no changes made.");
  } else {
    console.log("FinTrack demo data added.");
  }
  console.log(`Login email: ${DEMO_EMAIL}`);
  console.log(`Login password: ${DEMO_PASSWORD}`);
}

seedDemo()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
