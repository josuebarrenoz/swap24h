'use strict';

(function () {
  // === CONFIG ===
  const API_BASE = 'https://backendapiservices.duckdns.org'; // tu backend FastAPI
  const SUMMARY_ENDPOINT = `${API_BASE}/api/rates/summary`;

  // === ELEMENTOS DEL DOM (de tu index.html) ===
  const elFecha = document.getElementById('Fecha');
  const elBCV   = document.getElementById('BCV');
  const elMD    = document.getElementById('MD'); // Binance
  const elMP    = document.getElementById('MP'); // MidPrice y spreads

  // === HELPERS ===
  const nf = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pf = (n) => (Number.isFinite(n) ? `${nf.format(n)}%` : '—');
  const sf = (n) => (Number.isFinite(n) ? nf.format(n) : '—');

  function setError(el, isError) {
    if (!el) return;
    el.style.color = isError ? '#ff4444' : ''; // usa color por defecto del tema cuando no hay error
  }

  async function getJSON(url, { timeoutMs = 12000 } = {}) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(id);
    }
  }

  function paintSummary(sum) {
    // Fecha/actualización
    elFecha.textContent = `Actualización • ${sum?.last_update ?? ''}`;

    // Valores base
    const bcv  = Number(sum?.bcv?.price);
    const binW = Number(sum?.binance?.weighted_avg);

    // Mid & spreads (vienen calculados en el backend, pero recalculamos por seguridad)
    const mid       = Number.isFinite(bcv) && Number.isFinite(binW) ? (bcv + binW) / 2 : NaN;
    const diffAbs   = Number.isFinite(bcv) && Number.isFinite(binW) ? (binW - bcv) : NaN;
    const spreadBcv = Number.isFinite(diffAbs) && bcv ? (diffAbs / bcv) * 100 : NaN;
    const spreadSym = Number.isFinite(diffAbs) && Number.isFinite(mid) && mid
      ? (Math.abs(diffAbs) / mid) * 100
      : NaN;

    // BCV
    elBCV.textContent = `BCV (USD) = ${sf(bcv)} Bs`;
    setError(elBCV, !Number.isFinite(bcv));

    // Binance
    elMD.textContent = `Binance P2P (SELL) = ${sf(binW)} Bs (prom. ponderado)`;
    setError(elMD, !Number.isFinite(binW));

    // Mid & spreads
    elMP.textContent =
      `MidPrice = ${sf(mid)} Bs • Diferencia: ${sf(diffAbs)} Bs • ` +
      `Spread: ${pf(spreadBcv)} (rel. simétrica: ${pf(spreadSym)})`;
    setError(elMP, !Number.isFinite(mid));
  }

  async function loadOnce() {
    try {
      // 1) Intento con /summary (1 sola llamada)
      const sum = await getJSON(SUMMARY_ENDPOINT);
      paintSummary(sum);
    } catch (err) {
      console.error('Error /summary:', err);

      // 2) Fallback: dos llamadas separadas si /summary no existe o falla
      try {
        const [bcv, bin] = await Promise.all([
          getJSON(`${API_BASE}/api/rates/bcv`),
          getJSON(`${API_BASE}/api/rates/binance?trade_type=SELL`),
        ]);

        const sumLike = {
          last_update: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
          bcv: { price: Number(bcv?.price) },
          binance: { weighted_avg: Number(bin?.weighted_avg ?? bin?.simple_avg ?? bin?.first_price) },
        };
        paintSummary(sumLike);
      } catch (e2) {
        console.error('Error fallback bcv/binance:', e2);
        // Mensajes de error visibles
        elFecha.textContent = 'Error al consultar la API.';
        elBCV.textContent = elMD.textContent = elMP.textContent = '';
        setError(elBCV, true); setError(elMD, true); setError(elMP, true);
      }
    }
  }

  // Primer render inmediato
  loadOnce();

  // Auto-actualización cada 60 s (opcional)
  // const REFRESH_MS = 60_000;
  // setInterval(loadOnce, REFRESH_MS);
})();
