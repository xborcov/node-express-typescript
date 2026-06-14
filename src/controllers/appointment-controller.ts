import { Request, Response, NextFunction } from "express";
import { ApiSuccess } from "@/utils/ApiSucess";
import { asyncHandler } from "@/middleware/async-middleware";
import { AppointmentService, CreateAppointmentPayload } from "@/services/appointment-service";
import { validateAppointmentPayload } from "@/utils/validation";
import { ApiError } from "@/utils/ApiError";

const appointmentService = new AppointmentService();

export const getAppointments = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const appointments = appointmentService.getAppointments();
    res.status(200).json(new ApiSuccess(appointments, "Appointments retrieved successfully."));
  },
);

export const createAppointment = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const payload = req.body as CreateAppointmentPayload;
    const payloadAny = payload as any;

    const errors: string[] = [];
    const allowedRoles = ["user", "admin"];
    const allowedAppointmentTypes = ["checkup", "urgent", "follow-up", "specialist"];

    if (!payloadAny || typeof payloadAny !== "object") {
      errors.push("Appointment payload must be an object.");
    }

    if (!payloadAny?.userId || typeof payloadAny.userId !== "string") {
      errors.push("Appointment userId is required.");
    }

    if (!payload?.date || typeof payload.date !== "string" || Number.isNaN(Date.parse(payload.date))) {
      errors.push("Appointment date must be a valid ISO timestamp.");
    }

    if (payloadAny?.date && new Date(payloadAny.date) < new Date()) {
      errors.push("Appointment date must be in the future.");
    }

    if (!payloadAny?.reason || typeof payloadAny.reason !== "string" || payloadAny.reason.trim().length < 5) {
      errors.push("Appointment reason must contain at least 5 characters.");
    }

    if (payloadAny?.userId && !payloadAny.userId.match(/^u\d+$/)) {
      errors.push("Appointment userId must be a valid user identifier.");
    }

    if (payloadAny?.appointmentType && !allowedAppointmentTypes.includes(payloadAny.appointmentType)) {
      errors.push("Appointment type is not supported.");
    }

    if (payloadAny?.email !== undefined) {
      if (typeof payloadAny.email !== "string" || !payloadAny.email.includes("@")) {
        errors.push("A valid email address is required.");
      }
    }

    if (payloadAny?.notes && (typeof payloadAny.notes !== "string" || payloadAny.notes.trim().length < 3)) {
      errors.push("Notes must contain at least 3 characters.");
    }

    if (errors.length > 0) {
      throw new ApiError({}, 400, errors.join(" "));
    }

    validateAppointmentPayload(payload);
    const appointment = appointmentService.createAppointment(payload);
    res.status(201).json(new ApiSuccess(appointment, "Appointment created successfully."));
  },
);
