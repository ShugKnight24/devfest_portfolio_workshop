import { NoToneMapping } from "three";
import { ThreeStage } from "./ThreeStage";
import { createPochitaInkScene } from "./scenes/pochitaInkScene";
import { createReacherFightScene } from "./scenes/reacherFightScene";
import { createReacherInvestigationScene } from "./scenes/reacherInvestigationScene";
import { createDenjiScene } from "./scenes/denjiScene";
import { createKickBackScene } from "./scenes/kickBackScene";
import { createIrisOutScene } from "./scenes/irisOutScene";
import { createFirstGlanceScene } from "./scenes/firstGlanceScene";
import { createInThePoolScene } from "./scenes/inThePoolScene";
import { createJaneSleptScene } from "./scenes/janeSleptScene";
import { createSlowSummerEveScene } from "./scenes/slowSummerEveScene";
import { createJaneDoeScene } from "./scenes/janeDoeScene";
import { createMiceScene } from "./scenes/miceScene";
import { createNextMountainScene, createNextPeakScene } from "./scenes/nextMountainScene";
import { createGanryujimaScene } from "./scenes/ganryujimaScene";
import { createBombBlastScene } from "./scenes/bombBlastScene";
import { createShrikeInkScene } from "./scenes/shrikeInkScene";
import { createSpecialInvestigatorsScene } from "./scenes/specialInvestigatorsScene";
import { createBreakfastScene } from "./scenes/breakfastScene";
import { createMargraveDinerScene } from "./scenes/margraveDinerScene";
import { createMargraveArrivalScene } from "./scenes/margraveArrivalScene";
import { createDenjiDreamScene } from "./scenes/denjiDreamScene";
import { createReigandoInkScene } from "./scenes/reigandoInkScene";
import { createDrifterKitScene } from "./scenes/drifterKitScene";
import { createPochitaContractScene } from "./scenes/pochitaContractScene";
import { createSlopTruckScene } from "./scenes/slopTruckScene";
import { createDevilHunterScene } from "./scenes/devilHunterScene";
import { createDreamCafeScene } from "./scenes/dreamCafeScene";

/**
 * SceneStage — the talk's scenes, by name, for `scene` slides.
 *
 * Loaded lazily by the slide engine, so three.js arrives only when the deck
 * reaches a scene. `fired` is the clicker beat: the
 * Pochita rev, Denji's pull, the Devil's roar. Reacher's fight and his read of
 * the scene run on a loop and ignore it. `step` is set only on a slide with
 * several beats: how many the clicker has fired, for a scene walked in steps.
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
  // The songs: one short film each, played beside its official video.
  "kick-back": { create: createKickBackScene, options: { ...FILM, fov: 36 } },
  "iris-out": { create: createIrisOutScene, options: { ...FILM, fov: 36 } },
  "first-glance": { create: createFirstGlanceScene, options: { ...FILM, fov: 36 } },
  "in-the-pool": { create: createInThePoolScene, options: { ...FILM, fov: 36 } },
  "jane-slept": { create: createJaneSleptScene, options: { ...FILM, fov: 36 } },
  "slow-summer-eve": { create: createSlowSummerEveScene, options: { ...FILM, fov: 36 } },
  "jane-doe": { create: createJaneDoeScene, options: { ...FILM, fov: 36 } },
  mice: { create: createMiceScene, options: { ...FILM, fov: 36 } },
  // Where you stand: one mountain, four places to look at it from.
  "next-mountain": { create: createNextMountainScene, options: { ...FILM, fov: 40 } },
  "next-peak": { create: createNextPeakScene, options: { ...FILM, fov: 40 } },
  // Backdrops: full-bleed behind an ordinary slide.
  "ganryujima": { create: createGanryujimaScene, options: { ...FILM, fov: 36 } },
  "bomb-blast": { create: createBombBlastScene, options: { ...FILM, fov: 36 } },
  "musashi-shrike": { create: createShrikeInkScene, options: { ...INK, fov: 36 } },
  "the-110th": { create: createSpecialInvestigatorsScene, options: { ...FILM, fov: 36 } },
  "breakfast": { create: createBreakfastScene, options: { ...FILM, fov: 36 } },
  "margrave-diner": { create: createMargraveDinerScene, options: { ...FILM, fov: 36 } },
  "margrave-arrival": { create: createMargraveArrivalScene, options: { ...FILM, fov: 36 } },
  "denji-dream": { create: createDenjiDreamScene, options: { ...FILM, fov: 36 } },
  "reigando": { create: createReigandoInkScene, options: { ...INK, fov: 36 } },
  "drifter-kit": { create: createDrifterKitScene, options: { ...FILM, fov: 36 } },
  "pochita-contract": { create: createPochitaContractScene, options: { ...FILM, fov: 36 } },
  "slop-truck": { create: createSlopTruckScene, options: { ...FILM, fov: 36 } },
  "devil-hunter": { create: createDevilHunterScene, options: { ...FILM, fov: 36 } },
  "dream-cafe": { create: createDreamCafeScene, options: { ...FILM, fov: 36 } },
};

export const SCENE_IDS = Object.keys(SCENES);

export default function SceneStage({ scene, fired = false, step, clock, label, className = "" }) {
  const entry = SCENES[scene];
  if (!entry) return null;
  return (
    <ThreeStage
      scene={entry.create}
      props={{ fired, step, clock }}
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
