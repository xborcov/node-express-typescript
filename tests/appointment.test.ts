import { AppointmentService, AppointmentAssessmentRequest, assessAppointmentRequest } from "@/services/appointment-service";
import { UserService } from "@/services/user-service";
import { validateAppointmentPayload } from "@/utils/validation";
import { validateAppointmentRequestPayload } from "@/utils/request-validation";

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

describe("assessAppointmentRequest", () => {
  it("rejects a missing user request", () => {
    const decision = assessAppointmentRequest({
      userId: "unknown",
      date: new Date(Date.now() + 3600000).toISOString(),
      type: "checkup",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("User not found.");
  });

  it("rejects invalid appointment dates", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: "not-a-date",
      type: "checkup",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Appointment date is invalid.");
  });

  it("rejects unsupported appointment types", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 3600000).toISOString(),
      type: "travel" as any,
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Unsupported appointment type.");
  });

  it("blocks a non-admin blocked user request", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 3600000).toISOString(),
      type: "checkup",
      insuranceProvided: true,
      isBlocked: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Blocked users cannot book appointments.");
  });

  it("allows a doctor to override blocked user restriction", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 7200000).toISOString(),
      type: "checkup",
      insuranceProvided: true,
      isBlocked: true,
      requestorRole: "doctor",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.reasons).toContain("Blocked user appointment allowed by role override.");
  });

  it("allows an admin to override blocked user restriction", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 7200000).toISOString(),
      type: "checkup",
      insuranceProvided: true,
      isBlocked: true,
      requestorRole: "admin",
    });

    expect(decision.allowed).toBe(true);
  });

  it("rejects urgent appointment without insurance", () => {
    const weekdayMidday = new Date();
    weekdayMidday.setDate(weekdayMidday.getDate() + ((1 - weekdayMidday.getDay() + 7) % 7));
    weekdayMidday.setHours(14, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: weekdayMidday.toISOString(),
      type: "urgent",
      insuranceProvided: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Insurance is required for urgent or specialist appointments.");
  });

  it("rejects specialist appointment without insurance", () => {
    const saturdayEvening = new Date();
    saturdayEvening.setDate(saturdayEvening.getDate() + ((6 - saturdayEvening.getDay() + 7) % 7));
    saturdayEvening.setHours(19, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: saturdayEvening.toISOString(),
      type: "specialist",
      insuranceProvided: false,
      missedAppointments: 0,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Insurance is required for urgent or specialist appointments.");
  });

  it("rejects evening booking without insurance for checkup", () => {
    const fridayEvening = new Date();
    fridayEvening.setDate(fridayEvening.getDate() + ((5 - fridayEvening.getDay() + 7) % 7));
    fridayEvening.setHours(19, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: fridayEvening.toISOString(),
      type: "checkup",
      insuranceProvided: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Weekend or evening appointments require insurance.");
  });

  it("allows weekend morning booking with insurance", () => {
    const saturdayMorning = new Date();
    saturdayMorning.setDate(saturdayMorning.getDate() + ((6 - saturdayMorning.getDay() + 7) % 7));
    saturdayMorning.setHours(10, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: saturdayMorning.toISOString(),
      type: "checkup",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
  });

  it("rejects night weekend booking after missed appointments", () => {
    const saturdayNight = new Date();
    saturdayNight.setDate(saturdayNight.getDate() + ((6 - saturdayNight.getDay() + 7) % 7));
    saturdayNight.setHours(20, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: saturdayNight.toISOString(),
      type: "follow-up",
      insuranceProvided: true,
      missedAppointments: 2,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Repeat missed appointments block evening or weekend bookings.");
  });

  it("rejects evening booking on weekday after repeated missed appointments", () => {
    const mondayEvening = new Date();
    mondayEvening.setDate(mondayEvening.getDate() + ((1 - mondayEvening.getDay() + 7) % 7));
    mondayEvening.setHours(19, 30, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: mondayEvening.toISOString(),
      type: "checkup",
      insuranceProvided: true,
      missedAppointments: 2,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Repeat missed appointments block evening or weekend bookings.");
  });

  it("allows weekday midday booking for urgent with insurance", () => {
    const noonTomorrow = new Date();
    noonTomorrow.setDate(noonTomorrow.getDate() + 1);
    noonTomorrow.setHours(12, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: noonTomorrow.toISOString(),
      type: "urgent",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("urgent");
  });

  it("allows follow-up appointment with normal priority", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 7200000).toISOString(),
      type: "follow-up",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("normal");
  });

  it("downgrades urgent priority due to repeated missed appointments", () => {
    const middayTomorrow = new Date();
    middayTomorrow.setDate(middayTomorrow.getDate() + 1);
    middayTomorrow.setHours(13, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: middayTomorrow.toISOString(),
      type: "urgent",
      insuranceProvided: true,
      missedAppointments: 3,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("high");
    expect(decision.reasons).toContain("Repeated missed appointments reduced booking priority.");
  });

  it("downgrades specialist priority from high to normal due to repeated missed appointments", () => {
    const weekdayMidday = new Date();
    weekdayMidday.setDate(weekdayMidday.getDate() + ((1 - weekdayMidday.getDay() + 7) % 7));
    weekdayMidday.setHours(13, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: weekdayMidday.toISOString(),
      type: "specialist",
      insuranceProvided: true,
      missedAppointments: 3,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("normal");
    expect(decision.reasons).toContain("Repeated missed appointments reduced booking priority.");
  });

  it("rejects a slot conflict from an existing appointment", () => {
    const service = new AppointmentService();
    const existing = service.getAppointments()[0];

    const decision = assessAppointmentRequest({
      userId: existing.userId,
      date: existing.date,
      type: "checkup",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("The requested appointment slot is unavailable due to a conflict.");
  });

  it("allows an admin to override weekend restrictions", () => {
    const sundayEvening = new Date();
    sundayEvening.setDate(sundayEvening.getDate() + ((0 - sundayEvening.getDay() + 7) % 7));
    sundayEvening.setHours(20, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: sundayEvening.toISOString(),
      type: "specialist",
      insuranceProvided: false,
      missedAppointments: 3,
      requestorRole: "admin",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("high");
    expect(decision.reasons).toContain("Role override applied despite missed appointment history.");
  });

  it("returns low priority for basic checkup", () => {
    const weekdayMidday = new Date();
    weekdayMidday.setDate(weekdayMidday.getDate() + ((1 - weekdayMidday.getDay() + 7) % 7));
    weekdayMidday.setHours(13, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: weekdayMidday.toISOString(),
      type: "checkup",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("low");
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

  it("throws when userId is missing", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).toThrow("Appointment userId is required.");
  });

  it("accepts a valid appointment payload", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).not.toThrow();
  });

  it("throws when date is in the past", () => {
    expect(() => {
      validateAppointmentPayload({ userId: "u1", date: new Date(Date.now() - 3600000).toISOString(), reason: "Consultation" });
    }).toThrow("Appointment date must be in the future.");
  });
});

describe("validateAppointmentRequestPayload", () => {
  it("throws when userId is missing", () => {
    expect(() => {
      validateAppointmentRequestPayload({ date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).toThrow("Appointment userId is required.");
  });

  it("throws when userId format is invalid", () => {
    expect(() => {
      validateAppointmentRequestPayload({ userId: "user", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation" });
    }).toThrow("Appointment userId must be a valid user identifier.");
  });

  it("throws when a bad email is provided", () => {
    expect(() => {
      validateAppointmentRequestPayload({ userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation", email: "invalid" });
    }).toThrow("A valid email address is required.");
  });

  it("throws when appointmentType is invalid", () => {
    expect(() => {
      validateAppointmentRequestPayload({
        userId: "u1",
        date: new Date(Date.now() + 3600000).toISOString(),
        reason: "Consultation",
        appointmentType: "invalid",
      });
    }).toThrow("Appointment type is not supported.");
  });

  it("throws when notes are too short", () => {
    expect(() => {
      validateAppointmentRequestPayload({
        userId: "u1",
        date: new Date(Date.now() + 3600000).toISOString(),
        reason: "Consultation",
        notes: "ab",
      });
    }).toThrow("Notes must contain at least 3 characters.");
  });

  it("throws when role is invalid", () => {
    expect(() => {
      validateAppointmentRequestPayload(
        { userId: "u1", date: new Date(Date.now() + 3600000).toISOString(), reason: "Consultation", role: "invalid" },
        { validateRole: true },
      );
    }).toThrow("User role must be 'user' or 'admin'.");
  });

  it("accepts a valid appointment request payload with all fields", () => {
    expect(() => {
      validateAppointmentRequestPayload({
        userId: "u1",
        date: new Date(Date.now() + 3600000).toISOString(),
        reason: "Consultation",
        email: "user@example.com",
        notes: "Bring referral notes",
        appointmentType: "checkup",
      });
    }).not.toThrow();
  });
});
