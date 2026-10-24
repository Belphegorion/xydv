# Research Report: E-Commerce Discount & Reference Pricing Architecture (XYDV)

**Document Reference**: `docs/research-discounts.md`  
**Classification**: Legal, Regulatory, UX & Architectural Engineering Directive  
**Date**: October 2026  
**Applicability**: XYDV Customer Storefront (`apps/web`), Admin Panel (`apps/web/src/app/admin`), Backend API (`apps/api`), and Data Models (`packages/types`)

---

## 1. Executive Summary for the Store Owner

Discounts drive conversion and customer acquisition, but improper price displays can expose an e-commerce business in India to heavy regulatory fines, dark-pattern crackdowns, and margin erosion.

When a customer sees a price struck through (e.g. *~~₹999~~ ₹699, 30% off*), both the customer and Indian regulators ask one fundamental question: **What was the original price, and is the discount real?**

In India:
1. Under the **Legal Metrology (Packaged Commodities) Rules, 2011**, every packaged product sold online must explicitly declare the statutory **Maximum Retail Price (MRP)** inclusive of all taxes. You can never sell a product for more than the MRP. The MRP displayed online must strictly match what is printed on the physical garment tag when the order arrives at the customer's door.
2. Under the **Central Consumer Protection Authority (CCPA) 2023 Guidelines on Dark Patterns** and **2022 Misleading Advertisement Guidelines**, inflating a "was" price right before a sale or showing a permanent fake discount is strictly classified as an unfair and deceptive trade practice. Furthermore, showing countdown timers or "Only 2 left" warnings that reset or do not match real inventory is classified as illegal **False Urgency**.
3. Under the **Central Goods and Services Tax (CGST) Act, 2017 (Section 15(3)(a))**, pre-supply discounts shown on the product page and checkout must be recorded on the tax invoice. GST (18%) is levied only on the net discounted price. If an item is returned or refunded, the refund and credit note must strictly equal the discounted price paid, not the original price.

This research document outlines the legal requirements, engineering safeguards, data models, and user experience patterns required to build an Amazon/Flipkart-grade discount system for XYDV that is legally airtight, margin-protected, and physically fast.

---

## 2. Researched Practices & Recommendations for XYDV

### 2.1 Recommended for XYDV (Core Architecture)
1. **Explicit Dual-Field Price Model**:
   - `mrpPaise`: Statutory Maximum Retail Price (MRP) printed on physical garment tags and packaging (integer paise).
   - `sellingPricePaise`: Regular everyday catalog selling price before active promotional discounts (integer paise).
   - `effectivePricePaise`: Authoritative calculated price the customer actually pays today, evaluated against active scheduled discounts (integer paise).
   - Constraint: `effectivePricePaise <= sellingPricePaise <= mrpPaise`.
2. **Accessible Visual Hierarchy**:
   - Discounted price displayed as the primary visual hero in bold tabular numerals.
   - Original price enclosed in `<del>` or `<s>` with an accessible screen-reader announcement: `<span className="sr-only">Original price: </span><del>₹999</del>`.
   - Prominent savings pill showing percentage off (e.g. `30% OFF`) and/or rupee savings (e.g. `Save ₹300`).
3. **Discount Scope & Target Types**:
   - `product`: Explicit list of product IDs / SKUs.
   - `category`: Category slug/ID (e.g. `'tops'`, `'bottoms'`).
   - `catalog`: Store-wide global promotion.
4. **Engineered Safeguards (Margin & Floor Protection)**:
   - **Minimum Price Floor (`priceFloorPaise`)**: No discount may ever reduce a product's price below a defined absolute floor (e.g., ₹299 / 29,900 paise) or a minimum percentage of cost.
   - **Per-Item Cap (`maxDiscountCapPaise`)**: For fixed-amount discounts applied in bulk to categories or the catalog, a cap ensures an item priced at ₹499 cannot have a ₹500 discount applied.
   - **Mandatory End Dates on Bulk Discounts**: Catalog-wide and category-wide discounts must mandate an end date (maximum 30 days) to prevent perpetual sales and accidental permanent discounts.
5. **Server-Side Authoritative Pricing Engine**:
   - Single pure TypeScript function: `resolvePrice(product, variant, applicableDiscounts, now)`.
   - The client never calculates or sends payable prices. The server re-evaluates prices at cart add, checkout initiation, Razorpay order creation, and payment verification.

### 2.2 Explicitly NOT Recommended or Deferred
1. **Deferred: Complex Multi-Tier Stacking**:
   - Do NOT allow stacking multiple promotional discounts together on the same line item (e.g. 20% category discount + 15% product discount). Stacking leads to cascading rounding errors, margin wipeouts, and customer confusion.
   - Rule: **Most Specific Wins** (Product Discount > Category Discount > Catalog Discount) with an optional admin override to **Best Deal for Customer Wins** (Highest Discount).
2. **Prohibited: Client-Side Price Calculation**:
   - The browser must never calculate subtotals, tax, or discounts for payment gateways. Doing so creates IDOR vulnerabilities and payment manipulation exploits.
3. **Prohibited: Artificial Struck-Through Reference Prices**:
   - Never allow an admin to invent a fictitious struck-through price (e.g. listing an item as "~~₹5,000~~ ₹999") when the product's actual MRP or historical price was never ₹5,000.
4. **Prohibited: Looping / Fake Countdown Urgency Timers**:
   - Timers that reset on page reload or do not reflect an actual database `endDate` are strictly banned under CCPA 2023 Dark Patterns regulations.

---

## 3. Compliance & Legal Framework (India, EU, US)

### 3.1 Primary Legal Authorities Cited

| Statute / Regulation | Jurisdiction | Key Requirement / Section | Impact on XYDV Implementation |
| :--- | :--- | :--- | :--- |
| **Legal Metrology (Packaged Commodities) Rules, 2011** | India | **Rule 6(10)**: Mandatory digital declarations.<br>**Rule 18(2)**: No sale above MRP.<br>**Rule 2(m)**: MRP inclusive of all taxes. | The struck-through price online must never exceed physical package MRP. MRP must be stored and declared as tax-inclusive. |
| **Legal Metrology Act, 2009** | India | **Section 36(1)**: Penalties for selling above declared price (fines up to ₹50,000 / imprisonment for repeat offenses). | Hard database validation: `price <= mrp` enforced on every product save. |
| **Consumer Protection Act, 2019** | India | **Section 2(47)**: Unfair trade practices (misleading representation of price). | Reference prices must reflect bona fide former selling prices or genuine statutory MRP. |
| **CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023** | India | **Section 5 & Annexure (Pattern #1: False Urgency, Pattern #8: Drip Pricing)**. | Countdown timers only allowed when tied to a real, fixed discount `endDate`. Displayed price must be all-inclusive. |
| **Central Goods & Services Tax (CGST) Act, 2017** | India | **Section 15(3)(a)**: Pre-supply discounts recorded in tax invoice excluded from taxable value.<br>**Section 34**: Credit notes on returns. | Taxable value = discounted price. Invoices must show original price, discount, and net taxable amount. Refunds match discounted amount. |
| **EU Directive 98/6/EC (as amended by Omnibus Directive 2019/2161)** | European Union | **Article 6a**: Any announcement of price reduction must indicate the lowest price applied during a period of not less than 30 days prior. | If XYDV expands to EU customers, struck-through price must reflect the 30-day lowest selling price, not just list MRP. |
| **FTC Guides Against Deceptive Pricing (16 CFR Part 233)** | United States | **16 CFR § 233.1**: Former price comparisons valid only if former price was offered openly for a reasonably substantial period of time. | Prevents artificial price inflation prior to flash sales. |

### 3.2 XYDV "Allowed, Risky, Prohibited" Matrix

| Category | Allowed (Compliant & Safe) | Risky (Requires Guardrails / Legal Review) | Prohibited (Illegal / Dark Pattern) |
| :--- | :--- | :--- | :--- |
| **Reference Price** | Strikethrough of verified statutory MRP printed on product tag.<br>Strikethrough of regular selling price charged for >= 30 days. | Strikethrough of regular price when regular price was only active for 2-3 days before the sale. | Fictitious "market value" or inflated price invented solely to display a fake "70% off". |
| **Selling Price** | Any discounted price equal to or below MRP that respects the minimum margin floor. | Selling at a loss (predatory pricing) if market dominance applies. | Selling at any amount higher than statutory MRP. |
| **Urgency & Badges** | "Sale ends in X hours" where timer strictly matches `endDate` from database.<br>"Limited Time Deal" badge during an active scheduled sale. | "Only 3 left at this price" unless backed by live, real-time database stock counts. | Evergreen countdown timers that reset to 24:00:00 every time the user refreshes the page. |
| **Discount Scope** | Single product discount.<br>Category discount with per-item floor & cap.<br>Storewide discount with end date. | Catalog-wide flat amount discount (e.g. "₹500 off everything") without a minimum price floor. | Uncapped flat discounts that reduce item prices to ₹0 or negative values. |
| **Coupons & Stacking** | Coupon applied to non-discounted items.<br>Coupon applied on top of discount with a combined margin cap (e.g. max total 50% off). | Unrestricted coupon stacking on deeply discounted clearance items. | Misleading "Up to 80% off" when only 1 single obscure SKU in the store is discounted at 80%. |
| **GST & Invoicing** | 18% GST calculated on net taxable value after discount.<br>Line item displays original price, discount, and net. | Omitting the discount breakdown on B2B GST tax invoices. | Charging GST on the pre-discount MRP and pocketing the difference. |

*Disclaimer: Items marked "Risky" or changes to statutory tax invoice formatting must be formally reviewed by XYDV's chartered accountant and legal counsel.*

---

## 4. Architectural Comparison Tables & Trade-off Analysis

### 4.1 Struck-Through Price Definition: MRP vs. Previous Selling Price

| Approach | Description | Pros | Cons / Legal Risks | Recommendation for XYDV |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: MRP as Struck-Through Price** | Struck-through price is strictly the manufacturer's statutory Maximum Retail Price (`mrpPaise`). | 100% compliant with Legal Metrology Rule 6(10). Standard across Amazon India & Flipkart. Never violates 30-day prior price rule because MRP is fixed on packaging. | If regular selling price is already below MRP, customer sees a "permanent discount" against MRP rather than a temporary sale. | **Recommended Default**: Display MRP struck through with label `"M.R.P.: ₹1,499"`, alongside current price. |
| **Option B: Recent Selling Price ("Was" Price)** | Struck-through price is the actual price charged during the preceding 30 days (`sellingPricePaise`). | Reflects genuine immediate savings of the promotional event. High consumer trust. Meets EU Omnibus Directive. | Requires historical price logging. If price fluctuates frequently, calculating the lowest 30-day price requires a dedicated price history audit table. | **Recommended for Flash Sales**: When a product with regular selling price of ₹999 drops to ₹699, display: `"M.R.P.: ₹1,499 (53% off) / Was: ₹999 (Save ₹300 today)"`. |
| **Option C: Admin Custom Reference Price** | Admin types any arbitrary number into an "Original Price" field. | High flexibility for shop manager. | **EXTREME LEGAL RISK**: Violates Consumer Protection Act and CCPA Dark Patterns. High probability of accidental fake discounts. | **REJECTED**: Never allow arbitrary untracked reference prices. |

### 4.2 Conflict Resolution: Which Discount Wins?

When an item matches multiple discounts (e.g., Product has ₹200 off, Category has 20% off, Catalog has 10% off):

| Rule | Description | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Most Specific Wins** (Product > Category > Catalog) | Specific overrides general. If a product discount exists, it takes precedence. If not, category discount applies. If not, catalog discount applies. | Highly predictable for admin. Easy to reason about margins. Standard in ERP and enterprise retail systems. | If a broad catalog sale is 30% off, but a product had a stale ₹50 off rule, the customer gets the worse deal unless overridden. | **RECOMMENDED PRIMARY RULE**: Most specific rule wins. Admin UI clearly indicates which rule is active for each product. |
| **2. Best Price for Customer Wins** (Max Discount) | The system evaluates all matching discounts and automatically selects the one that provides the lowest payable price. | Maximum conversion; customers always get the biggest saving; avoids customer dissatisfaction. | Can cause unexpected margin dips if an admin forgets an active category promotion when launching a catalog sale. | **Recommended Alternate**: Admin toggle in settings: `PRIORITIZE_BEST_CUSTOMER_DEAL` (default: false). |
| **3. Stack All Discounts** | Discounts compound (e.g. 20% off, then another 10% off). | Exciting promotional marketing. | Margin disaster. High risk of price collapsing to near zero. Complex tax allocation. | **REJECTED**: Not permitted in Version 1. |

### 4.3 Price Computation Strategy: Read-Time vs. Precomputed vs. Hybrid

| Dimension | Strategy A: Pure Read-Time | Strategy B: Pure Precomputed | Strategy C: Hybrid Event-Driven (Recommended) |
| :--- | :--- | :--- | :--- |
| **Mechanism** | Query active discounts in memory on every request; evaluate `resolvePrice()`. | Background job writes `effectivePrice` to MongoDB `Product` documents periodically. | Store `effectivePricePaise`, `activeDiscountId`, and `discountPercent` on `Product`. Recompute on discount lifecycle events and scheduled cron. |
| **Catalog Sorting & Filtering** | **BROKEN / SLOW**: Cannot sort or filter 1,000 products by price in MongoDB without fetching all into Node memory. | **FAST**: MongoDB natively indexes `effectivePricePaise: 1`. Query sorts in < 5ms. | **FAST**: MongoDB natively indexes `effectivePricePaise: 1`. Query sorts in < 5ms. |
| **Cache & Staleness** | 0s staleness, but heavy CPU overhead on listing pages. | High staleness risk between cron runs (up to 1 hour). | Near-instant: Batched worker updates affected products immediately on discount create/edit/pause. |
| **Checkout Authoritativeness** | Authoritative. | Vulnerable to stale prices during checkout. | **Guaranteed Authoritative**: Cart and checkout always invoke `resolvePrice()` on the fly against live discount rules. |
| **Verdict** | Fails catalog scale. | Fails checkout accuracy. | **RECOMMENDED**: Hybrid approach balances instant catalog indexing with 100% authoritative checkout validation. |

### 4.4 Discount Types Supported in Version 1

| Discount Type | Formula | Use Cases | Safeguards Required |
| :--- | :--- | :--- | :--- |
| **1. Percentage Off (`percentage`)** | `effective = price - round(price * value / 100)` | Standard seasonal sales (e.g. 10%, 20%, 30%, 50% off). | Max percentage cap (cannot exceed 70%). Integer paise rounding. |
| **2. Fixed Amount Off (`fixed_amount`)** | `effective = price - valuePaise` | Flat savings (e.g. "₹300 off on Hoodies"). | **CRITICAL**: Must enforce `priceFloorPaise` and `maxDiscountCapPaise` so cheap accessories (e.g. ₹199 socks) do not drop to ₹0. |
| **3. Set Final Price (`set_price`)** | `effective = valuePaise` | Flash drops (e.g. "Any Tee for ₹699"). | Must be strictly less than current selling price. Applies primarily to single products or variants. |

---

## 5. Interaction with Coupons & Preset Discount Tiers

XYDV recently deployed a preset-tier coupon system (10%, 20%, 50% with margin caps). When Feature 1 is active, how do discounts and coupons interact?

### 5.1 Stacking Policy
1. **Default Rule (Exclusive)**: Coupons do NOT apply to products already marked down under an active promotional discount, UNLESS the admin explicitly toggles `allowCouponStacking: true` on that specific discount.
2. **If Stacking is Permitted**:
   - The coupon percentage or amount is calculated against the **already discounted price** (`effectivePricePaise`), not the original MRP.
   - **Hard Margin Protection**: The cumulative discount from both the promotion and the coupon CANNOT exceed **50% of the product's regular selling price** or breach the store's minimum price floor (₹299).
   - Example: Product MRP ₹1,999, regular selling price ₹1,499. Active discount: 20% off -> ₹1,199. Customer applies 20% tier coupon -> 20% of ₹1,199 = ₹240. Final payable price = ₹959 (Total saving ₹540 on regular price, or 36% total, safely within the 50% margin cap).

---

## 6. Primary Source References

1. **Ministry of Consumer Affairs, Food & Public Distribution (Legal Metrology Division)**:
   - *Legal Metrology (Packaged Commodities) Rules, 2011* (G.S.R. 202(E)), as amended by G.S.R. 592(E) (E-Commerce Declarations) and G.S.R. 779(E).
   - [https://consumeraffairs.nic.in/acts-and-rules/legal-metrology](https://consumeraffairs.nic.in/acts-and-rules/legal-metrology) (Accessed Oct 2026).
2. **Central Consumer Protection Authority (CCPA)**:
   - *Guidelines for Prevention and Regulation of Dark Patterns, 2023* (Notified Nov 30, 2023, F. No. CCPA/1-1/2023).
   - *Guidelines for Prevention of Misleading Advertisements and Endorsements for Misleading Advertisements, 2022*.
   - [https://pib.gov.in/PressReleasePage.aspx?PRID=1981156](https://pib.gov.in/PressReleasePage.aspx?PRID=1981156) (Accessed Oct 2026).
3. **Goods and Services Tax Council (CBIC, Department of Revenue, Ministry of Finance)**:
   - *Central Goods and Services Tax Act, 2017 (Act No. 12 of 2017)*, Section 15 ("Value of Taxable Supply") and Section 34 ("Credit and Debit Notes").
   - *Circular No. 92/11/2019-GST* (Clarification on sales promotion schemes, discounts, and post-supply incentives).
   - [https://cbic-gst.gov.in](https://cbic-gst.gov.in) (Accessed Oct 2026).
4. **European Commission**:
   - *Directive (EU) 2019/2161 (Omnibus Directive)* amending Council Directive 98/6/EC on consumer protection in the indication of the prices of products.
   - *Commission Notice — Guidance on the interpretation and application of Article 6a of Directive 98/6/EC* (2021/C 526/02).
   - [https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1229(01)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1229(01)) (Accessed Oct 2026).
5. **United States Federal Trade Commission (FTC)**:
   - *FTC Guides Against Deceptive Pricing*, 16 CFR Part 233.
   - [https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233) (Accessed Oct 2026).

---

## 7. Open Questions for Stakeholder Approval (Discounts)

Before proceeding to Phase 2 Technical Design, please review and approve the following 10 architectural decisions:

1. **Struck-Through Price Definition**: Do you approve using the physical garment **MRP** (`mrpPaise`) as the statutory struck-through reference price (standard Amazon/Flipkart model), while logging previous selling prices for flash-sale badges?
2. **Supported Discount Types in Version 1**: Do you confirm version 1 should support **Fixed Amount Off (₹)**, **Percentage Off (%)**, and **Set Final Price (₹)**?
3. **Price Floor & Caps**: Do you approve a global safety floor of **₹299 (29,900 paise)** and a maximum discount cap of **70%** to prevent accidental misconfigurations on cheap items?
4. **Conflict Resolution Rule**: Do you approve **Most Specific Wins** (`Product > Category > Catalog`) as the default rule, with an admin toggle for `Best Customer Deal`?
5. **Coupon Interaction**: Do you approve that active promotional discounts **exclude coupons by default**, unless the admin explicitly checks "Allow Coupon Stacking" with a cumulative 50% cap?
6. **Mandatory Scheduling for Catalog Sales**: Do you agree that storewide catalog sales must require an explicit **End Date** (maximum 30 days) to prevent forgotten permanent sales?
7. **International Reference Pricing**: Does XYDV plan to sell directly to the European Union or United Kingdom in this release (which would mandate activating the 30-day lowest price rule on the storefront)?
8. **Badges & Urgency**: Do you approve displaying clean tactical badges (`"LIMITED DROP"`, `"SALE"`, `"SPECIAL PRICING"`) and strictly prohibiting unanchored countdown timers?
9. **Variant Pricing**: When variants within a single product have different prices, listing cards will show `"From ₹XXX"`. On the PDP, selecting a size/colorway will dynamically update the exact price and savings. Do you approve?
10. **Excluded Products**: Should specific limited-edition collaboration items or gift cards be permanently marked `isDiscountExcluded: true` in the product model?
