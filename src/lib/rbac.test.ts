import { describe, expect, it } from "vitest";
import { canAccess, defaultPathFor, navItemsFor } from "./rbac";

describe("rbac", () => {
  it("gives owners access to every workspace", () => {
    expect(canAccess("owner", "/")).toBe(true);
    expect(canAccess("owner", "/financial")).toBe(true);
    expect(canAccess("owner", "/operations")).toBe(true);
  });

  it("keeps finance off the live board and dispatch off P&L", () => {
    expect(canAccess("finance", "/financial")).toBe(true);
    expect(canAccess("finance", "/operations")).toBe(false);
    expect(canAccess("dispatcher", "/financial")).toBe(false);
    expect(canAccess("dispatcher", "/operations")).toBe(true);
    expect(canAccess("dispatcher", "/fleet")).toBe(true);
    expect(canAccess("dispatcher", "/fleet/dispatch")).toBe(true);
    expect(canAccess("finance", "/fleet")).toBe(true);
    expect(canAccess("finance", "/fleet/kpis")).toBe(true);
    expect(canAccess("finance", "/routes")).toBe(true);
    expect(canAccess("finance", "/imports")).toBe(true);
    expect(canAccess("dispatcher", "/scorecard")).toBe(false);
    expect(canAccess("operations_manager", "/insights")).toBe(true);
  });

  it("sends drivers to their scorecard home", () => {
    expect(defaultPathFor("driver")).toBe("/drivers");
    expect(navItemsFor("driver").map((item) => item.to)).toEqual(["/drivers"]);
  });
});
