# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# TODO — Rediseño visual del Main Hub

## Queja del usuario (pendiente de hacer)

El Main Hub **no gusta visualmente**: el azul frío del hub choca con los personajes.
El usuario quiere que el hub se vea **"como los personajes"**, es decir, que el hub y
los sprites pertenezcan visualmente al mismo juego.

- El hub actual usa azul marino frío: `#0b1020`, `#12224c`, bordes y paneles azules.
  Definidos sobre todo en `src/theme.ts` (`HUB_COLORS`, `HUB_RADIUS`).
- Los personajes (`assets/characters/player.png`, `enemy_basic.png`, `enemy_fast.png`,
  `enemy_tank.png`) son cálidos: piel, naranja, marrón, con sombreado cartoon 3D.
- La UI del hub, en cambio, es plana y vectorial (Views, bordes redondeados, iconos
  geométricos). De ahí que se lea como "placeholder".

## Cómo abordarlo

1. Muestrear los píxeles de los 4 sprites para extraer su paleta real (dominantes,
   sombras, luces) en vez de inventarla.
2. Reescribir `HUB_COLORS` en `src/theme.ts` con esa paleta cálida.
3. Revisar los colores sueltos que no pasan por `HUB_COLORS` en `src/components/`:
   `TopBar.tsx`, `StagePanel.tsx`, `LoadoutBar.tsx`, `BottomNav.tsx`, `PixelButton.tsx`.
4. Unificar el estilo de la UI con el de los sprites: no basta con cambiar tonos, hay
   que añadir volumen (bordes inferiores gruesos, sombras, brillos) para que el hub
   deje de verse plano.

## Contexto de lo ya hecho

- El batch de audio, feedback, dash, rendimiento y pausa ya está terminado y validado.
- Los drops y pickups ya usan sprites de `assets/items/` (generados por
  `scripts/generate-icons.js`), así que las monedas y gemas ya no son cuadraditos.
- El usuario ve esos sprites pero **no los ha revisado todavía**: no puedo validar
  imágenes a ojo, así que el ajuste de tamaño/contorno/colores es cosa suya.
- Validar siempre con `npx tsc --noEmit`, `npm run lint` y `npx expo export --platform android`.
