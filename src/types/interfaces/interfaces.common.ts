// Interface for custom class ApiError
export interface ApiError extends Error {
  success: boolean;
  message: string;
  statusCode: number;
  data: [] | {};
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Appointment {
  id: string;
  userId: string;
  date: string;
  reason: string;
}
