/**
 * Datos del cliente: lo ÚNICO que se toca al copiar la plantilla para otro negocio.
 * El projectId sale de `npx sanity init` / sanity.io/manage y también va en
 * src/config.js (PANEL) de la web.
 */
export const CLIENTE = {
  nombre: 'Kanel',
  projectId: '2mfj2p92',
  dataset: 'production',
  studioHost: 'kanel-bageri', // queda en https://kanel-bageri.sanity.studio
  studioAppId: 'hnxaq05gdd7fyxiopxz5bp4n', // lo imprime el primer `npm run deploy`; vacío hasta entonces

  // Idioma de los textos del panel (lo que ve el dueño): 'es' | 'en' | 'da'
  idiomaPanel: 'en',

  // Idiomas de la web, el primero es el base (obligatorio en el panel).
  idiomas: ['es', 'en', 'da'],

  // Campos opcionales según el rubro.
  campos: {
    porKilo: false, // fiambrería, verdulería: paquetes en kg
    duracion: false, // servicios (masajes, peluquería): paquetes en minutos
    etiqueta: true, // cartelito sobre la foto ("Para 2", "Nuevo")
  },
};
