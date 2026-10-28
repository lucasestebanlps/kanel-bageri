import { defineType, defineField, defineArrayMember } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { CLIENTE } from '../cliente.js';
import { T } from '../textos.js';
import { textoIdiomas, BASE_LANG } from './textoIdiomas.js';

const { porKilo, duracion, etiqueta } = CLIENTE.campos;
const unidadVisible = porKilo || duracion;

const SUFIJO = { unidad: 'u.', kg: 'kg', min: 'min' };

export const producto = defineType({
  name: 'producto',
  title: T.producto,
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    textoIdiomas({ name: 'nombre', title: T.nombre, obligatorio: true }),
    defineField({
      name: 'categoria',
      title: T.categoria,
      type: 'reference',
      to: [{ type: 'categoria' }],
      options: { disableNew: false },
      validation: (r) => r.required().error(T.obligatorio),
    }),
    defineField({
      name: 'disponible',
      title: T.disponible,
      description: T.disponibleAyuda,
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'foto',
      title: T.foto,
      description: T.fotoAyuda,
      type: 'image',
      options: { hotspot: true },
    }),
    textoIdiomas({ name: 'descripcion', title: T.descripcion, description: T.descripcionAyuda, multilinea: true }),
    defineField({
      name: 'unidad',
      title: T.unidad,
      type: 'string',
      hidden: !unidadVisible,
      // un negocio de servicios arranca cada producto nuevo en minutos
      initialValue: duracion && !porKilo ? 'min' : 'unidad',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          { value: 'unidad', title: T.unidades },
          ...(porKilo ? [{ value: 'kg', title: T.kilo }] : []),
          ...(duracion ? [{ value: 'min', title: T.minutos }] : []),
        ],
      },
    }),
    defineField({
      name: 'paquetes',
      title: T.paquetes,
      description: T.paquetesAyuda,
      type: 'array',
      validation: (r) => r.required().min(1).error(T.sinPaquetes),
      of: [
        defineArrayMember({
          name: 'paquete',
          title: T.paquete,
          type: 'object',
          options: { columns: 2 },
          fields: [
            defineField({
              name: 'cantidad',
              title: T.cantidad,
              type: 'number',
              initialValue: 1,
              validation: (r) => r.required().positive().error(T.obligatorio),
            }),
            defineField({
              name: 'precio',
              title: T.precio,
              type: 'number',
              validation: (r) => r.required().min(0).error(T.obligatorio),
            }),
          ],
          preview: {
            select: { cantidad: 'cantidad', precio: 'precio' },
            prepare: ({ cantidad, precio }) => ({ title: `${cantidad ?? '?'} → ${precio ?? '?'} kr` }),
          },
        }),
      ],
    }),
    ...(etiqueta
      ? [textoIdiomas({ name: 'etiqueta', title: T.etiqueta, description: T.etiquetaAyuda })]
      : []),
    orderRankField({ type: 'producto' }),
  ],
  preview: {
    select: {
      title: `nombre.${BASE_LANG}`,
      categoria: `categoria.nombre.${BASE_LANG}`,
      disponible: 'disponible',
      media: 'foto',
      paquetes: 'paquetes',
      unidad: 'unidad',
    },
    prepare: ({ title, categoria, disponible, media, paquetes = [], unidad = 'unidad' }) => {
      const precios = paquetes.map((p) => `${p.cantidad} ${SUFIJO[unidad]} ${p.precio} kr`).join(' · ');
      return {
        title: disponible === false ? `${title} (${T.agotado})` : title,
        subtitle: [categoria || T.sinCategoria, precios].filter(Boolean).join(' | '),
        media,
      };
    },
  },
});
