import { useEffect, useRef, useState } from "react";
import { createStage, hasWebGL } from "./stageRuntime";

/**
 * ThreeStage — mounts one scene module into a sized box.
 *
 * `scene` is a factory `(stage, { props, overlay }) => { update, setProps, dispose }`
 * (see stageRuntime.js). Keep the factory reference stable: a new function
 * identity rebuilds the whole scene.
 *
 * Without a `label` the stage is decorative (aria-hidden): use that when a
 * parent control already names it, like a beat's button.
 *
 * `children` render above the canvas and are what the scene positions labels
 * into (`overlay`). `fallback` renders instead of the canvas when WebGL is
 * missing or the context is lost, so the slide still says something.
 */
export const ThreeStage = ({ scene, props, options, label, className = "", style, fallback = null, children }) => {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const handleRef = useRef(null);
  const propsRef = useRef(props);
  const optionsRef = useRef(options);
  const [failed, setFailed] = useState(() => !hasWebGL());

  propsRef.current = props;

  useEffect(() => {
    if (failed || !containerRef.current) return undefined;
    let stage;
    let instance;
    try {
      stage = createStage(containerRef.current, { ...optionsRef.current, onContextLost: () => setFailed(true) });
      instance = scene(stage, { props: propsRef.current, overlay: overlayRef.current });
      stage.start(instance.update, instance.render);
      // Dev only: lets a still be rendered on demand (stage.renderAt) for review.
      if (import.meta.env.DEV) (window.__stages ??= new Set()).add(stage);
    } catch (error) {
      console.warn("[ThreeStage] scene failed to start", error);
      instance?.dispose?.();
      stage?.dispose();
      setFailed(true);
      return undefined;
    }
    handleRef.current = { stage, instance };
    return () => {
      handleRef.current = null;
      instance.dispose?.();
      stage.dispose();
      if (import.meta.env.DEV) window.__stages?.delete(stage);
    };
  }, [scene, failed]);

  // Props are pushed, never rebuilt: a fired beat must not remount the scene.
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    handle.instance.setProps?.(props);
    handle.stage.invalidate();
  });

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {failed ? (
        fallback
      ) : (
        <>
          <div ref={containerRef} className="absolute inset-0" />
          <div ref={overlayRef} className="pointer-events-none absolute inset-0">
            {children}
          </div>
        </>
      )}
    </div>
  );
};
