import { Appointment } from "@/types/interfaces/interfaces.common";
import { ApiError } from "@/utils/ApiError";
import { UserService } from "@/services/user-service";

export interface CreateAppointmentPayload {
  userId: string;
  date: string;
  reason: string;
}

export interface AppointmentAssessmentRequest {
  userId: string;
  date: string;
  type: "checkup" | "urgent" | "follow-up" | "specialist";
  insuranceProvided?: boolean;
  missedAppointments?: number;
  requestorRole?: "user" | "admin" | "doctor";
  isBlocked?: boolean;
}

export interface AppointmentDecision {
  allowed: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  reasons: string[];
}

const appointmentTypes = ["checkup", "urgent", "follow-up", "specialist"] as const;

function buildRejectedDecision(reason: string): AppointmentDecision {
  return {
    allowed: false,
    priority: "low",
    reasons: [reason],
  };
}

function getBasePriority(type: AppointmentAssessmentRequest["type"]): AppointmentDecision["priority"] {
  switch (type) {
    case "urgent":
      return "urgent";
    case "specialist":
      return "high";
    case "checkup":
      return "low";
    case "follow-up":
      return "normal";
  }
}

function isAllowedAppointmentType(type: string): type is AppointmentAssessmentRequest["type"] {
  return appointmentTypes.includes(type as AppointmentAssessmentRequest["type"]);
}

function canOverrideRestrictions(request: AppointmentAssessmentRequest): boolean {
  return request.requestorRole === "admin" || request.requestorRole === "doctor";
}

function isWeekendOrEvening(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day === 0 || day === 6 || hour >= 18 || hour < 7;
}

function hasValidInsurance(request: AppointmentAssessmentRequest): boolean {
  return Boolean(request.insuranceProvided);
}

function requiresInsurance(request: AppointmentAssessmentRequest): boolean {
  return request.type === "urgent" || request.type === "specialist";
}

function getImmediateRejectionReason(
  request: AppointmentAssessmentRequest,
  isWeekendOrEveningBooking: boolean,
  hasRestrictionOverride: boolean,
): string | undefined {
  if (hasRestrictionOverride || hasValidInsurance(request)) {
    return undefined;
  }

  if (requiresInsurance(request)) {
    return "Insurance is required for urgent or specialist appointments.";
  }

  if (isWeekendOrEveningBooking) {
    return "Weekend or evening appointments require insurance.";
  }

  return undefined;
}

function hasSlotConflict(appointments: Appointment[], normalizedDate: string): boolean {
  return appointments.some((appointment) => appointment.date === normalizedDate);
}

function downrankPriority(priority: AppointmentDecision["priority"]): AppointmentDecision["priority"] {
  if (priority === "urgent") {
    return "high";
  }

  if (priority === "high") {
    return "normal";
  }

  if (priority === "normal") {
    return "low";
  }

  return priority;
}

function shouldRejectWeekendMissedAppointments(
  request: AppointmentAssessmentRequest,
  isWeekendOrEveningBooking: boolean,
  hasRestrictionOverride: boolean,
): boolean {
  const hasRestriction = hasRestrictionOverride === true;
  return isWeekendOrEveningBooking && hasRestriction === false && (request.missedAppointments ?? 0) > 1;
}

function shouldAddUrgentNoInsuranceReason(
  request: AppointmentAssessmentRequest,
  hasRestrictionOverride: boolean,
): boolean {
  return request.type === "urgent" && hasRestrictionOverride === false && !hasValidInsurance(request);
}

function shouldAddWeekendRuleReason(
  isWeekendOrEveningBooking: boolean,
  reasons: string[],
): boolean {
  const hasWeekendRuleReason = reasons.includes("Stricter weekend or evening booking rules apply.");
  return isWeekendOrEveningBooking && hasWeekendRuleReason === false;
}

function gatherDecisionDetails(
  request: AppointmentAssessmentRequest,
  hasRestrictionOverride: boolean,
  isWeekendOrEveningBooking: boolean,
): { priority: AppointmentDecision["priority"]; reasons: string[] } {
  const reasons: string[] = [];
  let priority = getBasePriority(request.type);
  const missedAppointments = request.missedAppointments ?? 0;

  if (missedAppointments > 2) {
    if (hasRestrictionOverride) {
      reasons.push("Role override applied despite missed appointment history.");
    } else {
      priority = downrankPriority(priority);
      reasons.push("Repeated missed appointments reduced booking priority.");
    }
  }

  if (request.isBlocked && hasRestrictionOverride) {
    reasons.push("Blocked user appointment allowed by role override.");
  }

  if (shouldAddUrgentNoInsuranceReason(request, hasRestrictionOverride)) {
    reasons.push("Urgent appointments without insurance are still evaluated.");
  }

  if (shouldAddWeekendRuleReason(isWeekendOrEveningBooking, reasons)) {
    reasons.push("Stricter weekend or evening booking rules apply.");
  }

  return { priority, reasons };
}

export function assessAppointmentRequest(
  request: AppointmentAssessmentRequest,
  appointments: Appointment[] = defaultAppointments,
): AppointmentDecision {
  const appointmentDate = new Date(request.date);
  if (Number.isNaN(appointmentDate.getTime())) {
    return buildRejectedDecision("Appointment date is invalid.");
  }

  const normalizedDate = appointmentDate.toISOString();
  const user = new UserService().getUserById(request.userId);
  const hasRestrictionOverride = canOverrideRestrictions(request);

  if (!user) {
    return buildRejectedDecision("User not found.");
  }

  if (request.isBlocked && hasRestrictionOverride === false) {
    return buildRejectedDecision("Blocked users cannot book appointments.");
  }

  if (hasSlotConflict(appointments, normalizedDate)) {
    return buildRejectedDecision("The requested appointment slot is unavailable due to a conflict.");
  }

  if (!isAllowedAppointmentType(request.type)) {
    return buildRejectedDecision("Unsupported appointment type.");
  }

  const isWeekendOrEveningBooking = isWeekendOrEvening(appointmentDate);
  const rejectionReason = getImmediateRejectionReason(request, isWeekendOrEveningBooking, hasRestrictionOverride);
  if (rejectionReason) {
    return buildRejectedDecision(rejectionReason);
  }

  if (shouldRejectWeekendMissedAppointments(request, isWeekendOrEveningBooking, hasRestrictionOverride)) {
    return buildRejectedDecision("Repeat missed appointments block evening or weekend bookings.");
  }

  const { priority, reasons } = gatherDecisionDetails(request, hasRestrictionOverride, isWeekendOrEveningBooking);

  return {
    allowed: true,
    priority,
    reasons,
  };
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
