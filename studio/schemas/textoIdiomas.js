/**
 * Campo de texto en los idiomas de la web: { es, en, da }.
 * El idioma base es obligatorio; los demás, si quedan vacíos, la web usa el base.
 */
import { defineField } from 'sanity';
import { CLIENTE } from '../cliente.js';
import { T } from '../textos.js';

const [BASE] = CLIENTE.idiomas;

export function textoIdiomas({ name, title, description, multilinea = false, obligatorio = false, ...rest }) {
  return defineField({
    name,
    title,
    description,
    type: 'object',
    options: { columns: 1 },
    fields: CLIENTE.idiomas.map((lang) =>
      defineField({
        name: lang,
        title: T.idioma[lang],
        type: multilinea ? 'text' : 'string',
        rows: multilinea ? 3 : undefined,
        description: lang === BASE ? undefined : `${T.traduccionAyuda} ${T.idioma[BASE].toLowerCase()}.`,
        validation: lang === BASE && obligatorio ? (r) => r.required().error(T.obligatorio) : undefined,
      })
    ),
    ...rest,
  });
}

export const BASE_LANG = BASE;
