#!/bin/bash

# Script de gestión del servidor obs-websocket simulator

show_menu() {
    echo ""
    echo "🎬 obs-websocket Simulator - Gestión con PM2"
    echo "=============================================="
    echo ""
    echo "1. 📊 Ver estado del servidor"
    echo "2. 🚀 Iniciar servidor"
    echo "3. 🛑 Detener servidor"
    echo "4. 🔄 Reiniciar servidor"
    echo "5. 📋 Ver logs en tiempo real"
    echo "6. 📜 Ver últimas 50 líneas de logs"
    echo "7. 🗑️  Eliminar del PM2"
    echo "8. 🎮 Probar con cliente Python"
    echo "9. 🌐 Abrir cliente HTML"
    echo "0. ❌ Salir"
    echo ""
    read -p "Selecciona una opción: " option
}

while true; do
    show_menu

    case $option in
        1)
            echo ""
            echo "📊 Estado del servidor:"
            pm2 list
            pm2 show obs-websocket 2>/dev/null
            ;;
        2)
            echo ""
            echo "🚀 Iniciando servidor..."
            pm2 start /workspaces/obs-websocket/demo/obs_websocket_simulator.py \
                --name obs-websocket \
                --interpreter python3 \
                --log-date-format "YYYY-MM-DD HH:mm:ss Z"
            echo ""
            echo "✅ Servidor iniciado en ws://localhost:4455"
            echo "🔑 Password: supersecretpassword"
            ;;
        3)
            echo ""
            echo "🛑 Deteniendo servidor..."
            pm2 stop obs-websocket
            ;;
        4)
            echo ""
            echo "🔄 Reiniciando servidor..."
            pm2 restart obs-websocket
            ;;
        5)
            echo ""
            echo "📋 Logs en tiempo real (Ctrl+C para salir):"
            pm2 logs obs-websocket
            ;;
        6)
            echo ""
            echo "📜 Últimas 50 líneas de logs:"
            pm2 logs obs-websocket --lines 50 --nostream
            ;;
        7)
            echo ""
            echo "🗑️  Eliminando del PM2..."
            pm2 delete obs-websocket
            ;;
        8)
            echo ""
            echo "🎮 Ejecutando cliente de prueba..."
            python3 /workspaces/obs-websocket/demo/obs_websocket_client.py
            ;;
        9)
            echo ""
            echo "🌐 Abriendo cliente HTML..."
            echo "📍 Ruta: /workspaces/obs-websocket/demo/obs_websocket_test.html"
            echo ""
            echo "Opciones para abrir:"
            echo "1. VSCode: Click derecho → Open with Live Server"
            echo "2. Browser: file:///workspaces/obs-websocket/demo/obs_websocket_test.html"
            echo "3. Port forward: Si usas Codespaces/remoto"
            ;;
        0)
            echo ""
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Opción inválida"
            ;;
    esac

    read -p "Presiona Enter para continuar..."
done
