import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
      return;
    }
    if (!session.userRole || !roles.includes(session.userRole)) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function getSessionUser(req: Request): { id: number; role: string } | null {
  const session = req.session as any;
  if (!session?.userId) return null;
  return { id: session.userId, role: session.userRole };
}
