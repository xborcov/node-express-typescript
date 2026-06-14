import { Appointment } from "@/types/interfaces/interfaces.common";
import { ApiError } from "@/utils/ApiError";
import { UserService } from "@/services/user-service";

export interface CreateAppointmentPayload {
  userId: string;
  date: string;
  reason: string;
}

const defaultAppointments: Appointment[] = [
  {
    id: "a1",
    userId: "u1",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reason: "Annual review",
  },
];

export class AppointmentService {
  private readonly  appointments: Appointment[];
  private readonly userService = new UserService();

  constructor(initialAppointments: Appointment[] = defaultAppointments) {
    this.appointments = [...initialAppointments];
  }

  getAppointments(): Appointment[] {
    return [...this.appointments].sort((a, b) => a.date.localeCompare(b.date));
  }

  createAppointment(payload: CreateAppointmentPayload): Appointment {
    const user = this.userService.getUserById(payload.userId);
    if (!user) {
      throw new ApiError({}, 404, "User not found for appointment.");
    }

    const normalizedDate = new Date(payload.date).toISOString();
    if (this.appointments.some((appointment) => appointment.userId === payload.userId && appointment.date === normalizedDate)) {
      throw new ApiError({}, 409, "The requested appointment slot is already booked.");
    }

    const newAppointment: Appointment = {
      id: `a${this.appointments.length + 1}`,
      userId: payload.userId,
      date: normalizedDate,
      reason: payload.reason.trim(),
    };

    this.appointments.push(newAppointment);
    return newAppointment;
  }
}
