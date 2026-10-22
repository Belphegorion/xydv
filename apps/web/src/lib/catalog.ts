export interface ProductVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  primaryImage: string;
  secondaryImage?: string;
  gallery: string[];
  stock: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  discipline: string;
  verified: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'accessories';
  discipline: 'run' | 'train' | 'rec';
  gender: 'men' | 'women' | 'unisex';
  price: number;
  compareAtPrice?: number;
  specsSummary: string;
  headline: string;
  description: string;
  fabricDetails: {
    composition: string;
    weightGsm: number;
    technology: string;
    finish: string;
  };
  features: string[];
  careInstructions: string[];
  biomechanics: string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  isFeatured?: boolean;
  isBestseller?: boolean;
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod_volt_tee_001',
    name: 'Volt Performance Tee',
    slug: 'volt-performance-tee',
    category: 'tops',
    discipline: 'run',
    gender: 'men',
    price: 58.0,
    compareAtPrice: 68.0,
    specsSummary: 'SweatShield+ / 180 GSM / UPF 50+',
    headline:
      'High-tenacity technical tee engineered for intense kinetic output and continuous thermal regulation.',
    description:
      'Engineered with proprietary SweatShield+ micro-mesh, the Volt Performance Tee rapidly expels moisture while maintaining zero clinging saturation. Bonded shoulder seams eliminate chafing under weighted vests and running packs.',
    fabricDetails: {
      composition: '82% High-Tenacity Micro-Poly, 18% AeroFlex Spandex',
      weightGsm: 180,
      technology: 'SweatShield+ Phase-Change Capillary Action',
      finish: 'Antimicrobial Silver-Ion & UPF 50+ Sun Barrier',
    },
    features: [
      'SweatShield+ capillary action wicks moisture 3.4x faster than standard synthetic knit',
      'Ultrasonic flatlock bonded seams to eliminate abrasion during high-mileage runs',
      'Engineered 4-way rebound maintains shape without bagging out after repetitive washes',
      'Reflective 3M Scotchlite telemetry accents for low-light night running safety',
    ],
    careInstructions: [
      'Machine wash cold with like technical synthetics (30°C / 85°F)',
      'Do not use fabric softeners (softeners clog moisture-wicking capillary channels)',
      'Line dry in shade or tumble dry low on delicate cycle',
      'Do not iron over reflective telemetry branding',
    ],
    biomechanics:
      'Ergonomic raglan cut engineered to facilitate full scapular retraction and uninhibited overhead range of motion. Model is 6 ft 1 in (185 cm), 185 lbs (84 kg) wearing size M.',
    variants: [
      {
        id: 'var_vpt_blk_m',
        sku: 'VPT-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-4-1.jpg',
        secondaryImage: '/products/image-5-2.jpg',
        gallery: [
          '/products/image-4-1.jpg',
          '/products/image-5-1.jpg',
          '/products/image-5-2.jpg',
          '/products/image-6-1.jpg',
        ],
        stock: 65,
      },
      {
        id: 'var_vpt_vlt_m',
        sku: 'VPT-VLT-M',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        primaryImage: '/products/image-6-1.jpg',
        secondaryImage: '/products/image-7-1.jpg',
        gallery: [
          '/products/image-6-1.jpg',
          '/products/image-7-1.jpg',
          '/products/image-10-1.jpg',
          '/products/image-10-3.jpg',
        ],
        stock: 25,
      },
      {
        id: 'var_vpt_slv_m',
        sku: 'VPT-SLV-M',
        colorName: 'Titanium Grey',
        colorHex: '#52525B',
        size: 'M',
        primaryImage: '/products/men-sports-tee.jpg',
        secondaryImage: '/products/sports-tee-front.jpg',
        gallery: [
          '/products/men-sports-tee.jpg',
          '/products/sports-tee-front.jpg',
          '/products/sportswear-tee-angled.jpg',
          '/products/image-4-1.jpg',
        ],
        stock: 40,
      },
    ],
    rating: 4.9,
    reviewCount: 342,
    reviews: [
      {
        id: 'rev_vpt_01',
        author: 'Marcus K.',
        rating: 5,
        date: '2026-09-28',
        title: 'Zero saturation even during 20km tempo runs',
        content:
          'The capillary wicking on this tee is noticeably superior to any other running brand. It never gets heavy with sweat, and the neck and shoulders feel weightless.',
        discipline: 'Ultra Marathoner',
        verified: true,
      },
      {
        id: 'rev_vpt_02',
        author: 'David L.',
        rating: 5,
        date: '2026-09-14',
        title: 'Perfect athletic slim silhouette',
        content:
          'Fits snug around the shoulders and chest while leaving room through the torso. The ultrasonic seams make running with a weighted vest completely painless.',
        discipline: 'Hybrid Athlete',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_apex_shorts_002',
    name: 'Apex Modular Training Shorts',
    slug: 'apex-modular-training-shorts',
    category: 'bottoms',
    discipline: 'train',
    gender: 'men',
    price: 72.0,
    specsSummary: 'AeroFlex 5" / Compression Liner / YKK Aquaguard',
    headline:
      'Multi-functional training shorts built with a supportive compression liner and abrasion-resistant shell.',
    description:
      'Engineered for maximum leg propulsion and heavy barbell friction. Features an integrated compression liner with dedicated zero-bounce phone pocket, laser-cut ventilation ports, and YKK Aquaguard zip pockets.',
    fabricDetails: {
      composition:
        'Shell: 88% Cordura® Ballistic Nylon, 12% Spandex; Liner: 80% Micro-Nylon, 20% Elastane',
      weightGsm: 165,
      technology: 'AeroFlex 4-Way Ballistic Weave',
      finish: 'DWR Water-Repellent & Anti-Friction Coating',
    },
    features: [
      'Cordura® reinforced front panels resist knurling wear from deadlifts and barbell contact',
      'Dual YKK Aquaguard waterproof zip pockets keep keycards and essentials dry',
      'Built-in internal compression liner with dedicated bounce-free media sleeve',
      'Custom woven technical drawcord with silicone-dipped ends',
    ],
    careInstructions: [
      'Machine wash cold gentle inside-out (30°C / 85°F)',
      'Close all zips before washing to prevent snagging',
      'Hang dry only; do not tumble dry',
      'Do not bleach or dry clean',
    ],
    biomechanics:
      'Curved hemline with 2-inch side split to ensure zero resistance during deep squats, box jumps, and sprints. Model is 6 ft 0 in (183 cm), 190 lbs (86 kg) wearing size M.',
    variants: [
      {
        id: 'var_ats_blk_m',
        sku: 'ATS-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-8-1.jpg',
        secondaryImage: '/products/image-11-1.jpg',
        gallery: [
          '/products/image-8-1.jpg',
          '/products/image-11-1.jpg',
          '/products/image-11-2.jpg',
          '/products/image-14-1.jpg',
        ],
        stock: 50,
      },
      {
        id: 'var_ats_olv_m',
        sku: 'ATS-OLV-M',
        colorName: 'Tactical Olive',
        colorHex: '#3D4532',
        size: 'M',
        primaryImage: '/products/image-14-1.jpg',
        secondaryImage: '/products/image-15-1.jpg',
        gallery: [
          '/products/image-14-1.jpg',
          '/products/image-15-1.jpg',
          '/products/image-8-1.jpg',
          '/products/image-11-1.jpg',
        ],
        stock: 35,
      },
    ],
    rating: 5.0,
    reviewCount: 289,
    reviews: [
      {
        id: 'rev_ats_01',
        author: 'Julian R.',
        rating: 5,
        date: '2026-10-02',
        title: 'The liner holds your phone without slipping a millimeter',
        content:
          'Finally a liner phone pocket that actually works for high cadence sprints. No bounce, no readjusting. Worth every penny.',
        discipline: 'Sprint Coach',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_storm_shell_003',
    name: 'Storm-Shield Ripstop Shell',
    slug: 'storm-shield-ripstop-shell',
    category: 'outerwear',
    discipline: 'train',
    gender: 'men',
    price: 148.0,
    compareAtPrice: 165.0,
    specsSummary: 'Cordura® 500D / 20k Waterproof / Sealed Seams',
    headline:
      'Ultra-lightweight technical windcheater engineered to withstand torrential squalls and freezing wind.',
    description:
      'Engineered with 3-layer laminated Cordura® ripstop, the Storm-Shield Shell provides 20,000mm hydrostatic head waterproofing alongside 25,000 g/m²/24h breathability. Fully taped internal seams and an architectural storm collar protect against the elements.',
    fabricDetails: {
      composition: '3-Layer 100% Cordura® Micro-Ripstop Nylon with Hydrophilic Membrane',
      weightGsm: 145,
      technology: 'Storm-Shield 20K/25K Sealed Lamination',
      finish: 'Fluorocarbon-Free C0 DWR Repellent',
    },
    features: [
      '20,000mm hydrostatic head waterproof rating with 100% seam-sealed tape construction',
      'Dual-direction underarm ventilation zippers for thermal dumping during uphill accents',
      'Architectural 3-point adjustable hood engineered to fit securely over athletic caps',
      'Fidlock magnetic snap collar closure for instant one-handed deployment',
    ],
    careInstructions: [
      'Wash gently with technical outerwear wash at 30°C',
      'Rinse thoroughly; do not use detergents with optical brighteners',
      'Tumble dry low for 20 minutes to reactivate the DWR water repellent coating',
      'Do not dry clean',
    ],
    biomechanics:
      'Articulated elbow sleeves and an extended dropped rear tail prevent hem ride-up when leaning into headwinds or cycling.',
    variants: [
      {
        id: 'var_sss_blk_m',
        sku: 'SSS-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-9-1.jpg',
        secondaryImage: '/products/image-13-1.jpg',
        gallery: [
          '/products/image-9-1.jpg',
          '/products/image-13-1.jpg',
          '/products/image-13-2.jpg',
          '/products/image-16-1.jpg',
        ],
        stock: 30,
      },
      {
        id: 'var_sss_gry_m',
        sku: 'SSS-GRY-M',
        colorName: 'Stealth Ash',
        colorHex: '#71717A',
        size: 'M',
        primaryImage: '/products/men-windcheater-ash.jpg',
        secondaryImage: '/products/men-windbreaker.jpg',
        gallery: [
          '/products/men-windcheater-ash.jpg',
          '/products/men-windbreaker.jpg',
          '/products/image-9-1.jpg',
          '/products/image-13-1.jpg',
        ],
        stock: 22,
      },
    ],
    rating: 4.8,
    reviewCount: 174,
    reviews: [
      {
        id: 'rev_sss_01',
        author: 'Alex T.',
        rating: 5,
        date: '2026-09-18',
        title: 'Bombproof water repellency',
        content:
          'Got caught in an unexpected rainstorm in the mountains. Water beaded right off. The magnetic hood adjustment is genius.',
        discipline: 'Trail Runner',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_tactical_cap_004',
    name: 'Ballistic Fidlock Cap',
    slug: 'ballistic-fidlock-cap',
    category: 'accessories',
    discipline: 'rec',
    gender: 'unisex',
    price: 42.0,
    specsSummary: 'Laser Vent / Fidlock V-Buckle / Quick-Dry',
    headline:
      'High-performance headwear with magnetic one-hand sizing adjustment and sweat-wicking internal headband.',
    description:
      'Crafted from water-resistant ballistic ripstop with micro laser-perforated side panels for optimal cranial airflow. Anchored by an authentic German-engineered Fidlock magnetic buckle.',
    fabricDetails: {
      composition: '100% Hydrophobic Ballistic Ripstop Polyester',
      weightGsm: 110,
      technology: 'Laser-Vented Micro-Aero Mesh',
      finish: 'DWR Repellent & Antimicrobial Sweatband',
    },
    features: [
      'German-engineered Fidlock magnetic slider buckle for micro-second adjustments',
      'Laser-cut ventilation ports along lateral panels maintain cranial cooling',
      'Hydrophobic EVA foam brim keeps shape and floats if dropped in water',
      'Reflective tonal XYDV telemetry logo at front and rear strap',
    ],
    careInstructions: [
      'Hand wash in cold water with mild soap',
      'Air dry flat in shade',
      'Do not machine wash or crush brim',
    ],
    biomechanics:
      'Low-crown architectural profile with deep temple cutouts ensuring compatibility with sunglasses and audio headbands.',
    variants: [
      {
        id: 'var_bfc_blk_os',
        sku: 'BFC-BLK-OS',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'OS',
        primaryImage: '/products/image-12-1.jpg',
        secondaryImage: '/products/image-12-2.jpg',
        gallery: [
          '/products/image-12-1.jpg',
          '/products/image-12-2.jpg',
          '/products/image-12-3.jpg',
        ],
        stock: 80,
      },
    ],
    rating: 4.9,
    reviewCount: 412,
    reviews: [
      {
        id: 'rev_bfc_01',
        author: 'Nathan B.',
        rating: 5,
        date: '2026-10-01',
        title: 'Best workout cap I own',
        content:
          'The magnetic buckle lets you tighten or loosen on the move without breaking stride. Fits clean and dries fast.',
        discipline: 'Triathlete',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_compression_top_005',
    name: 'AeroFlex Seamless Crop Top',
    slug: 'aeroflex-seamless-crop-top',
    category: 'tops',
    discipline: 'train',
    gender: 'women',
    price: 52.0,
    compareAtPrice: 62.0,
    specsSummary: 'AeroFlex Knit / Ribbed Compression / Zero Chafing',
    headline:
      'Engineered seamless knit with graduated compression zones to stabilize the core during dynamic lifting.',
    description:
      'Constructed with circular seamless knitting technology, eliminating all side seams. Targeted compression zones provide medium-to-high support while open-knit ventilation zones expel body heat.',
    fabricDetails: {
      composition: '74% Polyamide 6.6, 26% High-Tension Elastane',
      weightGsm: 240,
      technology: 'AeroFlex Targeted Zone Compression',
      finish: 'SweatShield+ Hydrophilic Treatment',
    },
    features: [
      'Circular seamless construction provides true 360-degree anatomical contouring',
      'Reinforced underbust ribbing guarantees zero upward displacement during explosive moves',
      'Removable molded breathable cups with micro-perforations for heat dissipation',
      'Square athletic neckline engineered for shoulder blade freedom',
    ],
    careInstructions: [
      'Machine wash cold on gentle cycle inside a wash bag',
      'Remove cups prior to washing for longevity',
      'Lay flat to dry; do not hang while wet',
    ],
    biomechanics:
      'Engineered specifically for overhead press, barbell cleans, and gymnastics. Model is 5 ft 8 in (173 cm), 135 lbs (61 kg) wearing size S.',
    variants: [
      {
        id: 'var_cpt_blk_s',
        sku: 'CPT-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/women-casual-top.jpg',
        secondaryImage: '/products/women-colourblock-tee.jpg',
        gallery: [
          '/products/women-casual-top.jpg',
          '/products/women-colourblock-tee.jpg',
          '/products/women-highneck-tee.jpg',
          '/products/women-vneck-top.jpg',
        ],
        stock: 45,
      },
      {
        id: 'var_cpt_sge_s',
        sku: 'CPT-SGE-S',
        colorName: 'Sage Matrix',
        colorHex: '#8A9A86',
        size: 'S',
        primaryImage: '/products/women-sports-bra-sage.jpg',
        secondaryImage: '/products/women-sports-bra-rose.jpg',
        gallery: [
          '/products/women-sports-bra-sage.jpg',
          '/products/women-sports-bra-rose.jpg',
          '/products/women-sports-bra-lilac.jpg',
          '/products/women-casual-top.jpg',
        ],
        stock: 30,
      },
    ],
    rating: 4.9,
    reviewCount: 198,
    reviews: [
      {
        id: 'rev_cpt_01',
        author: 'Elena V.',
        rating: 5,
        date: '2026-09-22',
        title: 'Unbelievably supportive without choking you',
        content:
          'Stays put through burpees, snatches, and handstand pushups. The fabric feels premium and dense without feeling hot.',
        discipline: 'CrossFit Competitor',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_activewear_set_006',
    name: 'Thermal Compression Cargo Set',
    slug: 'thermal-compression-cargo-set',
    category: 'bottoms',
    discipline: 'rec',
    gender: 'women',
    price: 110.0,
    compareAtPrice: 125.0,
    specsSummary: '420 GSM Grid / Ergonomic Pockets / Thermal Reg',
    headline: 'Heavyweight thermal training bottoms with ergonomic magnetic cargo enclosures.',
    description:
      'Engineered for cold-weather outdoor training and recovery. Built from 420 GSM brushback micro-grid thermal fleece that traps heat within geometric chambers while allowing vapor release.',
    fabricDetails: {
      composition: '68% Organic Cotton, 26% Cordura® Nylon, 6% Elastane',
      weightGsm: 420,
      technology: 'ClimateSync Geometric Thermal Grid',
      finish: 'Peached Exterior with Low-Pill Brushed Fleece Interior',
    },
    features: [
      '420 GSM double-knit thermal grid locks warmth without excess bulk',
      'Dual flat-lay side cargo pockets with silent magnetic snap closures',
      'Gusseted crotch and articulated knees for unrestricted mobility',
      'Elasticized waistband with internal high-grip silicone stay track',
    ],
    careInstructions: [
      'Machine wash cold inside out with mild liquid detergent',
      'Tumble dry low or hang dry',
      'Do not use bleach or fabric conditioners',
    ],
    biomechanics:
      'Tapered architectural cut engineered to seal around ankles and avoid drag. Model is 5 ft 9 in (175 cm), 140 lbs (63 kg) wearing size S.',
    variants: [
      {
        id: 'var_act_blk_s',
        sku: 'ACT-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/women-cargo-jogger-charcoal.jpg',
        secondaryImage: '/products/women-cargo-jogger-wide.jpg',
        gallery: [
          '/products/women-cargo-jogger-charcoal.jpg',
          '/products/women-cargo-jogger-wide.jpg',
          '/products/women-cargo-jogger-trio.jpg',
          '/products/women-crop-pant-set.jpg',
        ],
        stock: 35,
      },
      {
        id: 'var_act_olv_s',
        sku: 'ACT-OLV-S',
        colorName: 'Alpine Olive',
        colorHex: '#4E5343',
        size: 'S',
        primaryImage: '/products/women-winter-set-olive.jpg',
        secondaryImage: '/products/women-winter-set-slate.jpg',
        gallery: [
          '/products/women-winter-set-olive.jpg',
          '/products/women-winter-set-slate.jpg',
          '/products/women-winter-set-crop.jpg',
          '/products/women-cargo-jogger-charcoal.jpg',
        ],
        stock: 28,
      },
    ],
    rating: 4.8,
    reviewCount: 165,
    reviews: [
      {
        id: 'rev_act_01',
        author: 'Chloe M.',
        rating: 5,
        date: '2026-09-30',
        title: 'Best cold-weather joggers I have ever worn',
        content:
          'Warm without being sweaty. The magnetic pockets are sleek and do not bulge out like bulky cargo pants.',
        discipline: 'Outdoor Trainer',
        verified: true,
      },
    ],
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 'prod_tactical_jogger_007',
    name: 'Tactical Division Cargo Jogger',
    slug: 'tactical-division-cargo-jogger',
    category: 'bottoms',
    discipline: 'train',
    gender: 'men',
    price: 88.0,
    compareAtPrice: 98.0,
    specsSummary: 'Cordura® Weave / Articulated Knee / Magnetic Pockets',
    headline:
      'High-tenacity athletic cargo jogger engineered for heavy outdoor sessions and operational utility.',
    description:
      'Engineered with a high-tenacity Cordura® stretch-ripstop construction. Features 6 functional technical pockets, magnetic flap enclosures, and elasticized cuffs that fit comfortably over running shoes or boots.',
    fabricDetails: {
      composition: '90% Cordura® Nylon, 10% Spandex 4-Way Stretch',
      weightGsm: 220,
      technology: 'AeroFlex Ripstop Abrasion Shield',
      finish: 'DWR Repellent & Anti-Stain Treatment',
    },
    features: [
      'Gusseted crotch panel prevents seam tension during full-depth squats',
      'Articulated double-layer knee darts preserve unrestricted range of motion',
      'Dual deep zip hand pockets + dual magnetic cargo pockets',
      'Ultra-dense rib cuff seals the ankle against cold drafts and debris',
    ],
    careInstructions: [
      'Machine wash cold gentle with technical synthetics',
      'Tumble dry low or air dry in shade',
      'Do not iron over magnetic hardware',
    ],
    biomechanics:
      'Anatomical taper hugging calves while leaving room in hips and thighs. Model is 6 ft 2 in (188 cm), 195 lbs (88 kg) wearing size L.',
    variants: [
      {
        id: 'var_tdj_blk_m',
        sku: 'TDJ-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/men-cargo-jogger.jpg',
        secondaryImage: '/products/men-sportswear-lower-1.jpg',
        gallery: [
          '/products/men-cargo-jogger.jpg',
          '/products/men-sportswear-lower-1.jpg',
          '/products/men-sportswear-lower-2.jpg',
          '/products/men-steel-track-set.jpg',
        ],
        stock: 55,
      },
    ],
    rating: 4.9,
    reviewCount: 210,
    reviews: [
      {
        id: 'rev_tdj_01',
        author: 'Sam W.',
        rating: 5,
        date: '2026-10-04',
        title: 'Incredible fit and indestructible fabric',
        content:
          'Scraped against concrete and barbells multiple times, zero marks. Taper at the bottom is razor clean.',
        discipline: 'Tactical Fitness',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: true,
  },
  {
    id: 'prod_juni_wrap_008',
    name: 'Juni Kinetic Wrap Top',
    slug: 'juni-kinetic-wrap-top',
    category: 'tops',
    discipline: 'rec',
    gender: 'women',
    price: 64.0,
    specsSummary: 'SweatShield+ Micro-Rib / Wrap Architecture / Thumbholes',
    headline: 'Elegantly sculpted technical wrap top for studio transitions and outdoor layering.',
    description:
      'Constructed with an asymmetrical crossover wrap silhouette that flatters the core while providing breathable muscle temperature retention. Extended sleeves feature reinforced thumb loops.',
    fabricDetails: {
      composition: '84% Micro-Modal, 16% Lycra Xtra Life',
      weightGsm: 210,
      technology: 'SweatShield+ Micro-Airflow Knit',
      finish: 'Ultra-Soft Carbon Suede Touch',
    },
    features: [
      'Adaptive crossover wrap structure ties securely around waist or ribcage',
      'Reinforced thumb loop cuffs prevent sleeve migration during warmups',
      'Deep breathable back cutout prevents sweat pooling during intense movement',
      'Four-way stretch recovery holds shape without bagging',
    ],
    careInstructions: [
      'Machine wash cold gentle in mesh bag',
      'Lay flat to dry to preserve wrap drape',
      'Do not bleach or tumble dry hot',
    ],
    biomechanics:
      'Provides thermal insulation over sports bras without binding the ribcage during deep breathing. Model is 5 ft 7 in (170 cm), 128 lbs (58 kg) wearing size S.',
    variants: [
      {
        id: 'var_jwt_blk_s',
        sku: 'JWT-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/women-juni-wrap-top.jpg',
        secondaryImage: '/products/women-juni-wrap-top-2.jpg',
        gallery: [
          '/products/women-juni-wrap-top.jpg',
          '/products/women-juni-wrap-top-2.jpg',
          '/products/women-shrug-charcoal.jpg',
          '/products/women-shrug-blush.jpg',
        ],
        stock: 38,
      },
    ],
    rating: 4.8,
    reviewCount: 140,
    reviews: [
      {
        id: 'rev_jwt_01',
        author: 'Maya S.',
        rating: 5,
        date: '2026-09-19',
        title: 'The fabric feels unbelievable',
        content:
          'Feels silky and expensive, but still handles a workout. Great for walking to and from the gym.',
        discipline: 'Pilates & Strength',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: true,
  },
  {
    id: 'prod_stealth_windbreaker_009',
    name: 'Stealth Aero Windbreaker',
    slug: 'stealth-aero-windbreaker',
    category: 'outerwear',
    discipline: 'run',
    gender: 'men',
    price: 135.0,
    compareAtPrice: 150.0,
    specsSummary: 'Micro-Ripstop / Packable / 85g Ultralight',
    headline: 'Ultralight running windbreaker that compresses into its own chest pocket.',
    description:
      'Weighing only 85 grams, the Stealth Aero Windbreaker packs maximum wind and drizzle protection into an ultra-compact footprint. Features reflective trim and back exhaust vents.',
    fabricDetails: {
      composition: '100% Ultralight Featherweight Ripstop Nylon',
      weightGsm: 75,
      technology: 'AeroVent Flow-Through Channels',
      finish: 'Eco-Friendly C0 DWR Finish',
    },
    features: [
      'Self-stowing internal chest pocket with elasticized carry loop',
      'Dual rear exhaust vents prevent ballooning during high-speed runs',
      'Micro-elastic hem and cuffs seal against cold wind gusts',
      'Reflective 360-degree branding for night road visibility',
    ],
    careInstructions: [
      'Machine wash cold on delicate cycle',
      'Hang dry only; dries within 20 minutes',
      'Do not iron or dry clean',
    ],
    biomechanics:
      'Zero-drag athletic contour designed specifically for running, sprinting, and road cycling.',
    variants: [
      {
        id: 'var_saw_blk_m',
        sku: 'SAW-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/men-windbreaker.jpg',
        secondaryImage: '/products/windbreaker-black.jpg',
        gallery: [
          '/products/men-windbreaker.jpg',
          '/products/windbreaker-black.jpg',
          '/products/men-windcheater-black.jpg',
          '/products/men-windcheater-olive.jpg',
        ],
        stock: 42,
      },
    ],
    rating: 4.9,
    reviewCount: 185,
    reviews: [
      {
        id: 'rev_saw_01',
        author: 'Chris P.',
        rating: 5,
        date: '2026-09-25',
        title: 'Weighs nothing and blocks all wind',
        content:
          'I pack this into my pocket for early morning runs. The breathability vents in the back are perfectly positioned.',
        discipline: 'Marathoner',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: false,
  },
  {
    id: 'prod_women_windbreaker_010',
    name: 'Women Stealth Packable Shell',
    slug: 'women-stealth-packable-shell',
    category: 'outerwear',
    discipline: 'run',
    gender: 'women',
    price: 135.0,
    specsSummary: 'Feather-Ripstop / Windproof / Reflective Telemetry',
    headline:
      'High-visibility technical windbreaker cut with an articulated feminine athletic silhouette.',
    description:
      'Engineered for damp dawn and twilight runs. Offers impenetrable windproofing and a lightweight water-repellent shell that never traps condensation.',
    fabricDetails: {
      composition: '100% Recycled Technical Micro-Ripstop Nylon',
      weightGsm: 78,
      technology: 'AeroVent Anatomical Exhaust Architecture',
      finish: 'DWR Repellent Coating',
    },
    features: [
      'Scalloped hemline provides extended rear coverage without restricting stride',
      'Laser-cut ventilation ports along lower spine and underarms',
      'Two concealed zip pockets with internal earphone cord pass-through',
      'High storm collar with chin zipper garage to prevent chafing',
    ],
    careInstructions: [
      'Machine wash cold delicate',
      'Air dry flat in shade',
      'Do not use fabric conditioner',
    ],
    biomechanics:
      'Articulated shoulder raglan lines cut specifically for athletic female posture and arm carriage.',
    variants: [
      {
        id: 'var_wsp_blk_s',
        sku: 'WSP-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/women-windbreaker.jpg',
        secondaryImage: '/products/women-cropped-jacket-set-black.jpg',
        gallery: [
          '/products/women-windbreaker.jpg',
          '/products/women-cropped-jacket-set-black.jpg',
          '/products/women-cropped-jacket-set-navy.jpg',
          '/products/women-cropped-jacket-set-olive.jpg',
        ],
        stock: 34,
      },
    ],
    rating: 4.9,
    reviewCount: 152,
    reviews: [
      {
        id: 'rev_wsp_01',
        author: 'Jessica D.',
        rating: 5,
        date: '2026-10-02',
        title: 'Flattering cut that performs',
        content:
          'Most running jackets look like trash bags. This has great shape and keeps the cold wind off my chest completely.',
        discipline: 'Distance Runner',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: false,
  },
  {
    id: 'prod_tactical_sling_011',
    name: 'Ballistic Modular Sling Pack',
    slug: 'ballistic-modular-sling-pack',
    category: 'accessories',
    discipline: 'rec',
    gender: 'unisex',
    price: 68.0,
    specsSummary: 'Cordura® 1000D / YKK Aquaguard / Fidlock Strap',
    headline: 'High-tenacity cross-body gear bag designed for urban transit and EDC hardware.',
    description:
      'Constructed from virtually indestructible 1000D ballistic Cordura® nylon. Features dual water-resistant compartments, padded fleece phone sleeve, and magnetic quick-release strap buckle.',
    fabricDetails: {
      composition: '100% Cordura® 1000D Ballistic Nylon',
      weightGsm: 340,
      technology: 'Ballistic Armor-Knit Weave',
      finish: 'Polyurethane Backcoating & Water-Resistant Face',
    },
    features: [
      'German-made Fidlock magnetic V-buckle for instant one-click chest release',
      'YKK Aquaguard waterproof zippers with glove-friendly hypalon pulls',
      'Internal fleece-lined pocket protects mobile screens and optics from scratching',
      'MOLLE webbing loops on base for clipping keys, carabiners, or running lights',
    ],
    careInstructions: [
      'Spot clean with warm water and damp cloth',
      'Do not machine wash or submerge Fidlock magnetic hardware',
    ],
    biomechanics:
      'Ergonomic asymmetrical sling strap distributes weight evenly across upper torso without restricting shoulder mobility.',
    variants: [
      {
        id: 'var_bms_blk_os',
        sku: 'BMS-BLK-OS',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'OS',
        primaryImage: '/products/image-12-2.jpg',
        secondaryImage: '/products/image-12-1.jpg',
        gallery: [
          '/products/image-12-2.jpg',
          '/products/image-12-1.jpg',
          '/products/image-12-3.jpg',
        ],
        stock: 50,
      },
    ],
    rating: 5.0,
    reviewCount: 318,
    reviews: [
      {
        id: 'rev_bms_01',
        author: 'Aaron L.',
        rating: 5,
        date: '2026-09-29',
        title: 'Carries keys, phone, straps, and wallet with zero bulk',
        content:
          'The magnetic buckle makes taking it off so satisfying. High quality hardware throughout.',
        discipline: 'City Commuter',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: true,
  },
  {
    id: 'prod_sports_bra_trio_012',
    name: 'AeroFlex High-Support Sports Bra',
    slug: 'aeroflex-high-support-sports-bra',
    category: 'tops',
    discipline: 'train',
    gender: 'women',
    price: 48.0,
    specsSummary: 'AeroFlex 4-Way / Bonded Band / Medium-High Impact',
    headline:
      'High-impact compression sports bra designed to eliminate bounce across explosive training.',
    description:
      'Engineered with dual-layer AeroFlex compression and a brushed elastic underband that never digs in. Clean bonded neckline prevents friction during jump rope and sprint drills.',
    fabricDetails: {
      composition: '75% High-Tenacity Polyamide, 25% Lycra Sport',
      weightGsm: 260,
      technology: 'AeroFlex Rebound Matrix',
      finish: 'SweatShield+ Hydrophilic Core',
    },
    features: [
      'Reinforced racerback posture harness distributes support evenly across trapezius',
      'Anti-chafing bonded edge seams along armholes and neckline',
      'Quick-drying capillary knit dries in under 30 minutes',
      'Molded micro-perforated breathable inserts included',
    ],
    careInstructions: [
      'Machine wash cold inside laundry pouch',
      'Remove foam cups before washing',
      'Air dry flat in shade',
    ],
    biomechanics:
      'Engineered to reduce vertical breast displacement by up to 78% during sprinting. Model is 5 ft 8 in (173 cm), 34B wearing size S.',
    variants: [
      {
        id: 'var_ahb_sge_s',
        sku: 'AHB-SGE-S',
        colorName: 'Sage Matrix',
        colorHex: '#8A9A86',
        size: 'S',
        primaryImage: '/products/women-sports-bra-sage.jpg',
        secondaryImage: '/products/women-sports-bra-rose.jpg',
        gallery: [
          '/products/women-sports-bra-sage.jpg',
          '/products/women-sports-bra-rose.jpg',
          '/products/women-sports-bra-lilac.jpg',
        ],
        stock: 45,
      },
      {
        id: 'var_ahb_ros_s',
        sku: 'AHB-ROS-S',
        colorName: 'Rose Dust',
        colorHex: '#B28A8A',
        size: 'S',
        primaryImage: '/products/women-sports-bra-rose.jpg',
        secondaryImage: '/products/women-sports-bra-lilac.jpg',
        gallery: [
          '/products/women-sports-bra-rose.jpg',
          '/products/women-sports-bra-lilac.jpg',
          '/products/women-sports-bra-sage.jpg',
        ],
        stock: 35,
      },
    ],
    rating: 4.9,
    reviewCount: 224,
    reviews: [
      {
        id: 'rev_ahb_01',
        author: 'Brooke T.',
        rating: 5,
        date: '2026-09-24',
        title: 'Finally a sports bra that locks everything down',
        content:
          'No shifting, no uncomfortable digging at the shoulders. Super comfortable for 10-mile runs.',
        discipline: 'Marathoner',
        verified: true,
      },
    ],
    isFeatured: false,
    isBestseller: true,
  },
];

export interface CatalogFilterParams {
  category?: string;
  discipline?: string;
  gender?: string;
  search?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'bestseller';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export function getAllProducts(): CatalogProduct[] {
  return CATALOG_PRODUCTS;
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((p) => p.id === id);
}

export function getRelatedProducts(currentId: string, limit = 4): CatalogProduct[] {
  const current = getProductById(currentId);
  if (!current) return CATALOG_PRODUCTS.slice(0, limit);

  return CATALOG_PRODUCTS.filter(
    (p) =>
      p.id !== currentId &&
      (p.category === current.category || p.discipline === current.discipline),
  ).slice(0, limit);
}

export function getFilteredProducts(filters: CatalogFilterParams): CatalogProduct[] {
  let results = [...CATALOG_PRODUCTS];

  if (filters.category && filters.category !== 'all') {
    results = results.filter((p) => p.category.toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters.discipline && filters.discipline !== 'all') {
    results = results.filter(
      (p) => p.discipline.toLowerCase() === filters.discipline!.toLowerCase(),
    );
  }

  if (filters.gender && filters.gender !== 'all') {
    results = results.filter(
      (p) => p.gender.toLowerCase() === filters.gender!.toLowerCase() || p.gender === 'unisex',
    );
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.specsSummary.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.discipline.toLowerCase().includes(q),
    );
  }

  if (typeof filters.minPrice === 'number') {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === 'number') {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.inStockOnly) {
    results = results.filter((p) => p.variants.some((v) => v.stock > 0));
  }

  // Sort
  if (filters.sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (filters.sort === 'bestseller') {
    results.sort(
      (a, b) =>
        (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0) || b.reviewCount - a.reviewCount,
    );
  } else if (filters.sort === 'newest') {
    results.reverse();
  } else {
    // 'featured' default
    results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  return results;
}
