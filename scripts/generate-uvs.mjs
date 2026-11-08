// Generates planar (box-projection) UVs for both shirt GLBs and writes the
// signing-region config to lib/uv-regions.json.
//
// Canvas layout (UV space, v measured from the BOTTOM, Blender-style):
//   front panel -> u [0.03, 0.485], back panel -> u [0.515, 0.97], both v [0.04, 0.96]
//   everything else (shoulders, hems, sleeve tops) -> a thin neutral strip at v ~0.015
// The signing rect stored in the config is the torso sub-area of each panel,
// derived from the real geometry (torso width below the armpits, collar excluded).
import fs from 'node:fs';
import path from 'node:path';

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const FRONT_RECT = { u0: 0.03, u1: 0.485, v0: 0.04, v1: 0.96 };
const BACK_RECT = { u0: 0.515, u1: 0.97, v0: 0.04, v1: 0.96 };

function parseGLB(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  let bin = null, off = 20 + jsonLen;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off); const type = buf.readUInt32LE(off + 4);
    if (type === 0x004e4942) bin = Buffer.from(buf.subarray(off + 8, off + 8 + len));
    off += 8 + len;
  }
  return { json, bin };
}
function accessorArray(gltf, bin, idx) {
  const acc = gltf.accessors[idx];
  const view = gltf.bufferViews[acc.bufferView];
  const Ctor = COMP[acc.componentType]; const n = NCOMP[acc.type];
  const byteOffset = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = view.byteStride && view.byteStride !== Ctor.BYTES_PER_ELEMENT * n ? view.byteStride : null;
  const out = new Float32Array(acc.count * n);
  if (!stride) out.set(new Ctor(bin.buffer, bin.byteOffset + byteOffset, acc.count * n));
  else for (let i = 0; i < acc.count; i++) out.set(new Ctor(bin.buffer, bin.byteOffset + byteOffset + i * stride, n), i * n);
  return out;
}
function matMul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
function nodeMatrix(node) {
  if (node.matrix) return Float32Array.from(node.matrix);
  const t = node.translation || [0, 0, 0], s = node.scale || [1, 1, 1];
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return Float32Array.from([(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0, (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0, (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1]);
}
const applyMat = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
function applyMatDir(m, v) {
  const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  const n = [(e * i - f * h) * v[0] - (d * i - f * g) * v[1] + (d * h - e * g) * v[2], -(b * i - c * h) * v[0] + (a * i - c * g) * v[1] - (a * h - b * g) * v[2], (b * f - c * e) * v[0] - (a * f - c * d) * v[1] + (a * e - b * d) * v[2]];
  const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l];
}

function process(file) {
  const { json: gltf, bin } = parseGLB(file);
  // gather world-space verts per primitive
  const prims = [];
  const scene = gltf.scenes[gltf.scene || 0];
  const walk = (ni, parent) => {
    const node = gltf.nodes[ni];
    const world = parent ? matMul(parent, nodeMatrix(node)) : nodeMatrix(node);
    if (node.mesh !== undefined) {
      for (const prim of gltf.meshes[node.mesh].primitives) {
        const pos = accessorArray(gltf, bin, prim.attributes.POSITION);
        const nor = accessorArray(gltf, bin, prim.attributes.NORMAL);
        const count = pos.length / 3;
        const P = new Float32Array(pos), N = new Float32Array(nor);
        for (let i = 0; i < count; i++) {
          const p = applyMat(world, [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
          const n = applyMatDir(world, [nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]]);
          P.set(p, i * 3); N.set(n, i * 3);
        }
        prims.push({ prim, P, N, count, uvAccessor: prim.attributes.TEXCOORD_0 });
      }
    }
    (node.children || []).forEach((c) => walk(c, world));
  };
  (scene.nodes || []).forEach((n) => walk(n, null));

  // global bbox
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const pr of prims) for (let i = 0; i < pr.count; i++) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], pr.P[i * 3 + k]); max[k] = Math.max(max[k], pr.P[i * 3 + k]);
  }
  const W = max[0] - min[0], H = max[1] - min[1];
  const cx = (min[0] + max[0]) / 2;

  // front detection: neckline dip in the top band near centre
  const neckLowest = (plusZ) => {
    let m = Infinity;
    for (const pr of prims) for (let i = 0; i < pr.count; i++) {
      const y = pr.P[i * 3 + 1], x = pr.P[i * 3], z = pr.P[i * 3 + 2];
      if (y > min[1] + H * 0.9 && Math.abs(x - cx) < W * 0.16 && (plusZ ? z >= (min[2] + max[2]) / 2 : z < (min[2] + max[2]) / 2)) m = Math.min(m, y);
    }
    return m;
  };
  const frontIsPlusZ = neckLowest(true) <= neckLowest(false);

  // torso half-extent below the armpits (y band 28%..52% of height)
  let torsoHalf = 0;
  for (const pr of prims) for (let i = 0; i < pr.count; i++) {
    const y = pr.P[i * 3 + 1];
    if (y > min[1] + H * 0.28 && y < min[1] + H * 0.52) torsoHalf = Math.max(torsoHalf, Math.abs(pr.P[i * 3] - cx));
  }
  const sx0 = (cx - torsoHalf * 0.86 - min[0]) / W, sx1 = (cx + torsoHalf * 0.86 - min[0]) / W;
  const syTop = 0.84, syBot = 0.2; // normalized height band (from bottom)

  // focus range: project a torso-centred x-window onto the panel rect so the
  // chest keeps texture resolution even on wide T-pose models (long sleeves).
  const focusHalf = Math.max(torsoHalf * 1.9, W * 0.24);
  const fxMin = cx - focusHalf, fxSpan = focusHalf * 2;
  const fxn = (x) => Math.min(1, Math.max(0, (x - fxMin) / fxSpan));
  const fxnOfNorm = (xn) => fxn(min[0] + xn * W);

  const rectMap = (rect, xn, yn) => [rect.u0 + xn * (rect.u1 - rect.u0), rect.v0 + yn * (rect.v1 - rect.v0)];
  const panelMap = (rect, x, yn) => rectMap(rect, fxn(x), yn);
  const signingRect = (rect) => {
    const [u0, v0] = rectMap(rect, fxnOfNorm(sx0), syBot); const [u1, v1] = rectMap(rect, fxnOfNorm(sx1), syTop);
    return { u0: +u0.toFixed(4), v0: +v0.toFixed(4), u1: +u1.toFixed(4), v1: +v1.toFixed(4) };
  };

  // generate UVs
  const newBuffers = [];
  for (const pr of prims) {
    const uv = new Float32Array(pr.count * 2);
    for (let i = 0; i < pr.count; i++) {
      const x = pr.P[i * 3], y = pr.P[i * 3 + 1];
      const [nx, ny, nz] = [pr.N[i * 3], pr.N[i * 3 + 1], pr.N[i * 3 + 2]];
      const xn = (x - min[0]) / W, yn = (y - min[1]) / H;
      const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
      let u, v;
      if (ay > ax && ay > az) { u = 0.03 + xn * 0.94; v = 0.015; }
      else {
        const isFront = (nz >= 0) === frontIsPlusZ;
        [u, v] = panelMap(isFront ? FRONT_RECT : BACK_RECT, x, yn);
      }
      uv[i * 2] = u; uv[i * 2 + 1] = v;
    }
    if (pr.uvAccessor !== undefined) {
      // overwrite existing TEXCOORD_0 data in place inside a copied BIN
      const acc = gltf.accessors[pr.uvAccessor];
      const view = gltf.bufferViews[acc.bufferView];
      const off = (view.byteOffset || 0) + (acc.byteOffset || 0);
      Buffer.from(uv.buffer).copy(bin, off);
      pr.done = true;
    } else {
      newBuffers.push({ prim: pr.prim, uv });
    }
  }
  // append new accessors for prims that had no UVs (tee)
  let outBin = bin;
  if (newBuffers.length) {
    const chunks = [bin];
    let offset = bin.length;
    const pad = (n) => (4 - (n % 4)) % 4;
    for (const nb of newBuffers) {
      const p = pad(offset); if (p) { chunks.push(Buffer.alloc(p)); offset += p; }
      const data = Buffer.from(nb.uv.buffer);
      gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target: 34962 });
      gltf.accessors.push({ bufferView: gltf.bufferViews.length - 1, componentType: 5126, count: nb.uv.length / 2, type: 'VEC2', min: [0, 0], max: [1, 1] });
      nb.prim.attributes.TEXCOORD_0 = gltf.accessors.length - 1;
      chunks.push(data); offset += data.length;
    }
    outBin = Buffer.concat(chunks);
    gltf.buffers[0].byteLength = outBin.length;
  }
  // write GLB
  const jsonStr = JSON.stringify(gltf);
  const jsonPad = (4 - (Buffer.byteLength(jsonStr) % 4)) % 4;
  const jsonChunk = Buffer.concat([Buffer.from(jsonStr), Buffer.alloc(jsonPad, 0x20)]);
  const binPad = (4 - (outBin.length % 4)) % 4;
  const binChunk = binPad ? Buffer.concat([outBin, Buffer.alloc(binPad)]) : outBin;
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const jc = Buffer.alloc(8); jc.writeUInt32LE(jsonChunk.length, 0); jc.writeUInt32LE(0x4e4f534a, 4);
  const bc = Buffer.alloc(8); bc.writeUInt32LE(binChunk.length, 0); bc.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([head, jc, jsonChunk, bc, binChunk]));

  return {
    bbox: { min: min.map((x) => +x.toFixed(3)), max: max.map((x) => +x.toFixed(3)), center: [+cx.toFixed(3), +((min[1] + max[1]) / 2).toFixed(3), +((min[2] + max[2]) / 2).toFixed(3)], size: [+W.toFixed(3), +H.toFixed(3), +(max[2] - min[2]).toFixed(3)] },
    frontIsPlusZ,
    front: { ...signingRect(FRONT_RECT), flipU: false },
    back: { ...signingRect(BACK_RECT), flipU: true },
  };
}

const cfg = {
  tee: process(path.resolve('public/models/tee.glb')),
  longsleeve: process(path.resolve('public/models/longsleeve.glb')),
};
fs.writeFileSync('lib/uv-regions.json', JSON.stringify(cfg, null, 2));
console.log(JSON.stringify(cfg, null, 2));
