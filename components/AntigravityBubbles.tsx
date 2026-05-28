'use client';

import React, { useEffect, useRef } from 'react';

export default function AntigravityBubbles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    // Mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 150, // Interaction radius
      targetGlow: 0,
      currentGlow: 0,
    };

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.targetGlow = 0.85; // Bring glow to maximum when moving
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.targetGlow = 0;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulseOffset: number;
    }

    const particles: Particle[] = [];
    // Deep glowing neon palette
    const colors = [
      'rgba(16, 185, 129, ',  // Emerald green
      'rgba(59, 130, 246, ',  // Neon Blue
      'rgba(139, 92, 246, ',  // Purple/Indigo
      'rgba(244, 63, 94, ',   // Rose Pink
      'rgba(245, 158, 11, ',  // Amber Orange
    ];

    // Initialize particles
    const particleCount = Math.min(80, Math.floor((width * height) / 20000));
    for (let i = 0; i < particleCount; i++) {
      const radius = 2 + Math.random() * 9;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const vx = (Math.random() - 0.5) * 0.35;
      const vy = (Math.random() - 0.5) * 0.35;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const baseAlpha = 0.08 + Math.random() * 0.2;

      particles.push({
        x,
        y,
        vx,
        vy,
        radius,
        color,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Organic Plasma Orbs definition (slow trigonometric movement)
    interface PlasmaOrb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      offsetX: number;
      offsetY: number;
    }

    const orbs: PlasmaOrb[] = [
      { x: width * 0.25, y: height * 0.3, vx: 0.2, vy: 0.15, radius: width * 0.38, color: 'rgba(139, 92, 246, 0.05)', speedX: 0.0007, speedY: 0.0005, offsetX: 100, offsetY: 200 }, // Purple
      { x: width * 0.75, y: height * 0.75, vx: -0.15, vy: 0.2, radius: width * 0.42, color: 'rgba(16, 185, 129, 0.04)', speedX: 0.0004, speedY: 0.0006, offsetX: 500, offsetY: 100 }, // Emerald
      { x: width * 0.8, y: height * 0.2, vx: -0.1, vy: -0.15, radius: width * 0.35, color: 'rgba(59, 130, 246, 0.04)', speedX: 0.0005, speedY: 0.0003, offsetX: 300, offsetY: 400 }, // Neon Blue
      { x: width * 0.3, y: height * 0.8, vx: 0.15, vy: -0.1, radius: width * 0.39, color: 'rgba(244, 63, 94, 0.045)', speedX: 0.0006, speedY: 0.0008, offsetX: 700, offsetY: 300 }, // Rose Pink
    ];

    // Animation Loop
    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Set blend mode for smooth neon overlapping glows
      ctx.globalCompositeOperation = 'screen';

      // 1. Render and Update Organic Plasma Orbs
      orbs.forEach((orb) => {
        // Trigonometric drift around initial spots
        const driftX = Math.sin(time * orb.speedX + orb.offsetX) * (width * 0.12);
        const driftY = Math.cos(time * orb.speedY + orb.offsetY) * (height * 0.12);
        const currentX = orb.x + driftX;
        const currentY = orb.y + driftY;

        // Draw massive radial glow gradient
        const grad = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, orb.radius);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(0.5, orb.color.replace('0.0', '0.015'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // 2. Render and Update Interactive Cursor Color Splash Spotlight
      if (mouse.x > -500) {
        // Smoothly interpolate cursor glow visibility
        mouse.currentGlow += (mouse.targetGlow - mouse.currentGlow) * 0.05;
        // Slowly decay spotlight when mouse stops moving
        mouse.targetGlow = Math.max(0.15, mouse.targetGlow - 0.004);

        const radialGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 2.2
        );
        // Cyan-purple-pink tri-color reactive spotlight
        radialGlow.addColorStop(0, `rgba(59, 130, 246, ${mouse.currentGlow * 0.06})`);
        radialGlow.addColorStop(0.3, `rgba(139, 92, 246, ${mouse.currentGlow * 0.035})`);
        radialGlow.addColorStop(0.7, `rgba(244, 63, 94, ${mouse.currentGlow * 0.015})`);
        radialGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Restore composite operation for normal particle rendering
      ctx.globalCompositeOperation = 'source-over';

      // 3. Update & Render Bubble Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Soft breathing pulsation on baseline alpha
        const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.05;
        const currentBaseAlpha = Math.max(0.02, p.baseAlpha + pulse);

        // Normal passive drift
        p.x += p.vx;
        p.y += p.vy;

        // Bouncing boundaries
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Interactive mouse electrostatic repulsion force
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const forceX = (dx / dist) * force * 1.6;
          const forceY = (dy / dist) * force * 1.6;
          
          p.x += forceX;
          p.y += forceY;
          // Brighten particle matching mouse cursor hover proximity
          p.alpha = Math.min(currentBaseAlpha * 3.5, 0.9);
        } else {
          // Fade back smoothly to baseline
          if (p.alpha > currentBaseAlpha) {
            p.alpha -= 0.008;
          } else {
            p.alpha = currentBaseAlpha;
          }
        }

        // Draw bubble particle with radial gradient for a premium glossy sphere texture
        const bubbleGrad = ctx.createRadialGradient(
          p.x - p.radius * 0.25,
          p.y - p.radius * 0.25,
          p.radius * 0.1,
          p.x,
          p.y,
          p.radius
        );
        bubbleGrad.addColorStop(0, '#ffffff');
        bubbleGrad.addColorStop(0.2, `${p.color}${p.alpha * 1.2})`);
        bubbleGrad.addColorStop(0.8, `${p.color}${p.alpha * 0.5})`);
        bubbleGrad.addColorStop(1, `${p.color}${p.alpha * 0.15})`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = bubbleGrad;
        ctx.fill();

        // High contrast glowing neon border stroke
        ctx.strokeStyle = `${p.color}${p.alpha * 0.75})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none transition-all duration-300"
      style={{
        zIndex: -1,
        backgroundColor: 'transparent',
      }}
    />
  );
}
