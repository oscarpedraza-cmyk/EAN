# Mentoría 2 · Evidencia, métricas y decisiones

Tablero para conducir el encuentro de **Mentoría 2** de la Ruta de Crecimiento Inteligente
(Electiva I, semana 6). Está construido sobre la *Guía para mentores* del curso: su ruta de
conversación, sus tres herramientas de referencia y su chequeo de cierre.

El encuentro asume equipos que **ya ejecutaron un plan**. No se formulan hipótesis desde cero:
se reconstruye lo ejecutado, se audita la evidencia, se interpretan las métricas contra su línea
base y se define un segundo ciclo.

> Resultado esperado del encuentro: *resultados interpretados y segundo ciclo de ejecución definido.*

## La ruta de conversación

| Paso | Qué pasa |
|---|---|
| **01 · Reconstruir lo ejecutado** | Plan acordado frente a acciones realizadas, con las desviaciones reconocidas. |
| **02 · Examinar la evidencia** | Una fila por acción: acción · **soporte** · resultado · tipo de evidencia · aprendizaje. |
| **03 · Interpretar las métricas** | Métrica · definición · **fuente** · **línea base** · **umbral previo** · resultado. |
| **04 · Localizar el bloqueo** | Auditoría con IA: confiabilidad, contradicciones, bloqueo entre siete, pre-mortem. |
| **05 · Diseñar el segundo ciclo** | Decisión sustentada, diseño del ciclo, chequeo de cierre y ficha del encuentro. |

## Las tres reglas que hacen el trabajo

**Sin soporte no hay evidencia.** Cada acción exige nombrar dónde está el dato. Una fila sin
soporte queda marcada en rojo y su confiabilidad **nunca supera 30**, sin importar lo bueno que
suene el resultado. Ese techo se aplica en el servidor (`normalizarInterpretacion`), así que
tampoco lo puede levantar el modelo.

**Ninguna cifra se lee sola.** La interpretación contrasta cada resultado con su línea base, su
umbral fijado de antemano y su tamaño de muestra, y dice explícitamente qué está concluyendo el
equipo desde una muestra que todavía no lo permite.

**El aprendizaje se protege.** Una prueba que no alcanza el umbral es valiosa si revela por qué.
La auditoría siempre rescata qué se aprendió, incluso —sobre todo— cuando el resultado fue malo.

## El pre-mortem: por qué la IA no predice resultados

La app **no estima el resultado del próximo experimento**, y es una decisión deliberada: un número
inventado por un modelo es una cifra sin comportamiento detrás, exactamente lo que esta sesión
enseña a rechazar. En su lugar hace tres cosas verificables antes de ejecutar:

1. **Muestra mínima.** Aritmética sobre el umbral que escribió el equipo: con un umbral del 20%
   hacen falta al menos 25 observaciones para que el resultado no dependa de una sola respuesta.
   Si el diseño contempla 18, la app lo dice: *no van a poder decidir*.
2. **Mapa de decisión**, comprometido antes de ejecutar: qué resultado concreto lleva a Mantener,
   cuál a Ajustar, cuál a Detener y qué hallazgo abriría Explorar. Con números, no con adjetivos.
3. **Variables**: cuál sola cambiar en el segundo ciclo y cuáles congelar para que el resultado
   sea atribuible.

El botón **«Revisar este diseño»** del paso 05 vuelve a correr el pre-mortem con el segundo ciclo
ya escrito. Cuando algo cambia después de auditar, la tarjeta lo advierte en vez de mostrar una
lectura vieja.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3000
```

**La app funciona sin configurar nada.** Sin credenciales de Gemini, `/api/interpretar` responde
con el motor local (`src/lib/motorLocal.ts`), que aplica las mismas reglas de la guía de forma
determinística: el techo por falta de soporte, la comparación contra umbral y línea base, y la
aritmética de la muestra mínima. La tarjeta indica siempre el origen de la lectura.

### Gemini

Dos rutas, mismo SDK (`@google/genai`): **Developer API** con `GEMINI_API_KEY`, o **Vertex AI**
con `GOOGLE_GENAI_USE_VERTEXAI=true` y `GOOGLE_CLOUD_PROJECT`. El modelo por defecto es
`gemini-1.5-flash` y se cambia con `GEMINI_MODEL`. Google está retirando las variantes 1.5 de la
API pública; si tu proyecto ya no las alcanza, apunta esa variable a un Flash vigente sin tocar
código. La llamada usa `responseSchema`, y `normalizarInterpretacion` valida la respuesta antes de
que llegue a pantalla.

### Firestore

Con las variables `NEXT_PUBLIC_FIREBASE_*` los encuentros se guardan en la colección
`mentorias_ci`; sin ellas, en `localStorage`. La insignia del paso 05 muestra cuál está activo.
`firestore.rules` viene cerrado: **ábrelo solo cuando haya autenticación**, porque el cliente
escribe directo a Firestore.

## Estructura

```
src/
  app/
    api/interpretar/route.ts   Gemini + respaldo determinístico
    page.tsx                   Orquestación de los cinco pasos
  componentes/                 Cabecera, PasoEjecucion, PasoEvidencia, PasoMetricas,
                               PasoInterpretacion, PasoCierre, Medidor, Dictado
  lib/
    guia.ts                    Vocabulario de la guía: pasos, bloqueos, decisiones, chequeo
    prompt.ts                  System instruction + responseSchema
    analisis.ts                Normalizador y techo por falta de soporte
    motorLocal.ts              Auditoría determinística y aritmética del pre-mortem
    ficha.ts                   Ficha del encuentro en PDF + cuerpo de correo
    useDictado.ts              Dictado con Web Speech API
    almacenamiento.ts          Firestore con caída a localStorage
```

Todo el vocabulario visible sale de `guia.ts`, para que coincida palabra por palabra con lo que
el equipo ve en la sesión.

## Notas de implementación

- **Paleta** tomada del tema de la plantilla institucional: casco `#042433`, cian `#0a7fa0`,
  menta `#00d494`, ladrillo `#be4b4b`.
- **Bloqueos**: los siete de la guía (segmento, oferta, canal, operación, tecnología, alianzas,
  financiamiento), agrupados por la pregunta de tres vías (demanda / oferta / capacidad).
- **Ficha en PDF**: se genera en el cliente con jsPDF, pagina sola y solo se habilita cuando hay
  decisión registrada y los seis puntos del chequeo verificados.
- **Dictado**: `webkitSpeechRecognition` (Chrome, Edge, Safari); donde no hay soporte el botón se
  degrada y los campos siguen escribiéndose a mano.
- **Orden en móvil**: dos columnas independientes en escritorio que se apilan en 01→05 en móvil,
  sin huecos por alineación de filas.
- **Cronómetro**: cuenta hacia arriba, no hacia abajo. La guía no fija duración: informa sin presionar.

## Scripts

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```
