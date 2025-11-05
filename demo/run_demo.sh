#!/bin/bash

echo "🎬 obs-websocket Demo - Simulador y Cliente"
echo "=============================================="
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado"
    exit 1
fi

# Instalar dependencias si no están
echo "📦 Verificando dependencias..."
pip3 install websockets --quiet 2>/dev/null || pip install websockets --quiet

echo ""
echo "🚀 Opción 1: Ejecutar servidor y cliente automáticamente"
echo "🚀 Opción 2: Ejecutar servidor solamente"
echo "🚀 Opción 3: Ejecutar cliente solamente"
echo ""
read -p "Selecciona una opción (1/2/3): " option

case $option in
    1)
        echo ""
        echo "🔄 Iniciando servidor en background..."
        python3 /workspaces/obs-websocket/demo/obs_websocket_simulator.py &
        SERVER_PID=$!

        echo "⏳ Esperando 2 segundos para que el servidor inicie..."
        sleep 2

        echo ""
        echo "🎮 Ejecutando cliente de prueba..."
        python3 /workspaces/obs-websocket/demo/obs_websocket_client.py

        echo ""
        echo "🛑 Deteniendo servidor..."
        kill $SERVER_PID 2>/dev/null

        echo "✅ Demo completado"
        ;;
    2)
        echo ""
        echo "🔄 Iniciando servidor..."
        echo "📝 Presiona Ctrl+C para detener"
        echo ""
        python3 /workspaces/obs-websocket/demo/obs_websocket_simulator.py
        ;;
    3)
        echo ""
        echo "🎮 Ejecutando cliente..."
        echo "⚠️  Asegúrate de que el servidor esté corriendo en otro terminal"
        echo ""
        python3 /workspaces/obs-websocket/demo/obs_websocket_client.py
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac
