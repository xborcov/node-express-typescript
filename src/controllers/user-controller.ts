import { Request, Response, NextFunction } from "express";
import { ApiSuccess } from "@/utils/ApiSucess";
import { asyncHandler } from "@/middleware/async-middleware";
import { validateUserPayload } from "@/utils/validation";
import { UserService } from "@/services/user-service";
import { ApiError } from "@/utils/ApiError";

const userService = new UserService();

export const getUsers = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const users = userService.getUsers();
    res.status(200).json(new ApiSuccess(users, "Users retrieved successfully."));
  },
);

export const createUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const payload = req.body;
    validateUserPayload(payload);
    const user = userService.createUser(payload);
    res.status(201).json(new ApiSuccess(user, "User created successfully."));
  },
);

export const errorUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    throw new ApiError({}, 500, "Handled by asyncHandler");
  },
);
