import { Router, type IRouter } from "express";
import { db, retirementsTable, expensesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

router.get("/", async (req, res) => {
  try {
    const { requesterId, status } = req.query;
    const retirements = await db.select().from(retirementsTable);
    let filtered = retirements;
    if (requesterId) filtered = filtered.filter(r => r.requesterId === parseInt(requesterId as string));
    if (status) filtered = filtered.filter(r => r.status === status);
    res.json(filtered.map(formatRetirement));
  } catch (error) {
    console.error("Get retirements error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get retirements" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { expenseId, requesterId, actualAmount, purpose, approverId, attachmentUrl } = req.body;

    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, expenseId)).limit(1);
    const expense = expenses[0];
    if (!expense) {
      res.status(400).json({ error: "Bad Request", message: "Expense not found" });
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

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const retirements = await db.select().from(retirementsTable).where(eq(retirementsTable.id, id)).limit(1);
    if (!retirements[0]) {
      res.status(404).json({ error: "Not Found", message: "Retirement not found" });
      return;
    }
    res.json(formatRetirement(retirements[0]));
  } catch (error) {
    console.error("Get retirement error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get retirement" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, reason, approverId } = req.body;
    const now = new Date().toISOString().split("T")[0];

    let updateData: any = { updatedAt: new Date() };
    if (action === "approve") {
      updateData.status = "approved";
      updateData.approvalDate = now;
    } else {
      updateData.status = "rejected";
      updateData.rejectionReason = reason;
    }

    const result = await db.update(retirementsTable).set(updateData).where(eq(retirementsTable.id, id)).returning();
    if (!result[0]) {
      res.status(404).json({ error: "Not Found", message: "Retirement not found" });
      return;
    }
    res.json(formatRetirement(result[0]));
  } catch (error) {
    console.error("Approve retirement error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to process retirement approval" });
  }
});

export default router;
