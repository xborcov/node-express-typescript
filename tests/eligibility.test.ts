import { canBookStandardAppointment } from "@/services/eligibility-service";

describe("canBookStandardAppointment", () => {
  describe("Base eligibility case", () => {
    it("returns true for the base eligible case", () => {
      const input = { age: 18, hasInsurance: true, isBlocked: false };
      expect(canBookStandardAppointment(input)).toBe(true);
    });
  });

  describe("Condition independence tests", () => {
    it("age condition independently changes the decision", () => {
      const input = { age: 17, hasInsurance: true, isBlocked: false };
      expect(canBookStandardAppointment(input)).toBe(false);
    });

    it("insurance condition independently changes the decision", () => {
      const input = { age: 18, hasInsurance: false, isBlocked: false };
      expect(canBookStandardAppointment(input)).toBe(false);
    });

    it("blocked condition independently changes the decision", () => {
      const input = { age: 18, hasInsurance: true, isBlocked: true };
      expect(canBookStandardAppointment(input)).toBe(false);
    });
  });
});

