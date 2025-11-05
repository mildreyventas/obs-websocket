# 🎬 OBS Online - Browser-based Streaming Studio

**Un sistema completo de streaming y grabación que funciona 100% en tu navegador**

## ✨ Características

- ✅ **Interfaz tipo OBS Studio** - Diseño profesional inspirado en Twitch/OBS
- 📹 **Captura de cámara** - Usa tu webcam directamente desde el navegador
- 🖥️ **Captura de pantalla** - Screen sharing integrado
- 🎬 **Múltiples escenas** - Gestión completa de escenas (crear, eliminar, duplicar)
- 🎨 **7 tipos de fuentes** - Cámara, Pantalla, Texto, Imagen, Color, Browser, Ventana
- 🔴 **Grabación local** - Graba videos en formato WebM con calidad configurable
- 📊 **Estadísticas en tiempo real** - FPS, frames, duración
- 🎨 **Canvas compositor** - Mezcla múltiples fuentes en tiempo real
- 🎛️ **Filtros visuales** - 8 efectos (escala de grises, sepia, invertir, blur, brillo, contraste, saturación)
- ⚙️ **Configuración avanzada** - Modal completo para configurar streaming y grabación
- 📡 **Configuración de streaming** - URLs RTMP para YouTube, Twitch, Facebook
- 🔑 **Stream Key seguro** - Campo de contraseña para la clave de transmisión
- 💾 **Persistencia de configuración** - Guarda configuración en localStorage
- 🔌 **API WebSocket compatible** - Compatible con obs-websocket protocol

## 🚀 Cómo usar

### Acceder a OBS Online

**Opción 1 - Codespaces (público):**
```
https://psychic-winner-q75599wjg7rqcp57-8081.app.github.dev/
```

**Opción 2 - Local:**
```
http://localhost:8081/
```

### Controles principales

1. **Agregar fuente**
   - Click en "➕ Agregar Fuente"
   - Selecciona Cámara o Pantalla
   - Acepta los permisos del navegador

2. **Cambiar escena**
   - Click en cualquier escena del panel izquierdo
   - La escena activa se marca en morado

3. **Grabar video**
   - Click en "🔴 Iniciar Grabación"
   - Graba todo lo que se muestra en el canvas
   - Click en "⏹️ Detener Grabación"
   - El archivo .webm se descarga automáticamente

4. **Streaming** (simulado)
   - Click en "▶️ Iniciar Stream"
   - El status cambia a "LIVE"
   - Click en "⏹️ Detener Stream"

5. **Configurar streaming real**
   - Click en "⚙️ Configuración" en la barra superior
   - Selecciona tu plataforma (YouTube, Twitch, Facebook)
   - La URL RTMP se llena automáticamente
   - Ingresa tu Stream Key (clave de transmisión)
   - Configura resolución, FPS y bitrate
   - Click en "💾 Guardar Configuración"
   - ⚠️ La configuración se guarda automáticamente en tu navegador

## 📋 Especificaciones técnicas

### Tecnologías usadas

- **Canvas API** - Renderizado de escenas en 1920x1080
- **MediaStream API** - Captura de cámara/pantalla
- **MediaRecorder API** - Grabación de video
- **WebRTC** - Streaming de medios
- **RequestAnimationFrame** - Loop de renderizado optimizado

### Configuración

- **Resolución:** 1920x1080 (Full HD)
- **FPS:** 30 FPS (configurable)
- **Formato de grabación:** WebM/VP9
- **Bitrate:** 5 Mbps

### API WebSocket (compatible con obs-websocket)

El sistema implementa los siguientes requests:

| Request | Descripción |
|---------|-------------|
| `GetVersion` | Información de versión |
| `GetStats` | Estadísticas de rendimiento |
| `GetSceneList` | Lista de escenas disponibles |
| `GetCurrentProgramScene` | Escena actual |
| `SetCurrentProgramScene` | Cambiar escena |
| `StartRecord` | Iniciar grabación |
| `StopRecord` | Detener grabación |
| `StartStream` | Iniciar streaming |
| `StopStream` | Detener streaming |

## 🎯 Casos de uso

### 1. Grabar tutoriales
```
1. Agregar fuente de pantalla
2. Agregar fuente de cámara (opcional)
3. Iniciar grabación
4. Al terminar, descargar el video
```

### 2. Streaming simulado
```
1. Configurar escenas
2. Agregar fuentes (cámara + pantalla)
3. Iniciar stream
4. Cambiar entre escenas en vivo
```

### 3. Compositor de video
```
1. Crear diferentes escenas
2. Agregar múltiples fuentes
3. Usar para presentaciones/demos
```

## 🔧 Desarrollo

### Estructura del proyecto

```
obs-online/
├── index.html          # Interfaz principal
├── obs-online.js       # Lógica del sistema
└── README.md          # Este archivo
```

### Clases principales

**OBSOnline**
- Clase principal que maneja todo el sistema
- Renderizado de canvas
- Gestión de escenas
- Control de grabación/streaming

### Extender funcionalidad

**Agregar nuevos tipos de fuente:**
```javascript
obsOnline.sources.set('custom-source', {
    id: 'custom-id',
    type: 'custom',
    name: 'Mi fuente',
    render: (ctx) => {
        // Custom rendering
    }
});
```

**Agregar efectos:**
```javascript
// En el método renderFrame()
this.ctx.filter = 'grayscale(100%)';
```

## 🌐 Compatibilidad

✅ **Chrome/Edge** - Completamente funcional
✅ **Firefox** - Completamente funcional
✅ **Safari** - Funcional (requiere HTTPS para captura)
❌ **Navegadores móviles** - Limitado (sin screen capture)

## 📝 Notas importantes

### Permisos requeridos

- 📹 **Cámara** - Para captura de webcam
- 🖥️ **Pantalla** - Para screen sharing

El navegador pedirá estos permisos cuando agregues fuentes.

### HTTPS requerido

Para usar en producción, necesitas HTTPS:
- ✅ Codespaces ya tiene HTTPS
- ✅ GitHub Pages tiene HTTPS
- ❌ `file://` no funciona para MediaStream
- ❌ `http://` no funciona en algunos navegadores

### Limitaciones

- No puede hacer streaming real a YouTube/Twitch (requiere servidor)
- La grabación es local (no en la nube)
- No soporta audio mixing avanzado
- Sin efectos de video complejos (chroma key, etc.)

## 🚀 Próximas mejoras

- [ ] Soporte para audio
- [ ] Efectos visuales (filtros, chroma key)
- [ ] Streaming real via WebRTC
- [ ] Importar imágenes/videos
- [ ] Texto animado
- [ ] Templates de escenas
- [ ] Hotkeys para control
- [ ] Panel de audio mixer

## 🎬 Comparación con OBS Studio

| Característica | OBS Studio | OBS Online |
|---------------|------------|------------|
| Captura de pantalla | ✅ | ✅ |
| Captura de cámara | ✅ | ✅ |
| Grabación local | ✅ | ✅ |
| Streaming a plataformas | ✅ | ❌ |
| Plugins | ✅ | ❌ |
| Chroma key | ✅ | ❌ |
| Audio mixing | ✅ | ⚠️ Limitado |
| Multiplataforma | ✅ Desktop | ✅ Navegador |
| Sin instalación | ❌ | ✅ |
| Funciona online | ❌ | ✅ |

## 📄 Licencia

MIT License - Libre para usar y modificar

---

👨‍💻 **Desarrollado por:** Hector Nolivos
⭐ Hecho con el protocolo obs-websocket como inspiración
🎬 Ideal para demos, tutoriales y presentaciones online
