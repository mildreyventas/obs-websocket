#!/usr/bin/env python3
"""
Simulador de obs-websocket server
Implementa el protocolo obs-websocket 5.x para demostración
"""

import asyncio
import websockets
import json
import base64
import hashlib
import secrets
from datetime import datetime

class OBSWebSocketSimulator:
    def __init__(self, host="localhost", port=4455):
        self.host = host
        self.port = port
        self.password = "supersecretpassword"
        self.rpc_version = 1
        self.obs_version = "30.0.0"
        self.obs_websocket_version = "5.6.3"

        # Estado simulado de OBS
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
        """Genera challenge y salt para autenticación"""
        self.salt = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
        self.challenge = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
        return {
            "challenge": self.challenge,
            "salt": self.salt
        }

    def verify_auth(self, auth_string):
        """Verifica la autenticación del cliente"""
        # Concatenar password + salt
        secret = self.password + self.salt
        # Primer hash
        secret_hash = hashlib.sha256(secret.encode()).digest()
        secret_b64 = base64.b64encode(secret_hash).decode('utf-8')

        # Concatenar con challenge
        auth_input = secret_b64 + self.challenge
        # Segundo hash
        auth_hash = hashlib.sha256(auth_input.encode()).digest()
        expected_auth = base64.b64encode(auth_hash).decode('utf-8')

        return auth_string == expected_auth

    def create_hello_message(self):
        """OpCode 0: Hello - Primer mensaje al conectarse"""
        return {
            "op": 0,  # OpCode Hello
            "d": {
                "obsWebSocketVersion": self.obs_websocket_version,
                "rpcVersion": self.rpc_version,
                "authentication": self.generate_auth_challenge()
            }
        }

    def create_identified_message(self):
        """OpCode 2: Identified - Respuesta tras identificación exitosa"""
        return {
            "op": 2,  # OpCode Identified
            "d": {
                "negotiatedRpcVersion": self.rpc_version
            }
        }

    def handle_request(self, request_type, request_data):
        """Procesa diferentes tipos de requests"""

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
                "platform": "ubuntu",
                "platformDescription": "Ubuntu 24.04 LTS"
            }

        elif request_type == "GetStats":
            return {
                **self.state["stats"],
                "availableDiskSpace": 50000,
                "averageFrameRenderTime": 16.67,
                "outputSkippedFrames": 0,
                "outputTotalFrames": 3600,
                "webSocketSessionIncomingMessages": 5,
                "webSocketSessionOutgoingMessages": 10
            }

        elif request_type == "GetSceneList":
            return {
                "currentProgramSceneName": self.state["current_scene"],
                "scenes": [{"sceneName": scene, "sceneIndex": i}
                          for i, scene in enumerate(self.state["scenes"])]
            }

        elif request_type == "GetCurrentProgramScene":
            return {
                "currentProgramSceneName": self.state["current_scene"]
            }

        elif request_type == "SetCurrentProgramScene":
            scene_name = request_data.get("sceneName")
            if scene_name in self.state["scenes"]:
                old_scene = self.state["current_scene"]
                self.state["current_scene"] = scene_name
                return {"success": True, "oldScene": old_scene, "newScene": scene_name}
            else:
                return {"error": "Scene not found"}

        elif request_type == "StartStream":
            self.state["streaming"] = True
            return {"success": True, "message": "Streaming iniciado"}

        elif request_type == "StopStream":
            self.state["streaming"] = False
            return {"success": True, "message": "Streaming detenido"}

        elif request_type == "StartRecord":
            self.state["recording"] = True
            return {"success": True, "message": "Grabación iniciada"}

        elif request_type == "StopRecord":
            self.state["recording"] = False
            return {"success": True, "message": "Grabación detenida"}

        else:
            return {"error": f"Request type '{request_type}' no reconocido"}

    def create_request_response(self, request_id, request_type, request_data):
        """OpCode 7: RequestResponse"""
        response_data = self.handle_request(request_type, request_data)

        return {
            "op": 7,  # OpCode RequestResponse
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
        """OpCode 5: Event"""
        return {
            "op": 5,  # OpCode Event
            "d": {
                "eventType": event_type,
                "eventIntent": 1,
                "eventData": event_data
            }
        }

    async def handle_client(self, websocket):
        """Maneja la conexión de un cliente"""
        print(f"🔌 Cliente conectado desde {websocket.remote_address}")

        try:
            # 1. Enviar Hello
            hello_msg = self.create_hello_message()
            await websocket.send(json.dumps(hello_msg))
            print(f"📤 Enviado Hello: {json.dumps(hello_msg, indent=2)}")

            # 2. Esperar Identify
            identify_msg = await websocket.recv()
            identify_data = json.loads(identify_msg)
            print(f"📥 Recibido: {json.dumps(identify_data, indent=2)}")

            if identify_data.get("op") != 1:  # OpCode Identify
                print("❌ Se esperaba OpCode 1 (Identify)")
                await websocket.close(4004, "Not Identified")
                return

            # 3. Verificar autenticación
            auth_string = identify_data["d"].get("authentication")
            if auth_string:
                if not self.verify_auth(auth_string):
                    print("❌ Autenticación fallida")
                    await websocket.close(4003, "Authentication Failed")
                    return
                print("✅ Autenticación exitosa")

            # 4. Enviar Identified
            identified_msg = self.create_identified_message()
            await websocket.send(json.dumps(identified_msg))
            print(f"📤 Enviado Identified: {json.dumps(identified_msg, indent=2)}")

            # 5. Enviar evento de bienvenida
            welcome_event = self.create_event("CustomEvent", {
                "message": "¡Bienvenido a obs-websocket simulator!",
                "timestamp": datetime.now().isoformat()
            })
            await websocket.send(json.dumps(welcome_event))
            print(f"📤 Evento enviado: CustomEvent")

            # 6. Loop principal - procesar requests
            async for message in websocket:
                data = json.loads(message)
                print(f"\n📥 Request recibido: {json.dumps(data, indent=2)}")

                if data.get("op") == 6:  # OpCode Request
                    request_type = data["d"]["requestType"]
                    request_id = data["d"]["requestId"]
                    request_data = data["d"].get("requestData", {})

                    # Procesar request
                    response = self.create_request_response(
                        request_id, request_type, request_data
                    )

                    await websocket.send(json.dumps(response))
                    print(f"📤 Response enviado: {request_type}")

                    # Emitir eventos si cambió el estado
                    if request_type == "SetCurrentProgramScene":
                        scene_event = self.create_event("CurrentProgramSceneChanged", {
                            "sceneName": self.state["current_scene"]
                        })
                        await websocket.send(json.dumps(scene_event))
                        print(f"📤 Evento: CurrentProgramSceneChanged")

                    elif request_type == "StartStream":
                        stream_event = self.create_event("StreamStateChanged", {
                            "outputActive": True,
                            "outputState": "OBS_WEBSOCKET_OUTPUT_STARTED"
                        })
                        await websocket.send(json.dumps(stream_event))
                        print(f"📤 Evento: StreamStateChanged")

        except websockets.exceptions.ConnectionClosed:
            print(f"❌ Cliente desconectado")
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

    async def start(self):
        """Inicia el servidor"""
        print(f"🚀 Iniciando obs-websocket simulator...")
        print(f"📡 Escuchando en ws://{self.host}:{self.port}")
        print(f"🔑 Password: {self.password}")
        print(f"📋 Versión RPC: {self.rpc_version}")
        print(f"🎬 Versión OBS: {self.obs_version}")
        print(f"🔌 Versión obs-websocket: {self.obs_websocket_version}")
        print("-" * 60)

        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()  # Run forever

if __name__ == "__main__":
    simulator = OBSWebSocketSimulator()
    asyncio.run(simulator.start())
