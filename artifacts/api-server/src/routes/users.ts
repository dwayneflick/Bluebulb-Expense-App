import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const formatUser = (user: typeof usersTable.$inferSelect) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  createdAt: user.createdAt.toISOString(),
});

router.get("/", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map(formatUser));
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get users" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role || !department) {
      res.status(400).json({ error: "Bad Request", message: "All fields are required" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(usersTable).values({ name, email, passwordHash, role, department }).returning();
    res.status(201).json(formatUser(result[0]));
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(400).json({ error: "Bad Request", message: "Email already exists" });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create user" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!users[0]) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(formatUser(users[0]));
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, role, department } = req.body;
    const result = await db.update(usersTable).set({ name, email, role, department }).where(eq(usersTable.id, id)).returning();
    if (!result[0]) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(formatUser(result[0]));
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update user" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete user" });
  }
});

export default router;
