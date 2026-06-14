import { ApiError } from "@/utils/ApiError";
import { CreateAppointmentPayload } from "@/services/appointment-service";
import { CreateUserPayload } from "@/services/user-service";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUserPayload = (payload: CreateUserPayload) => {
  if (!payload || typeof payload !== "object") {
    throw new ApiError({}, 400, "User payload must be an object.");
  }

  if (!payload.name || typeof payload.name !== "string" || payload.name.trim().length < 2) {
    throw new ApiError({}, 400, "User name must contain at least 2 characters.");
  }

  if (!payload.email || typeof payload.email !== "string" || !emailPattern.exec(payload.email)) {
    throw new ApiError({}, 400, "A valid email address is required.");
  }
};

export const validateAppointmentPayload = (payload: CreateAppointmentPayload) => {
  if (!payload || typeof payload !== "object") {
    throw new ApiError({}, 400, "Appointment payload must be an object.");
  }

  if (!payload.userId || typeof payload.userId !== "string") {
    throw new ApiError({}, 400, "Appointment userId is required.");
  }

  if (!payload.date || typeof payload.date !== "string" || Number.isNaN(Date.parse(payload.date))) {
    throw new ApiError({}, 400, "Appointment date must be a valid ISO timestamp.");
  }

  const appointmentDate = new Date(payload.date);
  if (appointmentDate < new Date()) {
    throw new ApiError({}, 400, "Appointment date must be in the future.");
  }

  if (!payload.reason || typeof payload.reason !== "string" || payload.reason.trim().length < 5) {
    throw new ApiError({}, 400, "Appointment reason must contain at least 5 characters.");
  }
};
