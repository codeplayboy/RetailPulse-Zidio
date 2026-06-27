'use client';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

interface InViewProps {
  children: React.ReactNode;
  variants?: { hidden: object; visible: object };
  transition?: object;
  viewOptions?: { amount?: number | 'all' | 'some'; margin?: string };
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export function InView({
  children,
  variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  transition = { duration: 0.44, ease: [0.22, 1, 0.36, 1] },
  viewOptions = { amount: 0, margin: '200px' },
  once = true,
  as = 'div',
  className,
}: InViewProps) {
  const ref = useRef<Element>(null);
  const prefersReduced = useReducedMotion();
  const isInView = useInView(ref, { once, ...viewOptions } as Parameters<typeof useInView>[1]);

  if (prefersReduced) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Tag = as as unknown as React.ComponentType<any>;
    return <Tag className={className}>{children}</Tag>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionTag = (motion[as as keyof typeof motion] ?? motion.div) as any;

  return (
    <MotionTag
      ref={ref}
      className={cn(className)}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants as Variants}
      transition={transition}
    >
      {children}
    </MotionTag>
  );
}
