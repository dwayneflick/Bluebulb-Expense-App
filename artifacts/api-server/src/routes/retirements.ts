import { Router, type IRouter } from "express";
import { db, retirementsTable, expensesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSessionUser, requireRole } from "../middleware/auth";

const router: IRouter = Router();

const formatRetirement = (r: typeof retirementsTable.$inferSelect) => ({
  id: r.id,
  expenseId: r.expenseId,
  expenseName: r.expenseName,
  requesterId: r.requesterId,
  requesterName: r.requesterName,
  department: r.department,
  amount: r.amount,
  actualAmount: r.actualAmount,
  purpose: r.purpose,
  status: r.status,
  approverId: r.approverId,
  approverName: r.approverName,
  approvalDate: r.approvalDate,
  rejectionReason: r.rejectionReason,
  attachmentUrl: r.attachmentUrl,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// GET /retirements — filtered by role
router.get("/", async (req, res) => {
  try {
    const actor = getSessionUser(req)!;
    const { requesterId, status } = req.query;
    const retirements = await db.select().from(retirementsTable);
    let filtered = retirements;

    if (actor.role !== "admin") {
      if (actor.role === "requester") {
        filtered = filtered.filter(r => r.requesterId === actor.id);
      } else if (actor.role === "approver_manager" || actor.role === "finance_manager") {
        filtered = filtered.filter(r => r.approverId === actor.id);
      }
    }

    if (requesterId) filtered = filtered.filter(r => r.requesterId === parseInt(requesterId as string));
    if (status) filtered = filtered.filter(r => r.status === status);
    res.json(filtered.map(formatRetirement));
  } catch (error) {
    console.error("Get retirements error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get retirements" });
  }
});

// POST /retirements — requester or admin only
router.post("/", requireRole("requester", "admin"), async (req, res) => {
  try {
    const actor = getSessionUser(req)!;
    const { expenseId, requesterId, actualAmount, purpose, approverId, attachmentUrl } = req.body;

    if (actor.role === "requester" && requesterId !== actor.id) {
      res.status(403).json({ error: "Forbidden", message: "You can only submit retirement for yourself" });
      return;
    }

    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, expenseId)).limit(1);
    const expense = expenses[0];
    if (!expense) {
      res.status(400).json({ error: "Bad Request", message: "Expense not found" });
      return;
    }
    if (expense.status !== "paid") {
      res.status(400).json({ error: "Bad Request", message: "Can only retire paid expenses" });
      return;
    }

    const requesterUsers = await db.select().from(usersTable).where(eq(usersTable.id, requesterId)).limit(1);
    const requester = requesterUsers[0];
    if (!requester) {
      res.status(400).json({ error: "Bad Request", message: "Requester not found" });
      return;
    }

    let approverName = null;
    if (approverId) {
      const approverUsers = await db.select().from(usersTable).where(eq(usersTable.id, approverId)).limit(1);
      approverName = approverUsers[0]?.name || null;
    }

    const result = await db.insert(retirementsTable).values({
      expenseId,
      expenseName: expense.expenseName,
      requesterId,
      requesterName: requester.name,
      department: requester.department,
      amount: expense.amount,
      actualAmount: actualAmount || null,
      purpose,
      status: "pending",
      approverId: approverId || null,
      approverName,
      attachmentUrl: attachmentUrl || null,
    }).returning();

    res.status(201).json(formatRetirement(result[0]));
  } catch (error) {
    console.error("Create retirement error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create retirement" });
  }
});

// GET /retirements/:id — authenticated users (with ownership check)
router.get("/:id", async (req, res) => {
  try {
    const actor = getSessionUser(req)!;
    const id = parseInt(req.params.id);
    const retirements = await db.select().from(retirementsTable).where(eq(retirementsTable.id, id)).limit(1);
    if (!retirements[0]) {
      res.status(404).json({ error: "Not Found", message: "Retirement not found" });
      return;
    }

    const r = retirements[0];
    if (actor.role !== "admin" && actor.role !== "finance_team") {
      if (r.requesterId !== actor.id && r.approverId !== actor.id) {
        res.status(403).json({ error: "Forbidden", message: "Access denied" });
        return;
      }
    }

    res.json(formatRetirement(r));
  } catch (error) {
    console.error("Get retirement error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get retirement" });
  }
});

// POST /retirements/:id/approve — must be the assigned approver
router.post("/:id/approve", requireRole("approver_manager", "finance_manager", "admin"), async (req, res) => {
  try {
    const actor = getSessionUser(req)!;
    const id = parseInt(req.params.id);
    const { action, reason } = req.body;

    const retirements = await db.select().from(retirementsTable).where(eq(retirementsTable.id, id)).limit(1);
    if (!retirements[0]) {
      res.status(404).json({ error: "Not Found", message: "Retirement not found" });
      return;
    }

    const retirement = retirements[0];
    if (actor.role !== "admin" && retirement.approverId !== actor.id) {
      res.status(403).json({ error: "Forbidden", message: "You are not the assigned approver for this retirement" });
      return;
    }

    if (retirement.status !== "pending") {
      res.status(400).json({ error: "Bad Request", message: "Retirement has already been actioned" });
      return;
    }

    const now = new Date().toISOString().split("T")[0];
    let updateData: any = { updatedAt: new Date() };
    if (action === "approve") {
      updateData.status = "approved";
      updateData.approvalDate = now;
    } else if (action === "reject") {
      updateData.status = "rejected";
      updateData.rejectionReason = reason;
    } else {
      res.status(400).json({ error: "Bad Request", message: "Invalid action" });
      return;
    }

    const result = await db.update(retirementsTable).set(updateData).where(eq(retirementsTable.id, id)).returning();
    res.json(formatRetirement(result[0]));
  } catch (error) {
    console.error("Approve retirement error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to process retirement approval" });
  }
});

export default router;
