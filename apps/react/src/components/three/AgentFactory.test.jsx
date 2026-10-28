import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentFactory from "./AgentFactory";
import { FACTORY_STATIONS } from "./scenes/softwareFactoryScene";

// The test DOM has no WebGL, which is the case worth pinning: a visitor on a
// blocklisted GPU still gets the five stations, named, instead of a black box.
describe("AgentFactory", () => {
  it("falls back to the named stations without WebGL", () => {
    render(<AgentFactory />);

    for (const station of FACTORY_STATIONS) {
      expect(screen.getByText(station.name)).toBeInTheDocument();
    }
  });

  it("keeps the stations in the order the talk teaches them", () => {
    expect(FACTORY_STATIONS.map((s) => s.id)).toEqual(["problem", "spec", "build", "review", "ship"]);
  });
});
