import { useEffect, useRef, memo } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

// Memoized to prevent re-renders
export const ParticleBackground = memo(function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let isVisible = true;

    // Use reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Skip animation entirely for users who prefer reduced motion
    }

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    const createParticles = () => {
      particles = [];
      // Reduced particle count for better performance
      const area = window.innerWidth * window.innerHeight;
      const particleCount = Math.min(Math.floor(area / 25000), 40); // Max 40 particles
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2, // Slower speed
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }
    };

    const drawParticles = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(drawParticles);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      ctx.clearRect(0, 0, width, height);

      // Batch particle rendering
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      particles.forEach((particle) => {
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      });

      ctx.globalAlpha = 1;

      // Draw connections only for nearby particles (optimized)
      const connectionDistance = 80; // Reduced from 100
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          
          // Quick distance check (avoid sqrt when possible)
          if (Math.abs(dx) > connectionDistance || Math.abs(dy) > connectionDistance) continue;
          
          const distSq = dx * dx + dy * dy;
          const maxDistSq = connectionDistance * connectionDistance;
          
          if (distSq < maxDistSq) {
            const opacity = 0.08 * (1 - distSq / maxDistSq);
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(drawParticles);
    };

    // Visibility API to pause when tab is hidden
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Debounced resize handler
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        resizeCanvas();
        createParticles();
      }, 150);
    };

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 will-change-transform"
      style={{ opacity: 0.5 }}
      aria-hidden="true"
    />
  );
});