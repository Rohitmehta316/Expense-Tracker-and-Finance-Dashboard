import { Router } from "express";
import { Notification } from "../models/index.js";
import { asyncRoute, bad, id } from "./common.js";

const router = Router();router.get(
  "/notifications",
  asyncRoute(async (req, res) =>
    res.json({
      items: await Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(100),
    }),
  ),
);
router.patch(
  "/notifications/:id/read",
  asyncRoute(async (req, res) => {
    const item = await Notification.findOneAndUpdate(
      { _id: id(req.params.id), userId: req.userId },
      { isRead: true },
      { new: true },
    );
    if (!item) throw bad("Notification not found.", 404);
    res.json({ notification: item });
  }),
);
router.post(
  "/notifications/read-all",
  asyncRoute(async (req, res) => {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true },
    );
    res.json({ message: "Notifications marked as read" });
  }),
);
export default router;
