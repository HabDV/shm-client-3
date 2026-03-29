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

// Light theme: dark navy/indigo nodes on white bg
const LIGHT = {
  lineR: (p: number) => Math.round(30  + p * 40),
  lineG: (p: number) => Math.round(40  + p * 30),
  lineB:                        160,
  lineAlpha:                    0.18,
  nodeCore:       (a: number) => `rgba(25,40,140,${a})`,
  nodeGlowInner:  (a: number) => `rgba(40,60,180,${a})`,
  nodeGlowOuter:                `rgba(20,30,120,0)`,
  nodeBaseAlpha:                0.55,
  nodeGlowScale:                0.30,
  canvasOpacity:                0.45,
};

// Dark theme: bright light-blue/cyan nodes on dark bg
const DARK = {
  lineR: (p: number) => Math.round(60  + p * 80),
  lineG: (p: number) => Math.round(160 + p * 40),
  lineB:                        240,
  lineAlpha:                    0.28,
  nodeCore:       (a: number) => `rgba(140,210,255,${a})`,
  nodeGlowInner:  (a: number) => `rgba(100,180,255,${a})`,
  nodeGlowOuter:                `rgba(60,140,240,0)`,
  nodeBaseAlpha:                0.60,
  nodeGlowScale:                0.35,
  canvasOpacity:                0.70,
};

export default function NeuralBackground() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const nodesRef    = useRef<Node[]>([]);
  const colorScheme = useComputedColorScheme('light');
  const schemeRef   = useRef(colorScheme);
  schemeRef.current = colorScheme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x:          Math.random() * window.innerWidth,
      y:          Math.random() * window.innerHeight,
      vx:         (Math.random() - 0.5) * SPEED,
      vy:         (Math.random() - 0.5) * SPEED,
      radius:     Math.random() * 2 + 1.5,
      pulse:      Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const draw = () => {
      const w     = canvas.width;
      const h     = canvas.height;
      const theme = schemeRef.current === 'dark' ? DARK : LIGHT;
      const nodes = nodesRef.current;

      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x     += n.vx;
        n.y     += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const fade  = 1 - dist / CONNECTION_DIST;
            const alpha = fade * theme.lineAlpha;
            const p     = (nodes[i].x + nodes[j].x) / (2 * w);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${theme.lineR(p)},${theme.lineG(p)},${theme.lineB},${alpha})`;
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        const glow  = Math.sin(n.pulse) * 0.5 + 0.5;
        const alpha = theme.nodeBaseAlpha + glow * theme.nodeGlowScale;
        const r     = n.radius + glow * 1.2;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5);
        grad.addColorStop(0, theme.nodeGlowInner(alpha * 0.7));
        grad.addColorStop(1, theme.nodeGlowOuter);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = theme.nodeCore(alpha);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        zIndex:        0,
        pointerEvents: 'none',
        opacity:       colorScheme === 'dark' ? DARK.canvasOpacity : LIGHT.canvasOpacity,
        transition:    'opacity 0.4s ease',
      }}
    />
  );
}
