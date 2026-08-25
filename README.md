# Co-piloto de Mentoría

Tablero para **mentorías exprés de 20 minutos**. Está pensado para usarse en vivo, con el equipo
delante: capturar lo que dicen, auditar la evidencia con IA y salir con una decisión escrita.

La tesis del producto: los equipos confunden *entusiasmo* con *evidencia*. La app fuerza la
distinción con un semáforo de tres niveles, un *Reliability Score* y un experimento de 48 horas
a coste cero.

## Las tres etapas

| Etapa | Ventana | Qué pasa |
|---|---|---|
| 1 · Entrada rápida | min 0-8 | Equipo, problema/segmento, acción y resultado, nivel de evidencia. Con dictado por voz. |
| 2 · Auditoría IA | min 9-14 | Gemini devuelve score, alerta de auto-engaño, categoría de bloqueo, 2 preguntas y el experimento 48h. |
| 3 · Matriz de cierre | min 15-20 | Mantener / Ajustar / Detener / Explorar + compromiso + one-pager en PDF. |

El cronómetro cambia de color solo: **verde** por encima de 10 min, **ámbar** entre 5 y 10,
**rojo** por debajo de 5. La etapa activa se resalta según el reloj, y el botón
**«¡Ir a la Evidencia!»** corta la retórica: salta a la auditoría y la dispara con lo que haya capturado.

## Semáforo de evidencia

| Nivel | Qué es | Qué prueba |
|---|---|---|
| 🔴 1 · Declarativa | Opiniones, encuestas, entrevistas | Casi nada |
| 🟡 2 · Conductual | Registros, clics, waitlist, formularios | Interés, no disposición a pagar |
| 🟢 3 · Transaccional | Ventas, pagos, anticipos, cartas firmadas | Demanda real |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # opcional: la app arranca sin credenciales
npm run dev                  # http://localhost:3000
```

**La app funciona sin configurar nada.** Sin credenciales de Gemini, `/api/audit` responde con una
auditoría determinística (`src/lib/audit.ts`) que aplica las mismas reglas del prompt: sirve para
demos y evita que una sesión real se quede parada si la API falla. La tarjeta indica siempre el
origen del veredicto.

### Gemini

Dos rutas, mismo SDK (`@google/genai`):

- **Developer API** — basta con `GEMINI_API_KEY`.
- **Vertex AI** — `GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT` y credenciales
  de aplicación por defecto.

El modelo por defecto es `gemini-1.5-flash` y se cambia con `GEMINI_MODEL`. Google está retirando
las variantes 1.5 de la API pública; si tu proyecto ya no las alcanza, apunta esa variable a un
modelo Flash vigente sin tocar código.

La llamada usa `responseSchema` (`src/lib/prompt.ts`), así que la respuesta llega como JSON tipado;
`normalizeAudit` la valida y rellena huecos para que la interfaz nunca se rompa por una respuesta
inesperada.

### Firestore

Rellena las variables `NEXT_PUBLIC_FIREBASE_*` y las sesiones se guardan en la colección
`mentorship_sessions`. Sin ellas, se guardan en `localStorage`; la insignia de la tarjeta 3 muestra
cuál de los dos destinos está activo. El SDK se carga de forma perezosa, así que no pesa en el
arranque.

`firestore.rules` trae la regla cerrada por defecto: **ábrela solo cuando tengas autenticación**,
porque el cliente escribe directo a Firestore.

## Estructura

```
src/
  app/
    api/audit/route.ts   API Route: Gemini + fallback determinístico
    layout.tsx page.tsx  Orquestación de las tres etapas
  components/            TimerHeader, IntakePanel, AuditPanel, ClosingMatrix, Gauge, …
  lib/
    prompt.ts            System instruction + responseSchema
    audit.ts             Normalizador y auditoría de respaldo
    useTimer.ts          Cronómetro anclado a reloj real (sin deriva en segundo plano)
    useSpeech.ts         Dictado con Web Speech API
    pdf.ts               One-pager en PDF + cuerpo de correo
    storage.ts           Firestore con caída a localStorage
```

## Notas de implementación

- **Cronómetro sin deriva**: cuenta contra una marca de tiempo absoluta, no sumando ticks, así que
  no se atrasa si la pestaña pasa a segundo plano.
- **Dictado**: `webkitSpeechRecognition` (Chrome, Edge, Safari). En navegadores sin soporte el botón
  se degrada a un aviso y los campos siguen siendo escribibles.
- **PDF**: se genera en el cliente con jsPDF; el botón de correo abre un `mailto:` con el mismo
  contenido en texto plano.
- **Orden en móvil**: la retícula coloca la auditoría en la columna derecha en escritorio, pero el
  DOM mantiene el orden 1 → 2 → 3 para que en móvil se lea como la sesión transcurre.

## Scripts

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```
