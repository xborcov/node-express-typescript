import { Request, Response, NextFunction } from "express";
import { ApiSuccess } from "@/utils/ApiSucess";
import { asyncHandler } from "@/middleware/async-middleware";
import { AppointmentService, CreateAppointmentPayload } from "@/services/appointment-service";
import { validateAppointmentPayload } from "@/utils/validation";
import { validateAppointmentRequestPayload } from "@/utils/request-validation";

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

    validateAppointmentRequestPayload(payload);
    validateAppointmentPayload(payload);
    const appointment = appointmentService.createAppointment(payload);
    res.status(201).json(new ApiSuccess(appointment, "Appointment created successfully."));
  },
);
