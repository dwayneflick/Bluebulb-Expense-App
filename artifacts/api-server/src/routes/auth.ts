import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Too many login attempts. Please try again after 15 minutes." },
  skipSuccessfulRequests: true,
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password are required" });
      return;
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
    const user = users[0];
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }
    const session = req.session as any;
    session.userId = user.id;
    session.userRole = user.role;
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt.toISOString(),
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session?.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", async (req, res) => {
  try {
    const session = req.session as any;
    const userId = session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
      return;
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const user = users[0];
    if (!user) {
      req.session?.destroy(() => {});
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }
    session.userRole = user.role;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get user" });
  }
});

export default router;
