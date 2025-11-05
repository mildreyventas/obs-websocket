#!/usr/bin/env python3
"""
Cliente de prueba para obs-websocket
Demuestra cómo conectarse y usar el protocolo
"""

import asyncio
import websockets
import json
import base64
import hashlib
import uuid

class OBSWebSocketClient:
    def __init__(self, host="localhost", port=4455, password="supersecretpassword"):
        self.url = f"ws://{host}:{port}"
        self.password = password
        self.websocket = None
        self.request_id = 0
        self.pending_requests = {}

    def generate_auth_string(self, salt, challenge):
        """Genera el string de autenticación según el protocolo obs-websocket"""
        # Paso 1: Concatenar password + salt
        secret = self.password + salt

        # Paso 2: Primer SHA256
        secret_hash = hashlib.sha256(secret.encode()).digest()
        secret_b64 = base64.b64encode(secret_hash).decode('utf-8')

        # Paso 3: Concatenar con challenge
        auth_input = secret_b64 + challenge

        # Paso 4: Segundo SHA256
        auth_hash = hashlib.sha256(auth_input.encode()).digest()
        auth_string = base64.b64encode(auth_hash).decode('utf-8')

        return auth_string

    async def connect(self):
        """Conecta al servidor obs-websocket"""
        print(f"🔌 Conectando a {self.url}...")
        self.websocket = await websockets.connect(self.url)

        # 1. Recibir Hello (OpCode 0)
        hello_msg = await self.websocket.recv()
        hello_data = json.loads(hello_msg)
        print(f"\n📥 Recibido Hello:")
        print(json.dumps(hello_data, indent=2))

        if hello_data["op"] != 0:
            raise Exception("Se esperaba OpCode 0 (Hello)")

        # 2. Preparar Identify (OpCode 1)
        identify_payload = {
            "op": 1,  # OpCode Identify
            "d": {
                "rpcVersion": hello_data["d"]["rpcVersion"],
                "eventSubscriptions": 33  # General (1) + Scenes (32)
            }
        }

        # 3. Autenticación si es necesaria
        if "authentication" in hello_data["d"]:
            auth_data = hello_data["d"]["authentication"]
            auth_string = self.generate_auth_string(
                auth_data["salt"],
                auth_data["challenge"]
            )
            identify_payload["d"]["authentication"] = auth_string
            print("\n🔑 Autenticación generada")

        # 4. Enviar Identify
        await self.websocket.send(json.dumps(identify_payload))
        print(f"\n📤 Enviado Identify:")
        print(json.dumps(identify_payload, indent=2))

        # 5. Recibir Identified (OpCode 2)
        identified_msg = await self.websocket.recv()
        identified_data = json.loads(identified_msg)
        print(f"\n📥 Recibido Identified:")
        print(json.dumps(identified_data, indent=2))

        if identified_data["op"] != 2:
            raise Exception("Se esperaba OpCode 2 (Identified)")

        print("\n✅ Conexión establecida exitosamente!")
        return True

    async def send_request(self, request_type, request_data=None):
        """Envía un request al servidor"""
        self.request_id += 1
        request_id = str(self.request_id)

        request_msg = {
            "op": 6,  # OpCode Request
            "d": {
                "requestType": request_type,
                "requestId": request_id,
                "requestData": request_data or {}
            }
        }

        print(f"\n📤 Enviando request: {request_type}")
        await self.websocket.send(json.dumps(request_msg))

        # Esperar respuesta
        response_msg = await self.websocket.recv()
        response_data = json.loads(response_msg)

        print(f"📥 Respuesta recibida:")
        print(json.dumps(response_data, indent=2))

        return response_data

    async def listen_for_events(self, duration=5):
        """Escucha eventos del servidor por un tiempo determinado"""
        print(f"\n👂 Escuchando eventos por {duration} segundos...")

        try:
            async with asyncio.timeout(duration):
                async for message in self.websocket:
                    data = json.loads(message)

                    if data["op"] == 5:  # OpCode Event
                        event_type = data["d"]["eventType"]
                        event_data = data["d"].get("eventData", {})
                        print(f"\n🔔 Evento recibido: {event_type}")
                        print(json.dumps(event_data, indent=2))

                    elif data["op"] == 7:  # OpCode RequestResponse
                        print(f"\n📥 Response: {data['d']['requestType']}")
        except asyncio.TimeoutError:
            print("\n⏱️  Tiempo de escucha finalizado")

    async def close(self):
        """Cierra la conexión"""
        if self.websocket:
            await self.websocket.close()
            print("\n🔌 Conexión cerrada")

async def demo():
    """Demo completo del protocolo obs-websocket"""
    client = OBSWebSocketClient()

    try:
        # 1. Conectar
        await client.connect()

        # 2. Obtener versión
        print("\n" + "="*60)
        print("TEST 1: GetVersion")
        print("="*60)
        await client.send_request("GetVersion")

        # 3. Obtener estadísticas
        print("\n" + "="*60)
        print("TEST 2: GetStats")
        print("="*60)
        await client.send_request("GetStats")

        # 4. Obtener lista de escenas
        print("\n" + "="*60)
        print("TEST 3: GetSceneList")
        print("="*60)
        await client.send_request("GetSceneList")

        # 5. Obtener escena actual
        print("\n" + "="*60)
        print("TEST 4: GetCurrentProgramScene")
        print("="*60)
        await client.send_request("GetCurrentProgramScene")

        # 6. Cambiar escena (esto generará un evento)
        print("\n" + "="*60)
        print("TEST 5: SetCurrentProgramScene")
        print("="*60)
        await client.send_request("SetCurrentProgramScene", {"sceneName": "Scene 2"})

        # 7. Iniciar streaming (genera evento)
        print("\n" + "="*60)
        print("TEST 6: StartStream")
        print("="*60)
        await client.send_request("StartStream")

        # 8. Iniciar grabación
        print("\n" + "="*60)
        print("TEST 7: StartRecord")
        print("="*60)
        await client.send_request("StartRecord")

        # 9. Esperar un momento para recibir eventos
        await asyncio.sleep(1)

        # 10. Detener streaming
        print("\n" + "="*60)
        print("TEST 8: StopStream")
        print("="*60)
        await client.send_request("StopStream")

        # 11. Detener grabación
        print("\n" + "="*60)
        print("TEST 9: StopRecord")
        print("="*60)
        await client.send_request("StopRecord")

        print("\n" + "="*60)
        print("✅ ¡Demo completado exitosamente!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await client.close()

if __name__ == "__main__":
    print("🎬 obs-websocket Client Demo")
    print("="*60)
    asyncio.run(demo())
