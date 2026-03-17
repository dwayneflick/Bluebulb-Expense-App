import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db, expensesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|xls/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split("/")[1]);
    if (ext || mime) cb(null, true);
    else cb(new Error("Only images, PDFs and Office documents are allowed."));
  },
});

const formatExpense = (e: typeof expensesTable.$inferSelect) => ({
  id: e.id,
  expenseName: e.expenseName,
  expenseType: e.expenseType,
  purpose: e.purpose,
  otherInfo: e.otherInfo,
  department: e.department,
  sbu: e.sbu,
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
  attachments: e.attachments ? JSON.parse(e.attachments) : [],
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
    const expenses = await db.select().from(expensesTable);
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

    const requesterUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.requesterId)).limit(1);
    const requester = requesterUsers[0];
    if (!requester) { res.status(400).json({ error: "Bad Request", message: "Requester not found" }); return; }

    const approverUsers = await db.select().from(usersTable).where(eq(usersTable.id, body.approverId)).limit(1);
    const approver = approverUsers[0];
    if (!approver) { res.status(400).json({ error: "Bad Request", message: "Approver not found" }); return; }

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
      sbu: body.sbu || null,
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
    if (!expenses[0]) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }
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
    const result = await db.update(expensesTable).set({ ...body, updatedAt: new Date() }).where(eq(expensesTable.id, id)).returning();
    if (!result[0]) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }
    res.json(formatExpense(result[0]));
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update expense" });
  }
});

// Upload attachments (up to 3 files)
router.post("/:id/attachments", upload.array("files", 3), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    if (!expenses[0]) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }

    const existing: string[] = expenses[0].attachments ? JSON.parse(expenses[0].attachments) : [];
    const files = req.files as Express.Multer.File[];
    const newUrls = files.map(f => `/uploads/${f.filename}`);
    const merged = [...existing, ...newUrls].slice(0, 3);

    const result = await db.update(expensesTable).set({
      attachments: JSON.stringify(merged),
      updatedAt: new Date(),
    }).where(eq(expensesTable.id, id)).returning();

    res.json({ attachments: merged, expense: formatExpense(result[0]) });
  } catch (error) {
    console.error("Upload attachments error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to upload attachments" });
  }
});

// Upload receipt (finance team only)
router.post("/:id/receipt", upload.single("receipt"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) { res.status(400).json({ error: "Bad Request", message: "No file uploaded" }); return; }

    const receiptUrl = `/uploads/${req.file.filename}`;
    const result = await db.update(expensesTable).set({ receiptUrl, updatedAt: new Date() }).where(eq(expensesTable.id, id)).returning();
    if (!result[0]) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }

    res.json({ receiptUrl, expense: formatExpense(result[0]) });
  } catch (error) {
    console.error("Upload receipt error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to upload receipt" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, reason } = req.body;

    const expenses = await db.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    const expense = expenses[0];
    if (!expense) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }

    const now = new Date().toISOString().split("T")[0];
    let updateData: any = { updatedAt: new Date() };

    if (action === "reject") {
      updateData.status = "rejected";
      if (expense.status === "pending_manager") updateData.managerRejectionReason = reason;
      else if (expense.status === "pending_internal_control") updateData.internalControlRejectionReason = reason;
      else if (expense.status === "pending_finance_manager") updateData.financeManagerRejectionReason = reason;
    } else if (action === "approve") {
      if (expense.status === "pending_manager") {
        updateData.managerApprovalDate = now;
        if (expense.internalControlId) { updateData.status = "pending_internal_control"; updateData.currentApprovalStep = "internal_control"; }
        else if (expense.financeManagerId) { updateData.status = "pending_finance_manager"; updateData.currentApprovalStep = "finance_manager"; }
        else { updateData.status = "pending_payment"; updateData.currentApprovalStep = "payment"; }
      } else if (expense.status === "pending_internal_control") {
        updateData.internalControlApprovalDate = now;
        if (expense.financeManagerId) { updateData.status = "pending_finance_manager"; updateData.currentApprovalStep = "finance_manager"; }
        else { updateData.status = "pending_payment"; updateData.currentApprovalStep = "payment"; }
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

router.post("/:id/pay", upload.single("receipt"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const now = new Date().toISOString().split("T")[0];

    let receiptUrl = req.body.receiptUrl || null;
    if (req.file) receiptUrl = `/uploads/${req.file.filename}`;

    const result = await db.update(expensesTable).set({
      status: "paid",
      receiptUrl,
      paidDate: now,
      currentApprovalStep: "completed",
      updatedAt: new Date(),
    }).where(eq(expensesTable.id, id)).returning();

    if (!result[0]) { res.status(404).json({ error: "Not Found", message: "Expense not found" }); return; }
    res.json(formatExpense(result[0]));
  } catch (error) {
    console.error("Pay expense error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to mark as paid" });
  }
});

export default router;
