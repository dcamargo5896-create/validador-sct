const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

// Datos locales integrados (No requiere Supabase)
const baseDatosTitulos = {
  "TE-INM-9981-264563-125356-770": {
    folio_digital: "TE-INM-9981-264563-125356-770",
    estatus: "AUTENTICADO",
    nombre_completo: "ERICK ALEJANDRO RICO GARCIA",
    curp: "RIGE931031HPLCRR08",
    carrera: "INGENIERIA MECATRÓNICA",
    clave_carrera: "124",
    institucion: "UNIVERSIDAD NACIONAL AUTONOMA DE MEXICO",
    fecha_expedicion: "2023-05-23",
    sello_digital: "mkpDWpgtXbFZvtDyYaI2CEfDudYmKzGkSaHtzki2F0hNqSPdV6W6cPxsaREjH/2FIWh5YnA1c7jB233+v4B/BTE8yk10xs5z4rVOJK1otuhcSpxQq41dmA4GqexJSKofloXZ3sOzyArav8nqsDrCc1NQSCoH5kGQffrrqQmKc/lKz4P0426hX8zcNjU7XQgSC27zoerzMkxZfZTTE5jMxl/Y6oI9pAZH/MVq6XvESt56CekT+Xta2Mx5DcZmmbumCL/KpJ0+EmMqzLpCKG+sWTtRtOw71CH0NHlRpPXJYHJMXDm0xQUM1H6f6KzZtSBzeA=="
  }
};

// 1. ENDPOINT API DE CONSULTA
app.get('/api/v1/titulos/:folio', (req, res) => {
  const { folio } = req.params;
  const titulo = baseDatosTitulos[folio];

  if (!titulo) {
    return res.status(404).json({ 
      valido: false, 
      mensaje: "El folio digital no se encuentra registrado en el sistema oficial." 
    });
  }

  res.json({
    valido: true,
    estatus: titulo.estatus,
    datos_alumno: {
      nombre_completo: titulo.nombre_completo,
      curp: titulo.curp
    },
    datos_academicos: {
      carrera: titulo.carrera,
      clave_carrera: titulo.clave_carrera,
      institucion: titulo.institucion,
      fecha_expedicion: titulo.fecha_expedicion
    },
    seguridad: {
      sello_digital: titulo.sello_digital
    }
  });
});

// 2. INTERFAZ WEB DEL PORTAL
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIGED - Validación de Títulos Electrónicos</title>
    <script src="https://jsdelivr.net"></script>
    <style>
        .gob-bg { background-color: #6A1B29; }
        .gold-border { border-color: #BC955C; }
        .gold-bg { background-color: #BC955C; }
    </style>
</head>
<body class="bg-slate-900 font-sans text-slate-800 antialiased min-h-screen">
    <div class="max-w-[1200px] mx-auto p-4 md:p-8">
        <header class="mb-6 flex flex-col md:flex-row justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-2xl gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 gob-bg rounded-lg flex items-center justify-center text-white font-black border-b-2 gold-border">SIGED</div>
                <div>
                    <h1 class="text-white font-bold text-lg uppercase">Gobierno de México</h1>
                    <p class="text-xs text-slate-400">Verificación Oficial de Documentos Académicos Electrónicos</p>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-4 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
                <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2">Búsqueda Manual</h3>
                <div class="space-y-4">
                    <input type="text" id="folioInput" placeholder="Folio Digital del Título" class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-800">
                    <button onclick="buscarManual()" class="w-full gold-bg hover:opacity-90 text-white font-bold py-2.5 rounded-lg text-sm transition cursor-pointer">Buscar</button>
                </div>
            </div>

            <div class="lg:col-span-8">
                <div id="panelVacio" class="bg-slate-800 border border-dashed border-slate-700 rounded-2xl p-12 text-center text-slate-400">
                    <p>Introduce un Folio Digital o escanea el QR del título para verificar el estatus del profesionista.</p>
                </div>
                <div id="panelError" class="hidden bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
                    <p id="mensajeError" class="text-sm font-semibold"></p>
                </div>
                <div id="panelResultado" class="hidden space-y-6">
                    <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-xl flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-base">✓ Documento Autenticado</h4>
                            <p class="text-xs opacity-90">Este título cuenta con validez legal ante las autoridades educativas nacionales.</p>
                        </div>
                        <span id="txtEstatus" class="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase"></span>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h4 class="font-bold border-b pb-1 text-slate-700">DATOS DEL PROFESIONISTA</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="text-[11px] font-bold text-slate-400 block">NOMBRE</label><p id="lblNombre" class="text-sm font-bold text-slate-800 uppercase"></p></div>
                            <div><label class="text-[11px] font-bold text-slate-400 block">CURP</label><p id="lblCurp" class="text-sm font-mono font-bold text-slate-800"></p></div>
                        </div>
                        <h4 class="font-bold border-b pb-1 text-slate-700 pt-2">INFORMACIÓN ACADÉMICA</h4>
                        <div class="space-y-3">
                            <div><label class="text-[11px] font-bold text-slate-400 block">CARRERA / PERFIL</label><p id="lblCarrera" class="text-sm font-bold text-slate-800 uppercase"></p></div>
                            <div><label class="text-[11px] font-bold text-slate-400 block">INSTITUCIÓN EMITENTE</label><p id="lblInstitucion" class="text-sm font-bold text-slate-800 uppercase"></p></div>
                            <div><label class="text-[11px] font-bold text-slate-400 block">FECHA EXPEDICIÓN</label><p id="lblFechaExp" class="text-sm font-bold text-slate-800"></p></div>
                        </div>
                        <h4 class="font-bold border-b pb-1 text-slate-700 pt-2">SEGURIDAD CRIPTOGRÁFICA</h4>
                        <div><label class="text-[11px] font-bold text-slate-400 block">SELLO DIGITAL</label><p id="lblSello" class="text-[10px] font-mono break-all text-slate-500 bg-slate-50 p-2 rounded-lg border"></p></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const folioUrl = urlParams.get('folio');
            if (folioUrl) { document.getElementById('folioInput').value = folioUrl; consultarApi(folioUrl); }
        };
        function buscarManual() {
            const folio = document.getElementById('folioInput').value.trim();
            if (folio) {
                const nuevaUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?folio=' + encodeURIComponent(folio);
                window.history.pushState({path: nuevaUrl}, '', nuevaUrl);
                consultarApi(folio);
            }
        }
        async function consultarApi(folio) {
            const pvacio = document.getElementById('panelVacio'), perror = document.getElementById('panelError'), presultado = document.getElementById('panelResultado');
            pvacio.classList.add('hidden'); perror.classList.add('hidden'); presultado.classList.add('hidden');
            try {
                const res = await fetch('/api/v1/titulos/' + folio);
                const data = await res.json();
                if (!res.ok) throw new Error(data.mensaje || "Error en la consulta.");
                document.getElementById('txtEstatus').innerText = data.estatus;
                document.getElementById('lblNombre').innerText = data.datos_alumno.nombre_completo;
                document.getElementById('lblCurp').innerText = data.datos_alumno.curp;
                document.getElementById('lblCarrera').innerText = data.datos_academicos.carrera + ' (CLAVE: ' + data.datos_academicos.clave_carrera + ')';
                document.getElementById('lblInstitucion').innerText = data.datos_academicos.institucion;
                document.getElementById('lblFechaExp').innerText = data.datos_academicos.fecha_expedicion;
                document.getElementById('lblSello').innerText = data.seguridad.sello_digital;
                presultado.classList.remove('hidden');
            } catch (err) {
                document.getElementById('mensajeError').innerText = err.message;
                perror.classList.remove('hidden');
            }
        }
    </script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
