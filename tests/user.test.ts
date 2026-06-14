import { UserService } from "@/services/user-service";
import { validateUserPayload } from "@/utils/validation";
import { ApiError } from "@/utils/ApiError";

describe("UserService", () => {
  it("returns the default users", () => {
    const service = new UserService();
    const users = service.getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("john@example.com");
  });

  it("creates a new user with a default role", () => {
    const service = new UserService();
    const user = service.createUser({ name: "New User", email: "new@example.com" });

    expect(user).toMatchObject({ name: "New User", email: "new@example.com", role: "user" });
    expect(user.id).toBeDefined();
  });

  it("throws an error when a user email is already registered", () => {
    const service = new UserService();

    expect(() => {
      service.createUser({ name: "John Duplicate", email: "john@example.com" });
    }).toThrow("Email is already registered.");
  });
});

describe("validateUserPayload", () => {
  it("throws when email is invalid", () => {
    expect(() => {
      validateUserPayload({ name: "Bob", email: "not-an-email" });
    }).toThrow("A valid email address is required.");
  });

  it("throws when name is too short", () => {
    expect(() => {
      validateUserPayload({ name: "A", email: "a@example.com" });
    }).toThrow("User name must contain at least 2 characters.");
  });

  it("accepts a valid payload", () => {
    expect(() => {
      validateUserPayload({ name: "Alice Smith", email: "alice@example.com" });
    }).not.toThrow();
  });
});
