import { Router, type IRouter } from "express";
import { db, expensesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const expenses = await db.select().from(expensesTable);

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingCount = expenses.filter(e => ["pending_manager", "pending_internal_control", "pending_finance_manager", "pending_payment"].includes(e.status)).length;
    const approvedCount = expenses.filter(e => ["pending_payment", "paid"].includes(e.status)).length;
    const rejectedCount = expenses.filter(e => e.status === "rejected").length;
    const paidCount = expenses.filter(e => e.status === "paid").length;

    const deptMap = new Map<string, { count: number; amount: number }>();
    for (const e of expenses) {
      const d = e.department || "Unknown";
      const cur = deptMap.get(d) || { count: 0, amount: 0 };
      deptMap.set(d, { count: cur.count + 1, amount: cur.amount + (e.amount || 0) });
    }
    const byDepartment = Array.from(deptMap.entries()).map(([department, data]) => ({ department, ...data }));

    const monthMap = new Map<string, { count: number; amount: number }>();
    for (const e of expenses) {
      const date = e.requestDate ? e.requestDate.substring(0, 7) : e.createdAt.toISOString().substring(0, 7);
      const cur = monthMap.get(date) || { count: 0, amount: 0 };
      monthMap.set(date, { count: cur.count + 1, amount: cur.amount + (e.amount || 0) });
    }
    const byMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data }));

    const yearMap = new Map<string, { count: number; amount: number }>();
    for (const e of expenses) {
      const year = (e.requestDate ? e.requestDate.substring(0, 4) : e.createdAt.toISOString().substring(0, 4));
      const cur = yearMap.get(year) || { count: 0, amount: 0 };
      yearMap.set(year, { count: cur.count + 1, amount: cur.amount + (e.amount || 0) });
    }
    const byYear = Array.from(yearMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({ year, ...data }));

    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const e of expenses) {
      const s = e.status || "unknown";
      const cur = statusMap.get(s) || { count: 0, amount: 0 };
      statusMap.set(s, { count: cur.count + 1, amount: cur.amount + (e.amount || 0) });
    }
    const byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({ status, ...data }));

    res.json({
      totalExpenses,
      totalAmount,
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      byDepartment,
      byMonth,
      byYear,
      byStatus,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get stats" });
  }
});

export default router;
