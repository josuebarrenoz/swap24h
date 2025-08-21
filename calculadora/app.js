// app.js — usando TU backend FastAPI (no pydolarve)
'use strict';

const API_BASE = 'https://backendapiservices.duckdns.org';

// Comisión: 3% (igual que tu versión anterior)
const FEE = 0.97;

// ====== Utilidades DOM ======
const $ = (sel) => document.querySelector(sel);
const inputMonto = $("#numbers");
const selectTengo = $("#Tengo");
const selectQuiero = $("#Quiero");
const btnCalcular = $("#btnCalcular");
const out = $("#Resultado");

// ====== Estado ======
let tasaVESporUSD = null; // VES por 1 USD (de Binance ponderado)

// Convierte posibles strings con formato local a número JS
function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  return NaN;
}

function formatea(n, dec = 2) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : '—';
}

function setError(msg) {
  out.textContent = msg || '';
}

// ====== Fetch de tasa desde tu backend ======
async function cargarTasa() {
  // 1) Intenta /summary
  try {
    const r = await fetch(`${API_BASE}/api/rates/summary`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    const w = Number(data?.binance?.weighted_avg);
    const s = Number(data?.binance?.simple_avg);
    const f = Number(data?.binance?.first_price);

    const valor = [w, s, f].find((n) => Number.isFinite(n)); 
    if (!Number.isFinite(valor)) throw new Error('Tasa inválida en /summary');

    tasaVESporUSD = valor; // VES por USD
    return; // OK
  } catch (e) {
    console.warn('Fallo /summary, probando /rates/binance', e);
  }

  // 2) Fallback a /rates/binance
  try {
    const r2 = await fetch(`${API_BASE}/api/rates/binance?trade_type=SELL`, { cache: 'no-store' });
    if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
    const data2 = await r2.json();

    const w2 = Number(data2?.weighted_avg);
    const s2 = Number(data2?.simple_avg);
    const f2 = Number(data2?.first_price);

    const valor2 = [w2, s2, f2].find((n) => Number.isFinite(n));
    if (!Number.isFinite(valor2)) throw new Error('Tasa inválida en /rates/binance');

    tasaVESporUSD = valor2;
  } catch (err) {
    console.error(err);
    tasaVESporUSD = null;
    setError("Error al cargar la tasa (API). Intenta nuevamente.");
  }
}

// ====== Validaciones ======
function validarCampos(monto, tengo, quiero) {
  if (!Number.isFinite(monto) || monto <= 0) {
    setError("Ingresa un monto válido.");
    return false;
  }
  if (!tengo || !quiero) {
    setError("Selecciona ambas divisas.");
    return false;
  }
  if (tengo === quiero) {
    setError("Usa bien los desplegables para obtener un resultado satisfactorio.");
    return false;
  }
  if (!tasaVESporUSD) {
    setError("No hay tasa disponible aún. Intenta de nuevo en unos segundos.");
    return false;
  }
  return true;
}

// ====== Lógica de conversión ======
function calcular() {
  const monto = parseFloat(inputMonto.value);
  const tengo = selectTengo.value;  // "1"=VES; "2"=USD; "3"=USD cash; "4"=USDT
  const quiero = selectQuiero.value;

  if (!validarCampos(monto, tengo, quiero)) return;

  const esVES = (v) => v === "1";
  const esUSD = (v) => v === "2" || v === "3" || v === "4";

  let resultado = null;
  let sufijo = "";

  // VES -> USD
  if (esVES(tengo) && esUSD(quiero)) {
    resultado = (monto / tasaVESporUSD) * FEE;
    sufijo = " $";
  }
  // USD -> VES
  else if (esUSD(tengo) && esVES(quiero)) {
    resultado = (monto * tasaVESporUSD) * FEE;
    sufijo = " Bs";
  }
  // USD -> USD (entre modalidades)
  else if (esUSD(tengo) && esUSD(quiero)) {
    resultado = monto * FEE; // misma divisa, aplica fee
    sufijo = " $";
  } else {
    setError("Conversión no soportada.");
    return;
  }

  out.textContent = `Son ${formatea(resultado)}${sufijo}`;
}

// ====== Eventos ======
btnCalcular.addEventListener("click", calcular);
inputMonto.addEventListener("input", calcular);
selectTengo.addEventListener("change", calcular);
selectQuiero.addEventListener("change", calcular);

// ====== Init ======
(async () => {
  await cargarTasa();
  calcular(); // pinta inmediatamente si ya hay monto & selects
})();
