#!/usr/bin/env python3
"""
Servidor HTTP simple para servir el cliente HTML
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/workspaces/obs-websocket/demo", **kwargs)

    def end_headers(self):
        # Agregar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == '__main__':
    PORT = 8080

    print("=" * 60)
    print("🌐 Servidor HTTP iniciado")
    print("=" * 60)
    print(f"")
    print(f"📡 Puerto local: {PORT}")
    print(f"📂 Sirviendo desde: /workspaces/obs-websocket/demo")
    print(f"")
    print(f"🔗 URLs disponibles:")
    print(f"")
    print(f"   Local: http://localhost:{PORT}/obs_websocket_test.html")
    print(f"")
    print(f"   Codespaces (público):")
    print(f"   https://psychic-winner-q75599wjg7rqcp57-{PORT}.preview.app.github.dev/obs_websocket_test.html")
    print(f"")
    print("=" * 60)
    print(f"")
    print(f"⚠️  IMPORTANTE: Actualiza la URL del WebSocket en el HTML:")
    print(f"   Desde: ws://localhost:4455")
    print(f"   A:     wss://psychic-winner-q75599wjg7rqcp57-4455.preview.app.github.dev")
    print(f"")
    print("=" * 60)
    print(f"Presiona Ctrl+C para detener")
    print("")

    server = HTTPServer(('0.0.0.0', PORT), CustomHandler)
    server.serve_forever()
