import { Router } from "express";
import { auth } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import transactionsRoutes from "./transactions.routes.js";
import walletsRoutes from "./wallets.routes.js";
import budgetsRoutes from "./budgets.routes.js";
import savingsGoalsRoutes from "./savings-goals.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

// Public account endpoints are mounted before authentication.
router.use(authRoutes);
router.use(auth);

// Every finance router below is protected and scopes data to req.userId.
router.use(usersRoutes);
router.use(transactionsRoutes);
router.use(walletsRoutes);
router.use(budgetsRoutes);
router.use(savingsGoalsRoutes);
router.use(notificationsRoutes);
router.use(dashboardRoutes);

export default router;