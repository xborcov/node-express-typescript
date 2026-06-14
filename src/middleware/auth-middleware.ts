import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";

const API_TOKEN = process.env.API_TOKEN || "Bearer secret-token";

export const verify = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== API_TOKEN) {
    throw new ApiError({}, 401, "Unauthorized access. A valid API token is required.");
  }
  next();
};
