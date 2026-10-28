import * as THREE from "three";
import { createStage } from "../src/components/three/stageRuntime";
import { createPochitaInkScene } from "../src/components/three/scenes/pochitaInkScene";
import { createReacherFightScene } from "../src/components/three/scenes/reacherFightScene";
import { createReacherInvestigationScene } from "../src/components/three/scenes/reacherInvestigationScene";
import { createDenjiScene } from "../src/components/three/scenes/denjiScene";
import { createChainsawDevilScene } from "../src/components/three/scenes/chainsawDevilScene";
import { createSoftwareFactoryScene } from "../src/components/three/scenes/softwareFactoryScene";
import { createFirstGlanceScene } from "../src/components/three/scenes/firstGlanceScene";
import { createInThePoolScene } from "../src/components/three/scenes/inThePoolScene";
import { createJaneSleptScene } from "../src/components/three/scenes/janeSleptScene";
import { createIrisOutScene } from "../src/components/three/scenes/irisOutScene";
import { createKickBackScene } from "../src/components/three/scenes/kickBackScene";
import { createJaneDoeScene } from "../src/components/three/scenes/janeDoeScene";
import { createMiceScene } from "../src/components/three/scenes/miceScene";

// Dev-only stills: ?scene=<id>&fired=1, then window.__lab.renderAt(t) / fire().
const SCENES = {
  "pochita-ink": { create: createPochitaInkScene, fov: 38 },
  "reacher-fight": { create: createReacherFightScene, fov: 32 },
  "reacher-investigate": { create: createReacherInvestigationScene, fov: 34 },
  denji: { create: createDenjiScene, fov: 34 },
  devil: { create: createChainsawDevilScene, fov: 40 },
  factory: { create: createSoftwareFactoryScene, fov: 30, pbr: true },
  "first-glance": { create: createFirstGlanceScene, fov: 36 },
  pool: { create: createInThePoolScene, fov: 36 },
  church: { create: createJaneSleptScene, fov: 36 },
  iris: { create: createIrisOutScene, fov: 36 },
  kickback: { create: createKickBackScene, fov: 36 },
  janedoe: { create: createJaneDoeScene, fov: 36 },
  mice: { create: createMiceScene, fov: 36 },
};
const params = new URLSearchParams(location.search);
const { create, fov, pbr } = SCENES[params.get("scene") ?? "pochita-ink"];
// Ink scenes want flat paper (no bloom, no tone mapping); PBR scenes the defaults.
const stage = createStage(document.getElementById("stage"), pbr ? { fov, exposure: 0.95, bloom: { strength: 0.45, radius: 0.36, threshold: 0.9 } } : { fov, bloom: false, toneMapping: THREE.NoToneMapping });
const overlay = document.getElementById("overlay");
const props = { fired: params.get("fired") === "1" };
const scene = create(stage, { props, overlay });
stage.start(scene.update, scene.render);
window.__lab = {
  stage,
  scene,
  // Stills pause the live loop so it cannot overwrite the frame.
  renderAt: (t) => {
    stage.setPaused(true);
    stage.renderAt(t);
  },
  fire: (on = true) => scene.setProps?.({ fired: on }),
  // Scenes that load anything async expose `ready`; await it before stills.
  ready: scene.ready ?? Promise.resolve(),
};
