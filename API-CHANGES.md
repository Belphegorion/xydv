# XYDV API Changes Log

This document tracks all backend route, request, response, and schema changes across the API, along with their consumers across the storefront and admin panel.

---

## Route & Schema Change Register

| Route | Method | Change Type | Old Request / Response | New Request / Response | Consumers Affected | Finding ID |
|---|---|---|---|---|---|---|
| `/api/coupons/validate` | POST | Fix / Calculation | In `coupon.service.ts:139`, `itemTotalPaise` multiplied `item.price * 100`, inflating 100-fold if input was already in paise | Normalized input price handling: if `price > 1000` (paise), use directly; else multiply by 100 to paise | `CartDrawer.tsx` | `BE-005` |
| `/api/orders/razorpay/create-order` | POST | Hardening | Returned mixed float rupees (`subtotal`, `tax`, `total`) alongside `amount: integer paise` | Returns exact integer paise internal totals (`subtotalPaise`, `taxPaise`, `totalPaise`) while maintaining rupee backwards-compatibility | `CartDrawer.tsx`, checkout | `BE-004` |
| `/api/admin/orders/:id/refund` | POST | Fix / Validation | `order.total` compared directly to `amount` without checking whether units are in rupees or paise | Normalized comparison: accepts both rupee amounts (e.g. 129.99) and paise (e.g. 12999) based on order total scale | `AdminOrdersPage.tsx` | `BE-006` |

---
