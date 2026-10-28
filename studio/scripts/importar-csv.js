/**
 * Carga el menú de un cliente desde un CSV (el de la planilla de onboarding).
 * Se puede correr más de una vez: actualiza lo que viene en el CSV y no borra nada.
 *
 *   npm run importar:csv -- ruta/menu.csv [carpeta-de-fotos]
 *
 * Columnas (los nombres no distinguen mayúsculas ni tildes; el orden da igual):
 *   Producto, Categoria         obligatorias
 *   Precio (DKK)                un solo precio por 1 unidad, o en su lugar:
 *   Paquetes                    "1:28 | 4:100" (cantidad:precio)
 *   Disponible                  Si / No (vacío = Si)
 *   Descripcion
 *   Producto EN, Descripcion DA ...  traducciones (vacías = idioma base)
 *   Categoria EN, Categoria DA  traducciones de la categoría
 *   Foto                        nombre de archivo dentro de la carpeta de fotos
 *   Etiqueta                    "Para 2", "Nuevo"
 *   Unidad                      u / kg / min
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLIENTE } from '../cliente.js';
import { client, guardar, rangos, slug, subirFoto } from './comun.js';

const [rutaCsv, carpetaFotos] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!rutaCsv) {
  console.error('Uso: npm run importar:csv -- ruta/menu.csv [carpeta-de-fotos]');
  process.exit(1);
}

const [BASE, ...OTROS] = CLIENTE.idiomas;

/** CSV con comillas, comas o punto y coma (Excel en danés exporta con ;). */
function leerCsv(texto) {
  texto = texto.replace(/^﻿/, '');
  const sep = (texto.split('\n')[0].match(/;/g) || []).length > (texto.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const filas = [];
  let fila = [];
  let celda = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') (celda += '"'), i++;
      else if (ch === '"') comillas = false;
      else celda += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) fila.push(celda), (celda = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda), filas.push(fila), (fila = []), (celda = '');
    } else celda += ch;
  }
  if (celda || fila.length) fila.push(celda), filas.push(fila);
  const [cabecera, ...resto] = filas.filter((f) => f.some((c) => c.trim()));
  // "Precio (DKK)" -> "precio", "Descripción DA" -> "descripcion da"
  const claves = cabecera.map((h) => slug(h.replace(/\(.*?\)/g, '')).replace(/-/g, ' '));
  return resto.map((f) => Object.fromEntries(claves.map((k, i) => [k, (f[i] ?? '').trim()])));
}

const numero = (s) => Number(String(s).replace(/kr|dkk/gi, '').replace(',', '.').trim());
const SI = ['si', 'yes', 'ja', 'true', '1', 'x', ''];

function textos(fila, campo) {
  const out = { [BASE]: fila[campo] || '' };
  for (const lang of OTROS) if (fila[`${campo} ${lang}`]) out[lang] = fila[`${campo} ${lang}`];
  return out;
}

function paquetes(fila) {
  const lista = fila.paquetes
    ? fila.paquetes.split('|').map((p) => p.split(':').map(numero))
    : [[1, numero(fila.precio)]];
  return lista
    .filter(([c, p]) => c > 0 && p >= 0 && !Number.isNaN(p))
    .map(([cantidad, precio], i) => ({ _key: `p${i}`, _type: 'paquete', cantidad, precio }));
}

const UNIDAD = { u: 'unidad', unidad: 'unidad', kg: 'kg', kilo: 'kg', min: 'min', minutos: 'min' };

const filas = leerCsv(readFileSync(resolve(rutaCsv), 'utf8'));
const rangoCat = await rangos('categoria');
const rangoProd = await rangos('producto');
const tx = client.transaction();
const categorias = new Set();
let errores = 0;

for (const [i, fila] of filas.entries()) {
  fila.producto ||= fila.nombre;
  const nombre = fila.producto;
  const paqs = paquetes(fila);
  if (!nombre || !fila.categoria || !paqs.length) {
    console.warn(`! Fila ${i + 2}: falta producto, categoría o precio. Se saltea.`);
    errores++;
    continue;
  }

  const idCat = `categoria-${slug(fila.categoria)}`;
  if (!categorias.has(idCat)) {
    categorias.add(idCat);
    guardar(tx, { _id: idCat, _type: 'categoria', nombre: textos(fila, 'categoria') }, rangoCat);
  }

  const foto = fila.foto && carpetaFotos ? await subirFoto(resolve(carpetaFotos, fila.foto)) : null;
  if (fila.foto && !foto) console.warn(`! Fila ${i + 2}: no encontré la foto "${fila.foto}".`);

  const desc = textos(fila, 'descripcion');
  const etiqueta = textos(fila, 'etiqueta');
  guardar(
    tx,
    {
      _id: `producto-${slug(nombre)}`,
      _type: 'producto',
      nombre: textos(fila, 'producto'),
      categoria: { _type: 'reference', _ref: idCat },
      disponible: SI.includes(slug(fila.disponible ?? '')),
      unidad: UNIDAD[slug(fila.unidad ?? '')] || 'unidad',
      paquetes: paqs,
      ...(desc[BASE] ? { descripcion: desc } : {}),
      ...(etiqueta[BASE] ? { etiqueta } : {}),
      ...(foto ? { foto } : {}),
    },
    rangoProd
  );
  console.log(`· ${nombre}`);
}

await tx.commit();
console.log(`Listo: ${filas.length - errores} productos en ${categorias.size} categorías${errores ? `, ${errores} filas salteadas` : ''}.`);
