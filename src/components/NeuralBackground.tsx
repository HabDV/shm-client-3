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

// Dark theme: bright teal/cyan on dark bg
const DARK = {
  nodeFill:       (a: number) => `rgba(80,220,200,${a})`,
  nodeGlow0:      (a: number) => `rgba(80,220,200,${a})`,
  nodeGlow1:                    `rgba(40,140,220,0)`,
  lineR: (p: number) => Math.round(40  + p * 60),
  lineG: (p: number) => Math.round(180 - p * 60),
  lineB:                        220,
  lineAlphaScale:               0.30,
  nodeBaseAlpha:                0.55,
  nodeGlowScale:                0.40,
  canvasOpacity:                0.75,
};

// Light theme: deep indigo/violet on white bg — visible but subtle
const LIGHT = {
  nodeFill:       (a: number) => `rgba(80,60,200,${a})`,
  nodeGlow0:      (a: number) => `rgba(100,80,220,${a})`,
  nodeGlow1:                    `rgba(60,40,180,0)`,
  lineR: (p: number) => Math.round(80  + p * 40),
  lineG: (p: number) => Math.round(60  + p * 20),
  lineB:                        200,
  lineAlphaScale:               0.22,
  nodeBaseAlpha:                0.45,
  nodeGlowScale:                0.30,
  canvasOpacity:                0.55,
};

export default function NeuralBackground() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef<number>(0);
  const nodesRef       = useRef<Node[]>([]);
  const colorScheme    = useComputedColorScheme('light');
  // keep a ref so draw() always reads the latest value without restarting
  const schemeRef      = useRef(colorScheme);
  schemeRef.current    = colorScheme;

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

      // update positions
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
            const fade     = 1 - dist / CONNECTION_DIST;
            const alpha    = fade * theme.lineAlphaScale;
            const progress = (nodes[i].x + nodes[j].x) / (2 * w);
            const r        = theme.lineR(progress);
            const g        = theme.lineG(progress);
            const b        = theme.lineB;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
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

        // outer glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        grad.addColorStop(0, theme.nodeGlow0(alpha * 0.8));
        grad.addColorStop(1, theme.nodeGlow1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = theme.nodeFill(alpha);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []); // runs once — schemeRef keeps theme in sync

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
