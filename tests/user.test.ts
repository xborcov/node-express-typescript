import { UserService } from "@/services/user-service";
import { validateUserPayload } from "@/utils/validation";
import { validateUserRequestPayload } from "@/utils/request-validation";

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

  it("generates unique IDs for each new user", () => {
    const service = new UserService();
    const user1 = service.createUser({ name: "User One", email: "user1@example.com" });
    const user2 = service.createUser({ name: "User Two", email: "user2@example.com" });

    expect(user1.id).not.toBe(user2.id);
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

  it("throws when name is missing", () => {
    expect(() => {
      validateUserPayload({ name: "", email: "alice@example.com" });
    }).toThrow("User name must contain at least 2 characters.");
  });

  it("throws when email is missing", () => {
    expect(() => {
      validateUserPayload({ name: "Alice", email: "" });
    }).toThrow("A valid email address is required.");
  });

  it("throws when payload is not an object", () => {
    expect(() => {
      validateUserPayload(null as any);
    }).toThrow("User payload must be an object.");
  });

  it("accepts a valid payload", () => {
    expect(() => {
      validateUserPayload({ name: "Alice Smith", email: "alice@example.com" });
    }).not.toThrow();
  });

  it("accepts emails with valid domain formats", () => {
    expect(() => {
      validateUserPayload({ name: "User", email: "user+tag@example.co.uk" });
    }).not.toThrow();
  });
});

describe("validateUserRequestPayload", () => {
  it("throws when the name is missing", () => {
    expect(() => {
      validateUserRequestPayload({ email: "alice@example.com" });
    }).toThrow("User name must contain at least 2 characters.");
  });

  it("throws when the role is invalid", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", role: "invalid" });
    }).toThrow("User role must be 'user' or 'admin'.");
  });

  it("throws when email is invalid in request payload", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "invalid-email" });
    }).toThrow("A valid email address is required.");
  });

  it("throws when appointmentType is invalid", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", appointmentType: "invalid" });
    }).toThrow("Appointment type is not supported.");
  });

  it("throws when notes are too short", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", notes: "ab" });
    }).toThrow("Notes must contain at least 3 characters.");
  });

  it("accepts a valid user request payload with user role", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", role: "user" });
    }).not.toThrow();
  });

  it("accepts a valid user request payload with admin role", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", role: "admin", notes: "Premium user" });
    }).not.toThrow();
  });

  it("accepts a valid user request with all optional fields", () => {
    expect(() => {
      validateUserRequestPayload({
        name: "Alice Smith",
        email: "alice@example.com",
        role: "admin",
        notes: "Senior admin with special permissions",
        appointmentType: "urgent",
      });
    }).not.toThrow();
  });

  it("accepts optional email field when undefined", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: undefined } as any);
    }).toThrow("A valid email address is required.");
  });

  it("accepts optional notes field when undefined", () => {
    expect(() => {
      validateUserRequestPayload({ name: "Alice", email: "alice@example.com", notes: undefined } as any);
    }).not.toThrow();
  });
});
