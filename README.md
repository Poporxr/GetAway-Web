# SignOut — Digital Signing-Out Platform (prototype)

A working user-end prototype of the "Digital Signing Out Platform" (PRD in
[`docs/PRD.md`](docs/PRD.md)). Graduating students create a virtual signing-out
shirt, share one public link, and friends/family **pay a gift first, then sign
the 3D shirt** from anywhere. Built with Next.js 16 + React 19 + Tailwind 3 and
plain three.js. Working title "SignOut" is a placeholder brand.

## Run it

```bash
npm install
npm run build
npm run start        # production server on http://localhost:3000
# or: npm run dev    # development server
```

**Demo owner login:** `demo@signout.ng` / `demo1234`
(Adaeze Nwosu, University of Lagos — her shirts already carry gifts and
signatures so every page looks alive. Her tee:
`/s/adaeze-signs-out-k7x2`, long-sleeve: `/s/adaeze-longsleeve-m3p9`.)

**Test payment:** on the mock checkout, card `4084 0840 8408 4081` with any
future expiry/CVV succeeds; any other card is declined (there is also a
"simulate decline" button). A banner marks test mode on every page.

Data lives in `data/store.json` (created and seeded on first run). Delete the
file and restart to reset to the pristine seed state.

## What is real vs mocked

**Real (full business logic, server-side):**
- Pricing in integer kobo via API routes: minimum gift ₦2,000 (includes 1×
  signature); gifts ≥ ₦5,000 unlock 2× (+₦500), 3× (+₦700), 4× (+₦1,000).
- 10% platform commission on the full payment, disclosed to contributors
  before paying and explicitly acknowledged by owners during onboarding
  (acceptance + policy version + timestamp stored).
- Pay-before-sign: a settled payment issues a single-use signing entitlement
  (24h validity) tied to the transaction; signing consumes it; the token URL
  is the resume link for the paid-but-interrupted case.
- Signature editor: draw on a canvas pad (strokes stored as vectors) or type
  in a handwriting font (Caveat), 7 pen colours, front/back choice, drag
  placement on a flat template with rotation, bounds + overlap collision
  checks enforced on both client and server.
- Signatures composite into the garment's 2048×2048 texture canvas at the
  mapped UV position and render on the 3D model; they persist in the store
  and render identically on every reload/device because they are stored as
  structured data (surface, x, y, scale, rotation, strokes/text), never raster.
- Owner dashboard: live 3D shirts, share links with copy button, earnings
  (gifts, gross, fees, available/pending), gift history, per-shirt detail.
- Auth: email + password (scrypt-hashed) with cookie sessions.
- Withdrawals: balance derived from the ledger, idempotency keys, gated on
  student verification.
- Onboarding order enforced server-side: school/department → bank account →
  commission acknowledgement. One shirt per design per owner (max two shirts),
  unique unguessable slug per shirt.

**Mocked / simulated (by design, per prototype scope):**
- Payments: a mock checkout page styled like Paystack. Settlement flows
  through `settlePayment()` in `lib/payments.ts` — the exact seam where real
  Paystack verification/webhook handling plugs in later (verified amount in,
  entitlement + ledger entries out). Swapping in real Paystack only touches
  the checkout creation and confirm steps.
- Student verification: owners submit ID details + an evidence file *name*
  (the file itself is not uploaded/stored). Admin review is out of scope, so
  the status stays "pending review" (simulated queue) and the withdrawal gate
  therefore stays locked in this build — the gate logic itself is real and
  API-tested (403 while unverified).
- Withdrawal payouts stay "pending" (no payout processor, no admin console).

## 3D models — sourcing, licences, and honest gaps

Both models are garment-only GLBs downloaded at build time from Poly Pizza:

| Shirt | Model | Author | Licence | Source |
|---|---|---|---|---|
| Classic tee | "T-shirt" | Poly by Google | CC-BY 3.0 | https://poly.pizza/m/bdOMzzh-fSl |
| Long-sleeve | "T Shirt" | Nour | CC-BY 3.0 | https://poly.pizza/m/oZOt671DyI |

Attribution is also shown in the site footer, as CC-BY requires.

Adjustments made (script: `scripts/generate-uvs.mjs`, mapping in
`lib/uv-regions.json`): neither model shipped with a usable single-texture UV
layout (the tee had no UVs at all and wore a printed multi-material design;
the long-sleeve's UVs overlapped front/back). The script box-projects clean
UVs — front panel, back panel and a neutral strip — so one fabric texture
carries all signatures, and the app's own plain-white fabric material
replaces the tee's printed design.

**Known gaps vs the PRD garment spec:**
- The long-sleeve model is a plain long-sleeve crew shirt: it has **no collar
  and no front button placket**, so it is not a true button-down. No
  acceptable garment-only CC0/CC-BY button-down GLB was found (candidates
  were characters wearing clothes). The 2D template draws a placket line as a
  visual cue; the 3D garment itself remains a long-sleeve shirt. Swapping in
  a true button-down model later only requires a new GLB + UV pass.
- The tee is a regular-fit tee rather than strongly oversized.
- Both models are in a T-pose (arms out), and box-projected UVs stretch
  somewhat near the side seams; the signing area is the torso front/back,
  which maps cleanly.

## Assumptions on PRD open decisions (section 15)

- Signature "size" = linear width scale on the garment (1× ≈ 36% of the
  signing-area width, 4× ≈ 76%); height follows the signature's own aspect.
- Signing is allowed on **front and back** of each shirt.
- Entitlement lifetime: 24 hours (demo-friendly "short-lived").
- Gateway/processing fees are not modelled (mock gateway); the 10% is on the
  full amount the contributor pays.
- Earnings become available immediately; one seeded earning is marked
  "pending" purely to demonstrate the pending state. Payout holds/thresholds
  are not modelled; the withdrawal minimum is ₦100.
- "Shirt full" = 60 signatures; the public page then stops accepting gifts.
- Brand name "SignOut" is a placeholder, as is the `signout.ng` domain shown
  in share links (override with `NEXT_PUBLIC_BASE_URL`).

## Verification performed

- `npm run build` — passes (all 27 routes).
- Production server booted; every main route returns 200 (unknown slugs 404).
- 38-check API flow test, all passing: pricing rejections (₦1,500 gift,
  locked sizes), quote math (₦5,000 + 3× = ₦5,700 total, ₦570 fee, ₦5,130
  owner share), declined-then-successful mock payment, entitlement issuance,
  type-mode and draw-mode signature placement, single-use enforcement (409),
  overlap rejection (409), persistence on the public shirt, demo login,
  dashboard balance (₦29,880 after test earnings), withdrawal gate (403),
  verification submission, onboarding order enforcement, duplicate-shirt
  block (409).
- Not verified in this environment: the WebGL canvas render itself (no
  browser binary on the VM). The viewer includes a 2D fallback if WebGL is
  unavailable; open the app in a browser to eyeball the 3D result.
