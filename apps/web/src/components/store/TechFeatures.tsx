'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Drop,
  ArrowsOutCardinal,
  Thermometer,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  CheckCircle,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { MetricTicker } from '@/components/ui/MetricTicker';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';

interface TechSpec {
  code: string;
  name: string;
  subtitle: string;
  numericMetric: number;
  metricSuffix: string;
  metricLabel: string;
  description: string;
  icon: typeof Drop;
  standards: string[];
  composition: string;
  stressTest: string;
  applications: string[];
}

const TECH_SPECS: TechSpec[] = [
  {
    code: 'TECH-01',
    name: 'SWEATSHIELD+',
    subtitle: 'MOISTURE REGULATION',
    numericMetric: 18000,
    metricSuffix: ' g/m²',
    metricLabel: 'MVTR BREATHABILITY',
    description:
      'Hydrophobic inner fibers pull sweat away from the dermis 3x faster than standard polyester, preventing garment saturation under maximum heart rate load.',
    icon: Drop,
    standards: ['JIS L 1099 B-1 INVERTED CUP', 'ASTM E96 WATER VAPOR', 'OEKO-TEX STANDARD 100'],
    composition: '68% Tactical Micro-Nylon / 32% Hydro-Active Yarn',
    stressTest: 'Zero saturation after 90 min continuous Zone 5 anaerobic output.',
    applications: ['Performance Compression Tops', 'Basels', 'Fight Rashguards'],
  },
  {
    code: 'TECH-02',
    name: 'AEROFLEX 4-WAY',
    subtitle: 'BALLISTIC REBOUND',
    numericMetric: 94,
    metricSuffix: '% RECOVERY',
    metricLabel: 'TENSILE ELASTICITY',
    description:
      'Continuous multifilament elastane woven in a high-tension matrix allows full range of motion during deadlifts and deep squats without structural deformation.',
    icon: ArrowsOutCardinal,
    standards: ['ASTM D2594 KNIT STRETCH', 'ISO 13934-1 TENSILE FORCE', 'ELASTANE LOCK D4'],
    composition: '84% Recycled Polyamide / 16% Spandex Cross-Grid',
    stressTest: '10,000 cyclic elongation cycles at 150% extension without sag.',
    applications: ['Modular Training Shorts', 'Cargo Track Pants', 'Mobility Joggers'],
  },
  {
    code: 'TECH-03',
    name: 'CLIMATESYNC',
    subtitle: 'THERMAL HOMEOSTASIS',
    numericMetric: 420,
    metricSuffix: ' GSM',
    metricLabel: 'MICRO-GRID FLEECE',
    description:
      'Cellular fleece channels trap radiant body heat in resting intervals while expelling humid vapor through laser-perforated exhaust channels during active output.',
    icon: Thermometer,
    standards: ['ISO 11092 THERMAL RESISTANCE', 'CLO RATING 1.45', 'DWR BLUESIGN APPROVED'],
    composition: '100% High-Density Brushed Thermal Polymer with Micro-Grooves',
    stressTest: 'Maintains 37°C core balance across ambient -5°C to +18°C shifts.',
    applications: ['Tactical Outerwear', 'Cold Weather Tech Hoodies', 'Thermal Layers'],
  },
  {
    code: 'TECH-04',
    name: 'CORDURA® RIPSTOP',
    subtitle: 'ABRASION ARMOR',
    numericMetric: 500,
    metricSuffix: 'D DENIER',
    metricLabel: 'BALLISTIC REINFORCEMENT',
    description:
      'Military-grade high-tenacity nylon woven at critical friction stress points — barbell contact zones, knee hinges, and pocket trims — ensuring 500+ wash lifecycles.',
    icon: ShieldCheck,
    standards: ['MIL-SPEC DTL-32439A', 'MARTINDALE 50,000+ RUBS', 'YKK WATER-RESISTANT'],
    composition: '100% CORDURA® High-Tenacity Air-Jet Textured Nylon 6,6',
    stressTest: 'Zero rupture against knurled steel barbell knurling at 500 lbs.',
    applications: ['Barbell Contact Panels', 'Knee Gussets', 'EDC Tactical Bags'],
  },
];

export function TechFeatures() {
  const [activeTab, setActiveTab] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const currentSpec = TECH_SPECS[activeTab];

  return (
    <section
      aria-labelledby="tech-features-heading"
      className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--bg-surface)] px-4 py-16 transition-colors sm:px-6 sm:py-24 md:px-12"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 flex flex-col justify-between border-b border-[var(--border)] pb-8 sm:mb-12 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Cpu
                size={14}
                className="text-[var(--text-primary)] dark:text-[var(--accent)]"
                weight="bold"
              />
              <span className="font-mono text-xs tracking-[0.25em] text-[var(--text-secondary)] uppercase dark:text-[var(--accent)]">
                PROPRIETARY TEXTILE SCIENCE
              </span>
            </div>
            <h2
              id="tech-features-heading"
              className="font-heading text-3xl font-bold tracking-tighter text-[var(--text-primary)] uppercase md:text-5xl"
            >
              ENGINEERED MATERIAL SPECS
            </h2>
          </div>
          <p className="mt-4 max-w-sm font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase md:mt-0 md:text-right">
            TESTED ACROSS 1,000+ HOURS OF ELITE CROSS-TRAINING AND COMBAT SPORTS
          </p>
        </div>

        {/* Interactive Textile Inspector Tabs with Shared Spring Pill */}
        <div
          role="tablist"
          aria-label="Textile Technology Inspector Tabs"
          className="relative mb-8 grid grid-cols-2 gap-2 border border-[var(--border)] bg-[var(--bg)] p-2 lg:grid-cols-4"
        >
          {TECH_SPECS.map((tech, idx) => {
            const Icon = tech.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={tech.code}
                role="tab"
                id={`tab-${tech.code}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tech.code}`}
                onClick={() => setActiveTab(idx)}
                className={`btn-tactile relative flex items-center justify-between border px-2 py-2.5 text-left transition-colors duration-150 active:scale-[0.97] sm:px-4 sm:py-4 ${
                  isSelected
                    ? 'border-[var(--accent)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-primary)]'
                }`}
              >
                {/* Sliding Spring Active Indicator Pill */}
                {isSelected && (
                  <motion.div
                    layoutId="active-tech-tab-bg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 z-0 bg-[var(--bg-elevated)]"
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 flex min-w-0 items-center gap-1.5 sm:gap-3">
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center border transition-colors sm:h-8 sm:w-8 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:border-[var(--accent)] dark:bg-[var(--accent)]/15 dark:text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Icon size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-mono text-[11px] font-bold tracking-wider uppercase sm:text-xs">
                      {tech.name}
                    </span>
                    <span className="block font-mono text-[9px] text-[var(--text-secondary)] uppercase sm:text-[10px]">
                      {tech.code}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="relative z-10 hidden h-1.5 w-1.5 rounded-none bg-[var(--accent)] sm:inline-block"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Inspector Panel */}
        <div
          role="tabpanel"
          id={`panel-${currentSpec.code}`}
          aria-labelledby={`tab-${currentSpec.code}`}
          className="relative mb-12 overflow-hidden border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-8 md:p-12"
        >
          {/* Subtle tactical grid background */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-5 select-none"
            aria-hidden="true"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpec.code}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EMIL_EASE }}
              className="relative z-10 grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-12"
            >
              {/* Left Column: Core Spec & Live Numerical Counter */}
              <div className="flex flex-col justify-between lg:col-span-7">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <Badge variant="volt" size="sm" dot>
                      ACTIVE DIAGNOSTIC
                    </Badge>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {currentSpec.code}
                    </span>
                  </div>

                  <h3 className="font-heading mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
                    {currentSpec.name}
                  </h3>
                  <p className="mb-6 font-mono text-xs font-semibold tracking-widest text-[var(--text-primary)] uppercase dark:text-[var(--accent)]">
                    {currentSpec.subtitle}
                  </p>

                  <p className="mb-8 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm md:text-base">
                    {currentSpec.description}
                  </p>
                </div>

                {/* Animated Numerical Metric with Spring Physics */}
                <div className="flex flex-col justify-between gap-4 border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-baseline sm:p-6">
                  <div>
                    <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {currentSpec.metricLabel}
                    </span>
                    <div className="font-mono text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                      <MetricTicker
                        value={currentSpec.numericMetric}
                        suffix={currentSpec.metricSuffix}
                      />
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    LAB VERIFIED
                  </Badge>
                </div>
              </div>

              {/* Right Column: Lab Diagnostic Matrix */}
              <div className="space-y-5 border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:space-y-6 sm:p-6 lg:col-span-5">
                <div>
                  <span className="mb-1 block font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                    FIBER COMPOSITION
                  </span>
                  <p className="font-mono text-xs font-medium text-[var(--text-primary)]">
                    {currentSpec.composition}
                  </p>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <span className="mb-1 block font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                    LABORATORY BENCHMARK TEST
                  </span>
                  <p className="font-mono text-xs leading-relaxed font-semibold text-[var(--text-primary)] dark:text-[var(--accent)]">
                    {currentSpec.stressTest}
                  </p>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <span className="mb-2 block font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                    CERTIFIED ACCREDITATIONS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSpec.standards.map((std) => (
                      <span
                        key={std}
                        className="border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <span className="mb-2 block font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                    INTEGRATED ALLOCATIONS
                  </span>
                  <ul className="space-y-1.5">
                    {currentSpec.applications.map((app) => (
                      <li
                        key={app}
                        className="flex items-center gap-2 font-mono text-xs text-[var(--text-primary)]"
                      >
                        <CheckCircle
                          size={14}
                          className="flex-shrink-0 text-[#15803d] dark:text-[#22c55e]"
                          weight="bold"
                        />
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 4-Card Overview Grid with Spring Hover — Snap horizontal scroll on mobile, responsive grid on tablet/desktop */}
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {TECH_SPECS.map((tech, idx) => {
            const Icon = tech.icon;
            const isSelected = activeTab === idx;
            return (
              <motion.div
                key={tech.code}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab(idx);
                  }
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                transition={SPRING_TACTILE}
                className={`flex min-w-[280px] cursor-pointer snap-center flex-col justify-between border bg-[var(--bg)] p-5 transition-[border-color,box-shadow] duration-200 focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none sm:min-w-0 sm:p-6 ${
                  isSelected
                    ? 'border-[var(--accent)] shadow-sm'
                    : 'border-[var(--border)] hover:border-[var(--text-primary)]/40'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center border transition-colors sm:h-9 sm:w-9 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:border-[var(--accent)] dark:bg-[var(--accent)]/15 dark:text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Icon size={18} weight="bold" />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {tech.code}
                    </span>
                  </div>

                  <h3 className="font-heading text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase sm:text-base">
                    {tech.name}
                  </h3>
                  <p className="mt-0.5 mb-3 font-mono text-[10px] font-semibold tracking-widest text-[var(--text-primary)] uppercase dark:text-[var(--accent)]">
                    {tech.subtitle}
                  </p>
                  <p className="mb-6 line-clamp-3 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                    {tech.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div>
                    <span className="block font-mono text-sm font-bold text-[var(--text-primary)] sm:text-base">
                      {tech.numericMetric.toLocaleString('en-US')}
                      {tech.metricSuffix}
                    </span>
                    <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] uppercase">
                      {tech.metricLabel}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
                    weight="bold"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
