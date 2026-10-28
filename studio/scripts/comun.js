/** Utilidades compartidas por los scripts de importación. */
import { createReadStream, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { getCliClient } from 'sanity/cli';
import { LexoRank } from 'lexorank';

export const client = getCliClient({ apiVersion: '2025-01-01' });

export const slug = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Devuelve una función que da rangos de orden a partir del último existente del tipo. */
export async function rangos(tipo) {
  const ultimo = await client.fetch(`*[_type == $tipo] | order(orderRank desc)[0].orderRank`, { tipo });
  let r = ultimo ? LexoRank.parse(ultimo) : LexoRank.min();
  return () => {
    r = r.genNext().genNext();
    return r.toString();
  };
}

const subidas = new Map();

/** Sube una foto (Sanity no la duplica si ya existe) y devuelve el campo image listo. */
export async function subirFoto(ruta) {
  if (!ruta || !existsSync(ruta)) return null;
  if (!subidas.has(ruta)) {
    const asset = await client.assets.upload('image', createReadStream(ruta), { filename: basename(ruta) });
    subidas.set(ruta, asset._id);
  }
  return { _type: 'image', asset: { _type: 'reference', _ref: subidas.get(ruta) } };
}

/**
 * Crea el documento si no existe (con su rango de orden) y pisa solo los campos
 * que vienen del archivo: lo que el cliente haya cambiado en otros campos se mantiene.
 */
export function guardar(tx, doc, rango) {
  const { _id, _type, ...campos } = doc;
  tx.createIfNotExists({ _id, _type, orderRank: rango() });
  tx.patch(_id, (p) => p.set(campos));
}
