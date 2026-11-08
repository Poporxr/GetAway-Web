# Digital Signing Out Platform

Product Requirements Document (PRD)  |  MVP v1.0  |  5 November 2026

Status: Working specification. Confirmed business rules are distinguished from proposed implementation details.

## 1. Executive summary

A web platform for students to create a free virtual signing-out shirt and share a public link. Friends and classmates gift the shirt owner at least ₦2,000 to unlock signing. Paid signatures appear on an interactive, rotatable 3D shirt. The platform retains 10% of successful payments. Shirt owners can request withdrawal after verification of their student status.

## 2. Goals and success criteria

- Enable shirt owners to register, complete onboarding and share a shirt link in minutes.

- Allow contributors to pay and sign without creating accounts.

- Display signatures accurately on a rotatable 3D shirt across sessions and devices.

- Maintain accurate, auditable transaction and withdrawal records.

- Provide a secure, reviewable student-verification process before withdrawal.

Proposed launch KPIs: onboarding completion, shared links, checkout conversion, completed signatures, payment failure rate, withdrawal completion time, rendering performance and support incidents. Targets to be defined after beta testing.

## 3. Roles and permissions

| Role | Capabilities |
| --- | --- |
| Shirt owner | Register, onboard, create/view up to two shirts, share links, view gifts and signatures, verify student status, request withdrawals. |
| Contributor | Open public shirt link, choose gift and eligible signature size, pay, sign once per verified purchase. No account required. |
| Administrator | Manage school records, verification reviews, fraud flags, payment reconciliation, payout approvals and platform configuration. |

## 4. Confirmed business rules

| Area | Requirement |
| --- | --- |
| Account | Only shirt owners create accounts; contributors do not. |
| Shirt limit | At most two shirts per owner: one short-sleeve and one long-sleeve. |
| Onboarding | After signup: school and department → bank account → dashboard. |
| Commission | 10% of each successful payment, transparently disclosed during onboarding; owner must acknowledge before continuing. |
| Minimum gift | ₦2,000; normal 1× signature included. |
| Enlargement eligibility | Only a gift amount of at least ₦5,000 (excluding size surcharge) unlocks larger signatures. |
| Size fees | 2×: +₦500; 3×: +₦700; 4×: +₦1,000. 1×: no extra charge. |
| Payment sequence | Contributor pays before receiving signing permission. |
| 3D shirt | Owner can rotate/spin shirt and see newly saved signatures. |
| Withdrawals | Owner must verify student status at declared school using student ID or accepted identity evidence before withdrawing. |

Commission calculation assumption for MVP: 10% applies to the full successful payment (gift plus enlargement fee). Gateway fees and tax treatment must be defined and disclosed before production; example earnings exclude these charges.

## 5. User journeys

### 5.1 Owner signup and onboarding

- Create account and authenticate.

- Select or enter school and department; validate and allow corrections.

- Provide bank account details; validate recipient/account name through payment provider where available.

- Display prominent 10% commission disclosure and require explicit acceptance, storing policy version and timestamp.

- Land on dashboard with an interactive 3D shirt, link sharing controls and earnings overview.

### 5.2 Public signing and gifting

- Open unique shirt URL; view shirt owner context and 3D shirt.

- Enter gift amount (minimum ₦2,000) and choose signature size. Show only 1× if gift < ₦5,000.

- Calculate total server-side; initiate checkout and verify payment through secure webhook/server verification.

- Issue a short-lived, single-use signing authorization associated with the paid transaction.

- Contributor types or draws signature, chooses allowed placement on a shirt surface and submits.

- Server validates entitlement, bounds and collision rules; persists signature and updates the shirt.

### 5.3 Withdrawal and verification

- Owner views available, pending and withdrawn funds, plus itemized deductions.

- On first withdrawal, request student verification with student ID or another accepted document.

- Store evidence privately; administrator reviews and approves/rejects with reason and appeal/resubmission path.

- Only verified owners with sufficient cleared balance can request payouts to validated bank accounts.

- Backend creates idempotent payout request; reconcile final provider status before marking paid.

## 6. Functional requirements

### 6.1 Authentication, profiles and schools

- Email/password or supported social sign-in; email verification and password recovery.

- School and department fields are required; support curated directory plus moderated “other” entries.

- Owners can correct school/department subject to verification safeguards.

- Protect owner-only routes; contributor flow remains public.

### 6.2 Shirts and 3D rendering

- Each owner may create at most two free virtual shirts, one of each fixed design below.

- Short-sleeve design: plain pure-white XL round-neck (crew-neck) T-shirt, oversized/relaxed fit, loose through the torso and sleeves; never tight, fitted or slim-fit.

- Long-sleeve design: plain pure-white long-sleeve button-down shirt with a traditional collar, full front button placket and loose/relaxed fit; never tight, fitted or slim-fit.

- Both shirts must be unbranded and free of preprinted graphics, patterns or logos; only contributor signatures are added to the virtual garment.

- Provide distinct, accurately proportioned 3D GLB/GLTF assets for both fixed styles; support 360-degree rotation, front/back inspection and signature rendering aligned to each garment’s UV mapping.

- Contributors cannot customize garment type, color or fit. Signature placement must respect garment seams, sleeves, collar, buttons, fabric boundaries and available signing space.

- Unique unguessable public share URL per shirt.

- Rotate, zoom within limits, view front/back and mobile touch gestures.

- Persist signatures as structured records with position, rotation, dimensions, surface, payment reference and immutable size entitlement.

- Use properly UV-mapped GLB/GLTF models; render signatures as mapped textures or decals.

- Support signed area boundaries, collision checks, and a clear “shirt full” state.

### 6.3 Pricing and checkout

| Gift | Allowed sizes | Surcharge |
| --- | --- | --- |
| ₦2,000–₦4,999 | 1× only | ₦0 |
| ₦5,000+ | 1× / 2× / 3× / 4× | ₦0 / ₦500 / ₦700 / ₦1,000 |

Example: ₦5,000 gift + 4× enlargement (₦1,000) = ₦6,000 payment; platform fee ₦600; owner share ₦5,400 before gateway fees/taxes. Signature size is a relative design scale, not necessarily 2×/3×/4× surface area; final dimensions and available space need design validation.

- Amounts and eligibility calculated and verified on backend, in integer kobo.

- Display gift, surcharge, total and applicable fee disclosure before checkout.

- Verify gateway webhook authenticity, payment status, currency, amount and reference; deduplicate events.

- Prevent replay and duplicate signatures; handle successful payments with interrupted signing via secure resume link/token.

- Specify refunds, chargebacks and unclaimed paid signatures before launch.

### 6.4 Dashboard and ledger

- 3D shirt view with updated signatures; polling initially, real-time events later if necessary.

- Gift count, signatures, gross payments, platform fees, gateway fees, pending/available balance and withdrawals.

- Immutable transaction ledger and reconciliation; never derive payouts from unverified frontend state.

- Display verification status, payout status and failure reasons.

### 6.5 Admin

- Review student verification documents with restricted access and audit logs.

- Manage fraud flags, disputed payments, failed payouts and support cases.

- Configure supported schools, signature size dimensions and other non-contractual settings.

- View operational metrics without exposing private student documents broadly.

## 7. UX and screens

| Audience | Screens |
| --- | --- |
| Owner | Landing, signup/login, onboarding: school/department, onboarding: bank + commission acknowledgement, dashboard, shirt detail, gifts/history, verification, withdrawals, settings. |
| Contributor | Public shirt, gift/size selection, payment checkout, payment return/resume, signature editor, signing confirmation. |
| Admin | Admin login, verification queue/detail, payments, withdrawals, disputes and audit log. |

Design direction: mobile-first, celebratory but uncluttered; accessible forms, transparent totals, loading/error/empty states, and 3D performance fallback for lower-end devices.

## 8. Proposed technical architecture

| Layer | Recommended technology |
| --- | --- |
| Frontend | Vue 3, TypeScript, Vite, Vue Router, Tailwind CSS, shadcn-vue + Reka UI |
| State and forms | Pinia, TanStack Vue Query, VeeValidate + Zod |
| 3D and signing | Three.js + TresJS + @tresjs/cientos; Konva + vue-konva for flat 2D signing editor |
| Backend | Node.js, Express, TypeScript, Zod validation |
| Database | PostgreSQL + Prisma |
| Authentication | Better Auth or equivalent well-maintained server-side auth |
| Payments | Paystack, subject to approval of collection/transfer business model |
| Object storage | Private Cloudflare R2 or compatible object storage |
| Background work | Start simple; add Redis + BullMQ for retries/reconciliation when needed |
| Deployment | Frontend and backend deployed separately; managed PostgreSQL and HTTPS |

Suggested structure: separate frontend and backend repositories; backend modular monolith with auth, onboarding, schools, shirts, signatures, payments, ledger, verification, withdrawals and admin modules.

## 9. Data model (initial)

| Entity | Key fields |
| --- | --- |
| User | id, email, auth identity, createdAt |
| OwnerProfile | userId, schoolId, departmentId, commissionAcceptedAt, policyVersion |
| BankAccount | id, ownerId, bankCode, accountLast4, providerRecipientId, verifiedName |
| Shirt | id, ownerId, type, slug, modelVersion, status |
| Payment | id, shirtId, amountGiftKobo, surchargeKobo, totalKobo, platformFeeKobo, gatewayFeeKobo, status, providerRef |
| SigningEntitlement | id, paymentId, size, tokenHash, expiresAt, usedAt |
| Signature | id, shirtId, paymentId, assetKey, surface, x, y, scale, rotation, status |
| LedgerEntry | id, ownerId, paymentId/withdrawalId, type, amountKobo, createdAt |
| StudentVerification | id, ownerId, schoolId, evidenceKey, status, reviewedBy, reviewedAt |
| Withdrawal | id, ownerId, amountKobo, bankAccountId, status, providerRef, idempotencyKey |

Enforce database uniqueness for provider payment references, signing entitlement per paid transaction, and payout idempotency keys; define allowed shirt type per owner via a unique constraint.

## 10. API outline (proposed)

- POST /auth/*; GET/PATCH /me; POST /onboarding/school; POST /onboarding/bank; POST /onboarding/commission-acceptance

- GET/POST /shirts; GET /shirts/:id; GET /public/shirts/:slug; GET /public/shirts/:slug/signatures

- POST /public/shirts/:slug/checkout; POST /webhooks/paystack; GET /payments/:reference/status

- POST /signing/entitlements/:id/signatures; GET /dashboard/summary; GET /wallet/transactions

- POST /verification/student; GET /verification/status; POST /withdrawals; GET /withdrawals

- GET/PATCH /admin/verifications/:id; GET /admin/payments; GET /admin/withdrawals

## 11. Security, compliance and reliability

- Never expose payment secret keys; verify Paystack webhook signatures and transaction amounts server-side.

- Use role-based authorization, rate limits, CSRF protections where relevant, secure cookies, input validation and upload scanning.

- Store student IDs in private object storage with short-lived signed access, encryption, review audit trail and documented retention/deletion policy.

- Apply Nigeria Data Protection Act requirements and publish clear privacy/terms and consent notices; obtain local legal review.

- Confirm payment provider supports third-party collections, fee splits, custody/settlement and transfers before launch; do not assume approval.

- Use ledger transactions and row-level locking or equivalent to prevent duplicate payouts and negative balances.

- Define payment failure, refund, chargeback, dispute, withdrawal failure and verification rejection workflows.

- Optimize 3D model sizes, lazy-load viewer, support reduced motion and fallback 2D preview.

## 12. Non-functional requirements

- Responsive mobile-first interface; keyboard-accessible core controls and readable contrast.

- Graceful performance on midrange Android devices and unstable networks.

- Server-side observability: structured logs, payment audit events, alerts and error monitoring.

- Automated tests for pricing, eligibility, commission, payment idempotency, signature bounds and withdrawals.

- Backups, restore drills and environment-separated credentials.

## 13. MVP delivery phases

| Phase | Deliverable |
| --- | --- |
| 1 | Frontend/backend setup, auth, database, school/department and bank onboarding, commission consent. |
| 2 | 3D shirt models and rotatable viewer; public link and shirt management. |
| 3 | 2D signature editor, UV mapping, placement persistence, collision/boundary handling. |
| 4 | Paystack checkout, webhook verification, size eligibility, signing entitlement, ledger. |
| 5 | Dashboard, earnings and signatures; student verification and admin review. |
| 6 | Withdrawals, reconciliation, security testing, mobile optimization, beta launch. |

## 14. Out of scope for initial MVP

- Native iOS/Android apps, physical shirt printing or delivery.

- Social feeds, chat, subscriptions and creator marketplaces.

- Complex 3D avatar customization or AI-generated signatures.

- Automated school verification integrations unless an accessible official source exists.

## 15. Open decisions before implementation

- Exact signature dimensions: whether 2×/3×/4× refers to width, linear scale or occupied area; maximum signable shirt surface.

- Can contributors sign both front and back? Can owners move or remove signatures, and under what policy?

- Who pays gateway fees, and how are fees, refunds and chargebacks apportioned?

- How are bank accounts verified, and what identity/KYC requirements does the payout provider impose?

- When do funds become withdrawable, and are there payout thresholds or holds?

- Can an owner change school after onboarding, and what verification documents are acceptable?

- What happens when a shirt is full or payment succeeds but signature submission fails?

- Final product name, brand palette, privacy policy, terms and dispute policy.
