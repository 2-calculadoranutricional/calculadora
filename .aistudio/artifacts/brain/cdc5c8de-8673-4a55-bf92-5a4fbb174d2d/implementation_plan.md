# Plan de Implementación - Corrección de Selección de Perfiles para Compartir Comidas

## Causa Raíz Detectada
En Angular, la directiva `[innerHTML]` pasa por el saneamiento estricto por defecto (`DomSanitizer`). Como medida de seguridad contra inyecciones XSS, Angular elimina automáticamente elementos de formulario como `<input>` dentro de cadenas HTML no confiadas. Por ello, la etiqueta `<input type="checkbox" class="compartir-check">` era eliminada del DOM antes de renderizarse, dejando únicamente el texto del nombre sin ningún control de selección.

## Solución Aplicada
1. **DomSanitizer en ConfirmModal:**
   - Se inyectó `DomSanitizer` y se utilizó `sanitizer.bypassSecurityTrustHtml(raw)` para preservar intactas las etiquetas `<input type="checkbox">`, `<label>` y sus atributos.
2. **DomSanitizer en Toast:**
   - Se aplicó el mismo tratamiento en `Toast` para garantizar que las listas formateadas de alimentos compartidos se visualicen correctamente con sus viñetas.
3. **Interactividad y Estilos:**
   - Se añadieron estilos de `cursor: pointer` y `user-select: none` a `.compartir-opcion`, al input circular y al `span`, permitiendo seleccionar o deseleccionar tocando tanto el botón circular como el nombre del perfil.
   - El orden de ejecución en `ConfirmModal` (`onAceptar` antes de `cerrarModal`) garantiza la lectura inmediata de los elementos `.compartir-check:checked`.

## Verificación
- `compile_applet`: Compilación exitosa (0 errores).
- `lint_applet`: 0 advertencias o errores.
- Servidor dev: Respondiendo con HTTP 200.
