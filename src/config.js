/**
 * Business configuration — single source of truth for the business data.
 *
 * Kanel es una panadería ficticia: es el ejemplo del plan Profesional de
 * lucasesteban.dk. Los pedidos de WhatsApp le llegan a Lucas.
 */
export const BUSINESS = {
  name: 'Kanel',
  // WhatsApp de Lucas (formato wa.me, sin "+"): quien pruebe un pedido le escribe a él.
  whatsapp: '4550645498',
  phoneDisplay: '+45 50 64 54 98',
  instagram: 'https://www.instagram.com/',

  address: {
    street: 'Godthåbsvej 42',
    locality: '2000 Frederiksberg',
    mapsQuery: 'Godthåbsvej 42, 2000 Frederiksberg',
  },

  siteUrl: 'https://kanel-bageri.vercel.app',
  currency: 'kr',

  // Etiqueta "Web de ejemplo · Plan Profesional" y links a la web de Lucas.
  plan: { price: 4000 },
  makerUrls: {
    es: 'https://lucasesteban.dk/',
    en: 'https://lucasesteban.dk/en/',
    da: 'https://lucasesteban.dk/da/',
  },
};

/**
 * Horario: lunes cerrado; dos franjas de retiro por día. El selector de
 * horarios del pedido sale de acá.
 */
export const HOURS = {
  closedWeekdays: [1], // JS getDay(): 0=Sun ... 1=Monday
  windows: [
    { id: 'morning', start: '07:00', end: '11:30' },
    { id: 'afternoon', start: '14:00', end: '17:00' },
  ],
  slotMinutes: 30,
  minLeadMinutes: 60, // el primer horario ofrecido: ahora + 1 h para preparar
  daysAhead: 7,
};

/**
 * Panel (Sanity): de acá salen los productos. Con projectId vacío la web usa
 * src/data/products.json. Mismos datos que studio/cliente.js.
 */
export const PANEL = {
  projectId: '2mfj2p92',
  dataset: 'production',
  apiVersion: '2025-01-01',
};
