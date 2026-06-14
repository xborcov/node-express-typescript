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

    const errors: string[] = [];
    const allowedRoles = ["user", "admin"];
    const allowedAppointmentTypes = ["checkup", "urgent", "follow-up", "specialist"];

    if (!payload || typeof payload !== "object") {
      errors.push("User payload must be an object.");
    }

    if (!payload?.name || typeof payload.name !== "string" || payload.name.trim().length < 2) {
      errors.push("User name must contain at least 2 characters.");
    }

    if (!payload?.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
      errors.push("A valid email address is required.");
    }

    if (payload?.role && !allowedRoles.includes(payload.role)) {
      errors.push("User role must be 'user' or 'admin'.");
    }

    if (payload?.appointmentType && !allowedAppointmentTypes.includes(payload.appointmentType)) {
      errors.push("Appointment type is not supported.");
    }

    if (payload?.notes && (typeof payload.notes !== "string" || payload.notes.trim().length < 3)) {
      errors.push("Notes must contain at least 3 characters.");
    }

    if (errors.length > 0) {
      throw new ApiError({}, 400, errors.join(" "));
    }

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
