const URL_PREVISION = "https://api.open-meteo.com/v1/forecast";
const CORDOBA = { lat: 37.8882, lon: -4.7794 };

const graficos = {};

async function obtenerPrevision(lat, lon) {
  const url = `${URL_PREVISION}?latitude=${lat}&longitude=${lon}` +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code" +
    "&forecast_days=7&timezone=Europe%2FMadrid";

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error(error);
  }
}


function formatearFecha(texto) {
  return new Date(texto).toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short"
  });
}

function destruirGrafico(clave) {
  if (graficos[clave]) {
    graficos[clave].destroy();
  }
}

function crearGraficoTemperaturas(daily) {
  destruirGrafico(1);
  const etiquetas = daily.time.map(formatearFecha);

  graficos[1] = new Chart(document.getElementById("grafico-temperaturas"), {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Máxima (°C)",
          data: daily.temperature_2m_max,
          borderColor: "#e4572e",
          backgroundColor: "rgba(228, 87, 46, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5
        },
        {
          label: "Mínima (°C)",
          data: daily.temperature_2m_min,
          borderColor: "#2f80ed",
          backgroundColor: "rgba(47, 128, 237, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1500, easing: "easeInOutQuart" },
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          title: { display: true, text: "Temperatura (°C)" },
          grid: { color: "rgba(0,0,0,0.1)" }
        },
        x: {
          title: { display: true, text: "Fecha" },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficoPrecipitaciones(daily) {
  destruirGrafico(2);
  const etiquetas = daily.time.map(formatearFecha);

  graficos[2] = new Chart(document.getElementById("grafico-precipitaciones"), {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Precipitación (mm)",
        data: daily.precipitation_sum,
        backgroundColor: "rgba(27, 153, 139, 0.7)",
        borderColor: "#1b998b",
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1500, easing: "easeOutBounce" },
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Precipitación (mm)" },
          grid: { color: "rgba(0,0,0,0.1)" }
        },
        x: {
          title: { display: true, text: "Fecha" },
          grid: { display: false }
        }
      }
    }
  });
}

function crearGraficoViento(daily) {
  destruirGrafico(3);

  graficos[3] = new Chart(document.getElementById('grafico-viento'), {
    type: 'pie',
    data: {
      labels: daily.time.map(formatearFecha),
      datasets: [{
        label: 'Viento máximo (km/h)',
        data: daily.wind_speed_10m_max,
        backgroundColor: ['#7a5cc7', '#2f80ed', '#1b998b', '#aee113', '#ffc400', '#e4572e', '#d348c7'],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 2000, easing: 'easeInOutQuart' },
      plugins: {
        title: {
          display: true,
          text: 'Viento máximo por día',
          font: { family: 'Georgia', size: 18, weight: 'bold' },
          color: '#7a5cc7'
        },
        subtitle: {
          display: true,
          text: 'Velocidad máxima diaria (km/h)',
          font: { size: 12, style: 'italic' }
        },
        legend: {
          position: 'right',
          labels: { font: { size: 13 }, color: '#333', usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: (contexto) => ` ${contexto.parsed} km/h`
          }
        }
      }
    }
  });
}


function describirTiempo(codigo) {
  if (codigo === 0) return 'Despejado';
  if (codigo <= 3) return 'Nubosidad';
  if (codigo === 45 || codigo === 48) return 'Niebla';
  if (codigo >= 51 && codigo <= 57) return 'Llovizna';
  if (codigo >= 61 && codigo <= 67) return 'Lluvia';
  if (codigo >= 71 && codigo <= 77) return 'Nieve';
  if (codigo >= 80 && codigo <= 82) return 'Chubascos';
  if (codigo === 85 || codigo === 86) return 'Chubascos de nieve';
  if (codigo >= 95) return 'Tormenta';
  return 'Otro';
}

const COLORES_TIEMPO = {
  'Despejado': '#ffc400',
  'Nubosidad': '#9aa5b8',
  'Niebla': '#c9d1dc',
  'Llovizna': '#61bed5',
  'Lluvia': '#2f80ed',
  'Chubascos': '#1b998b',
  'Nieve': '#e8f1fb',
  'Chubascos de nieve': '#b7d3f2',
  'Tormenta': '#7a5cc7',
  'Otro': '#555555'
};

function crearGraficoTiempo(daily) {
  destruirGrafico(4);

  const conteo = {};
  daily.weather_code.forEach(codigo => {
    const tipo = describirTiempo(codigo);
    conteo[tipo] = (conteo[tipo] || 0) + 1;
  });

  const etiquetas = Object.keys(conteo);
  const valores = Object.values(conteo);

  graficos[4] = new Chart(document.getElementById('grafico-tiempo'), {
    type: 'doughnut',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Días',
        data: valores,
        backgroundColor: etiquetas.map(tipo => COLORES_TIEMPO[tipo]),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 20,
        spacing: 4,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      animation: { duration: 2000, easing: 'easeInOutQuart', animateRotate: true, animateScale: true },
      plugins: {
        title: {
          display: true,
          text: 'Tipo de tiempo previsto',
          font: { family: 'Georgia', size: 18, weight: 'bold' },
          color: '#2457c5'
        },
        subtitle: {
          display: true,
          text: 'Número de días según el código meteorológico',
          font: { size: 12, style: 'italic' }
        },
        legend: {
          position: 'right',
          labels: { font: { size: 13 }, color: '#333', usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: (contexto) => ` ${contexto.parsed} día(s)`
          }
        }
      }
    }
  });
}

const URL_GEOCODIFICACION = "https://geocoding-api.open-meteo.com/v1/search";


const formBusqueda = document.getElementById("form-busqueda");
const inputLocalidad = document.getElementById("localidad");
const btnBuscar = document.getElementById("btn-buscar");
const estado = document.getElementById("estado");
const nombreLocalidad = document.getElementById("nombre-localidad");


function mostrarEstado(texto, esError = false) {
  estado.textContent = texto;
  estado.classList.toggle("estado--error", esError);
  estado.hidden = false;
}

function ocultarEstado() {
  estado.hidden = true;
}

async function buscarLocalidad(nombre) {
  const url = `${URL_GEOCODIFICACION}?name=${encodeURIComponent(nombre)}` +
    "&count=1&language=es&format=json";

  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

  const datos = await respuesta.json();
  if (!datos.results || datos.results.length === 0) {
    throw new Error(`No se ha encontrado "${nombre}"`);
  }

  const lugar = datos.results[0];
  return {
    nombre: lugar.country ? `${lugar.name} (${lugar.country})` : lugar.name,
    lat: lugar.latitude,
    lon: lugar.longitude
  };
}



const elTempMax = document.getElementById("temp-max");
const elTempMin = document.getElementById("temp-min");
const elPrecipTotal = document.getElementById("precip-total");
const elVientoMax = document.getElementById("viento-max");
const elTempMaxDia = document.getElementById("temp-max-dia");
const elTempMinDia = document.getElementById("temp-min-dia");
const elVientoMaxDia = document.getElementById("viento-max-dia");
const elFechaConsulta = document.getElementById("fecha-consulta");

function pintarTarjetas(daily) {
  const tMax = Math.max(...daily.temperature_2m_max);
  const tMin = Math.min(...daily.temperature_2m_min);
  const viento = Math.max(...daily.wind_speed_10m_max);
  const lluvia = daily.precipitation_sum.reduce((suma, mm) => suma + mm, 0);

  const diaMax = daily.time[daily.temperature_2m_max.indexOf(tMax)];
  const diaMin = daily.time[daily.temperature_2m_min.indexOf(tMin)];
  const diaViento = daily.time[daily.wind_speed_10m_max.indexOf(viento)];

  elTempMax.textContent = tMax.toFixed(1);
  elTempMin.textContent = tMin.toFixed(1);
  elPrecipTotal.textContent = lluvia.toFixed(1);
  elVientoMax.textContent = viento.toFixed(1);

  elTempMaxDia.textContent = formatearFecha(diaMax);
  elTempMinDia.textContent = formatearFecha(diaMin);
  elVientoMaxDia.textContent = formatearFecha(diaViento);
}

function pintarFechaConsulta() {
  elFechaConsulta.textContent = new Date().toLocaleString("es-ES");
}



async function cargarPanel(lat, lon, nombre) {
  mostrarEstado("Cargando datos…");
  btnBuscar.disabled = true;

  try {
    const datos = await obtenerPrevision(lat, lon);
    if (!datos) throw new Error("No se pudo obtener la previsión");

    nombreLocalidad.textContent = nombre;
    crearGraficoTemperaturas(datos.daily);
    crearGraficoPrecipitaciones(datos.daily);
    crearGraficoViento(datos.daily);
    crearGraficoTiempo(datos.daily);
    pintarTarjetas(datos.daily);
    pintarFechaConsulta();
    ocultarEstado();
  } catch (error) {
    mostrarEstado(error.message, true);
  } finally {
    btnBuscar.disabled = false;
  }
}

formBusqueda.addEventListener("submit", async (evento) => {
  evento.preventDefault(); 

  const texto = inputLocalidad.value.trim();
  if (!texto) return;

  try {
    mostrarEstado("Buscando localidad…");
    const lugar = await buscarLocalidad(texto);
    await cargarPanel(lugar.lat, lugar.lon, lugar.nombre);
  } catch (error) {
    mostrarEstado(error.message, true);
  }
});

cargarPanel(CORDOBA.lat, CORDOBA.lon, "Córdoba");

