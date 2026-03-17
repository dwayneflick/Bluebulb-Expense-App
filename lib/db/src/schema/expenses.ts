import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseName: text("expense_name").notNull(),
  expenseType: text("expense_type").notNull(),
  purpose: text("purpose").notNull(),
  otherInfo: text("other_info"),
  department: text("department").notNull(),
  sbu: text("sbu"),
  attachments: text("attachments"),
  requesterId: integer("requester_id").notNull().references(() => usersTable.id),
  requesterName: text("requester_name").notNull(),
  approverId: integer("approver_id").notNull().references(() => usersTable.id),
  approverName: text("approver_name").notNull(),
  internalControlId: integer("internal_control_id").references(() => usersTable.id),
  internalControlName: text("internal_control_name"),
  financeManagerId: integer("finance_manager_id").references(() => usersTable.id),
  financeManagerName: text("finance_manager_name"),
  requestDate: text("request_date").notNull(),
  dueDate: text("due_date"),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("draft"),
  currentApprovalStep: text("current_approval_step"),
  attachmentUrl: text("attachment_url"),
  receiptUrl: text("receipt_url"),
  managerApprovalDate: text("manager_approval_date"),
  managerRejectionReason: text("manager_rejection_reason"),
  internalControlApprovalDate: text("internal_control_approval_date"),
  internalControlRejectionReason: text("internal_control_rejection_reason"),
  financeManagerApprovalDate: text("finance_manager_approval_date"),
  financeManagerRejectionReason: text("finance_manager_rejection_reason"),
  paidDate: text("paid_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
