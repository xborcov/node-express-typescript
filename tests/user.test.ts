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
  });
});

describe("validateUserPayload", () => {
  it("accepts a valid payload", () => {
    expect(() => {
      validateUserPayload({ name: "Alice Smith", email: "alice@example.com" });
    }).not.toThrow();
  });
});
