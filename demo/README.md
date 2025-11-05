# 🎬 obs-websocket Demo Simulator

Demo funcional que simula el servidor obs-websocket y demuestra cómo funciona el protocolo completo.

## 📋 ¿Qué incluye este demo?

### 1. **obs_websocket_simulator.py**
Simulador del servidor obs-websocket que implementa:
- ✅ Protocolo completo de handshake (Hello → Identify → Identified)
- ✅ Autenticación SHA256 (como el servidor real)
- ✅ Procesamiento de Requests (OpCode 6)
- ✅ Envío de RequestResponses (OpCode 7)
- ✅ Broadcast de Events (OpCode 5)
- ✅ Estado simulado de OBS (escenas, streaming, grabación)

### 2. **obs_websocket_client.py**
Cliente de prueba que demuestra:
- ✅ Conexión y autenticación
- ✅ Envío de requests
- ✅ Recepción de responses y events
- ✅ 9 tests diferentes de funcionalidad

### 3. **run_demo.sh**
Script bash para ejecutar el demo fácilmente

---

## 🚀 Cómo ejecutar el demo

### Opción 1: Script automático (recomendado)
```bash
cd /workspaces/obs-websocket/demo
./run_demo.sh
# Selecciona opción 1 para ejecutar todo automáticamente
```

### Opción 2: Manual
```bash
# Terminal 1 - Servidor
python3 obs_websocket_simulator.py

# Terminal 2 - Cliente (en otra terminal)
python3 obs_websocket_client.py
```

---

## 📡 Protocolo obs-websocket implementado

### Flujo de conexión:

```
1. Cliente conecta → Servidor envía Hello (OpCode 0)
   {
     "op": 0,
     "d": {
       "obsWebSocketVersion": "5.6.3",
       "rpcVersion": 1,
       "authentication": { "challenge": "...", "salt": "..." }
     }
   }

2. Cliente → Servidor envía Identify (OpCode 1)
   {
     "op": 1,
     "d": {
       "rpcVersion": 1,
       "eventSubscriptions": 33,
       "authentication": "hash_calculado..."
     }
   }

3. Servidor → Cliente envía Identified (OpCode 2)
   {
     "op": 2,
     "d": { "negotiatedRpcVersion": 1 }
   }

4. Cliente puede enviar Requests y recibir Events
```

### Autenticación SHA256:

```python
# Paso 1: Hash del password + salt
secret_hash = SHA256(password + salt)
secret_b64 = Base64(secret_hash)

# Paso 2: Hash con el challenge
auth_hash = SHA256(secret_b64 + challenge)
auth_string = Base64(auth_hash)
```

---

## 🎮 Requests implementados

El simulador soporta estos requests (como en OBS real):

| Request | Descripción |
|---------|-------------|
| `GetVersion` | Info de versiones de OBS y obs-websocket |
| `GetStats` | Estadísticas de CPU, memoria, FPS |
| `GetSceneList` | Lista de todas las escenas disponibles |
| `GetCurrentProgramScene` | Escena actual en programa |
| `SetCurrentProgramScene` | Cambiar escena (emite evento) |
| `StartStream` | Iniciar streaming (emite evento) |
| `StopStream` | Detener streaming |
| `StartRecord` | Iniciar grabación |
| `StopRecord` | Detener grabación |

---

## 🔔 Events emitidos

El servidor emite estos eventos automáticamente:

- **CustomEvent**: Evento de bienvenida al conectarse
- **CurrentProgramSceneChanged**: Cuando cambia la escena
- **StreamStateChanged**: Cuando inicia/detiene streaming

---

## 📊 Ejemplo de output

### Conexión exitosa:
```
🔌 Conectando a ws://localhost:4455...

📥 Recibido Hello:
{
  "op": 0,
  "d": {
    "obsWebSocketVersion": "5.6.3",
    "rpcVersion": 1,
    "authentication": { ... }
  }
}

✅ Conexión establecida exitosamente!
```

### Request GetVersion:
```
📤 Enviando request: GetVersion
📥 Respuesta recibida:
{
  "op": 7,
  "d": {
    "requestType": "GetVersion",
    "requestStatus": { "result": true, "code": 100 },
    "responseData": {
      "obsVersion": "30.0.0",
      "obsWebSocketVersion": "5.6.3",
      "rpcVersion": 1,
      "availableRequests": [...]
    }
  }
}
```

### Event recibido:
```
🔔 Evento recibido: CurrentProgramSceneChanged
{
  "sceneName": "Scene 2"
}
```

---

## 🔧 Configuración

### Cambiar password:
```python
# En obs_websocket_simulator.py
self.password = "tu_password_aqui"

# En obs_websocket_client.py
OBSWebSocketClient(password="tu_password_aqui")
```

### Cambiar puerto:
```python
# En obs_websocket_simulator.py
OBSWebSocketSimulator(port=4456)

# En obs_websocket_client.py
OBSWebSocketClient(port=4456)
```

---

## 📚 Referencias

Este simulador implementa el protocolo oficial de obs-websocket 5.x:
- **Documentación completa**: [docs/generated/protocol.md](../docs/generated/protocol.md)
- **Código fuente real**: [src/](../src/)
- **OpCodes**: [src/websocketserver/types/WebSocketOpCode.h](../src/websocketserver/types/WebSocketOpCode.h)

---

## 🎯 Lo que aprendiste

Con este demo viste en acción:

1. ✅ **Protocolo WebSocket** - Cómo funciona la comunicación bidireccional
2. ✅ **Handshake de obs-websocket** - Hello → Identify → Identified
3. ✅ **Autenticación SHA256** - Sistema de seguridad del protocolo
4. ✅ **Requests/Responses** - Patrón de comunicación cliente-servidor
5. ✅ **Events** - Sistema de notificaciones push del servidor
6. ✅ **OpCodes** - Diferentes tipos de mensajes del protocolo

---

## 🚀 Próximos pasos

Para usar el obs-websocket **real**:

1. Instala OBS Studio 28.0+ (ya incluye obs-websocket)
2. Abre `Tools → obs-websocket Settings`
3. Activa el servidor WebSocket
4. Usa este cliente o cualquier otro compatible
5. Conecta a `ws://localhost:4455`

¡Ahora puedes controlar OBS desde cualquier lenguaje de programación! 🎉
