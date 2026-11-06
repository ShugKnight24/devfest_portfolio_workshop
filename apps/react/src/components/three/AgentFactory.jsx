import { useState } from "react";
import { ThreeStage } from "./ThreeStage";
import { hasWebGL } from "./stageRuntime";
import {
  createSoftwareFactoryScene,
  FACTORY_MOODS,
  FACTORY_PAINTS,
  FACTORY_SPEEDS,
  FACTORY_STATIONS,
  FACTORY_VIEWS,
} from "./scenes/softwareFactoryScene";

/**
 * AgentFactory — the landing page's opening shot: a crew of robot agents
 * turning everyday problems into the outcomes people wanted, station by station.
 *
 * Loaded lazily (see LandingPage) so three.js never sits in the first paint.
 * Station labels are real DOM, positioned by the scene every frame, so they
 * stay crisp and readable without WebGL.
 *
 * The control bar sits outside the stage's `role="img"` box so its buttons stay
 * reachable to assistive tech; choices reach the scene as props (setProps), so
 * nothing remounts.
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

const SPEED_LABELS = { 0: ["❚❚", "Pause the line"], 1: ["1×", "Normal speed"], 2: ["2×", "Double speed"] };

const Group = ({ label, children }) => (
  <div role="group" aria-label={label} className="flex items-center gap-1">
    <span aria-hidden="true" className="mr-1 text-[10px] tracking-[0.2em] text-(--stage-text-muted)">
      {label}
    </span>
    {children}
  </div>
);

const Toggle = ({ pressed, onClick, label, title, children, className = "" }) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-label={label}
    title={title ?? label}
    onClick={onClick}
    className={`min-h-7 min-w-7 rounded-[3px] border px-2 py-1 transition-colors duration-200 hover:text-(--stage-text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--stage-accent) aria-pressed:border-(--stage-accent) aria-pressed:text-(--stage-text) ${className}`}
    style={{ borderColor: pressed ? undefined : "var(--stage-border)" }}
  >
    {children}
  </button>
);

const Controls = ({ settings, set }) => (
  <div
    className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[3px] border px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-(--stage-text-muted) backdrop-blur-sm sm:absolute sm:bottom-3 sm:left-3 sm:mt-0 sm:max-w-[calc(100%-1.5rem)]"
    style={{ borderColor: "var(--stage-border)", backgroundColor: "rgb(5 7 10 / 0.78)" }}
  >
    <Group label="View">
      {FACTORY_VIEWS.map((v) => {
        const station = FACTORY_STATIONS.find((s) => s.id === v.id);
        return (
          <Toggle
            key={v.id}
            pressed={settings.view === v.id}
            onClick={() => set({ view: v.id })}
            label={station ? `Close-up: ${station.num} ${station.name}` : v.name}
            className={station ? "hidden md:inline-block" : ""}
          >
            {v.name}
          </Toggle>
        );
      })}
    </Group>
    <Group label="Paint">
      {FACTORY_PAINTS.map((p) => (
        <Toggle
          key={p.id}
          pressed={settings.paint === p.id}
          onClick={() => set({ paint: p.id })}
          label={`Robot paint: ${p.name}`}
          title={p.name}
          className="p-1!"
        >
          <span aria-hidden="true" className="block size-4 rounded-full border border-black/40" style={{ backgroundColor: p.color }} />
        </Toggle>
      ))}
    </Group>
    <Group label="Light">
      {FACTORY_MOODS.map((m) => (
        <Toggle key={m.id} pressed={settings.mood === m.id} onClick={() => set({ mood: m.id })} label={m.name}>
          {m.name.split(" ")[0]}
        </Toggle>
      ))}
    </Group>
    <Group label="Speed">
      {FACTORY_SPEEDS.map((sp) => (
        <Toggle key={sp} pressed={settings.speed === sp} onClick={() => set({ speed: sp })} label={SPEED_LABELS[sp][1]}>
          {SPEED_LABELS[sp][0]}
        </Toggle>
      ))}
    </Group>
  </div>
);

export default function AgentFactory() {
  const [settings, setSettings] = useState({ view: "line", paint: "white", mood: "shift", speed: 1 });
  const set = (next) => setSettings((prev) => ({ ...prev, ...next }));
  // No WebGL, no scene to drive: the fallback chips stand alone.
  const [webgl] = useState(hasWebGL);
  return (
    <figure className="stage relative m-0">
      <ThreeStage
        scene={createSoftwareFactoryScene}
        props={settings}
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
      {webgl && <Controls settings={settings} set={set} />}
    </figure>
  );
}
