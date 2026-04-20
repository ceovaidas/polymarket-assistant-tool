"""
assistant_bridge.py
====================
Fono procesas: jungiasi prie Binance WebSocket, skaičiuoja bias score
iš 9 indikatorių ir kas 15s rašo signal.json kurį skaito analytics_dashboard.py

Paleisti: python assistant_bridge.py
"""

import sys, os, json, time, asyncio, requests

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

import config
import indicators as ind
from feeds import State, ob_poller, binance_feed

SIGNAL_FILE    = os.path.join(os.path.dirname(__file__), "signal.json")
WRITE_INTERVAL = 15   # sekundės

# ─────────────────────────────────────────────────────────────────
def compute_signal(st: State) -> dict:
    """Naudoja originalią bias_score() funkciją — –100..+100."""
    if not st.mid or not st.klines:
        return {"trend": "NEUTRAL", "bias_pct": 50, "score_raw": 0,
                "btc_price": None, "details": {}, "updated": time.strftime("%Y-%m-%d %H:%M:%S")}

    raw = ind.bias_score(st.bids, st.asks, st.mid, st.trades, st.klines)
    # raw: –100..+100 → bias_pct: 0..100
    bias_pct = 50 + raw / 2

    trend = "BULLISH" if bias_pct >= 55 else "BEARISH" if bias_pct <= 45 else "NEUTRAL"

    # Papildoma info
    rsi_v     = ind.rsi(st.klines)
    cvd5      = ind.cvd(st.trades, 300)
    ema_s, ema_l = ind.emas(st.klines)
    _, _, macd_h = ind.macd(st.klines)
    obi_v     = ind.obi(st.bids, st.asks, st.mid)

    return {
        "trend":     trend,
        "bias_pct":  round(bias_pct, 1),
        "score_raw": round(raw, 1),
        "btc_price": round(st.mid, 1),
        "details": {
            "rsi":      round(rsi_v, 1) if rsi_v else None,
            "cvd_5m":   round(cvd5 / 1e6, 2),
            "ema_cross": f"{round(ema_s,1)}/{round(ema_l,1)}" if ema_s and ema_l else None,
            "macd_hist": round(macd_h, 2) if macd_h else None,
            "obi":       round(obi_v * 100, 1),
        },
        "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

# ─────────────────────────────────────────────────────────────────
async def write_loop(state: State):
    """Kas WRITE_INTERVAL sek apskaičiuoja ir rašo signal.json."""
    await asyncio.sleep(5)   # laukiam kol WebSocket prisijungs
    while True:
        try:
            sig = compute_signal(state)
            with open(SIGNAL_FILE, "w") as f:
                json.dump(sig, f, indent=2)
            col = "\033[92m" if sig["trend"]=="BULLISH" else "\033[91m" if sig["trend"]=="BEARISH" else "\033[93m"
            print(f"\r  📊 BTC {sig['btc_price']}  "
                  f"Bias: {col}{sig['trend']}\033[0m ({sig['bias_pct']}%)  "
                  f"RSI:{sig['details']['rsi']}  "
                  f"CVD:{sig['details']['cvd_5m']}M  "
                  f"OBI:{sig['details']['obi']}%  "
                  f"[{sig['updated']}]    ", end="", flush=True)
        except Exception as e:
            print(f"\n⚠️ Klaida: {e}")
        await asyncio.sleep(WRITE_INTERVAL)

async def main():
    print("\033[95m\033[1m")
    print("  ╔══════════════════════════════════════════════════╗")
    print("  ║   📡  ASSISTANT BRIDGE — BTC Signal Writer      ║")
    print("  ╚══════════════════════════════════════════════════╝")
    print("\033[0m")
    print(f"  Rašo į:        {SIGNAL_FILE}")
    print(f"  Atnaujinimas:  kas {WRITE_INTERVAL}s")
    print(f"  Skaito:        analytics_dashboard.py automatiškai")
    print(f"  Ctrl+C sustabdyti\n")

    state = State()
    binance_sym = config.COIN_BINANCE["BTC"]

    # Pradiniai klines
    try:
        r = requests.get(
            f"{config.BINANCE_REST}/klines",
            params={"symbol": binance_sym, "interval": "1m", "limit": config.KLINE_BOOT},
            timeout=10
        )
        if r.status_code == 200:
            state.klines = [
                {"o": float(k[1]), "h": float(k[2]), "l": float(k[3]),
                 "c": float(k[4]), "v": float(k[5]), "t": k[0]/1000}
                for k in r.json()
            ]
            print(f"  ✅ Pradinis load: {len(state.klines)} žvakių (1m)")
    except Exception as e:
        print(f"  ⚠️ Klines klaida: {e}")

    print("  🔌 Jungiamasi prie Binance WebSocket...")
    await asyncio.gather(
        ob_poller(binance_sym, state),
        binance_feed("BTC", "1m", state),
        write_loop(state),
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n  👋 Bridge sustabdytas.\n")
