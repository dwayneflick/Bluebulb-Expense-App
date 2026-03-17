import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { expensesTable } from "./expenses";

export const retirementsTable = pgTable("retirements", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull().references(() => expensesTable.id),
  expenseName: text("expense_name").notNull(),
  requesterId: integer("requester_id").notNull().references(() => usersTable.id),
  requesterName: text("requester_name").notNull(),
  department: text("department").notNull(),
  amount: real("amount").notNull(),
  actualAmount: real("actual_amount"),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("pending"),
  approverId: integer("approver_id").references(() => usersTable.id),
  approverName: text("approver_name"),
  approvalDate: text("approval_date"),
  rejectionReason: text("rejection_reason"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRetirementSchema = createInsertSchema(retirementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRetirement = z.infer<typeof insertRetirementSchema>;
export type Retirement = typeof retirementsTable.$inferSelect;
