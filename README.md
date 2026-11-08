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

**Persistence is this browser's localStorage only.** This is a mockup: there
is no server database and no API layer. On first load the app seeds a demo
database into localStorage (key `signout-db-v1`) and afterwards reads/writes
only there; the signed-in session is a second localStorage key holding the
current user id. Consequences, by design:

- Data is **per device and per browser**. A shirt link created on one device
  will not resolve on another (each browser has its own seeded demo world).
- **Clearing browser storage resets everything** to the pristine seed state
  (demo owner, two shirts, six gifts, six signatures).
- Nothing you do in the app leaves your device.

## Design system

Premium neutral SaaS (Linear/Stripe register): white and warm stone
neutrals, near-black ink, one restrained accent (deep emerald) reserved for
highlights and success states, black primary buttons. Inter for UI text,
Caveat / Archivo Black only inside signature content. No purple, no
gradients, no decorative blobs. Shared primitives (`.card`, `.btn-primary`,
`.btn-accent`, `.btn-secondary`, `.input`, `.label`) live in
`app/globals.css`. Layouts are mobile-first and hold at 390px.

## What is real vs mocked

**Real (full business logic, running client-side in `lib/localstore.ts`):**
- Pricing in integer kobo via the local store: minimum gift ₦2,000 (includes
  1× signature); gifts ≥ ₦5,000 unlock 2× (+₦500), 3× (+₦700), 4× (+₦1,000).
- 10% platform commission on the full payment, disclosed to contributors
  before paying and explicitly acknowledged by owners during onboarding
  (acceptance + policy version + timestamp stored).
- Pay-before-sign: a settled payment issues a single-use signing entitlement
  (24h validity) tied to the transaction; signing consumes it; the token URL
  is the resume link for the paid-but-interrupted case.
- Signature editor with three content modes: **draw** on a canvas pad
  (strokes stored as vectors), **write** a name or short note, or **emoji**
  text — typed content accepts names, notes and inline emojis and renders in
  the signer's choice of three fonts (Caveat handwriting, Inter clean sans,
  Archivo Black display), fitted and word-wrapped into the placed box by the
  same layout code that paints the 3D texture. 7 pen colours, front/back
  choice. Placement is a visible box on the flat template: drag to move,
  corner handle to resize (never above the entitlement's size), top handle
  or slider to tilt; the box cannot rest on another signature — invalid
  spots turn the box red and it snaps back to the last free position on
  release. Bounds + overlap rules are re-validated by the store on submit.
- Signatures composite into the garment's 2048×2048 texture canvas at the
  mapped UV position and render on the 3D model; they persist in the store
  and render identically on every reload because they are stored as
  structured data (surface, x, y, scale, rotation, strokes/text), never raster.
- Owner dashboard: live 3D shirts, share links with copy button, earnings
  (gifts, gross, fees, available/pending), gift history, per-shirt detail.
- Auth: email + password accounts in the local store; the session is a
  localStorage key with the current user id, and route guards run
  client-side. Passwords are hashed with a tiny synchronous salted hash —
  node scrypt cannot run in a browser, and this is **mockup-grade only, not
  real password security** (the data never leaves the visitor's own device).
- Withdrawals: balance derived from the ledger, idempotency keys, gated on
  student verification.
- Onboarding order enforced by the store: school/department → bank account →
  commission acknowledgement. One shirt per design per owner (max two shirts),
  unique unguessable slug per shirt.

**Mocked / simulated (by design, per prototype scope):**
- Payments: a mock checkout page styled like Paystack. Settlement flows
  through `settlePayment()` in `lib/localstore.ts` — the exact seam where real
  Paystack verification/webhook handling plugs in later (verified amount in,
  entitlement + ledger entries out). Swapping in real Paystack only touches
  the checkout creation and confirm steps.
- Student verification: owners submit ID details + an evidence file *name*
  (the file itself is not uploaded/stored). Admin review is out of scope, so
  the status stays "pending review" (simulated queue) and the withdrawal gate
  therefore stays locked in this build — the gate logic itself is real and
  rejects withdrawal requests while the owner is unverified.
- Withdrawal payouts stay "pending" (no payout processor, no admin console).

## 3D models — sourcing, licences, and honest gaps

Both garments were replaced in the November 2026 quality pass; the original
Poly Pizza toys (2.3k / 5.3k tris, stiff T-pose) are kept as
`public/models/legacy-*.glb` fallbacks.

| Shirt | Model | Author | Licence | Source |
|---|---|---|---|---|
| Classic tee | "Tshirt" | Tabbuso | CC-BY 4.0 | https://sketchfab.com/3d-models/tshirt-5a21282b2e454d1696547148f617d3d0 |
| Button-down | "elvs_male_shirt_untucked_bd1" | Elvaerwyn | CC-BY | MakeHuman Community, shirts02 pack |

Attribution is also shown in the site footer, as CC-BY requires.

**Tee.** A Marvelous Designer cloth sim with genuinely natural drape
(sleeves hang, soft folds). Sketchfab's download API requires an account
(401 unauthenticated), so the file was fetched from a GitHub mirror of the
same model — identity verified by the exact triangle count (373,280) in
Sketchfab's own API record. Processing (gltf-transform + meshopt): decoded
the Draco compression, deleted four decal planes the mirror repo had added
(they are not part of the garment), decimated 373k → 63k tris, dropped
materials (the app supplies the white fabric). ~2.0 MB GLB.

**Button-down.** A real corporate shirt: modelled fold-down collar, a
raised centre placket and a column of individual button geometry down the
front (verified by direct vertex measurement — the button row sits at +Z,
which also fixed the model's front direction), long sleeves with cuffs, two
plain chest pockets. The MakeHuman source is OBJ; it was converted to GLB,
smooth normals computed, and its dark-silk diffuse texture stripped (the app
supplies the white fabric). 8,056 tris.

**UV pipeline** (`scripts/generate-uvs.mjs`, mapping in
`lib/uv-regions.json`): box-projects clean front/back panel UVs so one
fabric texture carries all signatures. Three fixes landed with the new
models: (1) UV writes are now stride-aware — interleaved attribute buffers
(POSITION/NORMAL/TEXCOORD in one bufferView) previously got their other
attributes smeared by the contiguous copy; (2) world normals are computed
with a true inverse-transpose — the old cofactor shortcut applied the
inverse rotation, which mirrors front/back assignment on any model whose
node carries a rotation (both old models had identity transforms, so it
never showed); (3) the button-down's front is locked to +Z from the button
measurement, because the collar heuristic misreads its band collar.
Panel assignment is verified programmatically after every run: front-facing
torso vertices must land in the front panel and back-facing in the back
panel (current models: 100% / 100%, zero mismatches).

**Known gaps vs the PRD garment spec:**
- The button-down is body-fitted MakeHuman proportions (slim torso,
  sleeves close to the body) at 8k tris: a genuine collared button-down,
  but softer and less premium than a Marvelous Designer garment. The ideal
  upgrade is identified and licence-verified — Sketchfab "Realistic Dress
  Shirt" by MotionStudioArts (CC-BY, 139k faces, crisp point collar, 7
  visible buttons, garment-only) — but its download sits behind a free
  Sketchfab login (the API returns 401 without an account), so it could
  not be fetched from this environment. Swapping it in later is: download
  the GLB → replace `public/models/longsleeve.glb` → run
  `scripts/generate-uvs.mjs` → re-upload to Cloudinary → update
  `lib/uv.ts`.
- The tee is a relaxed regular fit rather than strongly oversized.
- The viewer lights both garments with a studio HDRI environment, ACES
  tone mapping and a soft contact shadow, with a slow idle rotation that
  pauses while dragging.

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

(Quality pass, 2026-11-08 — supersedes the earlier server-build notes.)

- `npm run build` passes; `tsc --noEmit` clean. Production server booted;
  all 13 routes return 200 (/, /login, /signup, /onboarding, /dashboard +
  gifts/verification/withdrawals + shirt detail, both demo shirt pages,
  /pay/…, /sign/…). The built bundle references the new Cloudinary model
  URLs, and both URLs return HTTP 200 with byte sizes matching the local
  GLBs (tee 1,968,700 B; button-down 262,148 B).
- Store logic test (30 checks, all passing): the local store compiled
  standalone behind a localStorage shim — seed, demo login, every locked
  pricing rule (₦1,500 rejected; ₦3,000 cannot unlock 2×; ₦5,000 + 3× =
  ₦5,700 total / ₦570 fee / ₦5,130 owner share), decline-then-success
  settlement, entitlement single-use, overlap and out-of-bounds rejection,
  withdrawal gate, plus the new paths: a text signature with emojis and a
  `display` font choice stored verbatim, box scale 0.7 stored as exactly
  70% of the entitlement width, scale 2 clamped to the cap, legacy `type`
  records normalised to `text`/`hand`, 60-char text sliced to 48, balance
  accrual, persistence round-trip.
- Texture compositor rendered headlessly (@napi-rs/canvas / Skia, real
  Caveat + Inter + Archivo Black loaded): typed text in all three fonts
  wraps, fits and paints into the 2048px shirt texture, including a
  7-line wrapped note and legacy records. Emoji glyphs occupy layout
  space correctly in the headless run but render as monochrome outlines
  there — that Skia build has no colour-emoji font; in real browsers
  `fillText` uses the OS colour emoji font (Apple/Noto/Segoe Emoji), which
  is the standard canvas behaviour the app relies on.
- 3D model panel mapping verified programmatically (see the UV pipeline
  note above): 100% of front-facing torso vertices carry front-panel UVs
  and 100% of back-facing carry back-panel UVs, for both new models.
- Not verified in this environment: the WebGL canvas render itself (no
  browser binary on the VM). The viewer includes a 2D fallback if WebGL is
  unavailable; open the app in a browser to eyeball the 3D result — the
  drape of the new tee, the button-down's collar/placket under the studio
  lighting, and colour-emoji rendering on a real device are the three
  things to check.
