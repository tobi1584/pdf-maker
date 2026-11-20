
# ApuntesPDF

ApuntesPDF es una aplicación web gratuita para abrir, leer, subrayar, anotar y editar documentos PDF, especialmente diseñada para estudiar apuntes, temarios y oposiciones.

## Objetivo

Crear un editor de PDF moderno, rápido, intuitivo y completo, similar a las herramientas de anotación de Brave, Drawboard PDF y PDF-XChange Editor.

La aplicación debe funcionar en navegadores modernos como Brave, Chrome, Edge y Firefox.

El usuario debe poder trabajar con documentos PDF de cientos de páginas sin problemas de rendimiento.

## Tecnologías

- React
- TypeScript
- Vite
- PDF.js para visualizar los documentos PDF.
- pdf-lib para exportar PDFs con anotaciones.
- Zustand para gestionar el estado de la aplicación.
- Tailwind CSS para diseñar la interfaz.
- IndexedDB para guardar proyectos y anotaciones localmente.
- Vitest para pruebas automatizadas.

Se pueden incorporar otras bibliotecas cuando exista una justificación técnica.

## Características principales

### 1. Gestión de documentos

- Abrir archivos PDF desde el ordenador.
- Arrastrar y soltar archivos PDF.
- Mostrar documentos de múltiples páginas.
- Navegar entre páginas.
- Introducir directamente el número de página.
- Zoom manual y automático.
- Ajustar al ancho de pantalla.
- Ajustar página completa.
- Desplazamiento vertical continuo.
- Rotar páginas para visualización.
- Mostrar el número total de páginas.

### 2. Herramientas de anotación

#### Selección de texto
- Seleccionar texto real del PDF.
- Copiar texto seleccionado.
- Subrayar texto seleccionado.
- Resaltar texto con diferentes colores.
- Tachado de texto.

#### Rotulador libre
- Pintar libremente encima del PDF.
- Permitir subrayar por encima o fuera de las letras.
- Configurar colores.
- Configurar grosor.
- Configurar transparencia.
- Utilizar ratón, pantalla táctil o lápiz digital.

#### Escritura con teclado
- Insertar cuadros de texto en cualquier posición.
- Modificar contenido posteriormente.
- Cambiar tamaño de letra.
- Cambiar color.
- Mover cuadros de texto.
- Eliminar cuadros de texto.

#### Dibujos y formas
- Flechas.
- Líneas rectas.
- Rectángulos.
- Círculos y elipses.
- Dibujo libre.
- Cambiar color y grosor.
- Mover y eliminar anotaciones.

### 3. Edición de anotaciones

- Seleccionar anotaciones existentes.
- Mover anotaciones.
- Modificar sus propiedades.
- Eliminar anotaciones individualmente.
- Deshacer cambios.
- Rehacer cambios.
- Atajos de teclado.

### 4. Guardado y exportación

- Descargar el PDF con las anotaciones incorporadas.
- Mantener la calidad original del documento.
- Mantener las páginas originales.
- Mantener el texto seleccionable siempre que sea posible.
- Guardar las anotaciones en las coordenadas correctas.
- Evitar desplazamientos al cambiar el zoom.
- Permitir continuar editando un proyecto guardado.
- Guardar automáticamente el trabajo en IndexedDB.
- Recuperar proyectos después de cerrar el navegador.

El PDF exportado debe poder visualizarse correctamente en lectores externos.

### 5. Interfaz

La interfaz debe ser moderna, minimalista y cómoda para estudiar durante muchas horas.

Distribución:

- Barra superior con herramientas principales.
- Panel lateral opcional con miniaturas de páginas.
- Zona central dedicada al documento.
- Controles de navegación y zoom.
- Selector de colores.
- Panel de propiedades de anotaciones.
- Modo claro y oscuro.
- Posibilidad de ocultar paneles para ampliar el documento.

Priorizar una experiencia parecida a un editor de PDF profesional, evitando menús innecesarios.

## Rendimiento

- Soportar PDFs grandes de 200 a 500 páginas o más.
- Evitar renderizar todas las páginas simultáneamente.
- Utilizar renderizado progresivo o virtualización.
- Evitar bloqueos al hacer zoom o cambiar de página.
- Liberar recursos de páginas que ya no se muestran.
- Mantener las anotaciones alineadas con el documento.

## Privacidad

- Procesamiento local en el navegador.
- No subir documentos a servidores externos.
- No requerir cuentas.
- No requerir registro.
- No incluir suscripciones.
- No incluir publicidad.
- No recopilar datos personales.

## Prioridades de desarrollo

1. Visualizador PDF funcional.
2. Navegación y zoom.
3. Rotulador libre.
4. Cuadros de texto.
5. Flechas y figuras.
6. Selección y edición de anotaciones.
7. Guardado y exportación.
8. Subrayado mediante selección de texto.
9. Autoguardado y recuperación.
10. Mejoras visuales y optimización.

## Criterios de calidad

- Código modular y mantenible.
- Componentes reutilizables.
- TypeScript con tipado estricto.
- Diseño adaptable a diferentes pantallas.
- Manejo de errores.
- Pruebas de funcionalidades críticas.
- No introducir dependencias innecesarias.

## Estado del proyecto

En desarrollo.

Primera meta: disponer de una versión MVP funcional que permita abrir un PDF, dibujar anotaciones, escribir texto y exportar el documento.

## Ejecutar la primera versión

Requisitos: Node.js 20 o posterior. En la carpeta del proyecto:

```bash
npm install
npm run dev
```

Abre la dirección local que muestra Vite. En PowerShell con la ejecución de scripts restringida se pueden usar `npm.cmd install` y `npm.cmd run dev`.

La primera versión permite abrir o arrastrar un PDF, recorrer sus páginas, ampliar, ajustar al ancho y girar la vista. Incluye selección y movimiento de anotaciones, resaltado y subrayado de texto seleccionable, rotulador libre, texto editable, flechas, rectángulos, borrador, deshacer y rehacer. Para marcar palabras, elige **Resaltar texto** o **Subrayar texto** y arrastra sobre el texto del PDF. Los PDF escaneados que solo contienen imágenes no tienen texto seleccionable. El botón **Descargar PDF** incorpora las anotaciones al archivo conservando las páginas originales. Las anotaciones descargadas quedan aplanadas en el PDF. Todavía no se guardan proyectos editables entre sesiones.

Puedes ampliar el documento con **Ctrl + rueda del ratón** sobre la página. La herramienta **Mano** desplaza el documento al arrastrarlo. El botón de modo oscuro cambia la apariencia de la aplicación y recuerda la elección en este navegador.

Para comprobar la versión:

```bash
npm run build
npm test
```

Con el servidor de desarrollo abierto y Brave instalado, `npm run test:browser` ejecuta una prueba funcional de las herramientas y la descarga del PDF.
