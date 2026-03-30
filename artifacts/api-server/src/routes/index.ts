import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import expensesRouter from "./expenses";
import retirementsRouter from "./retirements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

// All routes below require a valid session
router.use(requireAuth);

router.use("/users", usersRouter);
router.use("/expenses", expensesRouter);
router.use("/retirements", retirementsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
