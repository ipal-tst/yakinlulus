import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
  it("keeps the first truthy argument when second is undefined", () => {
    expect(cn("text-sm", undefined)).toBe("text-sm");
  });
});
