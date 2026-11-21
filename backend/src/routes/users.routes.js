import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/index.js";
import { asyncRoute, bad, parse } from "./common.js";

const router = Router();router.get(
  "/auth/me",
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.userId).select("-password");
    if (!user) throw bad("Account not found.", 404);
    res.json({ user });
  }),
);
router.post("/auth/forgot-password", (_req, _res, next) =>
  next(
    bad(
      "Password recovery is not configured because no email delivery provider is connected.",
      501,
    ),
  ),
);
router.post("/auth/reset-password", (_req, res, next) =>
  next(bad("Password reset delivery is not configured yet.", 501)),
);
router.get(
  "/users/profile",
  asyncRoute(async (req, res) =>
    res.json({ user: await User.findById(req.userId).select("-password") }),
  ),
);
router.put(
  "/users/profile",
  asyncRoute(async (req, res) => {
    const d = parse(
      z.object({
        name: z.string().trim().min(2).max(80).optional(),
        email: z.string().email().optional(),
        currency: z.string().length(3).optional(),
        theme: z.enum(["light", "dark"]).optional(),
        profileImage: z.string().max(1000000).optional(),
        preferences: z
          .object({
            dateFormat: z.string().optional(),
            notifications: z.boolean().optional(),
          })
          .optional(),
      }),
      req.body,
    );
    if (
      d.email &&
      (await User.exists({
        email: d.email.toLowerCase(),
        _id: { $ne: req.userId },
      }))
    )
      throw bad("Email is already in use.", 409);
    res.json({
      user: await User.findByIdAndUpdate(
        req.userId,
        { $set: { ...d, email: d.email?.toLowerCase() } },
        { new: true, runValidators: true },
      ).select("-password"),
    });
  }),
);
router.put(
  "/users/change-password",
  asyncRoute(async (req, res) => {
    const d = parse(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).max(128),
      }),
      req.body,
    );
    const user = await User.findById(req.userId).select("+password");
    if (!(await bcrypt.compare(d.currentPassword, user.password)))
      throw bad("Current password is incorrect.", 400);
    user.password = await bcrypt.hash(d.newPassword, 12);
    await user.save();
    res.json({ message: "Password updated" });
  }),
);
export default router;
