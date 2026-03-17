import { Router, type IRouter } from "express";
import { db, expensesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const formatExpense = (e: typeof expensesTable.$inferSelect) => ({
  id: e.id,
  expenseName: e.expenseName,
  expenseType: e.expenseType,
  purpose: e.purpose,
  otherInfo: e.otherInfo,
  department: e.department,
  requesterId: e.requesterId,
  requesterName: e.requesterName,
  approverId: e.approverId,
  approverName: e.approverName,
  internalControlId: e.internalControlId,
  internalControlName: e.internalControlName,
  financeManagerId: e.financeManagerId,
  financeManagerName: e.financeManagerName,
  requestDate: e.requestDate,
  dueDate: e.dueDate,
  bankName: e.bankName,
  accountNumber: e.accountNumber,
  accountName: e.accountName,
  amount: e.amount,
  status: e.status,
  currentApprovalStep: e.currentApprovalStep,
  attachmentUrl: e.attachmentUrl,
  receiptUrl: e.receiptUrl,
  managerApprovalDate: e.managerApprovalDate,
  managerRejectionReason: e.managerRejectionReason,
  internalControlApprovalDate: e.internalControlApprovalDate,
  internalControlRejectionReason: e.internalControlRejectionReason,
  financeManagerApprovalDate: e.financeManagerApprovalDate,
  financeManagerRejectionReason: e.financeManagerRejectionReason,
  paidDate: e.paidDate,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
});

router.get("/", async (req, res) => {
  try {
    const { requesterId, status, approverId } = req.query;
    let query = db.select().from(expensesTable);
    const expenses = await query;
    let filtered = expenses;
    if (requesterId) filtered = filtered.filter(e => e.requesterId === parseInt(requesterId as string));
    if (status) filtered = filtered.filter(e => e.status === status);
    if (approverId) {
      const aid = parseInt(approverId as string);
      filtered = filtered.filter(e => e.approverId === aid || e.internalControlId === aid || e.financeManagerId === aid);
    }
    res.json(filtered.map(formatExpense));
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get expenses" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    
    // Get requester name
    const requesterUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.requesterId)).limit(1);
    const requester = requesterUsers[0];
    if (!requester) {
      res.status(400).json({ error: "Bad Request", message: "Requester not found" });
      return;
    }

    // Get approver name
    const approverUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.approverId)).limit(1);
    const approver = approverUsers[0];
    if (!approver) {
      res.status(400).json({ error: "Bad Request", message: "Approver not found" });
      return;
    }

    let internalControlName = null;
    let financeManagerName = null;

    if (body.internalControlId) {
      const icUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.internalControlId)).limit(1);
      internalControlName = icUsers[0]?.name || null;
    }
    if (body.financeManagerId) {
      const fmUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.financeManagerId)).limit(1);
      financeManagerName = fmUsers[0]?.name || null;
    }

    const currentStep = body.status === "pending_manager" ? "manager" : "draft";

    const result = await db.insert(expensesTable).values({
      expenseName: body.expenseName,
      expenseType: body.expenseType,
      purpose: body.purpose,
      otherInfo: body.otherInfo || null,
      department: body.department,
      requesterId: body.requesterId,
      requesterName: requester.name,
      approverId: body.approverId,
      approverName: approver.name,
      internalControlId: body.internalControlId || null,
      internalControlName,
      financeManagerId: body.financeManagerId || null,
      financeManagerName,
      requestDate: body.requestDate,
      dueDate: body.dueDate || null,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      amount: body.amount,
      status: body.status || "draft",
      currentApprovalStep: currentStep,
      attachmentUrl: body.attachmentUrl || null,
    }).returning();

    res.status(201).json(formatExpense(result[0]));
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create expense" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    if (!expenses[0]) {
      res.status(404).json({ error: "Not Found", message: "Expense not found" });
      return;
    }
    res.json(formatExpense(expenses[0]));
  } catch (error) {
    console.error("Get expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get expense" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const result = await db.update(expensesTable).set({
      ...body,
      updatedAt: new Date(),
    }).where(eq(expensesTable.id, id)).returning();
    if (!result[0]) {
      res.status(404).json({ error: "Not Found", message: "Expense not found" });
      return;
    }
    res.json(formatExpense(result[0]));
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update expense" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, reason, approverId } = req.body;

    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    const expense = expenses[0];
    if (!expense) {
      res.status(404).json({ error: "Not Found", message: "Expense not found" });
      return;
    }

    const now = new Date().toISOString().split("T")[0];
    let updateData: any = { updatedAt: new Date() };

    if (action === "reject") {
      updateData.status = "rejected";
      if (expense.status === "pending_manager") {
        updateData.managerRejectionReason = reason;
      } else if (expense.status === "pending_internal_control") {
        updateData.internalControlRejectionReason = reason;
      } else if (expense.status === "pending_finance_manager") {
        updateData.financeManagerRejectionReason = reason;
      }
    } else if (action === "approve") {
      if (expense.status === "pending_manager") {
        updateData.managerApprovalDate = now;
        if (expense.internalControlId) {
          updateData.status = "pending_internal_control";
          updateData.currentApprovalStep = "internal_control";
        } else if (expense.financeManagerId) {
          updateData.status = "pending_finance_manager";
          updateData.currentApprovalStep = "finance_manager";
        } else {
          updateData.status = "pending_payment";
          updateData.currentApprovalStep = "payment";
        }
      } else if (expense.status === "pending_internal_control") {
        updateData.internalControlApprovalDate = now;
        if (expense.financeManagerId) {
          updateData.status = "pending_finance_manager";
          updateData.currentApprovalStep = "finance_manager";
        } else {
          updateData.status = "pending_payment";
          updateData.currentApprovalStep = "payment";
        }
      } else if (expense.status === "pending_finance_manager") {
        updateData.financeManagerApprovalDate = now;
        updateData.status = "pending_payment";
        updateData.currentApprovalStep = "payment";
      }
    }

    const result = await db.update(expensesTable).set(updateData).where(eq(expensesTable.id, id)).returning();
    res.json(formatExpense(result[0]));
  } catch (error) {
    console.error("Approve expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to process approval" });
  }
});

router.post("/:id/pay", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { receiptUrl } = req.body;
    const now = new Date().toISOString().split("T")[0];

    const result = await db.update(expensesTable).set({
      status: "paid",
      receiptUrl: receiptUrl || null,
      paidDate: now,
      currentApprovalStep: "completed",
      updatedAt: new Date(),
    }).where(eq(expensesTable.id, id)).returning();

    if (!result[0]) {
      res.status(404).json({ error: "Not Found", message: "Expense not found" });
      return;
    }
    res.json(formatExpense(result[0]));
  } catch (error) {
    console.error("Pay expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to mark as paid" });
  }
});

export default router;
