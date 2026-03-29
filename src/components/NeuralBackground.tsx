import { useEffect, useRef } from 'react';
import { useComputedColorScheme } from '@mantine/core';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
}

const NODE_COUNT = 55;
const CONNECTION_DIST = 160;
const SPEED = 0.3;

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorScheme = useComputedColorScheme('light');
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // init nodes
    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      radius: Math.random() * 2 + 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const isDark = () => colorScheme === 'dark';

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dark = isDark();

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;

      // update
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * (dark ? 0.25 : 0.15);
            // DNA helix color: teal-blue gradient feel
            const progress = (nodes[i].x + nodes[j].x) / (2 * w);
            const r = Math.round(40 + progress * 60);
            const g = Math.round(180 - progress * 60);
            const b = Math.round(220);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        const baseAlpha = dark ? 0.5 : 0.35;
        const alpha = baseAlpha + glow * (dark ? 0.4 : 0.25);
        const r = n.radius + glow * 1.2;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
        grad.addColorStop(0, `rgba(80,220,200,${alpha})`);
        grad.addColorStop(1, `rgba(40,140,220,0)`);

        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,230,210,${alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: colorScheme === 'dark' ? 0.7 : 0.5,
      }}
    />
  );
}
