'use client';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import React, { useCallback, useRef } from 'react';

interface MagneticProps {
  children: React.ReactNode;
  intensity?: number;
  range?: number;
  actionArea?: 'self' | 'parent' | 'global';
  springOptions?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

export function Magnetic({
  children,
  intensity = 0.6,
  range = 100,
  actionArea = 'self',
  springOptions = { stiffness: 26.7, damping: 4.1, mass: 0.2 },
}: MagneticProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range) {
        x.set(dx * intensity);
        y.set(dy * intensity);
      }
    },
    [intensity, range, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (prefersReduced) return <>{children}</>;

  return (
    <motion.div
      ref={ref}
      style={{ x: xSpring, y: ySpring, display: 'inline-block' }}
      onMouseMove={actionArea === 'self' ? handleMouseMove : undefined}
      onMouseLeave={actionArea === 'self' ? handleMouseLeave : undefined}
    >
      {children}
    </motion.div>
  );
}
