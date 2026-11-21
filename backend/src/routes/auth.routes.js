import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, Wallet, Category } from "../models/index.js";
import { issueCookie } from "../middleware/auth.js";
import { asyncRoute, bad, parse } from "./common.js";

const router = Router();
const authBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  remember: z.boolean().optional(),
});router.post(
  "/auth/register",
  asyncRoute(async (req, res) => {
    const d = parse(
      authBody.extend({ name: z.string().trim().min(2).max(80) }),
      req.body,
    );
    if (await User.exists({ email: d.email.toLowerCase() }))
      throw bad("An account with this email already exists.", 409);
    const user = await User.create({
      name: d.name,
      email: d.email,
      password: await bcrypt.hash(d.password, 12),
    });
    await Promise.all(
      [
        "Salary",
        "Freelancing",
        "Business",
        "Investments",
        "Gifts",
        "Other income",
      ]
        .map((name) =>
          Category.create({
            userId: user.id,
            name,
            type: "income",
            isDefault: true,
          }),
        )
        .concat(
          [
            "Food",
            "Shopping",
            "Transportation",
            "Rent",
            "Education",
            "Healthcare",
            "Entertainment",
            "Bills",
            "Travel",
            "Other",
          ].map((name) =>
            Category.create({
              userId: user.id,
              name,
              type: "expense",
              isDefault: true,
            }),
          ),
        ),
    );
    await Wallet.create({
      userId: user.id,
      name: "Cash Wallet",
      type: "cash",
      currency: user.currency,
    });
    issueCookie(res, user.id);
    res
      .status(201)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          theme: user.theme,
        },
      });
  }),
);
router.post(
  "/auth/login",
  asyncRoute(async (req, res) => {
    const d = parse(authBody, req.body);
    const user = await User.findOne({ email: d.email.toLowerCase() }).select(
      "+password",
    );
    if (!user || !(await bcrypt.compare(d.password, user.password)))
      throw bad("Email or password is incorrect.", 401);
    issueCookie(res, user.id, d.remember !== false);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
      },
    });
  }),
);
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("fintrack_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Signed out" });
});
export default router;
