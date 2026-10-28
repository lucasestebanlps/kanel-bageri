# Panel (Sanity Studio)

El panel donde el dueño edita su menú: productos, fotos, precios por paquete, disponible/agotado
y categorías, en los idiomas de la web. Los cambios se ven en la web en segundos, sin volver a publicar.

Es la **plantilla** del plan Profesional: para un cliente nuevo se copia esta carpeta y se cambia
solo `cliente.js`.

## Qué tiene

- **Productos**: nombre, descripción y etiqueta por idioma (el idioma base es obligatorio; los otros,
  si quedan vacíos, la web usa el base), categoría, foto con recorte y punto focal, disponible,
  paquetes con precio. Opcionales por rubro: vender por kilo o por minutos (`cliente.js > campos`).
- **Categorías**: son las pestañas del menú. Se crean, renombran y ordenan desde el panel.
- **Orden**: productos y categorías se ordenan arrastrando.
- **Idioma del panel**: español, inglés o danés (`cliente.js > idiomaPanel`).

## Cliente nuevo (2 a 4 h)

```bash
# 1. Copiar la plantilla al repo del cliente
cp -R ~/kanel-bageri/studio ~/<cliente>/studio && cd ~/<cliente>/studio
rm -rf node_modules dist && npm install

# 2. Crear el proyecto Sanity (plan Free) y su dataset
npx sanity login                        # una sola vez por máquina
npx sanity projects create "<Cliente>" --dataset production --dataset-visibility public
```

3. Completar `cliente.js` (nombre, projectId, studioHost, idioma del panel, campos) y el mismo
   projectId en `src/config.js > PANEL` de la web.
4. Permitir que la web lea el panel (CORS):

   ```bash
   npx sanity cors add https://<dominio-del-cliente> --no-credentials
   npx sanity cors add http://localhost:5173 --no-credentials
   ```

5. Cargar el menú desde la planilla del cliente (exportada como CSV):

   ```bash
   npm run importar:csv -- ~/Descargas/menu.csv ~/Descargas/fotos
   ```

   Columnas: ver el comentario al principio de `scripts/importar-csv.js`. Se puede correr de nuevo:
   actualiza lo que viene en el CSV y no toca lo demás.
6. Publicar el panel: `npm run deploy` (queda en `https://<studioHost>.sanity.studio`). La primera vez
   imprime un `appId`: copiarlo en `cliente.js > studioAppId`.
7. Invitar al dueño como **Editor**: sanity.io/manage > proyecto > Members > Invite.
8. Mandarle el video de uso y el link del panel.

## Kanel (demo)

```bash
npm run importar:json   # carga src/data/products.json + fotos de assets-src/photos
npm run dev             # panel en http://localhost:3333
```
