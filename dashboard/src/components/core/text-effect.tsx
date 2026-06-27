'use client';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import React, { useEffect, useId, useState } from 'react';
import { cn } from '../../lib/utils';

type PresetType = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide';
type PerType = 'word' | 'char' | 'line';

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  'fade-in-blur': {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
      exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
    },
    item: {
      hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 200, damping: 20 } },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 22 } },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5 } },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    },
  },
};

interface TextEffectProps {
  children: string;
  per?: PerType;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  preset?: PresetType;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  variants?: { container?: Variants; item?: Variants };
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
}

function splitText(text: string, per: PerType): string[] {
  if (per === 'line') return text.split('\n');
  if (per === 'word') return text.split(/(\s+)/);
  return text.split('');
}

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  className,
  preset,
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  variants,
  onAnimationComplete,
  onAnimationStart,
}: TextEffectProps) {
  const prefersReduced = useReducedMotion();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const motionTag = (motion[as as keyof typeof motion] ?? motion.p) as any;
  const id = useId();

  const segments = splitText(children, per);

  const resolvedVariants = preset ? presetVariants[preset] : undefined;

  const containerVariants: Variants = {
    ...defaultContainerVariants,
    ...resolvedVariants?.container,
    ...variants?.container,
    visible: {
      ...defaultContainerVariants.visible,
      ...(resolvedVariants?.container as { visible?: object })?.visible,
      ...(variants?.container as { visible?: object })?.visible,
      transition: {
        staggerChildren: 0.05 / speedReveal,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    ...defaultItemVariants,
    ...resolvedVariants?.item,
    ...variants?.item,
    visible: {
      ...(defaultItemVariants.visible as object),
      ...(resolvedVariants?.item as { visible?: object })?.visible,
      ...(variants?.item as { visible?: object })?.visible,
      transition: {
        duration: 0.3 / speedSegment,
        ...(resolvedVariants?.item as { visible?: { transition?: object } })?.visible?.transition,
        ...(variants?.item as { visible?: { transition?: object } })?.visible?.transition,
      },
    },
  };

  if (prefersReduced) {
    return React.createElement(as, { className }, children);
  }

  const MotionTag = motionTag;

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          key={id}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className={cn('whitespace-pre-wrap', className)}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
        >
          {segments.map((segment, i) => (
            <motion.span
              key={`${id}-${i}`}
              variants={itemVariants}
              style={{ display: per === 'char' ? 'inline' : 'inline-block' }}
            >
              {segment}
            </motion.span>
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
