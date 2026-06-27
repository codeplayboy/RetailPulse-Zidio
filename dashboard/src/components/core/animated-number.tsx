'use client';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  springOptions?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  as?: keyof React.JSX.IntrinsicElements;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedNumber({
  value,
  className,
  springOptions = { stiffness: 100, damping: 30, mass: 1 },
  as = 'span',
  locale,
  formatOptions,
}: AnimatedNumberProps) {
  const prefersReduced = useReducedMotion();
  const spring = useSpring(prefersReduced ? value : 0, springOptions);
  const display = useTransform(spring, (v) => {
    if (formatOptions) {
      return new Intl.NumberFormat(locale, formatOptions).format(Math.round(v));
    }
    return Math.round(v).toLocaleString(locale);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionTag = (motion[as as keyof typeof motion] ?? motion.span) as any;

  return (
    <MotionTag className={cn('tabular-nums', className)}>
      {display}
    </MotionTag>
  );
}
