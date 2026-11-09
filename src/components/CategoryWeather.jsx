import { useEffect, useRef } from "react";

const amounts = {
  embers: 46,
  snow: 60,
  sparks: 26,
  bubbles: 34,
  leaves: 26,
  streaks: 30,
  stardust: 70,
  orbs: 16,
  motes: 0,
};

function spawn(type, width, height, anywhere) {
  const x = Math.random() * width;
  const y = anywhere ? Math.random() * height : null;
  switch (type) {
    case "embers":
      return {
        x,
        y: y ?? height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.5 + Math.random() * 1.3),
        size: 1 + Math.random() * 2.4,
        life: Math.random(),
      };
    case "snow":
      return {
        x,
        y: y ?? -10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.35 + Math.random() * 0.9,
        size: 1 + Math.random() * 2.6,
        life: Math.random() * 6,
      };
    case "bubbles":
      return {
        x,
        y: y ?? height + 12,
        vx: 0,
        vy: -(0.3 + Math.random() * 0.9),
        size: 2 + Math.random() * 7,
        life: Math.random() * 6,
      };
    case "leaves":
      return {
        x,
        y: y ?? -12,
        vx: 0.3 + Math.random() * 0.7,
        vy: 0.4 + Math.random() * 0.8,
        size: 4 + Math.random() * 5,
        life: Math.random() * 6,
      };
    case "streaks":
      return {
        x: anywhere ? x : -80,
        y: Math.random() * height,
        vx: 9 + Math.random() * 12,
        vy: 0,
        size: 30 + Math.random() * 90,
        life: 0,
      };
    case "sparks":
      return {
        x,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 14 + Math.random() * 30,
        life: Math.random() * 90,
      };
    case "orbs":
      return {
        x,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0,
        life: Math.random() * 160,
      };
    default:
      return {
        x,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        size: 0.6 + Math.random() * 1.6,
        life: Math.random() * 6,
      };
  }
}

/**
 * Clima do fundo, de acordo com a categoria do alien selecionado: brasas,
 * neve, faíscas, bolhas, folhas, rastros de velocidade, poeira estelar ou
 * ondas. Decorativo, não roda com "reduzir movimento" e pausa quando a aba
 * fica oculta.
 */
export default function CategoryWeather({ type = "motes", color = "#a7f542" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const amount = amounts[type] ?? 0;
    if (!context) return undefined;
    // O mesmo canvas é reutilizado ao trocar o alien. Uma categoria sem clima
    // também precisa remover os pixels deixados pela categoria anterior.
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!amount) return undefined;
    const motionQuery = globalThis.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles = [];

    function resize() {
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
      width = globalThis.innerWidth;
      height = globalThis.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scaled = Math.round(amount * Math.min(1, width / 1100 + 0.35));
      particles = Array.from({ length: scaled }, () =>
        spawn(type, width, height, true),
      );
      start();
    }

    function drawParticle(particle) {
      const { x, y, size } = particle;
      context.beginPath();
      if (type === "embers") {
        context.globalAlpha =
          0.25 + 0.6 * Math.abs(Math.sin(particle.life * 3));
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      } else if (type === "snow" || type === "stardust") {
        context.globalAlpha =
          type === "snow"
            ? 0.7
            : 0.25 + 0.6 * Math.abs(Math.sin(particle.life));
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      } else if (type === "bubbles") {
        context.globalAlpha = 0.5;
        context.arc(x + Math.sin(particle.life) * 6, y, size, 0, Math.PI * 2);
        context.stroke();
      } else if (type === "leaves") {
        context.globalAlpha = 0.6;
        context.ellipse(x, y, size, size * 0.45, particle.life, 0, Math.PI * 2);
        context.fill();
      } else if (type === "streaks") {
        context.globalAlpha = 0.35;
        context.moveTo(x, y);
        context.lineTo(x - size, y);
        context.stroke();
      } else if (type === "sparks") {
        // Um raio curto em zigue-zague que aparece por poucos quadros.
        if (particle.life % 90 > 8) return;
        context.globalAlpha = 0.85;
        context.moveTo(x, y);
        let px = x;
        let py = y;
        for (let step = 0; step < 4; step += 1) {
          px += (Math.random() - 0.5) * size;
          py += size * 0.4;
          context.lineTo(px, py);
        }
        context.stroke();
      } else if (type === "orbs") {
        const progress = (particle.life % 160) / 160;
        context.globalAlpha = 0.4 * (1 - progress);
        context.arc(x, y, 8 + progress * 70, 0, Math.PI * 2);
        context.stroke();
      }
    }

    function step() {
      frame = 0;
      if (motionQuery?.matches || document.hidden) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      context.strokeStyle = color;
      context.lineWidth = type === "streaks" ? 1.5 : 1.2;
      context.shadowColor = color;
      context.shadowBlur = type === "snow" ? 0 : 8;
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += type === "sparks" || type === "orbs" ? 1 : 0.02;
        if (type === "snow") particle.x += Math.sin(particle.life * 2) * 0.3;
        if (type === "leaves") particle.x += Math.sin(particle.life * 2) * 0.6;
        const gone =
          particle.y < -20 ||
          particle.y > height + 20 ||
          particle.x > width + 140 ||
          particle.x < -140;
        const blink = type === "sparks" && particle.life % 90 === 0;
        const faded = type === "orbs" && particle.life % 160 === 0;
        if (gone || blink || faded) {
          particles[index] = spawn(type, width, height, blink || faded);
          return;
        }
        drawParticle(particle);
      });
      context.globalAlpha = 1;
      frame = requestAnimationFrame(step);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, width, height);
    }

    function start() {
      stop();
      if (motionQuery?.matches || document.hidden) return;
      frame = requestAnimationFrame(step);
    }

    resize();
    globalThis.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    if (motionQuery?.addEventListener)
      motionQuery.addEventListener("change", start);
    else motionQuery?.addListener?.(start);
    return () => {
      stop();
      globalThis.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", start);
      if (motionQuery?.removeEventListener)
        motionQuery.removeEventListener("change", start);
      else motionQuery?.removeListener?.(start);
    };
  }, [type, color]);

  return (
    <canvas
      ref={canvasRef}
      className="weather"
      data-weather={type}
      aria-hidden="true"
    />
  );
}
