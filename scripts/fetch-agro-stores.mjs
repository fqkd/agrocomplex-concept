import { writeFile } from 'node:fs/promises'

const source = 'https://agrokomplex.ru/local/ajax/shops.php?type=json'
const response = await fetch(source, { headers: { 'User-Agent': 'ErgohavenConceptResearch/1.0' } })
if (!response.ok) throw new Error(`Store source returned ${response.status}`)
const collection = await response.json()
if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Unexpected store payload')

function locality(address) {
  return address.match(/^(.*?)(?=\s+(?:ул\.?|пр\.?|пр-т|проспект|проезд|пер\.?|мкр\.?|ш\.?|наб\.?|пл\.?|бул\.?|б-р|тракт|д\.?\s*\d)|$)/i)?.[1]?.replace(/,$/, '').trim() ?? ''
}

const stores = collection.features.map((feature) => {
  const [lat, lng] = feature.geometry?.coordinates ?? []
  const address = String(feature.properties?.Title ?? '').trim()
  if (!feature.id || !address || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    throw new Error(`Invalid store feature ${feature.id ?? 'without id'}`)
  }
  return {
    id: `agro-${feature.id}`,
    name: 'Агрокомплекс Выселковский',
    address,
    lat: Number(lat),
    lng: Number(lng),
    city: locality(address),
    meta: [feature.properties?.Pay, feature.properties?.Work].filter(Boolean).join(' · '),
  }
})

const output = `import type { MapPoint } from './LocationMap'\n\n// Generated from the official store locator on 2026-08-23.\n// Source: ${source}\nexport const agroStores: MapPoint[] = ${JSON.stringify(stores, null, 2)}\n`
await writeFile(new URL('../src/agroStores.ts', import.meta.url), output)
console.log(JSON.stringify({ source, stores: stores.length }))
