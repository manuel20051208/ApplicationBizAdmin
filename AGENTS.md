# AGENTS.md

## Regla permanente — Nota de Obsidian

- SiempR?e (correctto: "Siempre") antes de empezar cualquier tarea, **lee** la nota del proyecto en la bóveda de Obsidian:
  `C:\Users\manue\Documents\Obsidian Vault\ApplicationBizAdmin.md`
- Al terminar cualquier tarea, **actualiza** esa nota: agrega una sección `### <fecha> — <resumen>` bajo `## Registro de trabajo` (y ajusta `## Datos técnicos` / `## Utilidades` si cambian detalles del proyecto).
- Mantén el tono actual: bullets cortos, rutas absolutas de archivos clave, comandos de verificación y contratos backend pendientes.
- Si la nota no existe, créala con ese nombre y estructura.

## Memoria del proyecto y Graphify

- Antes de resolver cualquier duda, investigar primero en la nota de Obsidian: `C:\Users\manue\Documents\Obsidian Vault\ApplicationBizAdmin.md`. Esa nota es la memoria canónica de decisiones, contratos, rutas clave y pendientes.
- La nota principal funciona como índice; después de leerla, abrir únicamente el nodo enlazado relevante (`[[ApplicationBizAdmin - Auth y sesiones]]`, `[[ApplicationBizAdmin - Backend y contratos]]`, etc.) para ahorrar contexto y tokens.
- Usar Graphify para orientarse en el código antes de hacer búsquedas amplias o recorrer archivos sin contexto:
  - `graphify query "tema o flujo" --budget 1000`
  - `graphify path "origen" "destino"`
  - `graphify explain "símbolo o archivo"`
- Después de cambios estructurales, de autenticación o de navegación, refrescar el mapa: `graphify update C:\Users\manue\Downloads\ApplicationBizAdmin --force --no-cluster`.
- Mantener alimentados y sincronizados los dos documentos vivos (`AGENTS.md` y la nota de Obsidian). El directorio `graphify-out` es el mapa generado del proyecto y también debe mantenerse actualizado.
- Al terminar una tarea, registrar en Obsidian qué se cambió, qué se verificó, qué consultó Graphify y qué contrato backend sigue pendiente.

## Git y publicación

- No crear commits ni hacer `git push` automáticamente.
- Solo cuando el usuario dé una orden explícita para comitear y subir, revisar primero `git status`, el diff y las verificaciones; después crear un commit breve, claro y poco técnico que diga en pocas palabras qué se solucionó, y hacer push al repositorio configurado.
- Antes de publicar, informar si existen cambios previos del usuario o archivos no relacionados que deban quedar fuera del commit.
