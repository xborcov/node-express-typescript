import { canBookStandardAppointment } from "@/services/eligibility-service";

describe("canBookStandardAppointment", () => {
  it("returns true when all eligibility conditions are satisfied", () => {
    const input = { age: 30, hasInsurance: true, isBlocked: false };
    expect(canBookStandardAppointment(input)).toBe(true);
  });

  it("returns false when user is underage", () => {
    const input = { age: 17, hasInsurance: true, isBlocked: false };
    expect(canBookStandardAppointment(input)).toBe(false);
  });
});
