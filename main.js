/* ════════════════════════════════════
   IMÁGENES FLOTANTES
════════════════════════════════════ */
const imagenes = [
  'recursos/float/1.JPG',
  'recursos/float/2.JPG',
  'recursos/float/3.JPG',
  'recursos/float/4.JPG',
];

const lienzo      = document.getElementById('floatCanvas');
const ancho       = () => lienzo.offsetWidth;
const alto        = () => lienzo.offsetHeight;
let   contadorImg = 0;

function lanzarImagen(progresoInicial) {
  const src   = imagenes[contadorImg % imagenes.length];
  contadorImg++;

  const img     = document.createElement('img');
  img.src       = src;
  img.className = 'float-img';

  const areaAncho = ancho() + 400;
  const xInicio   = -200 + Math.random() * areaAncho;
  const escala    = 0.6 + Math.random() * 0.5;

  img.style.width  = (180 * escala) + 'px';
  img.style.height = (120 * escala) + 'px';
  img.style.left   = xInicio + 'px';

  const duracion    = 10000 + Math.random() * 8000;
  const amplitud    = 100   + Math.random() * 100;
  const fase        = Math.random() * Math.PI * 2;
  const alturaTotal = alto() + 1000;
  const inicio      = performance.now();
  const pInicial    = progresoInicial || 0;

  lienzo.appendChild(img);

  function animar(ahora) {
    const dt       = (ahora - inicio) / duracion;
    const progreso = pInicial + dt * (1 - pInicial);

    if (progreso >= 1) { img.remove(); return; }

    const y = alto() - progreso * alturaTotal;
    const x = xInicio + Math.sin(fase + progreso * Math.PI * 3) * amplitud;

    let opacidad;
    if      (progreso < 0.12) opacidad = (progreso / 0.12) * 0.6;
    else if (progreso > 0.78) opacidad = ((1 - progreso) / 0.22) * 0.6;
    else                      opacidad = 0.6;

    img.style.transform = `translate(${x - xInicio}px, ${y}px)`;
    img.style.opacity   = opacidad;
    requestAnimationFrame(animar);
  }

  requestAnimationFrame(animar);
}

/* Poblar pantalla desde el inicio con imágenes ya en trayecto */
[0.15, 0.30, 0.50, 0.65, 0.78].forEach((pos, i) => {
  setTimeout(() => lanzarImagen(pos), i * 80);
});

/* Seguir lanzando nuevas normalmente */
setTimeout(() => setInterval(() => lanzarImagen(0), 800), 400);

/* ════════════════════════════════════
   DATOS DE SERVICIOS
════════════════════════════════════ */
const serviciosData = {
  social: [
    {
      titulo:      'Boda',
      descripcion: 'Cobertura completa de bodas con fotografía y video profesional, edición incluida y entrega digital.',
      imagen:      'recursos/slider/boda.JPG',
      icono:       'boda.png'
    },
    {
      titulo:      'XV Años',
      descripcion: 'Producción de XV años con la mejor calidad, capturando cada momento especial de esta celebración única.',
      imagen:      'recursos/slider/xv.JPG',
      icono:       'xv.png'
    }
  ],
  corporate: [
    {
      titulo:      'CCTV',
      descripcion: 'Instalación y mantenimiento de sistemas de videovigilancia para tu empresa o negocio.',
      imagen:      'recursos/slider/placeholder.jfif',
      icono:       'cctv.png'
    },
    {
      titulo:      'Grabación de Eventos',
      descripcion: 'Cobertura profesional de conferencias, convenciones y eventos corporativos.',
      imagen:      'recursos/slider/placeholder.jfif',
      icono:       'grabacion.png'
    }
  ]
};

let categoriaActual   = 'social';
let indiceActual      = 0;
let serviciosActuales = serviciosData.social;

/* ════════════════════════════════════
   PROTECCIÓN ANTI-SPAM
════════════════════════════════════ */
const tiemposUltimaAccion = {};

function puedeEjecutar(clave, retardoMs = 500) {
  const ahora = Date.now();
  if (ahora - (tiemposUltimaAccion[clave] || 0) < retardoMs) return false;
  tiemposUltimaAccion[clave] = ahora;
  return true;
}

/* ════════════════════════════════════
   ELEMENTOS DEL POPUP DE CATEGORÍA
════════════════════════════════════ */
const popupOverlay      = document.getElementById('popupCategoria');
const popupImg          = document.getElementById('popupServiceImage');
const popupDesc         = document.getElementById('popupServiceDescription');
const popupOverlayCnt   = document.getElementById('popupServiceOverlay');
const popupPrev         = document.getElementById('popupPrevBtn');
const popupNext         = document.getElementById('popupNextBtn');
const popupDemoBtn      = document.getElementById('popupDemoButton');
const popupSolicitarBtn = document.getElementById('popupSolicitarButton');

/* ════════════════════════════════════
   ACTUALIZAR SLIDER
════════════════════════════════════ */
function actualizarSlider(direccion) {
  const servicio = serviciosActuales[indiceActual];
  const salida   = direccion === 'next' ? '-24px' : '24px';
  const entrada  = direccion === 'next' ?  '24px' : '-24px';

  popupImg.style.opacity   = '0';
  popupImg.style.transform = `translateX(${salida})`;
  popupDesc.classList.remove('visible');
  popupOverlayCnt.style.opacity = '0';

  setTimeout(() => {
    popupImg.src          = servicio.imagen;
    popupImg.alt          = servicio.titulo;
    popupDesc.textContent = servicio.descripcion;

    const rutaIcono = `recursos/slider/iconos/${servicio.icono}`;
    popupOverlayCnt.innerHTML = `
      <img src="${rutaIcono}" class="service-icon-img" alt="${servicio.titulo}">
      <span class="popup-service-title">${servicio.titulo}</span>
    `;

    popupImg.style.transition = 'none';
    popupImg.style.transform  = `translateX(${entrada})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popupImg.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
        popupImg.style.opacity    = '1';
        popupImg.style.transform  = 'translateX(0)';
        popupOverlayCnt.style.opacity = '1';
        setTimeout(() => popupDesc.classList.add('visible'), 80);
      });
    });
  }, 280);
}

/* ════════════════════════════════════
   CAMBIAR SLIDE
════════════════════════════════════ */
function cambiarSlide(direccion) {
  if (!puedeEjecutar('slider', 600)) return;

  if (direccion === 'next') {
    indiceActual = (indiceActual + 1) % serviciosActuales.length;
  } else {
    indiceActual = (indiceActual - 1 + serviciosActuales.length) % serviciosActuales.length;
  }

  actualizarSlider(direccion);
}

/* ════════════════════════════════════
   ABRIR POPUP DE CATEGORÍA
════════════════════════════════════ */
function abrirCategoria(categoria) {
  categoriaActual   = categoria;
  serviciosActuales = serviciosData[categoria];
  indiceActual      = 0;

  const servicio = serviciosActuales[0];

  popupImg.style.transition = 'none';
  popupImg.style.opacity    = '1';
  popupImg.style.transform  = 'translateX(0)';
  popupImg.src = servicio.imagen;
  popupImg.alt = servicio.titulo;

  popupDesc.textContent = servicio.descripcion;
  popupDesc.classList.add('visible');

  const rutaIcono = `recursos/slider/iconos/${servicio.icono}`;
  popupOverlayCnt.innerHTML = `
    <img src="${rutaIcono}" class="service-icon-img" alt="${servicio.titulo}">
    <span class="popup-service-title">${servicio.titulo}</span>
  `;
  popupOverlayCnt.style.opacity = '1';

  popupOverlay.classList.add('visible');
}

function cerrarPopup() {
  popupOverlay.classList.remove('visible');
}

/* ════════════════════════════════════
   EVENTOS DEL POPUP DE CATEGORÍA
════════════════════════════════════ */
document.querySelectorAll('.category-card').forEach(tarjeta => {
  tarjeta.addEventListener('click', () => {
    if (!puedeEjecutar('abrirCategoria', 400)) return;
    abrirCategoria(tarjeta.dataset.category);
  });
});

popupPrev.addEventListener('click', () => cambiarSlide('prev'));
popupNext.addEventListener('click', () => cambiarSlide('next'));

document.getElementById('closePopupBtn').addEventListener('click', () => {
  if (!puedeEjecutar('cerrarPopup', 300)) return;
  cerrarPopup();
});

popupOverlay.addEventListener('click', (e) => {
  if (e.target === popupOverlay) {
    if (!puedeEjecutar('cerrarPopup', 300)) return;
    cerrarPopup();
  }
});

popupDemoBtn.addEventListener('click', () => {
  if (!puedeEjecutar('demo', 800)) return;
  alert('PENDIENTE');
});

/* ════════════════════════════════════
   OVERLAY DE CONTACTO
════════════════════════════════════ */
const overlayContacto        = document.getElementById('overlayContacto');
const nombreServicioContacto = document.getElementById('nombreServicioContacto');
const campoLugar             = document.getElementById('campoLugar');
const campoFecha             = document.getElementById('campoFecha');
const btnWhatsapp            = document.getElementById('btnWhatsapp');

/* ════════════════════════════════════
   VERIFICAR SI EL FORMULARIO ESTÁ LISTO
════════════════════════════════════ */
function verificarListo() {
  const tieneLugar = campoLugar.value.trim() !== '';
  const tieneFecha = campoFecha.value !== '';
  if (tieneLugar && tieneFecha) {
    btnWhatsapp.disabled = false;
    btnWhatsapp.classList.add('listo');
  } else {
    btnWhatsapp.disabled = true;
    btnWhatsapp.classList.remove('listo');
  }
}

/* ════════════════════════════════════
   ABRIR CONTACTO
════════════════════════════════════ */
function abrirContacto() {
  if (!puedeEjecutar('abrirContacto', 400)) return;

  nombreServicioContacto.textContent = serviciosActuales[indiceActual].titulo;
  cerrarPopup();
  overlayContacto.classList.add('visible');

  campoLugar.value  = '';
  campoFecha.value  = '';
  btnWhatsapp.disabled = true;
  btnWhatsapp.classList.remove('listo');
}

/* ════════════════════════════════════
   CERRAR CONTACTO Y VOLVER AL POPUP
════════════════════════════════════ */
function cerrarContactoYVolver() {
  if (!puedeEjecutar('cerrarContacto', 300)) return;
  overlayContacto.classList.remove('visible');
  abrirCategoria(categoriaActual);
}

/* ════════════════════════════════════
   EVENTOS DE CONTACTO
════════════════════════════════════ */
document.getElementById('btnCerrarContacto').addEventListener('click', cerrarContactoYVolver);

overlayContacto.addEventListener('click', function(e) {
  if (e.target === overlayContacto) cerrarContactoYVolver();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (overlayContacto.classList.contains('visible')) cerrarContactoYVolver();
    else cerrarPopup();
  }
});

campoLugar.addEventListener('input', verificarListo);
campoFecha.addEventListener('change', verificarListo);

popupSolicitarBtn.addEventListener('click', abrirContacto);

/* ════════════════════════════════════
   WHATSAPP
════════════════════════════════════ */
btnWhatsapp.addEventListener('click', function() {
  if (btnWhatsapp.disabled || !puedeEjecutar('whatsapp', 1500)) return;

  const [anio, mes, dia] = campoFecha.value.split('-');
  const fechaFormateada  = `${dia}-${mes}-${anio}`;
  const servicio         = serviciosActuales[indiceActual].titulo;
  const lugar            = campoLugar.value.trim();

  const mensaje = `Hola, solicito el servicio de ${servicio} para la fecha ${fechaFormateada}.\n\nLugar del evento: ${lugar}\n\nDetalles: `;
  window.open(`https://wa.me/528124384370?text=${encodeURIComponent(mensaje)}`, '_blank');
});