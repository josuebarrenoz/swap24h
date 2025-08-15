// app.js (usando pydolarve: Binance)
const API_URL = "https://pydolarve.org/api/v2/dollar?page=binance";
const FEE = 0.97; // 3% de comisión

const $ = (sel) => document.querySelector(sel);
const inputMonto = $("#numbers");
const selectTengo = $("#Tengo");
const selectQuiero = $("#Quiero");
const btnCalcular = $("#btnCalcular");
const out = $("#Resultado");

let tasaVESporUSD = null; // VES por 1 USD (Binance)

// Convierte posibles strings con formato local a número JS
function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // limpia separadores de miles y convierte coma decimal a punto
    const s = v.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  return NaN;
}

// Obtiene y guarda la tasa desde pydolarve (Binance)
async function cargarTasa() {
  try {
    const res = await fetch(API_URL, { cache: "no-store", mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const raw = data?.monitors?.binance?.price;
    const valor = toNumber(raw);
    if (!isFinite(valor)) throw new Error("Tasa inválida (price)");

    tasaVESporUSD = valor; // pydolarve devuelve VES por USD
  } catch (err) {
    console.error(err);
    out.textContent = "Error al cargar la tasa (Binance). Intenta nuevamente.";
  }
}

function validarCampos(monto, tengo, quiero) {
  if (!isFinite(monto) || monto <= 0) {
    out.textContent = "Ingresa un monto válido.";
    return false;
  }
  if (!tengo || !quiero) {
    out.textContent = "Selecciona ambas divisas.";
    return false;
  }
  if (tengo === quiero) {
    out.textContent = "Usa bien los desplegables para obtener un resultado satisfactorio.";
    return false;
  }
  if (!tasaVESporUSD) {
    out.textContent = "No hay tasa disponible aún. Intenta de nuevo en unos segundos.";
    return false;
  }
  return true;
}

function formatea(n, dec = 2) {
  return Number(n).toFixed(dec);
}

// Lógica de conversión
function calcular() {
  const monto = parseFloat(inputMonto.value);
  const tengo = selectTengo.value;  // "1"=VES; "2"=USD; "3"=USDc; "4"=USDT
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
    resultado = monto * FEE; // misma divisa, solo aplica fee
    sufijo = " $";
  } else {
    out.textContent = "Conversión no soportada.";
    return;
  }

  out.textContent = `Son ${formatea(resultado)}${sufijo}`;
}

// Eventos
btnCalcular.addEventListener("click", calcular);
inputMonto.addEventListener("input", calcular);
selectTengo.addEventListener("change", calcular);
selectQuiero.addEventListener("change", calcular);

// Inicializa
cargarTasa();