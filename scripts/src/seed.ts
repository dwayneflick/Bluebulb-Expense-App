import { db, usersTable, expensesTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  const users = [
    { name: "Admin User", email: "admin@bluebulb.com", passwordHash: await hash("admin123"), role: "admin", department: "Administration" },
    { name: "Jane Doe", email: "jane@bluebulb.com", passwordHash: await hash("user123"), role: "requester", department: "Operations" },
    { name: "John Smith", email: "john@bluebulb.com", passwordHash: await hash("user123"), role: "requester", department: "Marketing" },
    { name: "Sarah Manager", email: "sarah@bluebulb.com", passwordHash: await hash("manager123"), role: "approver_manager", department: "Management" },
    { name: "Mike Control", email: "mike@bluebulb.com", passwordHash: await hash("control123"), role: "internal_control", department: "Internal Control" },
    { name: "Linda Finance", email: "linda@bluebulb.com", passwordHash: await hash("finance123"), role: "finance_manager", department: "Finance" },
    { name: "Bob Finance", email: "bob@bluebulb.com", passwordHash: await hash("finance123"), role: "finance_team", department: "Finance" },
  ];

  for (const user of users) {
    try {
      await db.insert(usersTable).values(user).onConflictDoNothing();
      console.log(`Created user: ${user.email}`);
    } catch (e: any) {
      console.log(`User ${user.email} already exists`);
    }
  }

  // Get all users to reference IDs
  const allUsers = await db.select().from(usersTable);
  const requester1 = allUsers.find(u => u.email === "jane@bluebulb.com");
  const requester2 = allUsers.find(u => u.email === "john@bluebulb.com");
  const manager = allUsers.find(u => u.email === "sarah@bluebulb.com");
  const ic = allUsers.find(u => u.email === "mike@bluebulb.com");
  const fm = allUsers.find(u => u.email === "linda@bluebulb.com");

  if (!requester1 || !requester2 || !manager || !ic || !fm) {
    console.log("Could not find required users, skipping expense seed");
    return;
  }

  const sampleExpenses = [
    {
      expenseName: "Team Training Workshop",
      expenseType: "Training",
      purpose: "Quarterly team upskilling session",
      department: "Operations",
      requesterId: requester1.id,
      requesterName: requester1.name,
      approverId: manager.id,
      approverName: manager.name,
      internalControlId: ic.id,
      internalControlName: ic.name,
      financeManagerId: fm.id,
      financeManagerName: fm.name,
      requestDate: "2026-03-01",
      dueDate: "2026-03-15",
      bankName: "Zenith Bank",
      accountNumber: "2012345678",
      accountName: "Jane Doe",
      amount: 150000,
      status: "pending_manager",
      currentApprovalStep: "manager",
    },
    {
      expenseName: "Marketing Conference Travel",
      expenseType: "Travel",
      purpose: "Lagos Marketing Summit attendance",
      department: "Marketing",
      requesterId: requester2.id,
      requesterName: requester2.name,
      approverId: manager.id,
      approverName: manager.name,
      internalControlId: ic.id,
      internalControlName: ic.name,
      financeManagerId: fm.id,
      financeManagerName: fm.name,
      requestDate: "2026-02-15",
      dueDate: "2026-02-28",
      bankName: "GTBank (Guaranty Trust Bank)",
      accountNumber: "0123456789",
      accountName: "John Smith",
      amount: 85000,
      status: "paid",
      currentApprovalStep: "completed",
      managerApprovalDate: "2026-02-16",
      internalControlApprovalDate: "2026-02-17",
      financeManagerApprovalDate: "2026-02-18",
      paidDate: "2026-02-20",
    },
    {
      expenseName: "Office Supplies Purchase",
      expenseType: "Office Supplies",
      purpose: "Monthly office stationery and supplies",
      department: "Operations",
      requesterId: requester1.id,
      requesterName: requester1.name,
      approverId: manager.id,
      approverName: manager.name,
      requestDate: "2026-03-10",
      bankName: "Access Bank",
      accountNumber: "0987654321",
      accountName: "Jane Doe",
      amount: 45000,
      status: "draft",
      currentApprovalStep: "draft",
    },
    {
      expenseName: "Client Accommodation",
      expenseType: "Accommodation",
      purpose: "Client visit accommodation - Abuja",
      department: "Marketing",
      requesterId: requester2.id,
      requesterName: requester2.name,
      approverId: manager.id,
      approverName: manager.name,
      internalControlId: ic.id,
      internalControlName: ic.name,
      financeManagerId: fm.id,
      financeManagerName: fm.name,
      requestDate: "2026-01-20",
      dueDate: "2026-01-25",
      bankName: "United Bank for Africa (UBA)",
      accountNumber: "1234567890",
      accountName: "John Smith",
      amount: 200000,
      status: "rejected",
      currentApprovalStep: "manager",
      managerRejectionReason: "Budget exceeded for Q1. Please resubmit in Q2.",
    },
    {
      expenseName: "Medical Equipment",
      expenseType: "Medical",
      purpose: "First aid supplies for office clinic",
      department: "Operations",
      requesterId: requester1.id,
      requesterName: requester1.name,
      approverId: manager.id,
      approverName: manager.name,
      internalControlId: ic.id,
      internalControlName: ic.name,
      financeManagerId: fm.id,
      financeManagerName: fm.name,
      requestDate: "2026-02-01",
      bankName: "First Bank of Nigeria",
      accountNumber: "3012345678",
      accountName: "Jane Doe",
      amount: 75000,
      status: "pending_payment",
      currentApprovalStep: "payment",
      managerApprovalDate: "2026-02-02",
      internalControlApprovalDate: "2026-02-03",
      financeManagerApprovalDate: "2026-02-04",
    },
  ];

  for (const expense of sampleExpenses) {
    try {
      await db.insert(expensesTable).values(expense as any);
      console.log(`Created expense: ${expense.expenseName}`);
    } catch (e: any) {
      console.log(`Expense seed error:`, e.message);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
