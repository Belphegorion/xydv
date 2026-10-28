'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';
import { ArrowRight, CaretDown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TOTAL_FRAMES = 20;
const KEYFRAME_STRIDE = 4;

// Module-level persistent frame cache: preserved across client-side soft navigations
const moduleFrameCache: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);

const getFrameUrl = (index: number) => {
  const pad = String(index + 1).padStart(3, '0');
  return `/animations/hero/ezgif-frame-${pad}.jpg`;
};

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCounterRef = useRef<HTMLSpanElement>(null);
  const telemetryLabelRef = useRef<HTMLSpanElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Flowing kinetic ladder transforms for STAGE 1: MATERIAL SPECS (MOISTURE & REBOUND)
  // Window: 0.00 -> 0.36
  const stage1Opacity = useTransform(scrollYProgress, [0, 0.22, 0.32], [1, 1, 0]);
  const stage1Visibility = useTransform<number, 'hidden' | 'visible'>(scrollYProgress, (v) =>
    v > 0.35 ? 'hidden' : 'visible',
  );
  const stage1Rung1X = useTransform(scrollYProgress, [0, 0.2, 0.32], [0, -12, -35]);
  const stage1Rung1Y = useTransform(scrollYProgress, [0, 0.2, 0.32], [0, -4, -14]);
  const stage1Rung2X = useTransform(scrollYProgress, [0, 0.22, 0.32], [0, 16, 42]);
  const stage1Rung2Y = useTransform(scrollYProgress, [0, 0.22, 0.32], [0, -2, -8]);
  const stage1Rung3X = useTransform(scrollYProgress, [0, 0.24, 0.32], [0, -8, -24]);
  const stage1Rung3Y = useTransform(scrollYProgress, [0, 0.24, 0.32], [0, 6, 16]);
  const stage1ContentY = useTransform(scrollYProgress, [0, 0.2, 0.32], [0, 8, 20]);

  // Flowing kinetic ladder transforms for STAGE 2: MATERIAL SPECS (BALLISTIC ARMOR & CORDURA)
  // Window: 0.32 -> 0.68
  const stage2Opacity = useTransform(scrollYProgress, [0.32, 0.4, 0.58, 0.68], [0, 1, 1, 0]);
  const stage2Visibility = useTransform<number, 'hidden' | 'visible'>(scrollYProgress, (v) =>
    v < 0.3 || v > 0.7 ? 'hidden' : 'visible',
  );
  const stage2Rung1X = useTransform(scrollYProgress, [0.32, 0.45, 0.68], [-30, 0, 30]);
  const stage2Rung1Y = useTransform(scrollYProgress, [0.32, 0.45, 0.68], [15, 0, -15]);
  const stage2Rung2X = useTransform(scrollYProgress, [0.32, 0.48, 0.68], [-20, 0, 40]);
  const stage2Rung2Y = useTransform(scrollYProgress, [0.32, 0.48, 0.68], [10, 0, -10]);
  const stage2Rung3X = useTransform(scrollYProgress, [0.32, 0.5, 0.68], [-35, 0, 25]);
  const stage2Rung3Y = useTransform(scrollYProgress, [0.32, 0.5, 0.68], [20, 0, -20]);
  const stage2ContentY = useTransform(scrollYProgress, [0.32, 0.45, 0.68], [15, 0, -15]);

  // Flowing kinetic ladder transforms for STAGE 3: CLIMAX (ENGINEERED FOR THE RELENTLESS)
  // Window: 0.68 -> 1.00
  const climaxOpacity = useTransform(scrollYProgress, [0.68, 0.78, 1.0], [0, 1, 1]);
  const climaxVisibility = useTransform<number, 'hidden' | 'visible'>(scrollYProgress, (v) =>
    v < 0.66 ? 'hidden' : 'visible',
  );
  const climaxPointerEvents = useTransform<number, 'none' | 'auto'>(scrollYProgress, (v) =>
    v < 0.75 ? 'none' : 'auto',
  );
  const climaxRung1X = useTransform(scrollYProgress, [0.68, 0.82, 1.0], [-25, 0, 0]);
  const climaxRung1Y = useTransform(scrollYProgress, [0.68, 0.82, 1.0], [20, 0, 0]);
  const climaxRung2X = useTransform(scrollYProgress, [0.7, 0.85, 1.0], [-15, 0, 0]);
  const climaxRung2Y = useTransform(scrollYProgress, [0.7, 0.85, 1.0], [15, 0, 0]);
  const climaxRung3X = useTransform(scrollYProgress, [0.72, 0.88, 1.0], [-30, 0, 0]);
  const climaxRung3Y = useTransform(scrollYProgress, [0.72, 0.88, 1.0], [25, 0, 0]);
  const climaxContentY = useTransform(scrollYProgress, [0.68, 0.82, 1.0], [20, 0, 0]);

  // Scroll cues and tactical telemetry transforms
  const initialScrollPromptOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const telemetryOpacity = useTransform(scrollYProgress, [0.15, 0.22, 0.84, 0.9], [0, 1, 1, 0]);
  const completionCueOpacity = useTransform(scrollYProgress, [0.9, 0.96], [0, 1]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: EMIL_EASE,
      },
    },
  };

  // Two-pass frame cache, cached canvas dimensions (zero reflow during RAF), & RAF scheduler
  const framesRef = useRef<(HTMLImageElement | null)[]>(moduleFrameCache);
  const rafIdRef = useRef<number | null>(null);
  const targetFrameRef = useRef<number>(0);
  const sizeRef = useRef<{ cw: number; ch: number; dpr: number }>({ cw: 0, ch: 0, dpr: 1 });

  const getBestLoadedFrame = useCallback((targetIndex: number): HTMLImageElement | null => {
    const frames = framesRef.current;
    const direct = frames[targetIndex] || moduleFrameCache[targetIndex];
    if (direct?.complete && direct.naturalWidth > 0) return direct;

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 0) {
        const pf = frames[prev] || moduleFrameCache[prev];
        if (pf?.complete && pf.naturalWidth > 0) return pf;
      }
      const next = targetIndex + offset;
      if (next < TOTAL_FRAMES) {
        const nf = frames[next] || moduleFrameCache[next];
        if (nf?.complete && nf.naturalWidth > 0) return nf;
      }
    }
    return null;
  }, []);

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const img = getBestLoadedFrame(frameIndex);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      let { cw, ch, dpr } = sizeRef.current;
      if (cw === 0 || ch === 0) {
        const rect = canvas.getBoundingClientRect();
        cw = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 0);
        ch = rect.height || (typeof window !== 'undefined' ? window.innerHeight : 0);
        dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
        sizeRef.current = { cw, ch, dpr };
        const targetW = Math.round(cw * dpr);
        const targetH = Math.round(ch * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
      if (cw === 0 || ch === 0) return;

      const iw = img.naturalWidth || 1920;
      const ih = img.naturalHeight || 1080;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;

      // Vertical framing: center 3D hoodie turntable vertically (focalY = 0.50) without clipping
      const focalY = 0.5;
      const dy = Math.min(0, Math.max(ch - nh, ch / 2 - nh * focalY));

      // Horizontal framing: center 3D hoodie turntable dead-center (focalX = 0.50) across mobile and desktop
      const isMobile = cw < 768;
      const focalX = isMobile ? 0.5 : 0.5;
      const dx = Math.min(0, Math.max(cw - nw, cw / 2 - nw * focalX));

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, dx, dy, nw, nh);
      ctx.restore();
    },
    [getBestLoadedFrame],
  );

  const scheduleRender = useCallback(
    (frameIndex: number, immediate = false) => {
      targetFrameRef.current = frameIndex;
      if (frameCounterRef.current) {
        frameCounterRef.current.textContent = `[${String(frameIndex + 1).padStart(3, '0')} / 020]`;
      }
      if (immediate) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        drawFrame(frameIndex);
        return;
      }
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        drawFrame(targetFrameRef.current);
      });
    },
    [drawFrame],
  );

  // Bind scroll progress directly to frame scrubbing & notify navbar
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (shouldReduceMotion) return;
    const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(latest * TOTAL_FRAMES)));
    scheduleRender(targetFrame);
    if (telemetryLabelRef.current) {
      if (latest < 0.35) {
        telemetryLabelRef.current.textContent = 'SEQ 01: SWEATSHIELD+ // 18K MVTR';
      } else if (latest < 0.68) {
        telemetryLabelRef.current.textContent = 'SEQ 02: 500D CORDURA® // RIPSTOP';
      } else {
        telemetryLabelRef.current.textContent = 'SEQ 03: RELENTLESS // STORM HOOD';
      }
    }
    if (typeof window !== 'undefined') {
      const isFinished = latest >= 0.92;
      window.dispatchEvent(
        new CustomEvent('xydv:hero-animation-status', {
          detail: { isFinished, progress: latest },
        }),
      );
    }
  });

  // Preloader lifecycle: Eager Frame 0 -> Pass 1 Keyframes (stride 4) -> Pass 2 Infill
  useEffect(() => {
    let isMounted = true;
    rafIdRef.current = null;

    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      let cw = rect.width;
      let ch = rect.height;

      // Resilient layout fallback for client-side soft navigations
      if (cw === 0 || ch === 0) {
        if (typeof window !== 'undefined') {
          cw = window.innerWidth;
          ch = window.innerHeight;
        }
      }
      if (cw === 0 || ch === 0) return;

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      const targetW = Math.round(cw * dpr);
      const targetH = Math.round(ch * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      sizeRef.current = { cw, ch, dpr };
      if (isMounted) {
        scheduleRender(targetFrameRef.current, true);
      }
    };

    updateSize();

    const loadFrame = async (index: number): Promise<HTMLImageElement | null> => {
      const existing = framesRef.current[index] || moduleFrameCache[index];
      if (existing?.complete && existing.naturalWidth > 0) {
        framesRef.current[index] = existing;
        moduleFrameCache[index] = existing;
        return existing;
      }

      return new Promise((resolve) => {
        let settled = false;
        const onFinish = (result: HTMLImageElement | null) => {
          if (settled) return;
          settled = true;
          if (result) {
            framesRef.current[index] = result;
            moduleFrameCache[index] = result;
          }
          resolve(result);
        };

        const img = new Image();
        img.fetchPriority = index === 0 ? 'high' : 'auto';

        // 1. Wire listeners BEFORE setting src to eliminate synchronous cache race conditions
        img.onload = () => {
          if ('decode' in img) {
            img
              .decode()
              .then(() => onFinish(img))
              .catch(() => onFinish(img));
          } else {
            onFinish(img);
          }
        };

        img.onerror = () => {
          onFinish(null);
        };

        // 2. Set src after handlers are bound
        img.src = getFrameUrl(index);

        // 3. Synchronous cache check: if browser resolved from disk/memory cache immediately
        if (img.complete && img.naturalWidth > 0) {
          if ('decode' in img) {
            img
              .decode()
              .then(() => onFinish(img))
              .catch(() => onFinish(img));
          } else {
            onFinish(img);
          }
        }
      });
    };

    const runPool = async (indices: number[], concurrency: number) => {
      let nextIdx = 0;
      const worker = async () => {
        while (nextIdx < indices.length && isMounted) {
          const cur = indices[nextIdx++];
          await loadFrame(cur);
          if (isMounted) {
            scheduleRender(targetFrameRef.current, false);
          }
        }
      };
      const workerCount = Math.min(concurrency, indices.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    };

    const initPreloader = async () => {
      // Step 1: Eagerly load Frame 0 & render immediately upon mount
      const firstFrame = await loadFrame(0);
      if (isMounted && firstFrame) {
        updateSize();
        scheduleRender(targetFrameRef.current, true);
      }

      // If user prefers reduced motion, only frame 0 is needed
      if (shouldReduceMotion) return;

      // Step 2: Pass 1 - Keyframe Decimation (stride 4, 6 frames, concurrency 6)
      const keyframes: number[] = [];
      const keyframeSet = new Set<number>();
      for (let i = 0; i < TOTAL_FRAMES; i += KEYFRAME_STRIDE) {
        keyframes.push(i);
        keyframeSet.add(i);
      }
      if (!keyframeSet.has(TOTAL_FRAMES - 1)) {
        keyframes.push(TOTAL_FRAMES - 1);
        keyframeSet.add(TOTAL_FRAMES - 1);
      }

      await runPool(keyframes, 6);

      // Step 3: Pass 2 - Infill intermediate frames in background (concurrency 4)
      const remainingFrames: number[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (!keyframeSet.has(i)) {
          remainingFrames.push(i);
        }
      }

      await runPool(remainingFrames, 4);
    };

    initPreloader();

    // Trigger immediate render passes to guarantee painting on client-side soft navigations
    const initialProgress = scrollYProgress.get();
    const initialFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(initialProgress * TOTAL_FRAMES)),
    );
    scheduleRender(initialFrame, true);

    const rafId = requestAnimationFrame(() => {
      if (!isMounted) return;
      updateSize();
      scheduleRender(targetFrameRef.current, true);
    });

    const timerId = setTimeout(() => {
      if (!isMounted) return;
      updateSize();
      scheduleRender(targetFrameRef.current, true);
    }, 60);

    window.addEventListener('resize', updateSize);
    const canvas = canvasRef.current;
    let ro: ResizeObserver | null = null;
    if (canvas && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      ro.observe(canvas);
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [scheduleRender, shouldReduceMotion, scrollYProgress]);

  return (
    <section
      id="hero-section"
      ref={containerRef}
      aria-label="New Season Showcase"
      className={cn(
        'dark relative min-h-[100dvh] w-full border-b border-black/20 bg-black dark:border-white/10',
        shouldReduceMotion ? '' : 'h-[350vh]',
      )}
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 flex h-[100dvh] w-full flex-col justify-center overflow-hidden bg-black px-4 pt-16 pb-12 sm:px-8 sm:pt-20 md:px-12 md:pt-24 lg:px-16">
        {/* HTML5 Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
          aria-hidden="true"
        />

        {/* Hidden Fallback Video for Design System Contract & Network Efficiency */}
        <video
          preload="none"
          muted
          playsInline
          className="pointer-events-none hidden select-none"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-athlete-training-in-the-gym-42777-large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Hero Content with Flowing Kinetic Ladder Choreography: Material Specs First, Climax At Last */}
        <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative flex min-h-[360px] w-full max-w-xl flex-col items-start sm:min-h-[400px] lg:max-w-2xl"
          >
            {/* ========================================================================= */}
            {/* 1. STAGE 1: MATERIAL SPECS (FIRST — SCROLL 0.00 -> 0.35)                  */}
            {/* ========================================================================= */}
            <motion.div
              style={{
                visibility: shouldReduceMotion ? 'hidden' : stage1Visibility,
                opacity: shouldReduceMotion ? 0 : stage1Opacity,
              }}
              className={cn(
                'pointer-events-none flex w-full flex-col items-start select-none',
                shouldReduceMotion ? 'hidden' : 'relative',
              )}
              aria-hidden={shouldReduceMotion ? 'true' : undefined}
            >
              <div className="mb-3 sm:mb-4">
                <Badge variant="volt" size="md" dot>
                  ENGINEERED MATERIAL SPECS // PHASE 01
                </Badge>
              </div>

              <div
                className="font-heading mb-4 flex w-full flex-col tracking-tighter uppercase sm:mb-6"
                aria-label="SweatShield Plus Moisture Regulation 4-Way Rebound"
              >
                {/* Ladder Step 1: SWEATSHIELD+ */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage1Rung1X,
                    y: shouldReduceMotion ? 0 : stage1Rung1Y,
                  }}
                  className="flex items-baseline gap-3"
                >
                  <span className="block text-[clamp(1.4rem,4.5vw,4.25rem)] leading-[0.92] font-extrabold tracking-tight text-white uppercase [text-shadow:_0_2px_20px_rgb(0_0_0_/_90%)]">
                    SWEATSHIELD+
                  </span>
                  <span className="font-mono text-xs font-bold tracking-widest text-[#E8FF00] sm:text-sm">
                    18,000 g/m²
                  </span>
                </motion.div>

                {/* Ladder Step 2: 4-WAY REBOUND (Stepped inward with technical marker) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage1Rung2X,
                    y: shouldReduceMotion ? 0 : stage1Rung2Y,
                  }}
                  className="my-1 flex items-center gap-2 pl-4 sm:my-2 sm:gap-3 sm:pl-8 md:pl-12"
                >
                  <span
                    className="h-[2px] w-6 shrink-0 bg-[#E8FF00] shadow-[0_0_8px_rgba(232,255,0,0.6)] sm:w-10"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[clamp(1rem,2.8vw,2.5rem)] leading-none font-bold tracking-wider text-[#E8FF00] uppercase [text-shadow:_0_2px_14px_rgb(0_0_0_/_80%)]">
                    4-WAY REBOUND
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase sm:text-xs">
                    {'// 94% TENSILE'}
                  </span>
                </motion.div>

                {/* Ladder Step 3: ZERO SATURATION (Stepped further down and inward) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage1Rung3X,
                    y: shouldReduceMotion ? 0 : stage1Rung3Y,
                  }}
                  className="pl-4 sm:pl-16 md:pl-24"
                >
                  <span className="block text-[clamp(1.3rem,4vw,3.75rem)] leading-[0.92] font-black tracking-tight text-white uppercase [text-shadow:_0_2px_24px_rgb(0_0_0_/_95%)]">
                    ZERO SATURATION
                  </span>
                </motion.div>
              </div>

              <motion.p
                style={{
                  y: shouldReduceMotion ? 0 : stage1ContentY,
                }}
                className="mb-4 max-w-lg border-l-2 border-[#E8FF00]/60 bg-black/20 py-1 pl-3 font-sans text-xs leading-relaxed text-zinc-200 backdrop-blur-[2px] [text-shadow:_0_1px_8px_rgb(0_0_0_/_90%)] sm:text-sm md:text-base"
              >
                Hydrophobic micro-yarn channels moisture away from the dermis 3x faster than
                standard knit. Maintains zero garment saturation under peak Zone 5 anaerobic output.
              </motion.p>
            </motion.div>

            {/* ========================================================================= */}
            {/* 2. STAGE 2: MATERIAL SPECS (BALLISTIC ARMOR — SCROLL 0.32 -> 0.68)        */}
            {/* ========================================================================= */}
            <motion.div
              style={{
                visibility: shouldReduceMotion ? 'hidden' : stage2Visibility,
                opacity: shouldReduceMotion ? 0 : stage2Opacity,
              }}
              className={cn(
                'pointer-events-none flex w-full flex-col items-start select-none',
                shouldReduceMotion ? 'hidden' : 'absolute top-0 left-0',
              )}
              aria-hidden={shouldReduceMotion ? 'true' : undefined}
            >
              <div className="mb-3 sm:mb-4">
                <Badge variant="volt" size="md" dot>
                  ENGINEERED MATERIAL SPECS // PHASE 02
                </Badge>
              </div>

              <div
                className="font-heading mb-4 flex w-full flex-col tracking-tighter uppercase sm:mb-6"
                aria-label="Cordura Ripstop 500D Abrasion Armor ClimateSync"
              >
                {/* Ladder Step 1: CORDURA® RIPSTOP */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage2Rung1X,
                    y: shouldReduceMotion ? 0 : stage2Rung1Y,
                  }}
                  className="flex items-baseline gap-3"
                >
                  <span className="block text-[clamp(1.8rem,5vw,4.25rem)] leading-[0.92] font-extrabold tracking-tight text-white uppercase [text-shadow:_0_2px_20px_rgb(0_0_0_/_90%)]">
                    CORDURA® RIPSTOP
                  </span>
                  <span className="font-mono text-xs font-bold tracking-widest text-[#E8FF00] sm:text-sm">
                    500D DENIER
                  </span>
                </motion.div>

                {/* Ladder Step 2: ABRASION ARMOR (Stepped inward) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage2Rung2X,
                    y: shouldReduceMotion ? 0 : stage2Rung2Y,
                  }}
                  className="my-1 flex items-center gap-2 pl-4 sm:my-2 sm:gap-3 sm:pl-8 md:pl-12"
                >
                  <span
                    className="h-[2px] w-6 shrink-0 bg-[#E8FF00] shadow-[0_0_8px_rgba(232,255,0,0.6)] sm:w-10"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[clamp(1.1rem,3vw,2.5rem)] leading-none font-bold tracking-wider text-[#E8FF00] uppercase [text-shadow:_0_2px_14px_rgb(0_0_0_/_80%)]">
                    ABRASION ARMOR
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase sm:text-xs">
                    {'// 50,000+ RUBS'}
                  </span>
                </motion.div>

                {/* Ladder Step 3: CLIMATESYNC (Stepped further down and inward) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : stage2Rung3X,
                    y: shouldReduceMotion ? 0 : stage2Rung3Y,
                  }}
                  className="pl-8 sm:pl-16 md:pl-24"
                >
                  <span className="block text-[clamp(1.5rem,4.5vw,3.75rem)] leading-[0.92] font-black tracking-tight text-white uppercase [text-shadow:_0_2px_24px_rgb(0_0_0_/_95%)]">
                    CLIMATESYNC THERMAL
                  </span>
                </motion.div>
              </div>

              <motion.p
                style={{
                  y: shouldReduceMotion ? 0 : stage2ContentY,
                }}
                className="mb-4 max-w-lg border-l-2 border-[#E8FF00]/60 bg-black/20 py-1 pl-3 font-sans text-xs leading-relaxed text-zinc-200 backdrop-blur-[2px] [text-shadow:_0_1px_8px_rgb(0_0_0_/_90%)] sm:text-sm md:text-base"
              >
                Military-grade ballistic weave reinforced at friction thresholds. Cellular thermal
                micro-grooves preserve 37°C core balance across ambient thermal shifts.
              </motion.p>
            </motion.div>

            {/* ========================================================================= */}
            {/* 3. STAGE 3: CLIMAX — ENGINEERED FOR THE RELENTLESS (AT LAST: 0.68 -> 1.0) */}
            {/* ========================================================================= */}
            <motion.div
              style={{
                visibility: shouldReduceMotion ? 'visible' : climaxVisibility,
                opacity: shouldReduceMotion ? 1 : climaxOpacity,
                pointerEvents: shouldReduceMotion ? 'auto' : climaxPointerEvents,
              }}
              className={cn(
                'flex w-full flex-col items-start',
                shouldReduceMotion ? 'pointer-events-auto relative' : 'absolute top-0 left-0',
              )}
            >
              <div className="mb-3 sm:mb-4">
                <Badge variant="volt" size="md" dot>
                  XYDV SS26 / TECHNICAL DIVISION
                </Badge>
              </div>

              {/* Cascading Flowing Ladder Headline */}
              <h1
                className="font-heading mb-4 flex w-full flex-col tracking-tighter uppercase select-none sm:mb-6"
                aria-label="Engineered For The Relentless"
              >
                {/* Ladder Step 1: ENGINEERED */}
                <motion.span
                  style={{
                    x: shouldReduceMotion ? 0 : climaxRung1X,
                    y: shouldReduceMotion ? 0 : climaxRung1Y,
                  }}
                  className="block text-[clamp(1.5rem,5vw,5rem)] leading-[0.92] font-extrabold tracking-tight text-white uppercase [text-shadow:_0_2px_20px_rgb(0_0_0_/_90%)]"
                >
                  ENGINEERED
                </motion.span>

                {/* Ladder Step 2: FOR THE (Stepped inward with technical marker) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : climaxRung2X,
                    y: shouldReduceMotion ? 0 : climaxRung2Y,
                  }}
                  className="my-1 flex items-center gap-2 pl-4 sm:my-2 sm:gap-3 sm:pl-8 md:pl-12"
                >
                  <span
                    className="h-[2px] w-6 shrink-0 bg-[#E8FF00] shadow-[0_0_8px_rgba(232,255,0,0.6)] sm:w-10"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[clamp(1.1rem,3vw,2.75rem)] leading-none font-bold tracking-wider text-[#E8FF00] uppercase [text-shadow:_0_2px_14px_rgb(0_0_0_/_80%)]">
                    FOR THE
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase sm:text-xs">
                    {'// DIV.01'}
                  </span>
                </motion.div>

                {/* Ladder Step 3: RELENTLESS (Stepped further down and inward) */}
                <motion.div
                  style={{
                    x: shouldReduceMotion ? 0 : climaxRung3X,
                    y: shouldReduceMotion ? 0 : climaxRung3Y,
                  }}
                  className="pl-4 sm:pl-16 md:pl-24"
                >
                  <span className="block text-[clamp(1.6rem,5.5vw,5.5rem)] leading-[0.92] font-black tracking-tight text-white uppercase [text-shadow:_0_2px_24px_rgb(0_0_0_/_95%)]">
                    RELENTLESS
                  </span>
                </motion.div>
              </h1>

              {/* Value Proposition Description */}
              <motion.p
                style={{
                  y: shouldReduceMotion ? 0 : climaxContentY,
                }}
                className="mb-6 max-w-lg border-l-2 border-[#E8FF00]/60 bg-black/20 py-1 pl-3 font-sans text-xs leading-relaxed text-zinc-200 backdrop-blur-[2px] [text-shadow:_0_1px_8px_rgb(0_0_0_/_90%)] sm:mb-8 sm:text-sm md:text-base"
              >
                Tactical performance apparel crafted with proprietary SweatShield+ moisture
                regulation and 4-way AeroFlex ballistic stretch. Built for zero compromise.
              </motion.p>

              {/* Call to Actions with Spring Tap Interaction */}
              <div className="pointer-events-auto flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={SPRING_TACTILE}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/products"
                    className="touch-target inline-flex min-h-[48px] w-full items-center justify-center gap-3 border border-white bg-white px-8 font-mono text-xs font-bold tracking-widest text-black uppercase shadow-lg transition-colors hover:border-zinc-200 hover:bg-zinc-200 sm:w-auto sm:text-sm"
                  >
                    <span>SHOP COLLECTION</span>
                    <ArrowRight size={18} weight="bold" />
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={SPRING_TACTILE}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/products?featured=true"
                    className="touch-target inline-flex min-h-[48px] w-full items-center justify-center border border-white/40 px-8 font-mono text-xs font-bold tracking-widest text-white uppercase shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-black sm:w-auto sm:text-sm"
                  >
                    <span>EXPLORE ARCHIVE</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 1. Initial Visual Scroll Indicator (fades out as scroll begins) */}
        <motion.div
          style={{ opacity: shouldReduceMotion ? 1 : initialScrollPromptOpacity }}
          className="pointer-events-none absolute right-6 bottom-6 z-10 hidden items-center gap-2 font-mono text-xs tracking-widest text-zinc-400 uppercase select-none md:right-12 md:flex"
          aria-hidden="true"
        >
          <span>SCROLL TO EXPLORE SPECS</span>
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CaretDown size={14} />
          </motion.div>
        </motion.div>

        {/* 2. Mid-Sequence Tactical Telemetry Indicator (visible between 15% and 94% scroll) */}
        <motion.div
          style={{ opacity: shouldReduceMotion ? 0 : telemetryOpacity }}
          className="pointer-events-none absolute bottom-6 left-4 z-10 flex items-center gap-2 font-mono text-[10px] tracking-wider text-zinc-400 uppercase select-none sm:left-8 sm:gap-3 sm:text-xs sm:tracking-widest md:left-12"
          aria-hidden="true"
        >
          <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#E8FF00]" />
          <span ref={telemetryLabelRef} className="max-w-[200px] truncate sm:max-w-none">
            SEQ 01: SWEATSHIELD+ // 18K MVTR
          </span>
          <span ref={frameCounterRef} className="shrink-0 font-mono text-zinc-500">
            [001 / 020]
          </span>
        </motion.div>

        {/* 3. Sequence Completion Cue (fades in at 90%..96% scroll) */}
        <motion.div
          style={{ opacity: shouldReduceMotion ? 0 : completionCueOpacity }}
          className="pointer-events-none absolute right-4 bottom-6 z-10 flex items-center gap-2 font-mono text-xs tracking-widest text-[#E8FF00] uppercase select-none sm:right-8 md:right-12"
          aria-hidden="true"
        >
          <span>SCROLL TO ENTER</span>
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, 4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CaretDown size={14} weight="bold" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
