<div align="center">

# 📚 ApuntesPDF

**Tus apuntes, tus anotaciones, tu navegador.**

Una aplicación web gratuita y en español para leer, resaltar y anotar documentos PDF.
Pensada para estudiar apuntes, temarios y oposiciones con tus archivos en local.

![Estado: en desarrollo](https://img.shields.io/badge/estado-en_desarrollo-f59e0b?style=flat-square)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square)

[Qué puedes hacer](#-qué-puedes-hacer) · [Instalación](#-instalación) · [Cómo usarlo](#-cómo-usarlo) · [Desarrollo](#-desarrollo)

</div>

---

## ✨ Qué puedes hacer

Abre un PDF, marca las ideas importantes, añade explicaciones y descarga una copia anotada para consultarla en otros lectores.

| Función | Qué permite |
| --- | --- |
| **Lectura de PDF** | Abrir archivos desde el ordenador o arrastrarlos a la aplicación, desplazarse entre páginas y saltar a una página concreta. |
| **Zoom y navegación** | Ampliar del 25 % al 300 %, ajustar al ancho, girar la vista y mover el documento con la herramienta Mano. |
| **Resaltado y subrayado** | Marcar palabras seleccionando el texto real del PDF. |
| **Rotulador libre** | Dibujar trazos sobre las páginas con color, grosor y opacidad configurables. |
| **Cuadros de texto** | Escribir notas, editar su contenido, cambiar el tamaño de letra y redimensionar los cuadros. |
| **Flechas y rectángulos** | Señalar conceptos y enmarcar partes del documento. |
| **Edición de anotaciones** | Seleccionar, mover, cambiar propiedades, borrar, deshacer y rehacer. |
| **Colores personalizados** | Añadir colores y conservar los cinco últimos en el navegador. |
| **Modo claro y oscuro** | Elegir la apariencia y recordar la preferencia entre sesiones. |
| **Exportación** | Descargar una copia del PDF con las anotaciones incorporadas. |

Las anotaciones se almacenan en coordenadas del PDF, independientes del zoom. El visor tiene en cuenta la rotación y renderiza las páginas cercanas a la zona visible bajo demanda.

> [!IMPORTANT]
> **Exportar un PDF no equivale a guardar un proyecto editable.** Las anotaciones descargadas quedan aplanadas sobre el documento y no se recuperan como objetos editables al volver a abrirlo. El guardado de proyectos y el autoguardado entre sesiones todavía no están implementados.

## 🔒 Privacidad

Los documentos se procesan **localmente en tu navegador**: no se suben a servidores. La aplicación no requiere cuentas ni registro, no incluye pagos ni publicidad y no utiliza APIs de IA externas.

El archivo original de tu ordenador no se sobrescribe: la exportación genera una copia con el sufijo `-anotado.pdf`. Las preferencias de tema y los colores personalizados se guardan en el almacenamiento local del navegador; los documentos y las anotaciones de la sesión no se conservan al cerrarla.

## 🚀 Instalación

Necesitas **Node.js 22.12 o posterior** y **npm**.

Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Abre la dirección local que muestra Vite en la terminal.

> [!TIP]
> En Windows, si PowerShell bloquea los scripts de npm, utiliza `npm.cmd install` y `npm.cmd run dev`.

Para generar y consultar la versión de producción:

```bash
npm run build
npm run preview
```

La compilación se genera en `dist/`.

## 📝 Cómo usarlo

1. Pulsa **Abrir PDF** o arrastra un archivo a la zona del documento.
2. Ajusta el ancho o el zoom y navega hasta la página que quieras estudiar.
3. Elige **Resaltar texto** o **Subrayar texto**, selecciona un color y arrastra sobre las palabras.
4. Añade trazos, flechas o rectángulos. Para crear una nota, elige **Texto** y arrastra para definir el cuadro.
5. Usa **Seleccionar** para mover anotaciones. Haz doble clic en un texto para editarlo y arrastra su esquina durante la edición para cambiar el tamaño del cuadro.
6. Pulsa **Descargar PDF** para obtener una copia anotada antes de cerrar la sesión.

> [!NOTE]
> El resaltado y el subrayado necesitan texto seleccionable. Los PDF escaneados que solo contienen imágenes pueden anotarse con dibujos y cuadros de texto, pero la aplicación no incorpora OCR. El borrador elimina anotaciones, no contenido original del PDF. El giro cambia la vista, no la orientación del archivo exportado.

### Atajos de teclado

| Atajo | Acción |
| --- | --- |
| `V` | Seleccionar y mover anotaciones |
| `H` | Mano: desplazar el documento |
| `S` | Resaltar texto |
| `U` | Subrayar texto |
| `P` | Rotulador |
| `T` | Insertar texto |
| `A` | Flecha |
| `R` | Rectángulo |
| `E` | Borrador |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Y` o `Ctrl + Mayús + Z` | Rehacer |
| `Supr` o `Retroceso` | Eliminar la anotación seleccionada |
| `Ctrl + rueda del ratón` | Cambiar el zoom sobre el documento |

En macOS, deshacer y rehacer también admiten `⌘` en lugar de `Ctrl`. Los atajos de herramientas no se activan mientras escribes en un campo de texto.

## 🛠️ Desarrollo

### Tecnologías

| Tecnología | Uso |
| --- | --- |
| React + TypeScript | Interfaz y lógica de la aplicación |
| Vite | Servidor de desarrollo y compilación |
| PDF.js | Renderizado del PDF y capa de texto seleccionable |
| pdf-lib | Exportación de documentos con anotaciones |
| Zustand | Estado de anotaciones e historial de cambios |
| Tailwind CSS + CSS | Estilos de la interfaz |
| Vitest + Playwright | Pruebas automatizadas y comprobaciones en navegador |

### Estructura del proyecto

```text
src/
├── components/            # Iconos y componentes de interfaz
├── features/
│   ├── annotations/       # Capa interactiva de anotaciones
│   └── pdf/               # Visor de páginas y selección de texto
├── services/              # Exportación del PDF
├── stores/                # Estado, selección e historial
├── types/                 # Tipos de herramientas y anotaciones
├── utils/                 # Geometría, colores y pruebas
├── App.tsx                # Interfaz principal
└── styles.css             # Estilos y temas
scripts/
└── smoke.mjs              # Prueba funcional en navegador
```

### Comprobaciones

```bash
npm test
npm run build
```

Las pruebas automatizadas cubren geometría, colores personalizados, historial de anotaciones y exportación.

Para ejecutar la prueba funcional, deja `npm run dev` activo y abre otra terminal:

```bash
npm run test:browser
```

Esta prueba usa Playwright con Brave y comprueba las herramientas, la edición de texto, el zoom, el desplazamiento, el tema y la descarga. Por defecto busca Brave en su ruta habitual de Windows y la aplicación en `http://127.0.0.1:5173/`. Puedes configurar `BRAVE_EXECUTABLE` y `APP_URL` mediante variables de entorno.

## 🗺️ Próximos pasos

El proyecto está en desarrollo. Las siguientes funciones son objetivos pendientes, no prestaciones de la versión actual:

- [ ] Guardado y apertura de proyectos editables.
- [ ] Autoguardado local con IndexedDB y recuperación entre sesiones.
- [ ] Líneas, elipses y tachado de texto.
- [ ] Panel de miniaturas y ajuste de página completa.
- [ ] Más validación de rendimiento con documentos de cientos de páginas.
- [ ] Ampliar las pruebas de compatibilidad entre navegadores.

La prioridad es consolidar un MVP estable y seguir construyendo una alternativa sencilla, gratuita y privada para estudiar PDF.
