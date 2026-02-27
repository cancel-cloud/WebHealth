import { describe, it, expect } from "vitest";
import { classifyQueryIntent } from "./intent-labeler";

describe("classifyQueryIntent", () => {
  it("classifies buying queries as commercial", () => {
    expect(classifyQueryIntent("buy cable drum online")).toBe("commercial");
    expect(classifyQueryIntent("best rope pulley review")).toBe("commercial");
    expect(classifyQueryIntent("kabelwinde kaufen")).toBe("commercial");
  });

  it("classifies brand queries as navigational", () => {
    expect(classifyQueryIntent("sfk seilzuege login")).toBe("navigational");
  });

  it("classifies domain queries as navigational", () => {
    expect(classifyQueryIntent("sfk seilzuege contact", "sfk-seilzuege.de")).toBe("navigational");
  });

  it("defaults to informational", () => {
    expect(classifyQueryIntent("how to install a cable drum")).toBe("informational");
    expect(classifyQueryIntent("wire rope breaking force calculation")).toBe("informational");
  });
});
