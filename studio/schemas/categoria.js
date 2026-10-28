import { defineType } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { T } from '../textos.js';
import { textoIdiomas, BASE_LANG } from './textoIdiomas.js';

export const categoria = defineType({
  name: 'categoria',
  title: T.categoria,
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    textoIdiomas({ name: 'nombre', title: T.nombreCategoria, obligatorio: true }),
    orderRankField({ type: 'categoria' }),
  ],
  preview: {
    select: { title: `nombre.${BASE_LANG}` },
  },
});
