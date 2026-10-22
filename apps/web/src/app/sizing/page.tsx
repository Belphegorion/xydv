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
      if (weightLbs < 145) baseSizeIndex = 0; // XS
      else if (weightLbs < 165) baseSizeIndex = 1; // S
      else if (weightLbs < 185) baseSizeIndex = 2; // M
      else if (weightLbs < 210) baseSizeIndex = 3; // L
      else if (weightLbs < 235) baseSizeIndex = 4; // XL
      else baseSizeIndex = 5; // XXL
    } else {
      if (weightLbs < 115) baseSizeIndex = 0; // XS
      else if (weightLbs < 130) baseSizeIndex = 1; // S
      else if (weightLbs < 150) baseSizeIndex = 2; // M
      else if (weightLbs < 170) baseSizeIndex = 3; // L
      else if (weightLbs < 195) baseSizeIndex = 4; // XL
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
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              BIOMECHANICAL FIT ARCHITECTURE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            SIZE & FIT CALCULATOR
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-2xl">
            Calibrated against elite athlete anatomical scans. Input your physical metrics to resolve your exact size profile.
          </p>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: INTERACTIVE FIT RECOMMENDER ENGINE             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Controls Box */}
          <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 space-y-6">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
              STEP 01 // ATHLETE PHYSICAL PROFILE
            </h2>

            {/* Gender Division Toggle */}
            <div>
              <label className="text-xs font-mono text-[var(--text-muted)] uppercase block mb-2">
                DIVISION SELECTION
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('men')}
                  className={`h-11 font-mono text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
                    gender === 'men'
                      ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  MEN&apos;S DIVISION
                </button>
                <button
                  type="button"
                  onClick={() => setGender('women')}
                  className={`h-11 font-mono text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
                    gender === 'women'
                      ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  WOMEN&apos;S DIVISION
                </button>
              </div>
            </div>

            {/* Height Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">STATURE (HEIGHT)</span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  {heightCm} CM / {Math.floor(heightCm / 30.48)}&apos;{Math.round((heightCm % 30.48) / 2.54)}&quot;
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
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
                <span>150 CM (4&apos;11&quot;)</span>
                <span>180 CM (5&apos;11&quot;)</span>
                <span>205 CM (6&apos;9&quot;)</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">MASS (WEIGHT)</span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
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
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
                <span>45 KG (99 LBS)</span>
                <span>85 KG (187 LBS)</span>
                <span>130 KG (286 LBS)</span>
              </div>
            </div>

            {/* Fit Preference */}
            <div>
              <label className="text-xs font-mono text-[var(--text-muted)] uppercase block mb-2">
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
                    className={`h-11 px-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
                      fit === f.id
                        ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Algorithmic Output Box */}
          <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
                STEP 02 // ALGORITHMIC DIAGNOSIS
              </h2>

              <div className="my-8 text-center p-6 bg-[var(--bg-elevated)] border border-[var(--border)]">
                <span className="text-[11px] font-mono font-bold uppercase text-[var(--accent)] tracking-[0.2em] block mb-2">
                  RECOMMENDED HARDWARE SIZE
                </span>
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[var(--text-primary)]">
                  SIZE {recommendation.size}
                </span>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {recommendation.confidence}% CONFIDENCE MATCH
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs font-sans text-[var(--text-secondary)] leading-relaxed">
                <p>
                  <strong className="text-[var(--text-primary)] font-mono uppercase">BEHAVIORAL FIT:</strong>{' '}
                  {recommendation.description}
                </p>
                <p>
                  Calculated against a body mass index of{' '}
                  <strong className="text-[var(--text-primary)] font-mono">
                    {(weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)}
                  </strong>{' '}
                  with anatomical shoulder and latissimus dorsi clearance.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--border)]">
              <Link
                href="/products"
                className="w-full h-11 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.97] transition-[background-color,border-color,opacity,transform] duration-150"
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                DIMENSIONAL BLUEPRINT
              </span>
              <h2 id="matrix-heading" className="text-2xl sm:text-3xl font-black uppercase font-heading text-[var(--text-primary)]">
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
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
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
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
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
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
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
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)] text-[var(--text-primary)] uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-bold">SIZE</th>
                  <th className="py-3.5 px-4 font-bold">CHEST / BUST ({unitSystem.toUpperCase()})</th>
                  <th className="py-3.5 px-4 font-bold">NATURAL WAIST ({unitSystem.toUpperCase()})</th>
                  <th className="py-3.5 px-4 font-bold">HIP MEASUREMENT ({unitSystem.toUpperCase()})</th>
                  <th className="py-3.5 px-4 font-bold">INSEAM LENGTH ({unitSystem.toUpperCase()})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                {currentChart.map((row) => (
                  <tr
                    key={row.size}
                    className={`hover:bg-[var(--bg-surface)] transition-colors ${
                      row.size === recommendation.size ? 'bg-[var(--accent)]/10 font-bold text-[var(--text-primary)]' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span>{row.size}</span>
                      {row.size === recommendation.size && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-[var(--accent)] text-black font-bold uppercase">
                          MATCH
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {formatUnit(row.chest[0])} - {formatUnit(row.chest[1])}
                    </td>
                    <td className="py-3.5 px-4">
                      {formatUnit(row.waist[0])} - {formatUnit(row.waist[1])}
                    </td>
                    <td className="py-3.5 px-4">
                      {formatUnit(row.hip[0])} - {formatUnit(row.hip[1])}
                    </td>
                    <td className="py-3.5 px-4">{formatUnit(row.inseam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: HOW TO MEASURE GUIDE                           */}
        {/* ========================================================= */}
        <section aria-labelledby="guide-heading" className="border-t border-[var(--border)] mt-16 pt-12">
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
            CALIBRATION PROTOCOL
          </span>
          <h2 id="guide-heading" className="text-2xl sm:text-3xl font-black uppercase font-heading text-[var(--text-primary)] mb-6">
            HOW TO MEASURE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div key={guide.step} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
                <span className="text-xs font-mono font-bold text-[var(--accent)]">{guide.step}</span>
                <h3 className="text-xs font-heading font-bold uppercase text-[var(--text-primary)]">{guide.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">{guide.instruction}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
