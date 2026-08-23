# KD SCREENER

Базовый модуль скринера XAUUSD. Текущий этап намеренно ограничен рыночным слоем: realtime tick ingestion, 5M candle aggregation и базовый market-structure state.

## Сейчас
- XAUUSD quote panel (Bid / Ask / Last)
- Demo stream для проверки UI без внешнего API
- WebSocket adapter: `window.KDScreener.connectWebSocket(url)`
- агрегация тиков в 5M свечи
- базовая отрисовка свечей
- счётчики ticks / candles
- заготовка Previous High / Previous Low без придуманной session-логики

## Следующий этап
1. Подключить реальный MT5 bridge.
2. Получать tick stream XAUUSD из MT5 Demo.
3. Зафиксировать правила сессии и расчёт Previous High/Low.
4. После проверки data layer добавить FVG / IFVG / Pin Bar / Range / confirmation.

## Принцип
Не добавлять торговые сигналы до тех пор, пока источник данных и правила формирования свечей/сессий не проверены.
