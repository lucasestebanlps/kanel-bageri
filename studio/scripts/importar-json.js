/**
 * Carga el menú de ejemplo de Kanel (src/data/products.json + fotos de
 * assets-src/photos/) en el panel. Se puede correr más de una vez.
 *
 *   npm run importar:json
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { client, guardar, rangos, subirFoto } from './comun.js';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
const { categories, products } = JSON.parse(readFileSync(`${raiz}src/data/products.json`, 'utf8'));

const rangoCat = await rangos('categoria');
const rangoProd = await rangos('producto');
const tx = client.transaction();

for (const c of categories) {
  guardar(tx, { _id: `categoria-${c.id}`, _type: 'categoria', nombre: c.name }, rangoCat);
}

for (const p of products) {
  const foto = await subirFoto(p.image && `${raiz}assets-src/photos/${p.image}.jpg`);
  console.log(`· ${p.name.es}${foto ? '' : ' (sin foto)'}`);
  guardar(
    tx,
    {
      _id: `producto-${p.id}`,
      _type: 'producto',
      nombre: p.name,
      descripcion: p.desc,
      categoria: { _type: 'reference', _ref: `categoria-${p.category}` },
      disponible: p.available,
      unidad: p.unit || 'unidad',
      paquetes: p.variants.map((v, i) => ({ _key: `p${i}`, _type: 'paquete', cantidad: v.units, precio: v.price })),
      ...(p.badge ? { etiqueta: p.badge } : {}),
      ...(foto ? { foto } : {}),
    },
    rangoProd
  );
}

await tx.commit();
console.log(`Listo: ${categories.length} categorías y ${products.length} productos.`);
