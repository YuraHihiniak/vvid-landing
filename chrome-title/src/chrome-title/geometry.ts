import { BufferAttribute, BufferGeometry } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Turn the faceted ExtrudeGeometry of a Text3D into a pillow.
 *
 * ExtrudeGeometry is unindexed with one flat normal per triangle, so the bevel shows every ring.
 * Welding everything and recomputing normals smooths the bevel, but also drags the lid's normals
 * off +z wherever a lid triangle meets a bevel quad — big lid triangles then interpolate those and
 * the flat faces get shading streaks. So the lids (material group 0) and the bevel + walls
 * (group 1) are welded separately: the lids stay dead flat, the sides become one continuous curve.
 * The bevel starts tangent to the lid, so the seam between the two sets is invisible.
 */
export function pillowGeometry(src: BufferGeometry): BufferGeometry {
  const position = src.getAttribute('position') as BufferAttribute
  const array = position.array as Float32Array
  const chunks: Float32Array[][] = [[], []]
  for (const g of src.groups) {
    const list = chunks[g.materialIndex === 1 ? 1 : 0]
    list.push(array.subarray(g.start * 3, (g.start + g.count) * 3))
  }
  if (!chunks[0].length || !chunks[1].length) return weld([array]) // no groups → one weld for all of it
  const lids = weld(chunks[0])
  const sides = weld(chunks[1])
  const merged = mergeGeometries([lids, sides], false)
  lids.dispose()
  sides.dispose()
  return merged ?? src
}

const TOLERANCE = 1e-4

function weld(parts: Float32Array[]): BufferGeometry {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const flat = new Float32Array(total)
  let offset = 0
  for (const p of parts) {
    flat.set(p, offset)
    offset += p.length
  }
  const geo = weldNumeric(flat) ?? weldByString(flat)
  geo.computeVertexNormals()
  return geo
}

/**
 * The same thing BufferGeometryUtils.mergeVertices does, but the vertex key is one number
 * (quantised x, y, z packed into 52 bits) instead of a concatenated string — about 4× faster on
 * the 100k+ vertices of a long title. Returns null when the geometry is too large for the packing.
 */
function weldNumeric(pos: Float32Array): BufferGeometry | null {
  const count = pos.length / 3
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = pos[i + a]
      if (v < min[a]) min[a] = v
      if (v > max[a]) max[a] = v
    }
  }
  const inv = 1 / TOLERANCE
  const bits = min.map((m, a) => Math.ceil(Math.log2((max[a] - m) * inv + 2)))
  if (bits[0] + bits[1] + bits[2] > 52) return null
  const my = 2 ** bits[1]
  const mz = 2 ** bits[2]

  const seen = new Map<number, number>()
  const index = new Uint32Array(count)
  const out = new Float32Array(pos.length)
  let next = 0
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3]
    const y = pos[i * 3 + 1]
    const z = pos[i * 3 + 2]
    const key = (Math.round((x - min[0]) * inv) * my + Math.round((y - min[1]) * inv)) * mz + Math.round((z - min[2]) * inv)
    let j = seen.get(key)
    if (j === undefined) {
      j = next++
      seen.set(key, j)
      out[j * 3] = x
      out[j * 3 + 1] = y
      out[j * 3 + 2] = z
    }
    index[i] = j
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(out.slice(0, next * 3), 3))
  geo.setIndex(new BufferAttribute(index, 1))
  return geo
}

function weldByString(pos: Float32Array): BufferGeometry {
  const geo = new BufferGeometry().setAttribute('position', new BufferAttribute(pos, 3))
  const welded = mergeVertices(geo, TOLERANCE)
  geo.dispose()
  return welded
}
