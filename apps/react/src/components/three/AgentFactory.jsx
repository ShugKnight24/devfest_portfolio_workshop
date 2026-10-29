import { ThreeStage } from "./ThreeStage";
import { createSoftwareFactoryScene, FACTORY_STATIONS } from "./scenes/softwareFactoryScene";

/**
 * AgentFactory — the landing page's opening shot: a crew of robot agents
 * turning everyday problems into the outcomes people wanted, station by station.
 *
 * Loaded lazily (see LandingPage) so three.js never sits in the first paint.
 * Station labels are real DOM, positioned by the scene every frame, so they
 * stay crisp and readable without WebGL.
 */

const LABEL =
  "An automated factory run by robot arms. Everyday problems, like a messy bank export or a four-page " +
  "school newsletter, enter on a conveyor. An investigator arm scans each into a blueprint, two builder arms " +
  "place interface parts onto a real device, a reviewer arm stamps it red then green, and the finished app " +
  "launches up a beam of light.";

const OPTIONS = { fov: 30, exposure: 0.95, bloom: { strength: 0.45, radius: 0.36, threshold: 0.9 } };

const StationChip = ({ station, positioned }) => (
  <div
    data-anchor={station.id}
    className={`flex flex-col gap-0.5 rounded-[3px] border px-2.5 py-1.5 font-mono text-[11px] uppercase leading-tight tracking-widest backdrop-blur-sm transition-colors duration-300 data-[hot]:border-(--stage-border-strong) data-[hot]:text-(--stage-text) ${
      positioned ? "absolute -translate-x-1/2 -translate-y-full whitespace-nowrap" : ""
    }`}
    style={{ borderColor: "var(--stage-border)", backgroundColor: "rgb(5 7 10 / 0.72)", color: "var(--stage-text-muted)" }}
  >
    <span>
      <span className="text-(--stage-accent)">{station.num}</span> <strong className="text-(--stage-text)">{station.name}</strong>
    </span>
    {/* Five chips side by side do not fit a phone with their status lines. */}
    <span data-status className="hidden normal-case text-[10px] tracking-normal text-(--stage-accent-alt) sm:block">
      {" "}
    </span>
  </div>
);

const Fallback = () => (
  <div className="flex h-full flex-wrap items-center justify-center gap-3 p-6">
    {FACTORY_STATIONS.map((station) => (
      <StationChip key={station.id} station={station} />
    ))}
  </div>
);

export default function AgentFactory() {
  return (
    <figure className="stage relative m-0">
      <ThreeStage
        scene={createSoftwareFactoryScene}
        label={LABEL}
        options={OPTIONS}
        className="h-[clamp(320px,58vh,640px)] w-full rounded-[4px] border"
        style={{ borderColor: "var(--stage-border)", backgroundColor: "var(--stage-bg)" }}
        fallback={<Fallback />}
      >
        {FACTORY_STATIONS.map((station) => (
          <StationChip key={station.id} station={station} positioned />
        ))}
        <figcaption className="absolute left-4 top-4 font-mono text-[11px] uppercase tracking-[0.25em] text-(--stage-text-muted)">
          <span className="text-(--stage-accent)">//</span> Problem in. Outcome out.
          <span className="hidden sm:inline"> — built by the crew</span>
        </figcaption>
      </ThreeStage>
    </figure>
  );
}
