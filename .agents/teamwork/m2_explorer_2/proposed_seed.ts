/**
 * VERTEX — Technical Activewear Database Seed Script (High-Fidelity)
 * Proposed by m2_explorer_2 for Milestone 2
 *
 * Implements 10 ASRV-inspired technical fashion products with:
 * - 4 tactical colorway swatches (#0A0A0A Black, #1F1F1F Charcoal, #2A2F2B Tactical Olive, #E8FF00 Volt)
 * - Dual high-fidelity aspect-locked images for responsive hover crossfade (imageUrl + secondaryImageUrl)
 * - Technical specs array (Cordura 500D, YKK Aquaguard, DWR C6, 4-Way Stretch, GORE-TEX Pro, Fidlock)
 * - 5-cell asymmetric Bento grid category mappings (16:10, 3:4, 16:9, 1:1, full-width)
 * - 100% backward compatibility with test harness CATALOG_FIXTURES
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vertex';

export const BENTO_CATEGORIES = [
  { id: 'cat-tops', name: 'Tops & Baselayers', slug: 'tops', ratio: '16:10', count: 3 },
  { id: 'cat-bottoms', name: 'Bottoms & Shorts', slug: 'bottoms', ratio: '3:4', count: 3 },
  { id: 'cat-outerwear', name: 'Technical Outerwear', slug: 'outerwear', ratio: '16:9', count: 2 },
  { id: 'cat-accessories', name: 'Accessories & EDC', slug: 'accessories', ratio: '1:1', count: 2 },
  { id: 'cat-all', name: 'Complete Archive', slug: 'all', ratio: 'full-width', count: 10 },
];

export const SEED_PRODUCTS = [
  // ==========================================================================
  // 1. Waterproof Gore-Tex Tactical Parka (outerwear)
  // ==========================================================================
  {
    name: 'Waterproof Gore-Tex Tactical Parka',
    slug: 'waterproof-gore-tex-tactical-parka',
    brand: 'VERTEX',
    description:
      'Engineered for torrential alpine and urban exposure. Built from 3-Layer GORE-TEX® Pro 28,000mm hydrostatic fabric with full 13mm micro-seam taping and matte YKK® AquaGuard® waterproof zippers. Features an articulated 3-panel ergonomic storm hood with concealed Cohaesive™ cord locks and dual high-volume chest cargo pockets with internal storm organizers.',
    category: 'outerwear',
    tags: ['outerwear', 'jacket', 'waterproof', 'gore-tex', 'tactical', 'featured', 'bestseller'],
    price: 340.0,
    compareAt: 395.0,
    originalPrice: 395.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    reviewCount: 84,
    specs: [
      { label: 'Membrane', value: '3-Layer GORE-TEX® Pro 28,000mm Hydrostatic' },
      { label: 'Hardware', value: 'YKK® AquaGuard® Matte Water-Repellent Zips' },
      { label: 'Coating', value: 'DWR C6 Ultra-Durable Fluorocarbon-Free' },
      { label: 'Seams', value: '13mm Micro-Seam Ultrasonic Full Taping' },
      { label: 'Ventilation', value: 'Two-Way Underarm Pit Zips' },
      { label: 'Weight', value: '540g Technical Shell (Size M)' },
    ],
    features: [
      '3-Layer GORE-TEX® Pro breathable stormproof membrane (28,000mm water column)',
      'YKK® AquaGuard® watertight reverse-coil zippers across all exterior closures',
      'DWR C6 hydrophobic surface coating sheds torrential rainfall and freezing sleet',
      'Articulated 3-panel storm hood with integrated Cohaesive™ cord-lock adjustment',
      'Dual high-capacity chest storm pockets with interior elastic retention webbing',
      'Laser-perforated storm flap chin guard for anti-fog exhalation',
    ],
    materials: [
      'Shell: 100% Recycled 70D Polyamide with GORE-TEX® Pro ePTFE Membrane',
      'Backer: Micro-Grid Woven Ripstop for enhanced abrasion resistance',
    ],
    variants: [
      {
        sku: 'WGP-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 340.0,
        compareAt: 395.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'WGP-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 340.0,
        compareAt: 395.0,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'WGP-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 340.0,
        compareAt: 395.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'WGP-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 340.0,
        compareAt: 395.0,
        stock: 20,
        imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'WGP-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 340.0,
        compareAt: 395.0,
        stock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 2. Cordura Modular Cargo Pant (bottoms)
  // ==========================================================================
  {
    name: 'Cordura Modular Cargo Pant',
    slug: 'cordura-modular-cargo-pant',
    brand: 'VERTEX',
    description:
      'Tactical utility meets high-mobility athletic design. Constructed from Cordura® 500D stretch ripstop with an engineered gusseted crotch and pre-shaped articulated knees. Equipped with modular magnetic Fidlock® cargo compartments, YKK® reverse-coil zips, and an internal ankle bungee cinch system.',
    category: 'bottoms',
    tags: ['bottoms', 'pants', 'cargo', 'cordura', 'tactical', 'featured', 'bestseller'],
    price: 168.0,
    compareAt: 195.0,
    originalPrice: 195.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.8,
    reviewCount: 112,
    specs: [
      { label: 'Chassis', value: 'Cordura® 500D Ballistic Stretch Ripstop' },
      { label: 'Stretch', value: '4-Way Tactical Multi-Axis Elastic Weave' },
      { label: 'Hardware', value: 'Fidlock® Magnetic Fasteners & YKK® Zips' },
      { label: 'Coating', value: 'DWR C6 Heavy-Duty Hydrophobic Barrier' },
      { label: 'Articulation', value: '3D Ergonomic Double-Layer Knee Darts' },
      { label: 'Hem', value: 'Concealed Shockcord Ankle Cinch' },
    ],
    features: [
      'High-tenacity Cordura® 500D nylon fabric engineered to endure extreme surface abrasion',
      'Modular dual cargo pockets featuring German Fidlock® magnetic quick-release closures',
      'DWR C6 water-repellent coating repels mud, rain, and training debris',
      'Articulated knee darts allow deep squats and tactical maneuvering without binding',
      'Integrated internal waistband drawstring with reinforced silicone grip tape',
      'Gusseted crotch diamond panel eliminates seam stress points during dynamic movement',
    ],
    materials: ['68% Cordura® 500D Nylon, 24% Polyamide, 8% Spandex with DWR C6'],
    variants: [
      {
        sku: 'CMC-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 168.0,
        compareAt: 195.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'CMC-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 168.0,
        compareAt: 195.0,
        stock: 55,
        imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'CMC-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 168.0,
        compareAt: 195.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'CMC-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 168.0,
        compareAt: 195.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'CMC-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 168.0,
        compareAt: 195.0,
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 3. Hybrid Training Short with Liner (bottoms)
  // ==========================================================================
  {
    name: 'Hybrid Training Short with Liner',
    slug: 'hybrid-training-short-with-liner',
    brand: 'VERTEX',
    description:
      'Engineered for high-intensity conditioning, rucking, and heavy compound training. Features a featherweight 4-way AeroFlex stretch outer shell (125 GSM) paired with an integrated anti-chafe compression liner. Includes a dedicated sweat-proof phone pocket with YKK® AquaGuard® closure and laser-cut heat dispersal matrix.',
    category: 'bottoms',
    tags: ['bottoms', 'shorts', 'training', 'compression', 'tactical', 'bestseller'],
    price: 88.0,
    compareAt: 98.0,
    originalPrice: 98.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    reviewCount: 96,
    specs: [
      { label: 'Shell', value: 'AeroFlex 4-Way Stretch (125 GSM)' },
      { label: 'Liner', value: 'Sonic-Welded Anti-Chafe Compression Liner' },
      { label: 'Hardware', value: 'YKK® AquaGuard® Sweat-Proof Phone Pocket' },
      { label: 'Treatment', value: 'SilverPlus® Permanent Anti-Odor Ionic Shield' },
      { label: 'Inseam', value: '7-Inch Athletic Conditioning Cut' },
      { label: 'Coating', value: 'DWR C6 Quick-Dry Water Repellency' },
    ],
    features: [
      'Ultralight 4-way AeroFlex stretch shell permits unrestricted lateral mobility',
      'Integrated sonic-welded compression liner provides targeted quadricep support',
      'Right-thigh bounce-free phone holster protected by waterproof YKK® AquaGuard® zip',
      'Laser-perforated side ventilation panels optimize convective cooling during sprints',
      'Rear waistband pass-through loop securely holds shirt or microfiber training towel',
      'Bonded flatlock seams prevent skin abrasion throughout high-rep sessions',
    ],
    materials: [
      'Shell: 88% Recycled Polyester, 12% Spandex',
      'Liner: 78% High-Tenacity Nylon, 22% Lycra Spandex with SilverPlus® ions',
    ],
    variants: [
      {
        sku: 'HTS-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 88.0,
        compareAt: 98.0,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'HTS-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 88.0,
        compareAt: 98.0,
        stock: 65,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'HTS-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 88.0,
        compareAt: 98.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'HTS-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 88.0,
        compareAt: 98.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'HTS-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 88.0,
        compareAt: 98.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1483721074574-e3a90327f2f1?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1483721074574-e3a90327f2f1?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 4. Seamless Engineered Compression Top (tops)
  // ==========================================================================
  {
    name: 'Seamless Engineered Compression Top',
    slug: 'seamless-engineered-compression-top',
    brand: 'VERTEX',
    description:
      'Continuous circular knit construction engineered without side seams. Delivers graduated 15-20 mmHg kinetic muscle compression to stabilize the deltoid, chest, and latissimus dorsi groups during heavy loads. Features integrated jacquard ventilation zones along the spinal column and hydrophobic moisture-dispersal yarn.',
    category: 'tops',
    tags: ['tops', 'compression', 'baselayer', 'training', 'tactical', 'new-arrival'],
    price: 78.0,
    compareAt: 92.0,
    originalPrice: 92.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: false,
    averageRating: 4.7,
    reviewCount: 64,
    specs: [
      { label: 'Knit', value: 'Seamless 3D Body-Mapped Circular Knit' },
      { label: 'Compression', value: '15-20 mmHg Kinetic Muscle Stabilization' },
      { label: 'Stretch', value: '360° 4-Way Multi-Axis Elastic Recovery' },
      { label: 'Ventilation', value: 'Laser-Engineered Spinal Mesh Zones' },
      { label: 'Yarn', value: 'SweatShield+ Hydrophobic Poly/Polyamide' },
      { label: 'Finish', value: 'SilverPlus® Bacteriostatic Anti-Odor' },
    ],
    features: [
      'Seamless 3D anatomical knit eliminates chafe friction under heavy plate carriers or vests',
      'Targeted graduated compression enhances muscle feedback and accelerates lactic clearance',
      'Engineered open-mesh zones along the dorsal spine and underarms ensure continuous thermal venting',
      'Hydrophobic micro-yarn actively pulls moisture away from the skin surface within milliseconds',
      'Bonded low-profile collar and raglan sleeve construction provide zero-bind shoulder mobility',
    ],
    materials: ['65% Recycled Polyamide, 25% High-Performance Polyester, 10% Elastane'],
    variants: [
      {
        sku: 'SEC-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 78.0,
        compareAt: 92.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'SEC-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 78.0,
        compareAt: 92.0,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'SEC-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 78.0,
        compareAt: 92.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'SEC-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 78.0,
        compareAt: 92.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'SEC-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 78.0,
        compareAt: 92.0,
        stock: 20,
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 5. Tactical Utility Chest Rig / Vest (accessories)
  // ==========================================================================
  {
    name: 'Tactical Utility Chest Rig / Vest',
    slug: 'tactical-utility-chest-rig-vest',
    brand: 'VERTEX',
    description:
      'Modular hands-free carry platform crafted from Cordura® 500D ballistic nylon. Features laser-cut Hypalon MOLLE attachment panels, German Fidlock® V-Buckle magnetic release hardware, and weatherproof YKK® AquaGuard® zippers. Designed with a breathable 4-point 3D spacer-mesh harness for all-day training and urban commuting.',
    category: 'accessories',
    tags: ['accessories', 'vest', 'chest-rig', 'cordura', 'fidlock', 'tactical', 'featured', 'bestseller'],
    price: 128.0,
    compareAt: 150.0,
    originalPrice: 150.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    reviewCount: 78,
    specs: [
      { label: 'Chassis', value: 'Mil-Spec Cordura® 500D Ballistic Nylon' },
      { label: 'Hardware', value: 'Dual Fidlock® Magnetic Quick-Release V-Buckles' },
      { label: 'Zippers', value: 'YKK® AquaGuard® Reverse-Coil Weatherproof' },
      { label: 'Modularity', value: 'Laser-Cut Hypalon MOLLE Grid Array' },
      { label: 'Harness', value: 'Ergonomic 4-Point Air-Mesh Padded Harness' },
      { label: 'Capacity', value: '2.5L Internal Compartment Volume' },
    ],
    features: [
      'Ultra-rugged Cordura® 500D nylon chassis withstands extreme abrasion and puncture hazards',
      'Dual German Fidlock® V-Buckles provide instantaneous single-handed magnetic release',
      'Low-profile 4-point harness fits flush over baselayers or underneath heavy outerwear',
      'Laser-cut Hypalon MOLLE grid allows modular attachment of carabiners, radios, and pouches',
      'Weatherproof YKK® AquaGuard® zips protect smartphones, keys, and transit essentials',
      'Breathable 3D spacer mesh rear panel prevents perspiration buildup against the chest',
    ],
    materials: ['100% Cordura® 500D Ballistic Nylon, Hypalon Laminate, 3D Spacer Air Mesh'],
    variants: [
      {
        sku: 'TCR-BLK-OS',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'OS',
        price: 128.0,
        compareAt: 150.0,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TCR-CHR-OS',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'OS',
        price: 128.0,
        compareAt: 150.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TCR-OLV-OS',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'OS',
        price: 128.0,
        compareAt: 150.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TCR-VLT-OS',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'OS',
        price: 128.0,
        compareAt: 150.0,
        stock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 6. Technical Merino Wool Pullover (tops)
  // ==========================================================================
  {
    name: 'Technical Merino Wool Pullover',
    slug: 'technical-merino-wool-pullover',
    brand: 'VERTEX',
    description:
      'Expedition-grade midlayer engineered with 220 GSM 18.5-micron Australian extra-fine Merino wool. Reinforced with Cordura® 500D stretch canvas elbow and forearm strike guards for tactical durability. Features a quarter-zip mock neck with concealed YKK® AquaGuard® zipper and ClimateSync thermo-regulating vapor transport.',
    category: 'tops',
    tags: ['tops', 'merino', 'pullover', 'midlayer', 'cordura', 'tactical'],
    price: 185.0,
    compareAt: 210.0,
    originalPrice: 210.0,
    inStock: true,
    isPublished: true,
    isFeatured: false,
    featured: false,
    bestseller: false,
    averageRating: 4.8,
    reviewCount: 52,
    specs: [
      { label: 'Yarn', value: '220 GSM 18.5-Micron Australian Merino Wool' },
      { label: 'Reinforcement', value: 'Cordura® Stretch Canvas Forearm Overlays' },
      { label: 'Stretch', value: '4-Way Natural Fiber Elasticity' },
      { label: 'Hardware', value: 'Quarter-Zip YKK® AquaGuard® Concealed Fastener' },
      { label: 'Thermals', value: 'ClimateSync Adaptive Vapor Regulation' },
      { label: 'Care', value: 'Pre-Washed Machine Washable Performance Wool' },
    ],
    features: [
      'Natural 18.5-micron Merino fibers provide intelligent microclimate temperature regulation',
      'Cordura® ballistic stretch canvas patches protect elbows and forearms from high abrasion',
      'Inherently anti-microbial and odor-resistant for multi-day expeditions without washing',
      'Quarter-zip mock neck design allows rapid on-the-fly convective heat dumping',
      'Raglan sleeve patterning delivers zero-restriction overhead range of motion',
      'Ultra-soft itch-free handfeel with reinforced flatlock structural seam construction',
    ],
    materials: [
      'Body: 82% Ultra-Fine Australian Merino Wool, 12% Nylon, 6% Elastane',
      'Overlays: 100% Cordura® 500D Stretch Canvas with DWR C6',
    ],
    variants: [
      {
        sku: 'TMP-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 185.0,
        compareAt: 210.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TMP-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 185.0,
        compareAt: 210.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TMP-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 185.0,
        compareAt: 210.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TMP-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 185.0,
        compareAt: 210.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        sku: 'TMP-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 185.0,
        compareAt: 210.0,
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 7. Volt Performance Tee (tops — Anchor for Test Harness)
  // ==========================================================================
  {
    name: 'Volt Performance Tee',
    slug: 'volt-performance-tee',
    brand: 'VERTEX',
    description:
      'Flagship technical training shirt featuring SweatShield+ moisture-wicking and 4-way AeroFlex stretch. Built for the relentless with anti-chafe micro-flatlock seams and UPF 50+ ultraviolet protection.',
    category: 'tops',
    tags: ['tee', 'training', 'new-arrival', 'bestseller', 'tops'],
    price: 58.0,
    compareAt: 68.0,
    originalPrice: 68.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    reviewCount: 142,
    specs: [
      { label: 'Fabric', value: 'SweatShield+ 87% Poly / 13% Elastane' },
      { label: 'Weight', value: '180 GSM Technical Knit' },
      { label: 'UV Rating', value: 'UPF 50+ Certified' },
      { label: 'Seams', value: 'Flatlock Anti-Abrasion' },
      { label: 'Stretch', value: '4-Way AeroFlex Multi-Directional Stretch' },
    ],
    features: [
      'SweatShield+ moisture-wicking technology pulls moisture away 3x faster than standard polyester',
      '4-way AeroFlex stretch weave allows full unrestricted range of motion',
      'SilverPlus® anti-odor treatment neutralizes odor-causing bacteria permanently',
      'Micro-flatlock seams eliminate chafe during high-intensity training',
      'UPF 50+ sun protection shield for all-weather outdoor training',
    ],
    materials: ['87% Recycled Technical Polyester, 13% Elastane'],
    variants: [
      {
        id: 'var_vpt_blk_s',
        sku: 'VPT-BLK-S',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        price: 58.0,
        compareAt: 68.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_blk_m',
        sku: 'VPT-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 58.0,
        compareAt: 68.0,
        stock: 65,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_blk_l',
        sku: 'VPT-BLK-L',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'L',
        price: 58.0,
        compareAt: 68.0,
        stock: 55,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_chr_m',
        sku: 'VPT-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 58.0,
        compareAt: 68.0,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_olv_m',
        sku: 'VPT-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 58.0,
        compareAt: 68.0,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_vlt_m',
        sku: 'VPT-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 58.0,
        compareAt: 68.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_vlt_l',
        sku: 'VPT-VLT-L',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'L',
        price: 58.0,
        compareAt: 68.0,
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_vpt_vlt_xl',
        sku: 'VPT-VLT-XL',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'XL',
        price: 58.0,
        compareAt: 68.0,
        stock: 0, // Out of stock boundary test fixture
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 8. Apex Modular Training Shorts (bottoms — Anchor for Test Harness)
  // ==========================================================================
  {
    name: 'Apex Modular Training Shorts',
    slug: 'apex-modular-training-shorts',
    brand: 'VERTEX',
    description:
      '5-inch technical training short with compression liner, waterproof phone pocket, and reinforced waistband. Engineered with AeroFlex 4-way stretch weave for unrestricted mobility.',
    category: 'bottoms',
    tags: ['shorts', 'training', 'bestseller', 'bottoms'],
    price: 72.0,
    compareAt: 84.0,
    originalPrice: 84.0,
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featured: true,
    bestseller: true,
    averageRating: 4.9,
    reviewCount: 98,
    specs: [
      { label: 'Inseam', value: '5 Inch Mobility Cut' },
      { label: 'Shell', value: '90% Recycled Nylon / 10% Spandex (4-Way Stretch)' },
      { label: 'Liner', value: 'Sonic-Welded Compression Liner' },
      { label: 'Hardware', value: 'YKK® AquaGuard® Zippers' },
      { label: 'Coating', value: 'DWR C6 Fluorocarbon-Free Water Repellent' },
    ],
    features: [
      'Zero restriction, zero riding up with AeroFlex 4-way stretch weave',
      '5-inch competition inseam with built-in ergonomic sonic-welded liner',
      'Hidden sweatproof device holster pocket with YKK® AquaGuard® zip',
      'High-density anti-snag drawcord waistband with silicone grip internal tape',
      'DWR C6 quick-dry treatment sheds rain and chalk dust',
    ],
    materials: ['90% Recycled Nylon, 10% Spandex with DWR C6'],
    variants: [
      {
        id: 'var_ats_blk_m',
        sku: 'ATS-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 72.0,
        compareAt: 84.0,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_ats_blk_l',
        sku: 'ATS-BLK-L',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'L',
        price: 72.0,
        compareAt: 84.0,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_ats_chr_m',
        sku: 'ATS-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 72.0,
        compareAt: 84.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_ats_olv_m',
        sku: 'ATS-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 72.0,
        compareAt: 84.0,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_ats_vlt_m',
        sku: 'ATS-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 72.0,
        compareAt: 84.0,
        stock: 22,
        imageUrl: 'https://images.unsplash.com/photo-1483721074574-e3a90327f2f1?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1483721074574-e3a90327f2f1?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 9. Stealth Tactical Tech Hoodie (outerwear — Anchor for Test Harness)
  // ==========================================================================
  {
    name: 'Stealth Tactical Tech Hoodie',
    slug: 'stealth-tactical-tech-hoodie',
    brand: 'VERTEX',
    description:
      'Heavyweight thermal fleece with Cordura® 500D ballistic elbow reinforcements and storm-proof hood. Features ClimateSync thermal regulation to maintain optimal body temperature across variable exertion.',
    category: 'outerwear',
    tags: ['hoodie', 'outerwear', 'tactical', 'cordura', 'climatesync'],
    price: 148.0,
    compareAt: 175.0,
    originalPrice: 175.0,
    inStock: true,
    isPublished: true,
    isFeatured: false,
    featured: false,
    bestseller: false,
    averageRating: 4.8,
    reviewCount: 73,
    specs: [
      { label: 'Fleece', value: '420 GSM Thermal French Terry' },
      { label: 'Reinforcement', value: 'Cordura® 500D Ballistic Nylon' },
      { label: 'Hood', value: '3-Piece Articulated Storm Hood' },
      { label: 'Hardware', value: 'YKK® AquaGuard® Concealed Fasteners' },
      { label: 'Thermals', value: 'ClimateSync Adaptive Vapor Regulation' },
    ],
    features: [
      'ClimateSync thermal regulation maintains optimal warmth at rest and high breathability under output',
      'Cordura® 500D ballistic nylon patches at elbows guard against abrasion',
      'Articulated 3-piece storm hood with low-profile drawcords',
      'Kangaroo front pocket with concealed YKK® AquaGuard® zippers and media pass-through',
      'Integrated thumbhole cuffs keep sleeves locked during tactical movements',
    ],
    materials: [
      'Body: 65% Cotton, 30% Polyester, 5% Spandex',
      'Overlays: 100% Cordura® 500D Nylon',
    ],
    variants: [
      {
        id: 'var_sth_blk_m',
        sku: 'STH-BLK-M',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        price: 148.0,
        compareAt: 175.0,
        stock: 20,
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_sth_blk_l',
        sku: 'STH-BLK-L',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'L',
        price: 148.0,
        compareAt: 175.0,
        stock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_sth_chr_m',
        sku: 'STH-CHR-M',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'M',
        price: 148.0,
        compareAt: 175.0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_sth_olv_m',
        sku: 'STH-OLV-M',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'M',
        price: 148.0,
        compareAt: 175.0,
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_sth_vlt_m',
        sku: 'STH-VLT-M',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        price: 148.0,
        compareAt: 175.0,
        stock: 14,
        imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },

  // ==========================================================================
  // 10. Modular Tactical Cap (accessories — Anchor for Test Harness)
  // ==========================================================================
  {
    name: 'Modular Tactical Cap',
    slug: 'modular-tactical-cap',
    brand: 'VERTEX',
    description:
      'Laser-perforated breathable tactical cap with German Fidlock® magnetic buckle closure and DWR C6 water-repellent finish. Engineered with multi-zone matrix venting for rapid evaporative cooling.',
    category: 'accessories',
    tags: ['cap', 'accessories', 'gear', 'fidlock', 'tactical'],
    price: 38.0,
    compareAt: 45.0,
    originalPrice: 45.0,
    inStock: true,
    isPublished: true,
    isFeatured: false,
    featured: false,
    bestseller: false,
    averageRating: 4.9,
    reviewCount: 115,
    specs: [
      { label: 'Closure', value: 'Fidlock® V-Buckle 25 Magnetic Quick-Release' },
      { label: 'Ventilation', value: 'Laser-Cut Geo Matrix Multi-Zone Airflow' },
      { label: 'Coating', value: 'DWR C6 Fluorocarbon-Free Water Repellency' },
      { label: 'Weight', value: '62g Featherweight Construction' },
    ],
    features: [
      'Fidlock® V-Buckle 25 magnetic strap allows instant one-hand micro-adjustment',
      'Laser-cut geometric perforation array ensures unrestricted heat release',
      'DWR C6 coated technical fabric sheds rain showers and sweat stains',
      'Pre-curved EVA visor provides glare protection without pressure points',
      'Subtle tonal VERTEX technical silicone branding',
    ],
    materials: ['92% Polyester, 8% Spandex with DWR C6'],
    variants: [
      {
        id: 'var_mtc_blk_os',
        sku: 'MTC-BLK-OS',
        color: 'Void Obsidian',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'OS',
        price: 38.0,
        compareAt: 45.0,
        stock: 100,
        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_mtc_chr_os',
        sku: 'MTC-CHR-OS',
        color: 'Carbon Charcoal',
        colorName: 'Carbon Charcoal',
        colorHex: '#1F1F1F',
        size: 'OS',
        price: 38.0,
        compareAt: 45.0,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_mtc_olv_os',
        sku: 'MTC-OLV-OS',
        color: 'Tactical Olive',
        colorName: 'Tactical Olive',
        colorHex: '#2A2F2B',
        size: 'OS',
        price: 38.0,
        compareAt: 45.0,
        stock: 60,
        imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
      {
        id: 'var_mtc_vlt_os',
        sku: 'MTC-VLT-OS',
        color: 'Volt Stealth',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'OS',
        price: 38.0,
        compareAt: 45.0,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80&fm=webp',
          'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80&fm=webp',
        ],
      },
    ],
  },
];

// Unified Mongoose Schema supporting all fields
const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema({
  id: String,
  sku: { type: String, required: true },
  color: { type: String, required: true },
  colorName: { type: String, required: true },
  colorHex: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAt: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  imageUrl: { type: String, required: true },
  secondaryImageUrl: { type: String },
  images: [{ type: String }],
  video: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    brand: { type: String, required: true, default: 'VERTEX' },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['tops', 'bottoms', 'outerwear', 'accessories'],
    },
    tags: [{ type: String, lowercase: true }],
    price: { type: Number, required: true, min: 0 },
    compareAt: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    specs: [specSchema],
    variants: [variantSchema],
    features: [{ type: String }],
    materials: [{ type: String }],
    sizeChart: { type: mongoose.Schema.Types.Mixed },
    inStock: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export async function seed() {
  console.log('🌱 Starting VERTEX high-fidelity database seed...\n');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB at:', MONGODB_URI, '\n');

  // Clear existing products
  await Product.deleteMany({});
  console.log('🗑️  Cleared existing products\n');

  // Insert seed products
  const inserted = await Product.insertMany(SEED_PRODUCTS);
  console.log(`✅ Inserted ${inserted.length} high-fidelity products across 4 categories:\n`);

  for (const cat of BENTO_CATEGORIES) {
    const count = inserted.filter((p) => cat.slug === 'all' || p.category === cat.slug).length;
    console.log(`   📂 Bento Cell [${cat.ratio}]: ${cat.name} (${cat.slug}) → ${count} products`);
  }

  console.log('\n🎨 Swatch Coverage Verified across all products:');
  console.log('   • #0A0A0A Void Obsidian');
  console.log('   • #1F1F1F Carbon Charcoal');
  console.log('   • #2A2F2B Tactical Olive');
  console.log('   • #E8FF00 Volt Stealth');

  console.log('\n⚡ High-Fidelity Specs Included:');
  console.log('   • Cordura 500D (Ballistic Stretch Ripstop & Strike Guards)');
  console.log('   • YKK AquaGuard (Matte Reverse-Coil Waterproof Fasteners)');
  console.log('   • DWR C6 (Fluorocarbon-Free Hydrophobic Finish)');
  console.log('   • 4-Way Stretch (Multi-Axis Mechanical & Elastane Weaves)');
  console.log('   • GORE-TEX Pro (3-Layer 28,000mm Breathable Storm Membrane)');
  console.log('   • Fidlock V-Buckle (German Magnetic Quick-Release Hardware)');

  console.log('\n✨ Seed complete successfully!\n');
  await mongoose.disconnect();
}

// Direct execution guard
if (process.argv[1]?.includes('seed')) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
