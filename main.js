/* ════════════════════════════════════
   IMÁGENES FLOTANTES — toda la página
════════════════════════════════════ */
const imagenes = [
  'recursos/float/1.JPG',
  'recursos/float/2.JPG',
  'recursos/float/3.JPG',
  'recursos/float/4.JPG',
];

const lienzo      = document.getElementById('floatCanvas');
let   contadorImg = 0;

function lanzarImagen(progresoInicial) {
  const src = imagenes[contadorImg % imagenes.length];
  contadorImg++;

  const img     = document.createElement('img');
  img.src       = src;
  img.className = 'float-img';

  const areaAncho = window.innerWidth + 400;
  const xInicio   = -200 + Math.random() * areaAncho;
  const escala    = 0.5 + Math.random() * 0.5;

  img.style.width  = (150 * escala) + 'px';
  img.style.height = (105 * escala) + 'px';
  img.style.left   = xInicio + 'px';

  const duracion  = 15000 + Math.random() * 10000;
  const amplitud  = 70    + Math.random() * 90;
  const fase      = Math.random() * Math.PI * 2;
  /* Recorrido vertical: desde el fondo de la ventana hasta bien arriba,
     cubre toda la página sin importar cuánto scroll haya */
  const altoRecorrido = window.innerHeight + document.body.scrollHeight + 400;
  const inicio    = performance.now();
  const pInicial  = progresoInicial || 0;

  lienzo.appendChild(img);

  function animar(ahora) {
    const dt       = (ahora - inicio) / duracion;
    const progreso = pInicial + dt * (1 - pInicial);

    if (progreso >= 1) { img.remove(); return; }

    const y = window.innerHeight - progreso * altoRecorrido;
    const x = xInicio + Math.sin(fase + progreso * Math.PI * 3) * amplitud;

    let op;
    if      (progreso < 0.10) op = (progreso / 0.10) * 0.5;
    else if (progreso > 0.80) op = ((1 - progreso) / 0.20) * 0.5;
    else                      op = 0.5;

    img.style.transform = `translate(${x - xInicio}px, ${y}px)`;
    img.style.opacity   = op;
    requestAnimationFrame(animar);
  }

  requestAnimationFrame(animar);
}

/* Poblar pantalla desde el inicio con imágenes ya en trayecto */
[0.08, 0.22, 0.38, 0.55, 0.70, 0.84].forEach((pos, i) => {
  setTimeout(() => lanzarImagen(pos), i * 80);
});

/* Seguir lanzando continuamente */
setTimeout(() => setInterval(() => lanzarImagen(0), 950), 600);

/* ════════════════════════════════════
   ANTI-SPAM
════════════════════════════════════ */
const tiempos = {};
function puedeEjecutar(clave, ms = 400) {
  const ahora = Date.now();
  if (ahora - (tiempos[clave] || 0) < ms) return false;
  tiempos[clave] = ahora;
  return true;
}

/* ════════════════════════════════════
   REVEAL DE TARJETAS AL SCROLL
════════════════════════════════════ */
const tarjetas = document.querySelectorAll('.servicio-card');

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

tarjetas.forEach(t => revealObs.observe(t));

/* ════════════════════════════════════
   CATEGORÍA EN NAVBAR AL SCROLL
════════════════════════════════════ */
const navCategoria = document.getElementById('navCategoria');
const anchors      = document.querySelectorAll('.categoria-anchor');

/* Usamos rootMargin negativo para detectar cuando el anchor
   cruza justo debajo del navbar */
const catObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const label = e.target.dataset.label;
      navCategoria.textContent = label;
      navCategoria.classList.add('visible');
    }
  });
}, {
  rootMargin: '-56px 0px -85% 0px',
  threshold: 0
});

anchors.forEach(a => catObs.observe(a));

/* Quitar etiqueta si volvemos al hero */
const heroObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navCategoria.textContent = '';
      navCategoria.classList.remove('visible');
    }
  });
}, { threshold: 0.1 });

heroObs.observe(document.querySelector('.hero'));

/* ════════════════════════════════════
   OVERLAY DE CONTACTO
════════════════════════════════════ */
const overlayContacto        = document.getElementById('overlayContacto');
const nombreServicioContacto = document.getElementById('nombreServicioContacto');
const campoLugar             = document.getElementById('campoLugar');
const campoFecha             = document.getElementById('campoFecha');
const btnWhatsapp            = document.getElementById('btnWhatsapp');

let servicioSeleccionado = '';

function verificarListo() {
  const ok = campoLugar.value.trim() !== '' && campoFecha.value !== '';
  btnWhatsapp.disabled = !ok;
  btnWhatsapp.classList.toggle('listo', ok);
}

function abrirContacto(nombreServicio) {
  if (!puedeEjecutar('abrirContacto')) return;
  servicioSeleccionado = nombreServicio || '';
  nombreServicioContacto.textContent = servicioSeleccionado || '–';
  campoLugar.value = '';
  campoFecha.value = '';
  btnWhatsapp.disabled = true;
  btnWhatsapp.classList.remove('listo');
  overlayContacto.classList.add('visible');
}

function cerrarContacto() {
  if (!puedeEjecutar('cerrarContacto', 300)) return;
  overlayContacto.classList.remove('visible');
}

document.getElementById('btnCerrarContacto').addEventListener('click', cerrarContacto);

overlayContacto.addEventListener('click', e => {
  if (e.target === overlayContacto) cerrarContacto();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlayContacto.classList.contains('visible')) cerrarContacto();
});

campoLugar.addEventListener('input',  verificarListo);
campoFecha.addEventListener('change', verificarListo);

/* Botón flotante (sin servicio específico) */
document.getElementById('btnContactoFlotante').addEventListener('click', () => {
  abrirContacto('');
});

/* Botones "Solicitar" por servicio */
document.querySelectorAll('.btn-solicitar').forEach(btn => {
  btn.addEventListener('click', () => abrirContacto(btn.dataset.servicio));
});

/* Botones "Demo reel" */
document.querySelectorAll('.btn-demo').forEach(btn => {
  btn.addEventListener('click', () => alert('PENDIENTE'));
});

/* ════════════════════════════════════
   WHATSAPP
════════════════════════════════════ */
btnWhatsapp.addEventListener('click', function () {
  if (btnWhatsapp.disabled || !puedeEjecutar('whatsapp', 1500)) return;
  const [a, m, d]       = campoFecha.value.split('-');
  const fechaFormateada = `${d}-${m}-${a}`;
  const servicio        = servicioSeleccionado || 'información';
  const lugar           = campoLugar.value.trim();
  const mensaje = `Hola, solicito el servicio de ${servicio} para la fecha ${fechaFormateada}.\n\nLugar del evento: ${lugar}\n\nDetalles: `;
  window.open(`https://wa.me/528124384370?text=${encodeURIComponent(mensaje)}`, '_blank');
});