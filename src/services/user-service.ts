import { User } from "@/types/interfaces/interfaces.common";
import { ApiError } from "@/utils/ApiError";

export interface CreateUserPayload {
  name: string;
  email: string;
  role?: "user" | "admin";
}

const defaultUsers: User[] = [
  { id: "u1", name: "John Doe", email: "john@example.com", role: "admin" },
  { id: "u2", name: "Jane Doe", email: "jane@example.com", role: "user" },
];

export class UserService {
  private readonly users: User[];

  constructor(initialUsers: User[] = defaultUsers) {
    this.users = [...initialUsers];
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  createUser(payload: CreateUserPayload): User {
    const existingUser = this.users.find((item) => item.email === payload.email);
    if (existingUser) {
      throw new ApiError({}, 409, "Email is already registered.");
    }

    const newUser: User = {
      id: `u${this.users.length + 1}`,
      name: payload.name.trim(),
      email: payload.email.toLowerCase(),
      role: payload.role ?? "user",
    };

    this.users.push(newUser);
    return newUser;
  }
}
