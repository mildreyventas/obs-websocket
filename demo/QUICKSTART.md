# 🚀 QUICKSTART - obs-websocket Simulator

## ✅ El servidor YA ESTÁ CORRIENDO con PM2

El simulador de obs-websocket está levantado y funcionando en:

```
🌐 WebSocket: ws://localhost:4455
🔑 Password: supersecretpassword
📋 RPC Version: 1
```

---

## 📊 Estado del servidor

```bash
pm2 list
```

Para ver más detalles:
```bash
pm2 show obs-websocket
```

---

## 📋 Ver logs en tiempo real

```bash
pm2 logs obs-websocket
```

O las últimas líneas:
```bash
pm2 logs obs-websocket --lines 50 --nostream
```

---

## 🎮 Probar el servidor

### Opción 1: Cliente Python
```bash
cd /workspaces/obs-websocket/demo
python3 obs_websocket_client.py
```

### Opción 2: Cliente HTML (navegador)
Abre en tu navegador:
```
file:///workspaces/obs-websocket/demo/obs_websocket_test.html
```

O desde VSCode:
1. Click derecho en `demo/obs_websocket_test.html`
2. "Open with Live Server" o "Open in Browser"

---

## 🛠️ Gestión del servidor

### Script interactivo (recomendado)
```bash
cd /workspaces/obs-websocket/demo
./manage.sh
```

Este script te permite:
- Ver estado
- Iniciar/detener/reiniciar
- Ver logs
- Probar cliente
- Y más...

### Comandos PM2 directos

**Detener:**
```bash
pm2 stop obs-websocket
```

**Iniciar:**
```bash
pm2 start obs-websocket
```

**Reiniciar:**
```bash
pm2 restart obs-websocket
```

**Eliminar:**
```bash
pm2 delete obs-websocket
```

**Monitoreo en tiempo real:**
```bash
pm2 monit
```

---

## 🌐 Acceder al cliente HTML

### Si estás en Codespaces:

1. **Forward del puerto**:
   - Ve a la pestaña "PORTS" en VSCode
   - El puerto 4455 debería estar listado
   - Click en "Forward Port" si no está
   - Copia la URL forwarded

2. **Abre el HTML**:
   - Abre `demo/obs_websocket_test.html` en tu navegador local
   - O usa "Simple Browser" en VSCode

3. **Configura la conexión**:
   - En vez de `localhost:4455`
   - Usa la URL forwarded de Codespaces
   - Ejemplo: `your-codespace-name-4455.app.github.dev`

### Si estás en local:

Simplemente abre:
```
file:///workspaces/obs-websocket/demo/obs_websocket_test.html
```

---

## 📤 Requests disponibles

El simulador soporta estos requests:

| Request | Descripción |
|---------|-------------|
| `GetVersion` | Info de versiones |
| `GetStats` | Estadísticas de OBS |
| `GetSceneList` | Lista de escenas |
| `GetCurrentProgramScene` | Escena actual |
| `SetCurrentProgramScene` | Cambiar escena |
| `StartStream` | Iniciar streaming |
| `StopStream` | Detener streaming |
| `StartRecord` | Iniciar grabación |
| `StopRecord` | Detener grabación |

---

## 🔔 Events que emite

- **CustomEvent**: Al conectarse
- **CurrentProgramSceneChanged**: Al cambiar escena
- **StreamStateChanged**: Al iniciar/detener stream

---

## 🐛 Troubleshooting

### El servidor no responde
```bash
pm2 restart obs-websocket
```

### Ver errores
```bash
pm2 logs obs-websocket --err
```

### Puerto ocupado
```bash
lsof -i :4455
# Mata el proceso si es necesario
pm2 delete obs-websocket
pm2 start demo/obs_websocket_simulator.py --name obs-websocket --interpreter python3
```

### Reinstalar
```bash
pm2 delete obs-websocket
cd /workspaces/obs-websocket/demo
./manage.sh
# Selecciona opción 2 (Iniciar servidor)
```

---

## 📚 Más información

- **README completo**: [README.md](README.md)
- **Resumen del demo**: [DEMO_SUMMARY.md](DEMO_SUMMARY.md)
- **Protocolo oficial**: [../docs/generated/protocol.md](../docs/generated/protocol.md)

---

## 🎯 Comandos rápidos

```bash
# Ver estado
pm2 list

# Ver logs live
pm2 logs obs-websocket

# Probar con cliente
python3 demo/obs_websocket_client.py

# Abrir menú de gestión
./demo/manage.sh

# Reiniciar servidor
pm2 restart obs-websocket
```

---

## ✨ ¡Listo!

El servidor está corriendo y listo para usar. Abre el cliente HTML o ejecuta el cliente Python para probarlo.

**URL del servidor**: `ws://localhost:4455`
**Password**: `supersecretpassword`

🎬 ¡A controlar OBS! 🚀
