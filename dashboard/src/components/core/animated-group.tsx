'use client';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

type PresetType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'blur'
  | 'blur-slide'
  | 'zoom'
  | 'flip'
  | 'bounce'
  | 'rotate'
  | 'swing';

const presets: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.4 } },
    },
  },
  slide: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    },
  },
  scale: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
    },
    item: {
      hidden: { opacity: 0, scale: 0.85 },
      visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    },
  },
  blur: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    },
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.4 } },
    },
  },
  'blur-slide': {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 180, damping: 22 },
      },
    },
  },
  zoom: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    },
  },
  flip: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, rotateX: -90 },
      visible: { opacity: 1, rotateX: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    },
  },
  bounce: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
    },
    item: {
      hidden: { opacity: 0, y: -20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 10, mass: 0.8 },
      },
    },
  },
  rotate: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
    },
    item: {
      hidden: { opacity: 0, rotate: -10, scale: 0.9 },
      visible: { opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    },
  },
  swing: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, rotate: -15, transformOrigin: 'top center' },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 150, damping: 15 },
      },
    },
  },
};

interface AnimatedGroupProps {
  children: React.ReactNode;
  preset?: PresetType;
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  asChild?: keyof React.JSX.IntrinsicElements;
}

export function AnimatedGroup({
  children,
  preset = 'fade',
  variants,
  className,
  as = 'div',
  asChild = 'div',
}: AnimatedGroupProps) {
  const prefersReduced = useReducedMotion();
  const selectedPreset = presets[preset];

  const containerVariants: Variants = {
    ...selectedPreset.container,
    ...variants?.container,
  };
  const itemVariants: Variants = {
    ...selectedPreset.item,
    ...variants?.item,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionContainer = (motion[as as keyof typeof motion] ?? motion.div) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionItem = (motion[asChild as keyof typeof motion] ?? motion.div) as any;

  if (prefersReduced) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Container = as as unknown as React.ComponentType<any>;
    return <Container className={className}>{children}</Container>;
  }

  return (
    <MotionContainer
      initial="hidden"
      animate="visible"
      className={cn(className)}
      variants={containerVariants}
    >
      {React.Children.map(children, (child, i) => (
        <MotionItem key={i} variants={itemVariants}>
          {child}
        </MotionItem>
      ))}
    </MotionContainer>
  );
}
