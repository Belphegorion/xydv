/**
 * Static Catalog Data for XYDV Technical Activewear
 * Authoritative mirror of apps/web/src/lib/catalog.ts for backend resolution & fallback
 */

export interface StaticProductVariant {
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

export interface StaticProductSpec {
  label: string;
  value: string;
}

export interface StaticCatalogProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  discipline?: string;
  gender?: string;
  price: number;
  compareAtPrice?: number;
  specsSummary?: string;
  description: string;
  features?: string[];
  specs?: StaticProductSpec[];
  variants: StaticProductVariant[];
}

export const STATIC_CATALOG: StaticCatalogProduct[] = [
  {
    "id": "prod_volt_tee_001",
    "name": "Volt Performance Tee",
    "slug": "volt-performance-tee",
    "category": "tops",
    "discipline": "run",
    "gender": "men",
    "price": 58,
    "compareAtPrice": 68,
    "specsSummary": "SweatShield+ / 180 GSM / UPF 50+",
    "description": "Engineered with proprietary SweatShield+ micro-mesh, the Volt Performance Tee rapidly expels moisture while maintaining zero clinging saturation. Bonded shoulder seams eliminate chafing under weighted vests and running packs.",
    "features": [
      "SweatShield+ capillary action wicks moisture 3.4x faster than standard synthetic knit",
      "Ultrasonic flatlock bonded seams to eliminate abrasion during high-mileage runs",
      "Engineered 4-way rebound maintains shape without bagging out after repetitive washes",
      "Reflective 3M Scotchlite telemetry accents for low-light night running safety"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "SweatShield+ Phase-Change Capillary Action"
      },
      {
        "label": "Composition",
        "value": "82% High-Tenacity Micro-Poly, 18% AeroFlex Spandex"
      },
      {
        "label": "Weight",
        "value": "180 GSM"
      },
      {
        "label": "Finish",
        "value": "Antimicrobial Silver-Ion & UPF 50+ Sun Barrier"
      },
      {
        "label": "Overview",
        "value": "SweatShield+ / 180 GSM / UPF 50+"
      }
    ],
    "variants": [
      {
        "id": "var_vpt_blk_m",
        "sku": "VPT-BLK-M",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "M",
        "primaryImage": "/products/image-4-1.jpg",
        "secondaryImage": "/products/image-5-2.jpg",
        "gallery": [
          "/products/image-4-1.jpg",
          "/products/image-5-1.jpg",
          "/products/image-5-2.jpg",
          "/products/image-6-1.jpg"
        ],
        "stock": 65
      },
      {
        "id": "var_vpt_vlt_m",
        "sku": "VPT-VLT-M",
        "colorName": "Volt Stealth",
        "colorHex": "#E8FF00",
        "size": "M",
        "primaryImage": "/products/image-6-1.jpg",
        "secondaryImage": "/products/image-7-1.jpg",
        "gallery": [
          "/products/image-6-1.jpg",
          "/products/image-7-1.jpg",
          "/products/image-10-1.jpg",
          "/products/image-10-3.jpg"
        ],
        "stock": 25
      },
      {
        "id": "var_vpt_slv_m",
        "sku": "VPT-SLV-M",
        "colorName": "Titanium Grey",
        "colorHex": "#52525B",
        "size": "M",
        "primaryImage": "/products/men-sports-tee.jpg",
        "secondaryImage": "/products/sports-tee-front.jpg",
        "gallery": [
          "/products/men-sports-tee.jpg",
          "/products/sports-tee-front.jpg",
          "/products/sportswear-tee-angled.jpg",
          "/products/image-4-1.jpg"
        ],
        "stock": 40
      }
    ]
  },
  {
    "id": "prod_apex_shorts_002",
    "name": "Apex Modular Training Shorts",
    "slug": "apex-modular-training-shorts",
    "category": "bottoms",
    "discipline": "train",
    "gender": "men",
    "price": 72,
    "specsSummary": "AeroFlex 5\" / Compression Liner / YKK Aquaguard",
    "description": "Engineered for maximum leg propulsion and heavy barbell friction. Features an integrated compression liner with dedicated zero-bounce phone pocket, laser-cut ventilation ports, and YKK Aquaguard zip pockets.",
    "features": [
      "Cordura® reinforced front panels resist knurling wear from deadlifts and barbell contact",
      "Dual YKK Aquaguard waterproof zip pockets keep keycards and essentials dry",
      "Built-in internal compression liner with dedicated bounce-free media sleeve",
      "Custom woven technical drawcord with silicone-dipped ends"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroFlex 4-Way Ballistic Weave"
      },
      {
        "label": "Composition",
        "value": "Shell: 88% Cordura® Ballistic Nylon, 12% Spandex; Liner: 80% Micro-Nylon, 20% Elastane"
      },
      {
        "label": "Weight",
        "value": "165 GSM"
      },
      {
        "label": "Finish",
        "value": "DWR Water-Repellent & Anti-Friction Coating"
      },
      {
        "label": "Overview",
        "value": "AeroFlex 5\" / Compression Liner / YKK Aquaguard"
      }
    ],
    "variants": [
      {
        "id": "var_ats_blk_m",
        "sku": "ATS-BLK-M",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "M",
        "primaryImage": "/products/image-8-1.jpg",
        "secondaryImage": "/products/image-11-1.jpg",
        "gallery": [
          "/products/image-8-1.jpg",
          "/products/image-11-1.jpg",
          "/products/image-11-2.jpg",
          "/products/image-14-1.jpg"
        ],
        "stock": 50
      },
      {
        "id": "var_ats_olv_m",
        "sku": "ATS-OLV-M",
        "colorName": "Tactical Olive",
        "colorHex": "#3D4532",
        "size": "M",
        "primaryImage": "/products/image-14-1.jpg",
        "secondaryImage": "/products/image-15-1.jpg",
        "gallery": [
          "/products/image-14-1.jpg",
          "/products/image-15-1.jpg",
          "/products/image-8-1.jpg",
          "/products/image-11-1.jpg"
        ],
        "stock": 35
      }
    ]
  },
  {
    "id": "prod_storm_shell_003",
    "name": "Storm-Shield Ripstop Shell",
    "slug": "storm-shield-ripstop-shell",
    "category": "outerwear",
    "discipline": "train",
    "gender": "men",
    "price": 148,
    "compareAtPrice": 165,
    "specsSummary": "Cordura® 500D / 20k Waterproof / Sealed Seams",
    "description": "Engineered with 3-layer laminated Cordura® ripstop, the Storm-Shield Shell provides 20,000mm hydrostatic head waterproofing alongside 25,000 g/m²/24h breathability. Fully taped internal seams and an architectural storm collar protect against the elements.",
    "features": [
      "20,000mm hydrostatic head waterproof rating with 100% seam-sealed tape construction",
      "Dual-direction underarm ventilation zippers for thermal dumping during uphill accents",
      "Architectural 3-point adjustable hood engineered to fit securely over athletic caps",
      "Fidlock magnetic snap collar closure for instant one-handed deployment"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "Storm-Shield 20K/25K Sealed Lamination"
      },
      {
        "label": "Composition",
        "value": "3-Layer 100% Cordura® Micro-Ripstop Nylon with Hydrophilic Membrane"
      },
      {
        "label": "Weight",
        "value": "145 GSM"
      },
      {
        "label": "Finish",
        "value": "Fluorocarbon-Free C0 DWR Repellent"
      },
      {
        "label": "Overview",
        "value": "Cordura® 500D / 20k Waterproof / Sealed Seams"
      }
    ],
    "variants": [
      {
        "id": "var_sss_blk_m",
        "sku": "SSS-BLK-M",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "M",
        "primaryImage": "/products/image-9-1.jpg",
        "secondaryImage": "/products/image-13-1.jpg",
        "gallery": [
          "/products/image-9-1.jpg",
          "/products/image-13-1.jpg",
          "/products/image-13-2.jpg",
          "/products/image-16-1.jpg"
        ],
        "stock": 30
      },
      {
        "id": "var_sss_gry_m",
        "sku": "SSS-GRY-M",
        "colorName": "Stealth Ash",
        "colorHex": "#71717A",
        "size": "M",
        "primaryImage": "/products/men-windcheater-ash.jpg",
        "secondaryImage": "/products/men-windbreaker.jpg",
        "gallery": [
          "/products/men-windcheater-ash.jpg",
          "/products/men-windbreaker.jpg",
          "/products/image-9-1.jpg",
          "/products/image-13-1.jpg"
        ],
        "stock": 22
      }
    ]
  },
  {
    "id": "prod_tactical_cap_004",
    "name": "Ballistic Fidlock Cap",
    "slug": "ballistic-fidlock-cap",
    "category": "accessories",
    "discipline": "rec",
    "gender": "unisex",
    "price": 42,
    "specsSummary": "Laser Vent / Fidlock V-Buckle / Quick-Dry",
    "description": "Crafted from water-resistant ballistic ripstop with micro laser-perforated side panels for optimal cranial airflow. Anchored by an authentic German-engineered Fidlock magnetic buckle.",
    "features": [
      "German-engineered Fidlock magnetic slider buckle for micro-second adjustments",
      "Laser-cut ventilation ports along lateral panels maintain cranial cooling",
      "Hydrophobic EVA foam brim keeps shape and floats if dropped in water",
      "Reflective tonal XYDV telemetry logo at front and rear strap"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "Laser-Vented Micro-Aero Mesh"
      },
      {
        "label": "Composition",
        "value": "100% Hydrophobic Ballistic Ripstop Polyester"
      },
      {
        "label": "Weight",
        "value": "110 GSM"
      },
      {
        "label": "Finish",
        "value": "DWR Repellent & Antimicrobial Sweatband"
      },
      {
        "label": "Overview",
        "value": "Laser Vent / Fidlock V-Buckle / Quick-Dry"
      }
    ],
    "variants": [
      {
        "id": "var_bfc_blk_os",
        "sku": "BFC-BLK-OS",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "OS",
        "primaryImage": "/products/image-12-1.jpg",
        "secondaryImage": "/products/image-12-2.jpg",
        "gallery": [
          "/products/image-12-1.jpg",
          "/products/image-12-2.jpg",
          "/products/image-12-3.jpg"
        ],
        "stock": 80
      }
    ]
  },
  {
    "id": "prod_compression_top_005",
    "name": "AeroFlex Seamless Crop Top",
    "slug": "aeroflex-seamless-crop-top",
    "category": "tops",
    "discipline": "train",
    "gender": "women",
    "price": 52,
    "compareAtPrice": 62,
    "specsSummary": "AeroFlex Knit / Ribbed Compression / Zero Chafing",
    "description": "Constructed with circular seamless knitting technology, eliminating all side seams. Targeted compression zones provide medium-to-high support while open-knit ventilation zones expel body heat.",
    "features": [
      "Circular seamless construction provides true 360-degree anatomical contouring",
      "Reinforced underbust ribbing guarantees zero upward displacement during explosive moves",
      "Removable molded breathable cups with micro-perforations for heat dissipation",
      "Square athletic neckline engineered for shoulder blade freedom"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroFlex Targeted Zone Compression"
      },
      {
        "label": "Composition",
        "value": "74% Polyamide 6.6, 26% High-Tension Elastane"
      },
      {
        "label": "Weight",
        "value": "240 GSM"
      },
      {
        "label": "Finish",
        "value": "SweatShield+ Hydrophilic Treatment"
      },
      {
        "label": "Overview",
        "value": "AeroFlex Knit / Ribbed Compression / Zero Chafing"
      }
    ],
    "variants": [
      {
        "id": "var_cpt_blk_s",
        "sku": "CPT-BLK-S",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "S",
        "primaryImage": "/products/women-casual-top.jpg",
        "secondaryImage": "/products/women-colourblock-tee.jpg",
        "gallery": [
          "/products/women-casual-top.jpg",
          "/products/women-colourblock-tee.jpg",
          "/products/women-highneck-tee.jpg",
          "/products/women-vneck-top.jpg"
        ],
        "stock": 45
      },
      {
        "id": "var_cpt_sge_s",
        "sku": "CPT-SGE-S",
        "colorName": "Sage Matrix",
        "colorHex": "#8A9A86",
        "size": "S",
        "primaryImage": "/products/women-sports-bra-sage.jpg",
        "secondaryImage": "/products/women-sports-bra-rose.jpg",
        "gallery": [
          "/products/women-sports-bra-sage.jpg",
          "/products/women-sports-bra-rose.jpg",
          "/products/women-sports-bra-lilac.jpg",
          "/products/women-casual-top.jpg"
        ],
        "stock": 30
      }
    ]
  },
  {
    "id": "prod_activewear_set_006",
    "name": "Thermal Compression Cargo Set",
    "slug": "thermal-compression-cargo-set",
    "category": "bottoms",
    "discipline": "rec",
    "gender": "women",
    "price": 110,
    "compareAtPrice": 125,
    "specsSummary": "420 GSM Grid / Ergonomic Pockets / Thermal Reg",
    "description": "Engineered for cold-weather outdoor training and recovery. Built from 420 GSM brushback micro-grid thermal fleece that traps heat within geometric chambers while allowing vapor release.",
    "features": [
      "420 GSM double-knit thermal grid locks warmth without excess bulk",
      "Dual flat-lay side cargo pockets with silent magnetic snap closures",
      "Gusseted crotch and articulated knees for unrestricted mobility",
      "Elasticized waistband with internal high-grip silicone stay track"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "ClimateSync Geometric Thermal Grid"
      },
      {
        "label": "Composition",
        "value": "68% Organic Cotton, 26% Cordura® Nylon, 6% Elastane"
      },
      {
        "label": "Weight",
        "value": "420 GSM"
      },
      {
        "label": "Finish",
        "value": "Peached Exterior with Low-Pill Brushed Fleece Interior"
      },
      {
        "label": "Overview",
        "value": "420 GSM Grid / Ergonomic Pockets / Thermal Reg"
      }
    ],
    "variants": [
      {
        "id": "var_act_blk_s",
        "sku": "ACT-BLK-S",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "S",
        "primaryImage": "/products/women-cargo-jogger-charcoal.jpg",
        "secondaryImage": "/products/women-cargo-jogger-wide.jpg",
        "gallery": [
          "/products/women-cargo-jogger-charcoal.jpg",
          "/products/women-cargo-jogger-wide.jpg",
          "/products/women-cargo-jogger-trio.jpg",
          "/products/women-crop-pant-set.jpg"
        ],
        "stock": 35
      },
      {
        "id": "var_act_olv_s",
        "sku": "ACT-OLV-S",
        "colorName": "Alpine Olive",
        "colorHex": "#4E5343",
        "size": "S",
        "primaryImage": "/products/women-winter-set-olive.jpg",
        "secondaryImage": "/products/women-winter-set-slate.jpg",
        "gallery": [
          "/products/women-winter-set-olive.jpg",
          "/products/women-winter-set-slate.jpg",
          "/products/women-winter-set-crop.jpg",
          "/products/women-cargo-jogger-charcoal.jpg"
        ],
        "stock": 28
      }
    ]
  },
  {
    "id": "prod_tactical_jogger_007",
    "name": "Tactical Division Cargo Jogger",
    "slug": "tactical-division-cargo-jogger",
    "category": "bottoms",
    "discipline": "train",
    "gender": "men",
    "price": 88,
    "compareAtPrice": 98,
    "specsSummary": "Cordura® Weave / Articulated Knee / Magnetic Pockets",
    "description": "Engineered with a high-tenacity Cordura® stretch-ripstop construction. Features 6 functional technical pockets, magnetic flap enclosures, and elasticized cuffs that fit comfortably over running shoes or boots.",
    "features": [
      "Gusseted crotch panel prevents seam tension during full-depth squats",
      "Articulated double-layer knee darts preserve unrestricted range of motion",
      "Dual deep zip hand pockets + dual magnetic cargo pockets",
      "Ultra-dense rib cuff seals the ankle against cold drafts and debris"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroFlex Ripstop Abrasion Shield"
      },
      {
        "label": "Composition",
        "value": "90% Cordura® Nylon, 10% Spandex 4-Way Stretch"
      },
      {
        "label": "Weight",
        "value": "220 GSM"
      },
      {
        "label": "Finish",
        "value": "DWR Repellent & Anti-Stain Treatment"
      },
      {
        "label": "Overview",
        "value": "Cordura® Weave / Articulated Knee / Magnetic Pockets"
      }
    ],
    "variants": [
      {
        "id": "var_tdj_blk_m",
        "sku": "TDJ-BLK-M",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "M",
        "primaryImage": "/products/men-cargo-jogger.jpg",
        "secondaryImage": "/products/men-sportswear-lower-1.jpg",
        "gallery": [
          "/products/men-cargo-jogger.jpg",
          "/products/men-sportswear-lower-1.jpg",
          "/products/men-sportswear-lower-2.jpg",
          "/products/men-steel-track-set.jpg"
        ],
        "stock": 55
      }
    ]
  },
  {
    "id": "prod_juni_wrap_008",
    "name": "Juni Kinetic Wrap Top",
    "slug": "juni-kinetic-wrap-top",
    "category": "tops",
    "discipline": "rec",
    "gender": "women",
    "price": 64,
    "specsSummary": "SweatShield+ Micro-Rib / Wrap Architecture / Thumbholes",
    "description": "Constructed with an asymmetrical crossover wrap silhouette that flatters the core while providing breathable muscle temperature retention. Extended sleeves feature reinforced thumb loops.",
    "features": [
      "Adaptive crossover wrap structure ties securely around waist or ribcage",
      "Reinforced thumb loop cuffs prevent sleeve migration during warmups",
      "Deep breathable back cutout prevents sweat pooling during intense movement",
      "Four-way stretch recovery holds shape without bagging"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "SweatShield+ Micro-Airflow Knit"
      },
      {
        "label": "Composition",
        "value": "84% Micro-Modal, 16% Lycra Xtra Life"
      },
      {
        "label": "Weight",
        "value": "210 GSM"
      },
      {
        "label": "Finish",
        "value": "Ultra-Soft Carbon Suede Touch"
      },
      {
        "label": "Overview",
        "value": "SweatShield+ Micro-Rib / Wrap Architecture / Thumbholes"
      }
    ],
    "variants": [
      {
        "id": "var_jwt_blk_s",
        "sku": "JWT-BLK-S",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "S",
        "primaryImage": "/products/women-juni-wrap-top.jpg",
        "secondaryImage": "/products/women-juni-wrap-top-2.jpg",
        "gallery": [
          "/products/women-juni-wrap-top.jpg",
          "/products/women-juni-wrap-top-2.jpg",
          "/products/women-shrug-charcoal.jpg",
          "/products/women-shrug-blush.jpg"
        ],
        "stock": 38
      }
    ]
  },
  {
    "id": "prod_stealth_windbreaker_009",
    "name": "Stealth Aero Windbreaker",
    "slug": "stealth-aero-windbreaker",
    "category": "outerwear",
    "discipline": "run",
    "gender": "men",
    "price": 135,
    "compareAtPrice": 150,
    "specsSummary": "Micro-Ripstop / Packable / 85g Ultralight",
    "description": "Weighing only 85 grams, the Stealth Aero Windbreaker packs maximum wind and drizzle protection into an ultra-compact footprint. Features reflective trim and back exhaust vents.",
    "features": [
      "Self-stowing internal chest pocket with elasticized carry loop",
      "Dual rear exhaust vents prevent ballooning during high-speed runs",
      "Micro-elastic hem and cuffs seal against cold wind gusts",
      "Reflective 360-degree branding for night road visibility"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroVent Flow-Through Channels"
      },
      {
        "label": "Composition",
        "value": "100% Ultralight Featherweight Ripstop Nylon"
      },
      {
        "label": "Weight",
        "value": "75 GSM"
      },
      {
        "label": "Finish",
        "value": "Eco-Friendly C0 DWR Finish"
      },
      {
        "label": "Overview",
        "value": "Micro-Ripstop / Packable / 85g Ultralight"
      }
    ],
    "variants": [
      {
        "id": "var_saw_blk_m",
        "sku": "SAW-BLK-M",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "M",
        "primaryImage": "/products/men-windbreaker.jpg",
        "secondaryImage": "/products/windbreaker-black.jpg",
        "gallery": [
          "/products/men-windbreaker.jpg",
          "/products/windbreaker-black.jpg",
          "/products/men-windcheater-black.jpg",
          "/products/men-windcheater-olive.jpg"
        ],
        "stock": 42
      }
    ]
  },
  {
    "id": "prod_women_windbreaker_010",
    "name": "Women Stealth Packable Shell",
    "slug": "women-stealth-packable-shell",
    "category": "outerwear",
    "discipline": "run",
    "gender": "women",
    "price": 135,
    "specsSummary": "Feather-Ripstop / Windproof / Reflective Telemetry",
    "description": "Engineered for damp dawn and twilight runs. Offers impenetrable windproofing and a lightweight water-repellent shell that never traps condensation.",
    "features": [
      "Scalloped hemline provides extended rear coverage without restricting stride",
      "Laser-cut ventilation ports along lower spine and underarms",
      "Two concealed zip pockets with internal earphone cord pass-through",
      "High storm collar with chin zipper garage to prevent chafing"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroVent Anatomical Exhaust Architecture"
      },
      {
        "label": "Composition",
        "value": "100% Recycled Technical Micro-Ripstop Nylon"
      },
      {
        "label": "Weight",
        "value": "78 GSM"
      },
      {
        "label": "Finish",
        "value": "DWR Repellent Coating"
      },
      {
        "label": "Overview",
        "value": "Feather-Ripstop / Windproof / Reflective Telemetry"
      }
    ],
    "variants": [
      {
        "id": "var_wsp_blk_s",
        "sku": "WSP-BLK-S",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "S",
        "primaryImage": "/products/women-windbreaker.jpg",
        "secondaryImage": "/products/women-cropped-jacket-set-black.jpg",
        "gallery": [
          "/products/women-windbreaker.jpg",
          "/products/women-cropped-jacket-set-black.jpg",
          "/products/women-cropped-jacket-set-navy.jpg",
          "/products/women-cropped-jacket-set-olive.jpg"
        ],
        "stock": 34
      }
    ]
  },
  {
    "id": "prod_tactical_sling_011",
    "name": "Ballistic Modular Sling Pack",
    "slug": "ballistic-modular-sling-pack",
    "category": "accessories",
    "discipline": "rec",
    "gender": "unisex",
    "price": 68,
    "specsSummary": "Cordura® 1000D / YKK Aquaguard / Fidlock Strap",
    "description": "Constructed from virtually indestructible 1000D ballistic Cordura® nylon. Features dual water-resistant compartments, padded fleece phone sleeve, and magnetic quick-release strap buckle.",
    "features": [
      "German-made Fidlock magnetic V-buckle for instant one-click chest release",
      "YKK Aquaguard waterproof zippers with glove-friendly hypalon pulls",
      "Internal fleece-lined pocket protects mobile screens and optics from scratching",
      "MOLLE webbing loops on base for clipping keys, carabiners, or running lights"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "Ballistic Armor-Knit Weave"
      },
      {
        "label": "Composition",
        "value": "100% Cordura® 1000D Ballistic Nylon"
      },
      {
        "label": "Weight",
        "value": "340 GSM"
      },
      {
        "label": "Finish",
        "value": "Polyurethane Backcoating & Water-Resistant Face"
      },
      {
        "label": "Overview",
        "value": "Cordura® 1000D / YKK Aquaguard / Fidlock Strap"
      }
    ],
    "variants": [
      {
        "id": "var_bms_blk_os",
        "sku": "BMS-BLK-OS",
        "colorName": "Void Obsidian",
        "colorHex": "#0A0A0A",
        "size": "OS",
        "primaryImage": "/products/image-12-2.jpg",
        "secondaryImage": "/products/image-12-1.jpg",
        "gallery": [
          "/products/image-12-2.jpg",
          "/products/image-12-1.jpg",
          "/products/image-12-3.jpg"
        ],
        "stock": 50
      }
    ]
  },
  {
    "id": "prod_sports_bra_trio_012",
    "name": "AeroFlex High-Support Sports Bra",
    "slug": "aeroflex-high-support-sports-bra",
    "category": "tops",
    "discipline": "train",
    "gender": "women",
    "price": 48,
    "specsSummary": "AeroFlex 4-Way / Bonded Band / Medium-High Impact",
    "description": "Engineered with dual-layer AeroFlex compression and a brushed elastic underband that never digs in. Clean bonded neckline prevents friction during jump rope and sprint drills.",
    "features": [
      "Reinforced racerback posture harness distributes support evenly across trapezius",
      "Anti-chafing bonded edge seams along armholes and neckline",
      "Quick-drying capillary knit dries in under 30 minutes",
      "Molded micro-perforated breathable inserts included"
    ],
    "specs": [
      {
        "label": "Technology",
        "value": "AeroFlex Rebound Matrix"
      },
      {
        "label": "Composition",
        "value": "75% High-Tenacity Polyamide, 25% Lycra Sport"
      },
      {
        "label": "Weight",
        "value": "260 GSM"
      },
      {
        "label": "Finish",
        "value": "SweatShield+ Hydrophilic Core"
      },
      {
        "label": "Overview",
        "value": "AeroFlex 4-Way / Bonded Band / Medium-High Impact"
      }
    ],
    "variants": [
      {
        "id": "var_ahb_sge_s",
        "sku": "AHB-SGE-S",
        "colorName": "Sage Matrix",
        "colorHex": "#8A9A86",
        "size": "S",
        "primaryImage": "/products/women-sports-bra-sage.jpg",
        "secondaryImage": "/products/women-sports-bra-rose.jpg",
        "gallery": [
          "/products/women-sports-bra-sage.jpg",
          "/products/women-sports-bra-rose.jpg",
          "/products/women-sports-bra-lilac.jpg"
        ],
        "stock": 45
      },
      {
        "id": "var_ahb_ros_s",
        "sku": "AHB-ROS-S",
        "colorName": "Rose Dust",
        "colorHex": "#B28A8A",
        "size": "S",
        "primaryImage": "/products/women-sports-bra-rose.jpg",
        "secondaryImage": "/products/women-sports-bra-lilac.jpg",
        "gallery": [
          "/products/women-sports-bra-rose.jpg",
          "/products/women-sports-bra-lilac.jpg",
          "/products/women-sports-bra-sage.jpg"
        ],
        "stock": 35
      }
    ]
  }
];
