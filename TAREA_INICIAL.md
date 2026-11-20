
# Primera tarea - MVP de ApuntesPDF

Desarrolla la primera versión funcional de ApuntesPDF.

Lee primero README.md y AGENTS.md.

## Objetivo

Crear una aplicación web que permita abrir un PDF, visualizarlo, añadir anotaciones y exportarlo.

## Fase 1 - Proyecto

- Inicializar React + TypeScript + Vite.
- Configurar Tailwind CSS.
- Instalar PDF.js.
- Instalar pdf-lib.
- Crear la estructura de carpetas.
- Preparar los comandos de desarrollo.

## Fase 2 - Visualizador

Implementar:

- Botón "Abrir PDF".
- Arrastrar y soltar archivos.
- Visualización de páginas.
- Navegación entre páginas.
- Indicador de página actual.
- Zoom de entrada y salida.
- Ajustar al ancho.
- Desplazamiento vertical.

El PDF debe visualizarse correctamente.

## Fase 3 - Herramientas

Implementar inicialmente:

1. Selección de anotaciones.
2. Rotulador libre.
3. Cuadros de texto editables.
4. Flechas.
5. Rectángulos.
6. Borrador.
7. Deshacer y rehacer.

Cada herramienta debe permitir seleccionar colores.

El rotulador debe permitir modificar grosor y transparencia.

## Fase 4 - Exportación

Implementar el botón "Descargar PDF".

Requisitos:

- Conservar las páginas originales.
- Incorporar las anotaciones.
- Respetar las coordenadas.
- Mantener la resolución original del PDF.
- No desplazar anotaciones.
- Generar un archivo PDF válido.

Para esta primera versión se permite aplanar las anotaciones durante la exportación.

## Fase 5 - Diseño

Crear una interfaz moderna con:

- Barra de herramientas superior.
- Documento centrado.
- Fondo gris suave.
- Panel de opciones.
- Controles de zoom.
- Indicador de página.
- Botón de exportación.
- Modo claro inicial.

Todo en español.

## Fase 6 - Pruebas

Comprobar:

- Apertura de PDF.
- Navegación entre páginas.
- Zoom.
- Rotulador.
- Escritura de texto.
- Flechas.
- Rectángulos.
- Borrado.
- Deshacer y rehacer.
- Exportación.

Especialmente importante:

Añadir anotaciones a una página, cambiar el zoom y comprobar que siguen exactamente en su sitio.

Exportar el PDF y comprobar que las anotaciones aparecen correctamente.

## Resultado esperado

Una aplicación ejecutable en local mediante:

npm install
npm run dev

No implementar todavía:

- Cuentas de usuario.
- Sincronización en la nube.
- Colaboración.
- IA.
- Aplicación móvil nativa.

Prioriza entregar una primera versión estable y utilizable.
