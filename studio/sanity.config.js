import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { daDKLocale } from '@sanity/locale-da-dk';
import { CLIENTE } from './cliente.js';
import { T } from './textos.js';
import { categoria } from './schemas/categoria.js';
import { producto } from './schemas/producto.js';

// El panel de Sanity en sí (botones, menús) viene en inglés; danés si el panel es en danés.
const locales = CLIENTE.idiomaPanel === 'da' ? [daDKLocale()] : [];

export default defineConfig({
  name: 'panel',
  title: CLIENTE.nombre,
  projectId: CLIENTE.projectId,
  dataset: CLIENTE.dataset,
  plugins: [
    structureTool({
      // Solo dos listas, ordenables arrastrando: productos y categorías.
      structure: (S, context) =>
        S.list()
          .title(CLIENTE.nombre)
          .items([
            orderableDocumentListDeskItem({ type: 'producto', title: T.productos, S, context }),
            orderableDocumentListDeskItem({ type: 'categoria', title: T.categorias, S, context }),
          ]),
    }),
    ...locales,
  ],
  schema: { types: [categoria, producto] },
  document: {
    // Sin "crear plantilla nueva" ni tipos sueltos en el menú de +
    newDocumentOptions: (prev) => prev.filter((o) => ['producto', 'categoria'].includes(o.templateId)),
  },
});
