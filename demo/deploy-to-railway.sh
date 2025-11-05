#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🚂  Desplegar Servidor en Railway (GRATIS)  🚂          ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Crear directorio para Railway
DEPLOY_DIR="/tmp/obs-websocket-server"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "📦 Preparando archivos para Railway..."

# Copiar servidor
cp /workspaces/obs-websocket/demo/obs_websocket_simulator.py server.py

# Crear requirements.txt
cat > requirements.txt << 'EOF'
websockets==12.0
EOF

# Crear railway.json (configuración)
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python3 server.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Crear Procfile (alternativa)
cat > Procfile << 'EOF'
web: python3 server.py
EOF

# Crear README
cat > README.md << 'EOF'
# obs-websocket Server

Servidor WebSocket que implementa el protocolo obs-websocket 5.x

## 🚀 Despliegue

Este servidor está diseñado para desplegarse en Railway.app

## 📡 Endpoints

- WebSocket: `wss://tu-app.railway.app`
- Puerto: El que asigne Railway (automático)
- Password: `supersecretpassword`

## 🔧 Configuración

El servidor escucha en `0.0.0.0` y el puerto que Railway asigne
vía la variable de entorno `PORT`.

## 📚 Protocolo

Implementa obs-websocket 5.x con:
- Autenticación SHA256
- OpCodes 0-9
- Requests básicos
- Events en tiempo real
EOF

# Modificar servidor para usar puerto de Railway
cat > server.py << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Servidor obs-websocket para Railway
"""

import asyncio
import websockets
import json
import base64
import hashlib
import secrets
import os
from datetime import datetime

class OBSWebSocketServer:
    def __init__(self):
        # Railway asigna el puerto vía variable de entorno
        self.host = "0.0.0.0"
        self.port = int(os.environ.get("PORT", 4455))
        self.password = os.environ.get("WEBSOCKET_PASSWORD", "supersecretpassword")
        self.rpc_version = 1
        self.obs_version = "30.0.0"
        self.obs_websocket_version = "5.6.3"

        self.state = {
            "streaming": False,
            "recording": False,
            "current_scene": "Scene 1",
            "scenes": ["Scene 1", "Scene 2", "Scene 3"],
            "stats": {
                "cpuUsage": 15.5,
                "memoryUsage": 512.3,
                "activeFps": 60.0,
                "renderSkippedFrames": 0,
                "renderTotalFrames": 3600
            }
        }

    def generate_auth_challenge(self):
        self.salt = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
        self.challenge = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
        return {"challenge": self.challenge, "salt": self.salt}

    def verify_auth(self, auth_string):
        secret = self.password + self.salt
        secret_hash = hashlib.sha256(secret.encode()).digest()
        secret_b64 = base64.b64encode(secret_hash).decode('utf-8')
        auth_input = secret_b64 + self.challenge
        auth_hash = hashlib.sha256(auth_input.encode()).digest()
        expected_auth = base64.b64encode(auth_hash).decode('utf-8')
        return auth_string == expected_auth

    def create_hello_message(self):
        return {
            "op": 0,
            "d": {
                "obsWebSocketVersion": self.obs_websocket_version,
                "rpcVersion": self.rpc_version,
                "authentication": self.generate_auth_challenge()
            }
        }

    def create_identified_message(self):
        return {"op": 2, "d": {"negotiatedRpcVersion": self.rpc_version}}

    def handle_request(self, request_type, request_data):
        if request_type == "GetVersion":
            return {
                "obsVersion": self.obs_version,
                "obsWebSocketVersion": self.obs_websocket_version,
                "rpcVersion": self.rpc_version,
                "availableRequests": [
                    "GetVersion", "GetStats", "GetSceneList",
                    "GetCurrentProgramScene", "SetCurrentProgramScene",
                    "StartStream", "StopStream", "StartRecord", "StopRecord"
                ],
                "supportedImageFormats": ["png", "jpg", "bmp"],
                "platform": "railway",
                "platformDescription": "Railway Deployment"
            }
        elif request_type == "GetStats":
            return {**self.state["stats"], "availableDiskSpace": 50000,
                    "averageFrameRenderTime": 16.67, "outputSkippedFrames": 0,
                    "outputTotalFrames": 3600, "webSocketSessionIncomingMessages": 5,
                    "webSocketSessionOutgoingMessages": 10}
        elif request_type == "GetSceneList":
            return {"currentProgramSceneName": self.state["current_scene"],
                    "scenes": [{"sceneName": s, "sceneIndex": i} for i, s in enumerate(self.state["scenes"])]}
        elif request_type == "GetCurrentProgramScene":
            return {"currentProgramSceneName": self.state["current_scene"]}
        elif request_type == "SetCurrentProgramScene":
            scene_name = request_data.get("sceneName")
            if scene_name in self.state["scenes"]:
                old_scene = self.state["current_scene"]
                self.state["current_scene"] = scene_name
                return {"success": True, "oldScene": old_scene, "newScene": scene_name}
            return {"error": "Scene not found"}
        elif request_type == "StartStream":
            self.state["streaming"] = True
            return {"success": True, "message": "Streaming started"}
        elif request_type == "StopStream":
            self.state["streaming"] = False
            return {"success": True, "message": "Streaming stopped"}
        elif request_type == "StartRecord":
            self.state["recording"] = True
            return {"success": True, "message": "Recording started"}
        elif request_type == "StopRecord":
            self.state["recording"] = False
            return {"success": True, "message": "Recording stopped"}
        return {"error": f"Unknown request: {request_type}"}

    def create_request_response(self, request_id, request_type, request_data):
        response_data = self.handle_request(request_type, request_data)
        return {
            "op": 7,
            "d": {
                "requestType": request_type,
                "requestId": request_id,
                "requestStatus": {
                    "result": True,
                    "code": 100 if "error" not in response_data else 600,
                    "comment": response_data.get("error", "OK")
                },
                "responseData": response_data
            }
        }

    def create_event(self, event_type, event_data):
        return {"op": 5, "d": {"eventType": event_type, "eventIntent": 1, "eventData": event_data}}

    async def handle_client(self, websocket):
        print(f"🔌 Client connected from {websocket.remote_address}")
        try:
            hello_msg = self.create_hello_message()
            await websocket.send(json.dumps(hello_msg))

            identify_msg = await websocket.recv()
            identify_data = json.loads(identify_msg)

            if identify_data.get("op") != 1:
                await websocket.close(4004, "Not Identified")
                return

            auth_string = identify_data["d"].get("authentication")
            if auth_string and not self.verify_auth(auth_string):
                await websocket.close(4003, "Authentication Failed")
                return

            identified_msg = self.create_identified_message()
            await websocket.send(json.dumps(identified_msg))

            welcome_event = self.create_event("CustomEvent", {
                "message": "Welcome to obs-websocket!",
                "timestamp": datetime.now().isoformat()
            })
            await websocket.send(json.dumps(welcome_event))

            async for message in websocket:
                data = json.loads(message)
                if data.get("op") == 6:
                    request_type = data["d"]["requestType"]
                    request_id = data["d"]["requestId"]
                    request_data = data["d"].get("requestData", {})
                    response = self.create_request_response(request_id, request_type, request_data)
                    await websocket.send(json.dumps(response))

                    if request_type == "SetCurrentProgramScene":
                        scene_event = self.create_event("CurrentProgramSceneChanged",
                                                       {"sceneName": self.state["current_scene"]})
                        await websocket.send(json.dumps(scene_event))
                    elif request_type == "StartStream":
                        stream_event = self.create_event("StreamStateChanged",
                                                        {"outputActive": True, "outputState": "STARTED"})
                        await websocket.send(json.dumps(stream_event))
        except websockets.exceptions.ConnectionClosed:
            print(f"❌ Client disconnected")
        except Exception as e:
            print(f"❌ Error: {e}")

    async def start(self):
        print(f"🚀 obs-websocket server starting...")
        print(f"📡 Listening on {self.host}:{self.port}")
        print(f"🔑 Password: {self.password}")
        print(f"📋 RPC Version: {self.rpc_version}")
        print("-" * 60)

        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()

if __name__ == "__main__":
    server = OBSWebSocketServer()
    asyncio.run(server.start())
PYTHON_EOF

echo ""
echo "✅ Archivos preparados en: $DEPLOY_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚂 PASOS PARA DESPLEGAR EN RAILWAY:"
echo ""
echo "1. Ve a: https://railway.app/"
echo "2. Click en 'Start a New Project'"
echo "3. Selecciona 'Deploy from GitHub repo'"
echo "4. O usa 'Empty Project' y sube los archivos"
echo ""
echo "OPCIÓN A - Con GitHub (recomendado):"
echo "  a. Crea un repo en GitHub"
echo "  b. Sube estos archivos:"
cd "$DEPLOY_DIR"
ls -la
echo ""
echo "  c. Conecta Railway con tu repo"
echo "  d. ¡Despliega!"
echo ""
echo "OPCIÓN B - CLI de Railway:"
echo "  npm install -g @railway/cli"
echo "  railway login"
echo "  cd $DEPLOY_DIR"
echo "  railway init"
echo "  railway up"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Archivos creados:"
echo "  - server.py          (Servidor WebSocket)"
echo "  - requirements.txt   (Dependencias Python)"
echo "  - railway.json       (Config de Railway)"
echo "  - Procfile          (Comando de inicio)"
echo "  - README.md         (Documentación)"
echo ""
echo "🔑 Configura en Railway:"
echo "  Variable de entorno: WEBSOCKET_PASSWORD=supersecretpassword"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
