import type { Request, Response, NextFunction } from "express";

export interface SessionUserData {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  localId: number | null;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUserData;
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session?.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session?.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }
  if (req.session.user.role !== "admin") {
    res.status(403).json({ message: "Permiso denegado" });
    return;
  }
  next();
}

export function getUser(req: Request): SessionUserData | undefined {
  return req.session?.user;
}
