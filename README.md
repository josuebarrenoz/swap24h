# Swapping24

Este repositorio contiene dos herramientas web principales para el ecosistema de intercambio y consulta de tasas en Venezuela:

## 1. Calculadora de Conversión (`calculadora/`)

La calculadora permite convertir entre Bolívares (VES), Dólares (USD), Cash y Tether (USDT) de forma sencilla y rápida. Utiliza la tasa de Binance obtenida en tiempo real desde [pydolarve.org](https://pydolarve.org/) y aplica automáticamente una comisión estándar del 3% para simular el costo real de las operaciones.

**Características:**
- Conversión instantánea entre VES, USD, Cash y USDT.
- Actualización automática de la tasa de Binance.
- Interfaz amigable y responsiva.
- Simulación de comisión de intercambio.

**Uso:**  
Abre [calculadora/index.html](calculadora/index.html) en tu navegador y selecciona las divisas de origen y destino, ingresa el monto y obtén el resultado al instante.

---

## 2. MidPrice (`midprice/`)

MidPrice es una herramienta que muestra el precio promedio entre la tasa oficial del BCV y la tasa de Binance, permitiendo comparar el spread y visualizar la diferencia entre ambas fuentes. Los datos se obtienen en tiempo real desde [pydolarve.org](https://pydolarve.org/) y se presentan junto con la fecha de la última actualización.

**Características:**
- Consulta simultánea de la tasa BCV y Binance.
- Cálculo del precio promedio ("MidPrice") y del spread.
- Visualización clara de las diferencias y porcentajes.
- Interfaz simple y rápida.

**Uso:**  
Abre [midprice/index.html](midprice/index.html) en tu navegador para ver las tasas actualizadas y el cálculo del MidPrice.

---

## Instalación y ejecución

No se requiere instalación especial. Solo abre los archivos `index.html` de cada herramienta en tu navegador favorito.  
Para desarrollo local, puedes usar un servidor simple:

```sh
python3 -m http.server
```
