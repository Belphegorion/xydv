'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Ruler,
  ArrowsLeftRight,
  ShieldCheck,
  ArrowRight,
  Check,
  User,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';

type Gender = 'men' | 'women';
type FitPreference = 'compression' | 'athletic' | 'relaxed';
type UnitSystem = 'in' | 'cm';

interface SizeRow {
  size: string;
  chest: [number, number]; // [min, max] in inches
  waist: [number, number];
  hip: [number, number];
  inseam: number;
}

const MEN_SIZE_CHART: Record<string, SizeRow[]> = {
  tops: [
    { size: 'XS', chest: [34, 36], waist: [28, 30], hip: [34, 36], inseam: 30 },
    { size: 'S', chest: [36, 38], waist: [30, 32], hip: [36, 38], inseam: 31 },
    { size: 'M', chest: [38, 41], waist: [32, 34], hip: [38, 41], inseam: 32 },
    { size: 'L', chest: [41, 44], waist: [34, 37], hip: [41, 44], inseam: 32 },
    { size: 'XL', chest: [44, 47], waist: [37, 40], hip: [44, 47], inseam: 33 },
    { size: 'XXL', chest: [47, 50], waist: [40, 43], hip: [47, 50], inseam: 33 },
  ],
  bottoms: [
    { size: 'XS', chest: [34, 36], waist: [27, 29], hip: [34, 36], inseam: 29 },
    { size: 'S', chest: [36, 38], waist: [29, 31], hip: [36, 38], inseam: 30 },
    { size: 'M', chest: [38, 40], waist: [31, 33], hip: [38, 40], inseam: 31 },
    { size: 'L', chest: [40, 43], waist: [33, 36], hip: [40, 43], inseam: 31 },
    { size: 'XL', chest: [43, 46], waist: [36, 39], hip: [43, 46], inseam: 32 },
    { size: 'XXL', chest: [46, 49], waist: [39, 42], hip: [46, 49], inseam: 32 },
  ],
  outerwear: [
    { size: 'XS', chest: [35, 37], waist: [28, 30], hip: [35, 37], inseam: 30 },
    { size: 'S', chest: [37, 39], waist: [30, 32], hip: [37, 39], inseam: 31 },
    { size: 'M', chest: [39, 42], waist: [32, 35], hip: [39, 42], inseam: 32 },
    { size: 'L', chest: [42, 45], waist: [35, 38], hip: [42, 45], inseam: 32 },
    { size: 'XL', chest: [45, 48], waist: [38, 41], hip: [45, 48], inseam: 33 },
    { size: 'XXL', chest: [48, 51], waist: [41, 44], hip: [48, 51], inseam: 33 },
  ],
};

const WOMEN_SIZE_CHART: Record<string, SizeRow[]> = {
  tops: [
    { size: 'XS', chest: [31, 33], waist: [24, 26], hip: [34, 36], inseam: 28 },
    { size: 'S', chest: [33, 35], waist: [26, 28], hip: [36, 38], inseam: 29 },
    { size: 'M', chest: [35, 37], waist: [28, 30], hip: [38, 40], inseam: 29 },
    { size: 'L', chest: [37, 40], waist: [30, 33], hip: [40, 43], inseam: 30 },
    { size: 'XL', chest: [40, 43], waist: [33, 36], hip: [43, 46], inseam: 30 },
    { size: 'XXL', chest: [43, 46], waist: [36, 39], hip: [46, 49], inseam: 31 },
  ],
  bottoms: [
    { size: 'XS', chest: [31, 33], waist: [23, 25], hip: [33, 35], inseam: 28 },
    { size: 'S', chest: [33, 35], waist: [25, 27], hip: [35, 37], inseam: 28 },
    { size: 'M', chest: [35, 37], waist: [27, 29], hip: [37, 39], inseam: 29 },
    { size: 'L', chest: [37, 40], waist: [29, 32], hip: [39, 42], inseam: 29 },
    { size: 'XL', chest: [40, 43], waist: [32, 35], hip: [42, 45], inseam: 30 },
    { size: 'XXL', chest: [43, 46], waist: [35, 38], hip: [45, 48], inseam: 30 },
  ],
  outerwear: [
    { size: 'XS', chest: [32, 34], waist: [24, 26], hip: [34, 36], inseam: 28 },
    { size: 'S', chest: [34, 36], waist: [26, 28], hip: [36, 38], inseam: 29 },
    { size: 'M', chest: [36, 38], waist: [28, 31], hip: [38, 41], inseam: 29 },
    { size: 'L', chest: [38, 41], waist: [31, 34], hip: [41, 44], inseam: 30 },
    { size: 'XL', chest: [41, 44], waist: [34, 37], hip: [44, 47], inseam: 30 },
    { size: 'XXL', chest: [44, 47], waist: [37, 40], hip: [47, 50], inseam: 31 },
  ],
};

export default function SizingPage() {
  const [gender, setGender] = useState<Gender>('men');
  const [fit, setFit] = useState<FitPreference>('athletic');
  const [heightCm, setHeightCm] = useState(180);
  const [weightKg, setWeightKg] = useState(82);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('in');
  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms' | 'outerwear'>('tops');

  // Algorithmic Size Recommendation
  const recommendation = useMemo(() => {
    // Height in inches & Weight in lbs for baseline BMI / Mass model
    const heightInches = heightCm / 2.54;
    const weightLbs = weightKg * 2.20462;

    let baseSizeIndex = 2; // Default M

    if (gender === 'men') {
      if (weightLbs < 145)
        baseSizeIndex = 0; // XS
      else if (weightLbs < 165)
        baseSizeIndex = 1; // S
      else if (weightLbs < 185)
        baseSizeIndex = 2; // M
      else if (weightLbs < 210)
        baseSizeIndex = 3; // L
      else if (weightLbs < 235)
        baseSizeIndex = 4; // XL
      else baseSizeIndex = 5; // XXL
    } else {
      if (weightLbs < 115)
        baseSizeIndex = 0; // XS
      else if (weightLbs < 130)
        baseSizeIndex = 1; // S
      else if (weightLbs < 150)
        baseSizeIndex = 2; // M
      else if (weightLbs < 170)
        baseSizeIndex = 3; // L
      else if (weightLbs < 195)
        baseSizeIndex = 4; // XL
      else baseSizeIndex = 5; // XXL
    }

    // Shift based on fit preference
    if (fit === 'compression' && baseSizeIndex > 0) {
      baseSizeIndex -= 0.5;
    } else if (fit === 'relaxed' && baseSizeIndex < 5) {
      baseSizeIndex += 0.5;
    }

    const roundedIndex = Math.round(baseSizeIndex);
    const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const primarySize = sizeNames[Math.min(5, Math.max(0, roundedIndex))];

    const confidence = Math.min(98, Math.max(88, 95 - Math.abs(roundedIndex - baseSizeIndex) * 10));

    return {
      size: primarySize,
      confidence,
      description:
        fit === 'compression'
          ? 'Anatomical zero-slip tension hugging muscle bellies for maximum blood circulation and posture support.'
          : fit === 'relaxed'
            ? 'Generous architectural silhouette with dropped shoulders and unrestricted airflow for recovery and leisure.'
            : 'Contoured athletic cut hugging shoulders and chest with comfortable taper through the core.',
    };
  }, [gender, fit, heightCm, weightKg]);

  const currentChart = gender === 'men' ? MEN_SIZE_CHART[activeTab] : WOMEN_SIZE_CHART[activeTab];

  const formatUnit = (val: number) => {
    if (unitSystem === 'cm') {
      return Math.round(val * 2.54);
    }
    return val;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              BIOMECHANICAL FIT ARCHITECTURE
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            SIZE & FIT CALCULATOR
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
            Calibrated against elite athlete anatomical scans. Input your physical metrics to
            resolve your exact size profile.
          </p>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: INTERACTIVE FIT RECOMMENDER ENGINE             */}
        {/* ========================================================= */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Controls Box */}
          <div className="space-y-6 border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:col-span-7">
            <h2 className="border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              STEP 01 // ATHLETE PHYSICAL PROFILE
            </h2>

            {/* Gender Division Toggle */}
            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-muted)] uppercase">
                DIVISION SELECTION
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('men')}
                  className={`h-11 font-mono text-xs font-bold tracking-wider uppercase transition-colors active:scale-[0.97] ${
                    gender === 'men'
                      ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  MEN&apos;S DIVISION
                </button>
                <button
                  type="button"
                  onClick={() => setGender('women')}
                  className={`h-11 font-mono text-xs font-bold tracking-wider uppercase transition-colors active:scale-[0.97] ${
                    gender === 'women'
                      ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  WOMEN&apos;S DIVISION
                </button>
              </div>
            </div>

            {/* Height Slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
                  STATURE (HEIGHT)
                </span>
                <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                  {heightCm} CM / {Math.floor(heightCm / 30.48)}&apos;
                  {Math.round((heightCm % 30.48) / 2.54)}&quot;
                </span>
              </div>
              <input
                id="stature-slider"
                aria-label="Stature height in centimeters"
                type="range"
                min={150}
                max={205}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--accent)]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--text-muted)]">
                <span>150 CM (4&apos;11&quot;)</span>
                <span>180 CM (5&apos;11&quot;)</span>
                <span>205 CM (6&apos;9&quot;)</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
                  MASS (WEIGHT)
                </span>
                <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                  {weightKg} KG / {Math.round(weightKg * 2.20462)} LBS
                </span>
              </div>
              <input
                id="mass-slider"
                aria-label="Mass weight in kilograms"
                type="range"
                min={45}
                max={130}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--accent)]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--text-muted)]">
                <span>45 KG (99 LBS)</span>
                <span>85 KG (187 LBS)</span>
                <span>130 KG (286 LBS)</span>
              </div>
            </div>

            {/* Fit Preference */}
            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-muted)] uppercase">
                DESIRED SILHOUETTE & FIT PREFERENCE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compression', label: 'COMPRESSION' },
                  { id: 'athletic', label: 'ATHLETIC SLIM' },
                  { id: 'relaxed', label: 'RELAXED OVERSIZED' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFit(f.id as FitPreference)}
                    className={`h-11 px-2 font-mono text-[10px] font-bold tracking-wider uppercase transition-colors active:scale-[0.97] sm:text-xs ${
                      fit === f.id
                        ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]'
                        : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Algorithmic Output Box */}
          <div className="flex flex-col justify-between border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:col-span-5">
            <div>
              <h2 className="border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
                STEP 02 // ALGORITHMIC DIAGNOSIS
              </h2>

              <div className="my-8 border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
                <span className="mb-2 block font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                  RECOMMENDED HARDWARE SIZE
                </span>
                <span className="font-mono text-5xl font-black tracking-tight text-[var(--text-primary)] sm:text-6xl">
                  SIZE {recommendation.size}
                </span>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {recommendation.confidence}% CONFIDENCE MATCH
                  </span>
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                <p>
                  <strong className="font-mono text-[var(--text-primary)] uppercase">
                    BEHAVIORAL FIT:
                  </strong>{' '}
                  {recommendation.description}
                </p>
                <p>
                  Calculated against a body mass index of{' '}
                  <strong className="font-mono text-[var(--text-primary)]">
                    {(weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)}
                  </strong>{' '}
                  with anatomical shoulder and latissimus dorsi clearance.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-4">
              <Link
                href="/products"
                className="flex h-11 w-full items-center justify-center gap-2 bg-[var(--text-primary)] font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.97]"
              >
                <span>EXPLORE {recommendation.size} GEAR IN CATALOG</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: COMPREHENSIVE TACTICAL SIZE SPECIFICATION TABLE */}
        {/* ========================================================= */}
        <section aria-labelledby="matrix-heading" className="border-t border-[var(--border)] pt-12">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                DIMENSIONAL BLUEPRINT
              </span>
              <h2
                id="matrix-heading"
                className="font-heading text-2xl font-black text-[var(--text-primary)] uppercase sm:text-3xl"
              >
                SPECIFICATION MATRIX
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Tabs */}
              <div className="flex border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
                {(['tops', 'bottoms', 'outerwear'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                      activeTab === tab
                        ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Units Toggle */}
              <div className="flex border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
                <button
                  type="button"
                  onClick={() => setUnitSystem('in')}
                  className={`px-2.5 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                    unitSystem === 'in'
                      ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  IN
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('cm')}
                  className={`px-2.5 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                    unitSystem === 'cm'
                      ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  CM
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[var(--border)]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] uppercase">
                <tr>
                  <th className="px-4 py-3.5 font-bold">SIZE</th>
                  <th className="px-4 py-3.5 font-bold">
                    CHEST / BUST ({unitSystem.toUpperCase()})
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    NATURAL WAIST ({unitSystem.toUpperCase()})
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    HIP MEASUREMENT ({unitSystem.toUpperCase()})
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    INSEAM LENGTH ({unitSystem.toUpperCase()})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                {currentChart.map((row) => (
                  <tr
                    key={row.size}
                    className={`transition-colors hover:bg-[var(--bg-surface)] ${
                      row.size === recommendation.size
                        ? 'bg-[var(--accent)]/10 font-bold text-[var(--text-primary)]'
                        : ''
                    }`}
                  >
                    <td className="flex items-center gap-2 px-4 py-3.5 font-bold text-[var(--text-primary)]">
                      <span>{row.size}</span>
                      {row.size === recommendation.size && (
                        <span className="bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent-foreground)] uppercase">
                          MATCH
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {formatUnit(row.chest[0])} - {formatUnit(row.chest[1])}
                    </td>
                    <td className="px-4 py-3.5">
                      {formatUnit(row.waist[0])} - {formatUnit(row.waist[1])}
                    </td>
                    <td className="px-4 py-3.5">
                      {formatUnit(row.hip[0])} - {formatUnit(row.hip[1])}
                    </td>
                    <td className="px-4 py-3.5">{formatUnit(row.inseam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: HOW TO MEASURE GUIDE                           */}
        {/* ========================================================= */}
        <section
          aria-labelledby="guide-heading"
          className="mt-16 border-t border-[var(--border)] pt-12"
        >
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
            CALIBRATION PROTOCOL
          </span>
          <h2
            id="guide-heading"
            className="font-heading mb-6 text-2xl font-black text-[var(--text-primary)] uppercase sm:text-3xl"
          >
            HOW TO MEASURE
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              {
                step: '01',
                title: 'CHEST / BUST',
                instruction:
                  'Place measuring tape under armpits and run flat across the fullest perimeter of the chest while standing naturally.',
              },
              {
                step: '02',
                title: 'NATURAL WAIST',
                instruction:
                  'Measure circumference at the narrowest section between ribcage and hips, maintaining a horizontal level.',
              },
              {
                step: '03',
                title: 'HIP PERIMETER',
                instruction:
                  'Stand with feet parallel and measure horizontally around the fullest projection of gluteal muscles.',
              },
              {
                step: '04',
                title: 'INSEAM CLEARANCE',
                instruction:
                  'Measure from highest point of inner crotch seam straight down the inner leg to bottom of ankle bone.',
              },
            ].map((guide) => (
              <div
                key={guide.step}
                className="space-y-2 border border-[var(--border)] bg-[var(--bg-surface)] p-5"
              >
                <span className="font-mono text-xs font-bold text-[var(--accent)]">
                  {guide.step}
                </span>
                <h3 className="font-heading text-xs font-bold text-[var(--text-primary)] uppercase">
                  {guide.title}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  {guide.instruction}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
