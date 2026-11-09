import { useEffect, useRef } from "react";

const lockTargets =
  ".alien-card, .planet, .era-node, button, a, select, input, summary";

/**
 * Mira decorativa para mouse. O cursor do sistema continua visível.
 * Só atualiza enquanto acompanha o ponteiro; pausa em aba oculta e quando
 * o usuário prefere movimento reduzido ou passa a usar um ponteiro de toque.
 */
export default function OmniCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return undefined;
    const fine = globalThis.matchMedia?.("(hover: hover) and (pointer: fine)");
    const motion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let frame = 0;
    let inside = false;

    const canShow = () =>
      inside && fine?.matches && !motion?.matches && !document.hidden;
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function render() {
      frame = 0;
      if (!canShow()) return;
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      ring.style.transform = `translate(${current.x}px, ${current.y}px)`;
      dot.style.transform = `translate(${target.x}px, ${target.y}px)`;
      // Ao alcançar o ponteiro não é necessário manter um loop ocioso.
      if (Math.hypot(target.x - current.x, target.y - current.y) > 0.1) {
        frame = requestAnimationFrame(render);
      }
    }
    function syncVisibility() {
      const visible = Boolean(canShow());
      ring.hidden = !visible;
      dot.hidden = !visible;
      if (visible) {
        if (!frame) frame = requestAnimationFrame(render);
      } else {
        stop();
        ring.classList.remove("is-pressed");
      }
    }
    function move(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      inside = true;
      target.x = event.clientX;
      target.y = event.clientY;
      if (ring.hidden) {
        current.x = target.x;
        current.y = target.y;
      }
      ring.classList.toggle(
        "is-locked",
        Boolean(event.target?.closest?.(lockTargets)),
      );
      syncVisibility();
    }
    const press = () => {
      if (canShow()) ring.classList.add("is-pressed");
    };
    const release = () => ring.classList.remove("is-pressed");
    const leave = () => {
      inside = false;
      syncVisibility();
    };

    function listen(query) {
      if (query?.addEventListener)
        query.addEventListener("change", syncVisibility);
      else query?.addListener?.(syncVisibility);
    }
    function unlisten(query) {
      if (query?.removeEventListener)
        query.removeEventListener("change", syncVisibility);
      else query?.removeListener?.(syncVisibility);
    }

    syncVisibility();
    globalThis.addEventListener("pointermove", move, { passive: true });
    globalThis.addEventListener("pointerdown", press, { passive: true });
    globalThis.addEventListener("pointerup", release, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", syncVisibility);
    listen(motion);
    listen(fine);
    return () => {
      stop();
      ring.hidden = true;
      dot.hidden = true;
      globalThis.removeEventListener("pointermove", move);
      globalThis.removeEventListener("pointerdown", press);
      globalThis.removeEventListener("pointerup", release);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", syncVisibility);
      unlisten(motion);
      unlisten(fine);
    };
  }, []);

  return (
    <>
      <span ref={ringRef} className="omni-cursor" aria-hidden="true" hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span
        ref={dotRef}
        className="omni-cursor-dot"
        aria-hidden="true"
        hidden
      />
    </>
  );
}
