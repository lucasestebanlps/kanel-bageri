# Kanel · panadería danesa (ejemplo del plan Profesional)

Web de ejemplo del **plan Profesional** de [lucasesteban.dk](https://lucasesteban.dk/#precios).
Kanel es una **panadería ficticia** en Frederiksberg: no existe, y las fotos son de
Unsplash (ver `assets-src/photos/FOTOS.md`).

Lo que muestra, que es lo que promete el plan Profesional:

- **Menú con fotos y pestañas** (wienerbrød, pan, para compartir, bebidas), con paquetes
  por producto (1 / 4 / 8 unidades, etc.).
- **Carrito** en una hoja que sube desde abajo, con el total al instante.
- **Día, franja y horario de retiro** según el horario real del local (lunes cerrado,
  mañana 7:00 a 11:30, tarde 14:00 a 17:00, y para hoy solo desde dentro de una hora).
- **El pedido llega armado por WhatsApp**: productos, total, día y hora.

Arriba lleva la franja "Web de ejemplo · Plan Profesional · 4.000 DKK · Ver planes" y al pie
"Web hecha por Lucas Esteban". Todos los WhatsApp van al número de Lucas con un mensaje de
interés ("Vi tu web de ejemplo de Kanel…"). No muestra stock ni "Popular": eso es del Premium.

Se armó sobre la base de código de una propuesta anterior (estructura, carrito y selector de
horarios), con identidad, textos, productos y fotos nuevas.

## Desarrollo

```bash
npm install
npm run dev       # genera las imágenes y levanta Vite
npm run build     # build + páginas /en/ y /da/ pre-renderizadas
npm run preview
```

- `src/config.js`: datos del negocio, WhatsApp, horarios y franjas de retiro.
- `src/data/products.json`: el menú (nombre y descripción en es/en/da, paquetes, foto).
- `src/i18n/dict.js`: todos los textos en los tres idiomas.
- `assets-src/photos/`: fotos originales; `scripts/gen-webp.js` genera las versiones web.
