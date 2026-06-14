export interface BookingEligibilityInput {
  age: number;
  hasInsurance: boolean;
  isBlocked: boolean;
}

export function canBookStandardAppointment(input: BookingEligibilityInput): boolean {
  if (input.age >= 18 && input.hasInsurance && !input.isBlocked) {
    return true;
  }

  return false;
}
