import { useEffect, useRef } from "react";

/**
 * Fundo vivo: partículas de "DNA" que flutuam e se conectam perto do cursor.
 * É decorativo (aria-hidden), pausa quando a aba fica oculta e vira um quadro
 * estático quando o usuário prefere menos movimento.
 */
export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return undefined;

    const motionQuery = globalThis.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );
    let reduced = Boolean(motionQuery?.matches);
    const pointer = { x: -9999, y: -9999 };
    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;

    function resize() {
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
      width = globalThis.innerWidth;
      height = globalThis.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const amount = Math.min(90, Math.round((width * height) / 16000));
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22 - 0.05,
        size: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
      }));
      draw(0, false);
      start();
    }

    function draw(time, advance = !reduced) {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        if (advance) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -10) particle.x = width + 10;
          if (particle.x > width + 10) particle.x = -10;
          if (particle.y < -10) particle.y = height + 10;
          if (particle.y > height + 10) particle.y = -10;
        }
        const twinkle = 0.35 + 0.3 * Math.sin(time / 900 + particle.phase);
        context.fillStyle = `rgba(167, 245, 66, ${twinkle})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();

        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (!reduced && distance < 170) {
          context.strokeStyle = `rgba(167, 245, 66, ${0.3 * (1 - distance / 170)})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      }
    }

    function loop(time) {
      // O callback deixou de estar pendente. Só há um novo pedido se o fundo
      // ainda puder animar, inclusive após uma mudança de preferência.
      frame = 0;
      if (reduced || document.hidden) return;
      draw(time);
      frame = requestAnimationFrame(loop);
    }
    function start() {
      if (!reduced && !frame && !document.hidden)
        frame = requestAnimationFrame(loop);
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function onVisibility() {
      stop();
      if (!document.hidden) {
        draw(0, false);
        start();
      }
    }
    function onMotionChange(event) {
      reduced = event.matches;
      stop();
      if (!document.hidden) {
        draw(0, false);
        start();
      }
    }
    function onPointer(event) {
      if (reduced || document.hidden) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    resize();
    globalThis.addEventListener("resize", resize);
    globalThis.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (motionQuery?.addEventListener) {
      motionQuery.addEventListener("change", onMotionChange);
    } else {
      motionQuery?.addListener?.(onMotionChange);
    }
    return () => {
      stop();
      globalThis.removeEventListener("resize", resize);
      globalThis.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      if (motionQuery?.removeEventListener) {
        motionQuery.removeEventListener("change", onMotionChange);
      } else {
        motionQuery?.removeListener?.(onMotionChange);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
