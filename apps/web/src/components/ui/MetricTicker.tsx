'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring, useInView, useReducedMotion } from 'motion/react';

export interface MetricTickerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function MetricTicker({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: MetricTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string>(
    shouldReduceMotion ? value.toLocaleString('en-US') : '0',
  );

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 100,
    damping: 14,
    mass: 1,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(
        decimals > 0
          ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
          : value.toLocaleString('en-US'),
      );
      return;
    }

    if (isInView) {
      motionVal.set(value);
    }
  }, [isInView, value, shouldReduceMotion, decimals, motionVal]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const unsubscribe = springVal.on('change', (latest) => {
      const formatted =
        decimals > 0
          ? latest.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
          : Math.round(latest).toLocaleString('en-US');
      setDisplayValue(formatted);
    });

    return () => unsubscribe();
  }, [springVal, shouldReduceMotion, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
