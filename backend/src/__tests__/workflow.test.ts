import { describe, expect, it } from "vitest";
import { canTransition, nextStatuses } from "../workflow.js";

describe("workflow transitions", () => {
  it("allows only the next step forward", () => {
    expect(canTransition("NEW", "ASSIGNED")).toBe(true);
    expect(canTransition("ASSIGNED", "TRANSCRIBED")).toBe(true);
    expect(canTransition("TRANSCRIBED", "REVIEWED")).toBe(true);
    expect(canTransition("REVIEWED", "COMPLETED")).toBe(true);
  });

  it("rejects skipping steps", () => {
    expect(canTransition("NEW", "COMPLETED")).toBe(false);
    expect(canTransition("NEW", "TRANSCRIBED")).toBe(false);
    expect(canTransition("ASSIGNED", "REVIEWED")).toBe(false);
  });

  it("rejects going backwards", () => {
    expect(canTransition("COMPLETED", "REVIEWED")).toBe(false);
    expect(canTransition("ASSIGNED", "NEW")).toBe(false);
  });

  it("reports a terminal state for COMPLETED", () => {
    expect(nextStatuses("COMPLETED")).toEqual([]);
    expect(nextStatuses("NEW")).toEqual(["ASSIGNED"]);
  });
});
