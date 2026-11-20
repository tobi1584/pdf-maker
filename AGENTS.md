
# Instrucciones para Codex - ApuntesPDF

Eres el desarrollador principal de ApuntesPDF.

Tu objetivo es construir una aplicación web profesional para estudiar y anotar documentos PDF.

Lee README.md antes de comenzar cualquier desarrollo.

## Reglas generales

1. Toda la interfaz debe estar en español.
2. Utiliza React, TypeScript y Vite.
3. Prioriza la estabilidad, el rendimiento y la facilidad de uso.
4. Mantén el código modular y organizado.
5. Evita dependencias innecesarias.
6. No implementes funcionalidades falsas o botones decorativos.
7. Cada herramienta visible debe funcionar realmente.
8. No elimines funcionalidades existentes sin justificación.
9. Comprueba que el proyecto compila después de los cambios.
10. No afirmes que una función está terminada sin haberla probado.

## Arquitectura

Organiza el proyecto utilizando carpetas como:

src/
  components/
  features/
    pdf/
    annotations/
    toolbar/
  hooks/
  stores/
  services/
  types/
  utils/

Puedes adaptar esta estructura si existe una alternativa técnicamente superior.

## Sistema de coordenadas

Este requisito es crítico.

Las anotaciones deben almacenarse en coordenadas independientes del zoom.

Al aumentar o reducir el zoom:
- Las anotaciones deben permanecer en su posición.
- Las flechas no deben desplazarse.
- Los textos no deben cambiar de ubicación.
- El grosor visual debe comportarse de forma coherente.
- La exportación debe conservar las posiciones correctas.

Considera también la rotación de las páginas.

## Sistema de herramientas

Cada herramienta debe tener un comportamiento claro.

- Seleccionar: seleccionar y mover anotaciones.
- Mano: desplazar el documento.
- Resaltar texto: seleccionar texto y resaltarlo.
- Rotulador: dibujar trazos libres.
- Texto: insertar y editar cuadros de texto.
- Flecha: dibujar flechas entre dos puntos.
- Línea: dibujar líneas.
- Rectángulo: dibujar rectángulos.
- Elipse: dibujar elipses.
- Borrador: eliminar anotaciones.
- Deshacer: revertir la última operación.
- Rehacer: recuperar la última operación revertida.

No confundas borrar anotaciones con borrar contenido original del PDF.

## Guardado

Distingue entre:

1. Proyecto editable: conserva las anotaciones como objetos editables.
2. PDF exportado: incorpora las anotaciones al documento para visualizarlo en lectores externos.

No prometas que las anotaciones exportadas seguirán siendo editables si se han aplanado sobre el PDF.

## Rendimiento

El usuario trabajará con documentos extensos.

No renderices cientos de páginas simultáneamente.

Utiliza virtualización, renderizado bajo demanda y limpieza de recursos cuando sea necesario.

## Experiencia de usuario

- Interfaz limpia.
- Herramientas fáciles de encontrar.
- Atajos de teclado.
- Estados visuales claros.
- Mensajes de error comprensibles.
- Confirmación antes de descartar trabajo sin guardar.
- Diseño cómodo para sesiones largas de estudio.

## Desarrollo

Trabaja por fases.

Primero consigue un MVP estable y después añade funcionalidades avanzadas.

Cuando termines una tarea:

1. Resume los cambios realizados.
2. Indica qué archivos has modificado.
3. Ejecuta las pruebas disponibles.
4. Informa de los errores pendientes.
5. Explica cómo comprobar la funcionalidad.

Si encuentras un problema técnico, investiga y propón una solución antes de introducir soluciones improvisadas.

## Restricciones

- No implementar cuentas de usuario.
- No implementar pagos.
- No implementar publicidad.
- No subir PDFs a servidores.
- No utilizar APIs de IA externas.
- No añadir servicios en la nube sin autorización.
- No modificar el contenido original del PDF salvo que una funcionalidad lo requiera explícitamente.

## Objetivo final

Construir una alternativa sencilla, gratuita y privada a los editores PDF comerciales, optimizada para estudiar oposiciones.
