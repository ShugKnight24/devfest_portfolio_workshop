import { NoToneMapping } from "three";
import { ThreeStage } from "./ThreeStage";
import { createPochitaInkScene } from "./scenes/pochitaInkScene";
import { createReacherFightScene } from "./scenes/reacherFightScene";
import { createReacherInvestigationScene } from "./scenes/reacherInvestigationScene";
import { createDenjiScene } from "./scenes/denjiScene";
import { createChainsawDevilScene } from "./scenes/chainsawDevilScene";
import { createKickBackScene } from "./scenes/kickBackScene";
import { createIrisOutScene } from "./scenes/irisOutScene";
import { createFirstGlanceScene } from "./scenes/firstGlanceScene";
import { createInThePoolScene } from "./scenes/inThePoolScene";
import { createJaneSleptScene } from "./scenes/janeSleptScene";
import { createJaneDoeScene } from "./scenes/janeDoeScene";
import { createMiceScene } from "./scenes/miceScene";

/**
 * SceneStage — the talk's scenes, by name, for `scene` slides.
 *
 * Loaded lazily by the slide engine, so three.js arrives only when the deck
 * reaches a scene. `fired` is the clicker beat: the
 * Pochita rev, Denji's pull, the Devil's roar. Reacher's fight and his read of
 * the scene run on a loop and ignore it.
 */

const INK = { bloom: false, toneMapping: NoToneMapping };
// Everything but Pochita is lit like the shows: filmic tone mapping and a soft
// bloom on lanterns, blasts and windows.
const FILM = { bloom: { strength: 0.45, radius: 0.5, threshold: 0.86 }, exposure: 1.05 };

const SCENES = {
  pochita: { create: createPochitaInkScene, options: { ...INK, fov: 38 } },
  reacher: { create: createReacherFightScene, options: { ...FILM, fov: 32 } },
  "reacher-investigate": { create: createReacherInvestigationScene, options: { ...FILM, fov: 34 } },
  "chainsaw-man": { create: createDenjiScene, options: { ...FILM, fov: 34 } },
  "chainsaw-devil": { create: createChainsawDevilScene, options: { ...FILM, fov: 40 } },
  // The songs: one short film each, played beside its official video.
  "kick-back": { create: createKickBackScene, options: { ...FILM, fov: 36 } },
  "iris-out": { create: createIrisOutScene, options: { ...FILM, fov: 36 } },
  "first-glance": { create: createFirstGlanceScene, options: { ...FILM, fov: 36 } },
  "in-the-pool": { create: createInThePoolScene, options: { ...FILM, fov: 36 } },
  "jane-slept": { create: createJaneSleptScene, options: { ...FILM, fov: 36 } },
  "jane-doe": { create: createJaneDoeScene, options: { ...FILM, fov: 36 } },
  mice: { create: createMiceScene, options: { ...FILM, fov: 36 } },
};

export const SCENE_IDS = Object.keys(SCENES);

export default function SceneStage({ scene, fired = false, clock, label, className = "" }) {
  const entry = SCENES[scene];
  if (!entry) return null;
  return (
    <ThreeStage
      scene={entry.create}
      props={{ fired, clock }}
      options={entry.options}
      label={label}
      className={className}
      style={{ backgroundColor: "#f1ece2" }}
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-center font-mono text-sm uppercase tracking-widest text-(--stage-text-muted)">
          {label}
        </div>
      }
    />
  );
}
