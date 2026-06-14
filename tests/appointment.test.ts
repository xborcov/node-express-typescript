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
  });

  it("throws when creating an appointment for a nonexistent user", () => {
    const service = new AppointmentService();

    expect(() => {
      service.createAppointment({
        userId: "unknown",
        date: new Date(Date.now() + 3600000).toISOString(),
        reason: "New visit",
      });
    }).toThrow("User not found for appointment.");
  });
});

describe("validateAppointmentPayload", () => {
  it("accepts a valid appointment payload", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).not.toThrow();
  });
});
