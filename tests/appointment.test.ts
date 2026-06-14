import { AppointmentService, AppointmentAssessmentRequest, assessAppointmentRequest } from "@/services/appointment-service";
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

  it("rejects weekend evening booking without insurance", () => {
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
    expect(decision.reasons).toEqual(expect.arrayContaining(["Insurance is required for urgent or specialist appointments."]));
  });

  it("returns urgent priority for an urgent appointment", () => {
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

  it("rejects evening booking without insurance for a checkup", () => {
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

  it("downgrades priority for repeated missed urgent appointments at midday", () => {
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

  it("allows a follow-up appointment with normal priority", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 7200000).toISOString(),
      type: "follow-up",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("normal");
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

  it("rejects evening booking after repeated missed appointments", () => {
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

  it("downgrades priority for repeated missed urgent appointments on a weekday midday", () => {
    const weekdayMidday = new Date();
    weekdayMidday.setDate(weekdayMidday.getDate() + ((1 - weekdayMidday.getDay() + 7) % 7));
    weekdayMidday.setHours(13, 0, 0, 0);

    const decision = assessAppointmentRequest({
      userId: "u1",
      date: weekdayMidday.toISOString(),
      type: "urgent",
      insuranceProvided: true,
      missedAppointments: 3,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("high");
    expect(decision.reasons).toContain("Repeated missed appointments reduced booking priority.");
  });

  it("downgrades repeated missed specialist appointments from high to normal", () => {
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

  it("rejects urgent appointment without insurance for a regular user", () => {
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

  it("allows a blocked doctor override and records override reason", () => {
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

  it("allows a follow-up appointment with normal priority", () => {
    const decision = assessAppointmentRequest({
      userId: "u1",
      date: new Date(Date.now() + 7200000).toISOString(),
      type: "follow-up",
      insuranceProvided: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.priority).toBe("normal");
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

import { validateAppointmentRequestPayload } from "@/utils/request-validation";

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

  it("accepts a valid appointment request payload", () => {
    expect(() => {
      validateAppointmentRequestPayload({
        userId: "u1",
        date: new Date(Date.now() + 3600000).toISOString(),
        reason: "Consultation",
        email: "user@example.com",
        notes: "Bring referral notes",
      });
    }).not.toThrow();
  });
});
