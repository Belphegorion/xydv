'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Drop, ArrowsOutCardinal, Thermometer, ShieldCheck, Cpu, ArrowUpRight, CheckCircle } from '@phosphor-icons/react';
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
      className="bg-[var(--bg-surface)] border-y border-[var(--border)] py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden transition-colors"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-[var(--border)] pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={14} className="text-[var(--text-primary)] dark:text-[var(--accent)]" weight="bold" />
              <span className="text-[var(--text-secondary)] dark:text-[var(--accent)] text-xs font-mono uppercase tracking-[0.25em]">
                PROPRIETARY TEXTILE SCIENCE
              </span>
            </div>
            <h2
              id="tech-features-heading"
              className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading"
            >
              ENGINEERED MATERIAL SPECS
            </h2>
          </div>
          <p className="text-[var(--text-secondary)] text-xs font-mono uppercase tracking-widest mt-4 md:mt-0 max-w-sm md:text-right">
            TESTED ACROSS 1,000+ HOURS OF ELITE CROSS-TRAINING AND COMBAT SPORTS
          </p>
        </div>

        {/* Interactive Textile Inspector Tabs with Shared Spring Pill */}
        <div
          role="tablist"
          aria-label="Textile Technology Inspector Tabs"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8 bg-[var(--bg)] p-2 border border-[var(--border)] relative"
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
                className={`relative px-2 py-2.5 sm:px-4 sm:py-4 text-left transition-colors duration-150 flex items-center justify-between border btn-tactile active:scale-[0.97] ${
                  isSelected
                    ? 'border-[var(--accent)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                }`}
              >
                {/* Sliding Spring Active Indicator Pill */}
                {isSelected && (
                  <motion.div
                    layoutId="active-tech-tab-bg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 bg-[var(--bg-elevated)] z-0"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-1.5 sm:gap-3 relative z-10 min-w-0">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:border-[var(--accent)] dark:bg-[var(--accent)]/15 dark:text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Icon size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase truncate">
                      {tech.name}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                      {tech.code}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-none hidden sm:inline-block relative z-10" aria-hidden="true" />
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
          className="bg-[var(--bg)] border border-[var(--border)] p-4 sm:p-8 md:p-12 mb-12 relative overflow-hidden"
        >
          {/* Subtle tactical grid background */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none select-none bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpec.code}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EMIL_EASE }}
              className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start"
            >
              {/* Left Column: Core Spec & Live Numerical Counter */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="volt" size="sm" dot>
                      ACTIVE DIAGNOSTIC
                    </Badge>
                    <span className="text-[var(--text-muted)] text-xs font-mono">{currentSpec.code}</span>
                  </div>

                  <h3 className="text-[var(--text-primary)] text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tight font-heading mb-2">
                    {currentSpec.name}
                  </h3>
                  <p className="text-[var(--text-primary)] dark:text-[var(--accent)] text-xs font-mono tracking-widest uppercase mb-6 font-semibold">
                    {currentSpec.subtitle}
                  </p>

                  <p className="text-[var(--text-secondary)] text-xs sm:text-sm md:text-base leading-relaxed font-sans mb-8">
                    {currentSpec.description}
                  </p>
                </div>

                {/* Animated Numerical Metric with Spring Physics */}
                <div className="p-4 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                  <div>
                    <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-[0.2em] block mb-1">
                      {currentSpec.metricLabel}
                    </span>
                    <div className="text-[var(--text-primary)] text-3xl sm:text-5xl font-mono font-bold tracking-tight">
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
              <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border)] p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                  <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest block mb-1">
                    FIBER COMPOSITION
                  </span>
                  <p className="text-[var(--text-primary)] text-xs font-mono font-medium">
                    {currentSpec.composition}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest block mb-1">
                    LABORATORY BENCHMARK TEST
                  </span>
                  <p className="text-[var(--text-primary)] dark:text-[var(--accent)] font-semibold text-xs font-mono leading-relaxed">
                    {currentSpec.stressTest}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest block mb-2">
                    CERTIFIED ACCREDITATIONS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSpec.standards.map((std) => (
                      <span
                        key={std}
                        className="text-[10px] font-mono bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)]"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest block mb-2">
                    INTEGRATED ALLOCATIONS
                  </span>
                  <ul className="space-y-1.5">
                    {currentSpec.applications.map((app) => (
                      <li key={app} className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-mono">
                        <CheckCircle size={14} className="text-[#15803d] dark:text-[#22c55e] flex-shrink-0" weight="bold" />
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
        <div className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 no-scrollbar">
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
                className={`cursor-pointer min-w-[280px] sm:min-w-0 snap-center p-5 sm:p-6 bg-[var(--bg)] border transition-[border-color,box-shadow] duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                  isSelected
                    ? 'border-[var(--accent)] shadow-sm'
                    : 'border-[var(--border)] hover:border-[var(--text-primary)]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white dark:border-[var(--accent)] dark:bg-[var(--accent)]/15 dark:text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Icon size={18} weight="bold" />
                    </div>
                    <span className="text-[var(--text-muted)] text-[11px] font-mono">{tech.code}</span>
                  </div>

                  <h3 className="text-[var(--text-primary)] text-sm sm:text-base font-bold uppercase tracking-wider font-heading">
                    {tech.name}
                  </h3>
                  <p className="text-[var(--text-primary)] dark:text-[var(--accent)] text-[10px] font-mono font-semibold tracking-widest uppercase mt-0.5 mb-3">
                    {tech.subtitle}
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-sans line-clamp-3 mb-6">
                    {tech.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--text-primary)] text-sm sm:text-base font-mono font-bold block">
                      {tech.numericMetric.toLocaleString('en-US')}{tech.metricSuffix}
                    </span>
                    <span className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-widest">
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
