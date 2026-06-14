import { ApiError } from "@/utils/ApiError";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = ["user", "admin"] as const;
const allowedAppointmentTypes = ["checkup", "urgent", "follow-up", "specialist"] as const;

const ensureObjectPayload = (payload: unknown, errors: string[], subject: string): boolean => {
  if (!payload || typeof payload !== "object") {
    errors.push(`${subject} payload must be an object.`);
    return false;
  }

  return true;
};

export const collectValidationErrors = (
  payload: unknown,
  validators: Array<(payload: any, errors: string[]) => void>,
): string[] => {
  const errors: string[] = [];
  validators.forEach((validator) => validator(payload, errors));
  return errors;
};

export const validateCommonRequestFields = (
  payload: any,
  errors: string[],
  options?: { validateRole?: boolean },
): void => {
  if (payload?.appointmentType && !allowedAppointmentTypes.includes(payload.appointmentType)) {
    errors.push("Appointment type is not supported.");
  }

  if (payload?.notes && (typeof payload.notes !== "string" || payload.notes.trim().length < 3)) {
    errors.push("Notes must contain at least 3 characters.");
  }

  if (payload?.email !== undefined && (typeof payload.email !== "string" || !emailPattern.test(payload.email))) {
    errors.push("A valid email address is required.");
  }

  if (options?.validateRole && payload?.role && !allowedRoles.includes(payload.role)) {
    errors.push("User role must be 'user' or 'admin'.");
  }
};

const validateUserRequestFields = (payload: any, errors: string[]) => {
  if (!ensureObjectPayload(payload, errors, "User")) {
    return;
  }

  if (!payload.name || typeof payload.name !== "string" || payload.name.trim().length < 2) {
    errors.push("User name must contain at least 2 characters.");
  }

  if (!payload.email || typeof payload.email !== "string" || !emailPattern.test(payload.email)) {
    errors.push("A valid email address is required.");
  }
};

export const validateUserRequestPayload = (payload: unknown): void => {
  const errors = collectValidationErrors(payload, [
    validateUserRequestFields,
    (payloadAny, validationErrors) => validateCommonRequestFields(payloadAny, validationErrors, { validateRole: true }),
  ]);

  if (errors.length > 0) {
    throw new ApiError({}, 400, errors.join(" "));
  }
};

const validateAppointmentRequestFields = (payload: any, errors: string[]) => {
  if (!ensureObjectPayload(payload, errors, "Appointment")) {
    return;
  }

  if (!payload.userId || typeof payload.userId !== "string") {
    errors.push("Appointment userId is required.");
  }

  if (!payload.date || typeof payload.date !== "string" || Number.isNaN(Date.parse(payload.date))) {
    errors.push("Appointment date must be a valid ISO timestamp.");
  }

  if (payload.date && new Date(payload.date) < new Date()) {
    errors.push("Appointment date must be in the future.");
  }

  if (!payload.reason || typeof payload.reason !== "string" || payload.reason.trim().length < 5) {
    errors.push("Appointment reason must contain at least 5 characters.");
  }

  if (payload.userId && !payload.userId.match(/^u\d+$/)) {
    errors.push("Appointment userId must be a valid user identifier.");
  }
};

export const validateAppointmentRequestPayload = (
  payload: unknown,
  options?: { validateRole?: boolean },
): void => {
  const errors = collectValidationErrors(payload, [
    validateAppointmentRequestFields,
    (payloadAny, validationErrors) =>
      validateCommonRequestFields(payloadAny, validationErrors, { validateRole: options?.validateRole ?? false }),
  ]);

  if (errors.length > 0) {
    throw new ApiError({}, 400, errors.join(" "));
  }
};
