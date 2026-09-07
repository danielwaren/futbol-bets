# Mercados y combinadas

## Catálogo

Todo sale de `packages/core/src/services/odds/leagues.ts` (`MARKETS`). Para el
selector del formulario usa `BETTABLE_MARKETS`, nunca `MARKET_LIST`: este último
incluye `parlay`, que no es apostable (es la fila madre de una combinada).

| Mercado | Línea | Cuota | Se resuelve con |
|---|---|---|---|
| `1x2` | — | feed | marcador (The Odds API `/scores`) |
| `goals` | 2.5 | feed | marcador |
| `btts` | — | feed | marcador |
| `corners` | 9.5 | feed (`totals_corners`) | estadísticas (API-Football) |
| `cards` | 4.5 | feed (`totals_cards`) | estadísticas |
| `shots` | 24.5 | **manual** | estadísticas |
| `shots_on_target` | 8.5 | **manual** | estadísticas |

**Tiros y tiros a puerta no tienen cuota de mercado a nivel partido.** Los
bookies solo los ofrecen como *player props* (`player_shots`,
`player_shots_on_target`), así que la cuota la escribe el usuario. El resultado
sí se resuelve solo, porque API-Football sí da los totales del partido.

Convenciones: los totales son **de los dos equipos sumados**; las tarjetas son
**amarillas + rojas**; una línea `.5` nunca empata y una línea entera que
coincide exactamente con el total es *push* (`void`, reembolso).

## Combinadas

La fila de `bets` es la madre (`kind = 'parlay'`, `market = 'parlay'`) y guarda
el stake y la **cuota efectiva**. Cada selección vive en `bet_legs`. La banca
sigue moviéndose solo por `bets`, vía el trigger `bets_recalc` de siempre.

```
bets (kind='parlay', odds=cuota efectiva, stake)
  └── bet_legs (una fila por selección, con su propio status)
```

Reglas, en `resolveParlay` (core) y `recalc_parlay` (SQL) — **son espejo, si
cambias una cambia la otra**:

- una pata perdida → combinada perdida, aunque queden partidos por jugar
- todas ganadas → ganada
- una pata anulada **sale del producto**: la cuota efectiva baja y el premio con
  ella (no tumba la combinada)
- todas anuladas → anulada, cuota 1, reembolso

Cuando una pata cambia de estado, el trigger `bet_legs_recalc` recalcula la
madre y eso dispara `bets_recalc`, que ajusta la banca. No hay que tocar nada a
mano desde el cliente.

Se crean con el RPC `create_parlay(bankroll_id, stake, notes, legs jsonb)`, no
con dos inserts: así la madre y las patas entran en la misma transacción. Si una
liga está bloqueada por el plan, falla todo y no queda una combinada huérfana.
Valida además: 2–12 patas, y **un partido no puede aparecer dos veces** (las
selecciones del mismo partido están correlacionadas).

En la UI: pestaña Partidos → chip **Combinada** → tocar cuotas de partidos
distintos → cupón flotante (`BetSlipBar`) → `BetSlipSheet` para el monto.

## Presupuesto de las APIs

Esto es lo que rompe el sistema si se descuida.

**The Odds API — plan gratis: 500 créditos/mes (~16/día).** Cada llamada cuesta
`mercados × regiones`. El 2026-09-03 la cuota se agotó en tres días porque
`refresh-odds` tenía `deep = Boolean(body.deep) || isCron`: el cron "light" de
cada 3 horas también hacía la pasada profunda sobre las 10 ligas.

Frenos actuales (`refresh-odds`):

1. Solo se refrescan las ligas que algún usuario tiene **realmente elegidas**
   (`activeLeagues()`); en el plan free cada uno solo puede apostar en 3.
2. `deep` mira los partidos más próximos, con tope `DEEP_EVENT_CAP`.
3. Por debajo de `LOW_CREDITS` se degrada a lo básico.
4. Un 401 por cuota aborta la corrida entera en vez de repetir el error por liga.

Cron (migración `0012`): light 1×/día, deep día por medio, settle cada 2 horas.
Con 3 ligas activas eso cabe justo en los 500/mes.

**Si quieres cuotas de córners y tarjetas frescas a diario, el plan gratis no
da.** Son ~2-3 créditos por partido y por corrida. Ahí hay que subir de plan en
the-odds-api.com; el código ya lo aprovecha solo subiendo la frecuencia del cron
y `DEEP_EVENT_CAP`.

**API-Football — plan gratis: 100 requests/día.** Solo se usa para las
estadísticas que The Odds API no da. Cuesta 1 request por día de partidos + 1
por partido, con tope `AF_BUDGET` por corrida, y el resultado se guarda en
`match_stats_cache` (un partido terminado ya no cambia, así que se pide una vez).
Necesita el secret `API_FOOTBALL_KEY`; sin él los mercados de estadísticas se
resuelven a mano y el resto sigue funcionando.

### Emparejar equipos entre las dos APIs

Los ids no coinciden, así que `settle-bets` cruza por nombre normalizado
(`normalizeTeam` + `sameTeam`). Está deliberadamente **conservador**: exige que
todos los tokens largos del nombre corto estén en el largo. Con "comparten
alguno" bastaba y *Manchester City* casaba con *Manchester United* — resolver
mal una apuesta es mucho peor que no resolverla, y lo que no casa simplemente
queda pendiente y se reintenta.

No amplíes `CLUB_NOISE` con `city`, `united` o `real`: son justo lo que
distingue a unos clubes de otros. Para ciudades escritas distinto en cada feed
(Munich/München) está `CITY_ALIASES`.
