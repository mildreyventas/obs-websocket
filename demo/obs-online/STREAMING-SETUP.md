# 🎬 OBS Online - Guía de Streaming Real

## ⚠️ Limitación Importante

**El navegador NO puede hacer streaming RTMP directamente.**

Los navegadores tienen restricciones de seguridad que impiden:
- Crear conexiones TCP/RTMP directas
- Conectar directamente a servidores RTMP como Facebook, YouTube, Twitch

## ✅ Solución: Servidor de Streaming

Hemos creado un servidor Node.js + FFmpeg que actúa como intermediario:

```
Navegador → WebSocket → Servidor Node.js → FFmpeg → RTMP → Facebook/YouTube/Twitch
```

## 📦 Archivos Creados

1. **`streaming-server.js`** - Servidor Node.js con WebSocket
2. **`package.json`** - Dependencias del servidor

## 🚀 Cómo Usar Streaming Real

### Paso 1: Iniciar el Servidor de Streaming

Abre una terminal nueva y ejecuta:

```bash
cd /workspaces/obs-websocket/demo/obs-online
node streaming-server.js
```

Deberías ver:
```
✅ Streaming server listening on port 9000
📡 WebSocket endpoint: ws://localhost:9000
🎬 Ready to stream to RTMP platforms
```

### Paso 2: Configurar OBS Online

1. Abre OBS Online en tu navegador (puerto 8081)
2. Click en **⚙️ Configuración**
3. Selecciona tu plataforma (Facebook Live, YouTube, Twitch)
4. Ingresa tu **Stream Key**
5. Guarda la configuración

### Paso 3: Iniciar Streaming

1. Agrega fuentes (cámara, pantalla, etc.)
2. Click en **▶️ Iniciar Transmisión**
3. El navegador se conectará al servidor
4. El servidor enviará el video a la plataforma via RTMP

## 🔧 Tecnologías Utilizadas

- **WebSocket (ws)** - Comunicación entre navegador y servidor
- **FFmpeg** - Codificación y envío RTMP
- **Node.js** - Servidor backend
- **MediaStream API** - Captura de video en el navegador

## 📝 Cómo Funciona

1. **Navegador captura video**:
   - MediaStream API captura cámara/pantalla
   - Canvas combina todas las fuentes
   - MediaRecorder genera video WebM

2. **Envío al servidor**:
   - WebSocket envía chunks de video
   - Navegador → ws://localhost:9000

3. **Servidor procesa**:
   - Recibe video WebM
   - FFmpeg lo recodifica a H.264
   - Envía a RTMP URL + Stream Key

4. **Plataforma recibe**:
   - Facebook/YouTube/Twitch recibe el stream
   - ¡Estás en VIVO!

## 🎯 Obtener Stream Key

### Facebook Live
1. Ve a https://www.facebook.com/live/create
2. Copia la **Stream Key** (mantén en secreto)
3. URL RTMP: `rtmps://live-api-s.facebook.com:443/rtmp/`

### YouTube Live
1. Ve a https://studio.youtube.com/
2. Click en "Ir en directo"
3. Copia la **Clave de transmisión**
4. URL RTMP: `rtmp://a.rtmp.youtube.com/live2`

### Twitch
1. Ve a https://dashboard.twitch.tv/settings/stream
2. Copia la **Clave de retransmisión principal**
3. URL RTMP: `rtmp://live.twitch.tv/app`

## ⚠️ Consideraciones de Producción

Para usar en producción (no solo local):

1. **Servidor en la nube**:
   - Deploy el servidor a Heroku, Railway, DigitalOcean
   - Cambiar `ws://localhost:9000` a `wss://tu-servidor.com`

2. **HTTPS obligatorio**:
   - MediaStream requiere HTTPS (excepto localhost)
   - Usar SSL/TLS para WebSocket (wss://)

3. **Recursos del servidor**:
   - FFmpeg consume CPU/RAM
   - 1 stream = ~1 CPU core
   - Usar servidor con buenos recursos

4. **Latencia**:
   - Latencia típica: 10-30 segundos
   - Depende de la codificación y plataforma

## 🐛 Troubleshooting

### "Address already in use" (Puerto 9000)
```bash
lsof -i:9000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### FFmpeg no encontrado
```bash
sudo apt-get update && sudo apt-get install -y ffmpeg
```

### WebSocket no conecta
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador
- Asegúrate de usar ws:// (no wss://) en localhost

## 📚 Recursos

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Facebook Live API](https://developers.facebook.com/docs/live-video-api/)
- [YouTube Live API](https://developers.google.com/youtube/v3/live/docs/)

---

👨‍💻 **Desarrollado por:** Hector Nolivos
