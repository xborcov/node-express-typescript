import { AppointmentService } from "@/services/appointment-service";
import { UserService } from "@/services/user-service";
import { validateAppointmentPayload } from "@/utils/validation";

describe("AppointmentService", () => {
  it("returns the default appointments sorted by date", () => {
    const service = new AppointmentService();
    const appointments = service.getAppointments();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].id).toBe("a1");
  });

  it("creates a new appointment for an existing user", () => {
    const userService = new UserService();
    const user = userService.getUsers()[0];
    const service = new AppointmentService();

    const appointment = service.createAppointment({
      userId: user.id,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      reason: "Follow up visit",
    });

    expect(appointment.userId).toBe(user.id);
    expect(appointment.reason).toBe("Follow up visit");
    expect(appointment.id).toBeDefined();
  });

  it("throws when a duplicate appointment slot is booked", () => {
    const service = new AppointmentService();
    const existingAppointment = service.getAppointments()[0];

    expect(() => {
      service.createAppointment({
        userId: existingAppointment.userId,
        date: existingAppointment.date,
        reason: "Duplicate booking",
      });
    }).toThrow("The requested appointment slot is already booked.");
  });
});

describe("validateAppointmentPayload", () => {
  it("throws when the date is invalid", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: "invalid-date", reason: "Checkup" });
    }).toThrow("Appointment date must be a valid ISO timestamp.");
  });

  it("throws when the reason is too short", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "No" });
    }).toThrow("Appointment reason must contain at least 5 characters.");
  });

  it("accepts a valid appointment payload", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).not.toThrow();
  });
});
