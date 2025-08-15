'use strict';

(function () {
  const fechaEl = document.getElementById('Fecha');
  const bcvEl = document.getElementById('BCV');   // Línea BCV (usd)
  const mdEl = document.getElementById('MD');     // Línea Binance
  const mpEl = document.getElementById('MP');     // Línea MidPrice (promedio) + diferencia

  const fmt = (n) => (typeof n === 'number' && isFinite(n) ? n.toFixed(2) : '—');
  const fmtPct = (n) => (typeof n === 'number' && isFinite(n) ? n.toFixed(2) + '%' : '—');

  async function getJSON(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
    return resp.json();
  }

  async function load() {
    try {
      const [binData, bcvData] = await Promise.all([
        getJSON('https://pydolarve.org/api/v2/dollar?page=binance'),
        getJSON('https://pydolarve.org/api/v2/dollar?page=bcv'),
      ]);

      const bin = binData?.monitors?.binance ?? {};
      const usd = bcvData?.monitors?.usd ?? {};

      // Fecha / última actualización (mostrar ambas)
      const updBCV = usd.last_update || '—';
      const updBIN = bin.last_update || '—';
      fechaEl.textContent = `Actualización • BCV: ${updBCV} | Binance: ${updBIN}`;

      // ---------- BCV (USD oficial) ----------
      const bcvPrice = (typeof usd.price === 'number') ? usd.price : NaN;
      const bcvChange = (typeof usd.change === 'number') ? usd.change : NaN;
      const bcvPercent = (typeof usd.percent === 'number') ? usd.percent : NaN;
      bcvEl.textContent = `BCV (USD) = ${fmt(bcvPrice)} Bs • Δ ${fmt(bcvChange)} • ${usd.symbol || ''} ${fmtPct(bcvPercent)}`;
      if (usd.color) bcvEl.style.color = usd.color;

      // ---------- Binance ----------
      const binPrice = (typeof bin.price === 'number') ? bin.price : NaN;
      const binChange = (typeof bin.change === 'number') ? bin.change : NaN;
      const binPercent = (typeof bin.percent === 'number') ? bin.percent : NaN;
      mdEl.textContent = `${bin.title || 'Binance'} = ${fmt(binPrice)} Bs • Δ ${fmt(binChange)} • ${bin.symbol || ''} ${fmtPct(binPercent)}`;
      if (bin.color) mdEl.style.color = bin.color;

      // ---------- MidPrice + Spread ----------
      // MidPrice = promedio simple de ambas tasas
      const havePrices = isFinite(bcvPrice) && isFinite(binPrice);
      const mid = havePrices ? (bcvPrice + binPrice) / 2 : NaN;

      // Diferencia absoluta y % de diferencia respecto a BCV (spread vs BCV)
      const diffAbs = havePrices ? (binPrice - bcvPrice) : NaN;
      const diffPctBcv = havePrices && bcvPrice !== 0 ? (diffAbs / bcvPrice) * 100 : NaN;

      // (Opcional) Diferencia relativa simétrica usando el promedio como denominador
      const diffPctSym = havePrices && mid !== 0 ? (Math.abs(diffAbs) / mid) * 100 : NaN;

      mpEl.textContent =
        `MidPrice = ${fmt(mid)} Bs • Diferencia: ${fmt(diffAbs)} Bs • Spread: ${fmtPct(diffPctBcv)} (rel. simétrica: ${fmtPct(diffPctSym)})`;

    } catch (err) {
      console.error(err);
      fechaEl.textContent = 'Error al consultar las APIs.';
      bcvEl.textContent = '';
      mdEl.textContent = '';
      mpEl.textContent = '';
    }
  }

  // Cargar al iniciar
  load();

  // Opcional: refrescar cada 60s
  // setInterval(load, 60000);
})();