#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🚀  Publicar obs-websocket Demo en GitHub Pages  🚀     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si gh está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no está instalado"
    echo ""
    echo "Instala con:"
    echo "  brew install gh          (Mac)"
    echo "  sudo apt install gh      (Linux)"
    echo "  winget install GitHub.cli (Windows)"
    echo ""
    echo "O sigue los pasos manuales en: GITHUB_PAGES_GUIDE.md"
    exit 1
fi

# Pedir datos al usuario
read -p "📝 Tu usuario de GitHub: " GITHUB_USER
read -p "📝 Nombre del repositorio (default: obs-websocket-demo): " REPO_NAME
REPO_NAME=${REPO_NAME:-obs-websocket-demo}

echo ""
echo "📦 Configuración:"
echo "   Usuario: $GITHUB_USER"
echo "   Repositorio: $REPO_NAME"
echo "   URL final: https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
read -p "¿Continuar? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# Crear directorio temporal
TMP_DIR="/tmp/$REPO_NAME"
echo ""
echo "📁 Creando directorio temporal: $TMP_DIR"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

# Copiar archivo HTML como index.html
echo "📄 Copiando archivos..."
cp /workspaces/obs-websocket/demo/obs_websocket_test.html index.html

# Crear README
cat > README.md << EOF
# 🎬 obs-websocket Demo Client

Cliente web interactivo para probar y controlar obs-websocket.

## 🌐 Demo en vivo

👉 **[Abrir Demo](https://${GITHUB_USER}.github.io/${REPO_NAME}/)**

## 📋 Características

- ✅ Conexión WebSocket con autenticación SHA256
- ✅ 9+ requests implementados (GetVersion, GetStats, GetSceneList, etc.)
- ✅ Visualización de eventos en tiempo real
- ✅ Log de comunicación completo
- ✅ Interfaz moderna y responsive

## 🚀 Cómo usar

1. **Abre la demo**: [https://${GITHUB_USER}.github.io/${REPO_NAME}/](https://${GITHUB_USER}.github.io/${REPO_NAME}/)

2. **Configura tu conexión**:
   - **Host**: Dirección de tu servidor obs-websocket
   - **Puerto**: 4455 (default)
   - **Password**: Tu contraseña configurada

3. **Conecta y prueba**:
   - Click en "🔌 Conectar"
   - Prueba los diferentes botones de control
   - Observa los eventos en tiempo real

## 🔧 Requisitos

Necesitas tener un servidor obs-websocket corriendo:

### Opción 1: OBS Studio (recomendado)
- Instala OBS Studio 28.0+ (incluye obs-websocket)
- Ve a Tools → obs-websocket Settings
- Habilita el servidor
- Copia el password

### Opción 2: Servidor simulado
- Usa el simulador incluido en el repositorio
- Ejecuta con PM2 o Python

## 📡 Conectar desde diferentes lugares

### Si tu servidor está en localhost:
\`\`\`
Host: localhost
Port: 4455
Password: tu_password
\`\`\`

### Si tu servidor está en Codespaces:
\`\`\`
Host: tu-codespace-4455.preview.app.github.dev
Port: 443
Password: tu_password
\`\`\`

### Si tu servidor está en un VPS/Cloud:
\`\`\`
Host: tu-servidor.com
Port: 4455
Password: tu_password
\`\`\`

## 📚 Documentación

- [obs-websocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [obs-websocket GitHub](https://github.com/obsproject/obs-websocket)
- [Cliente libraries](https://github.com/obsproject/obs-websocket#client-libraries-for-developers)

## 🛠️ Desarrollo

Este cliente está construido con:
- HTML5
- JavaScript vanilla
- WebSocket API
- SHA256 para autenticación

## 📄 Licencia

MIT License - Siéntete libre de usar y modificar

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Abre un issue o pull request.

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

EOF

# Crear .gitignore
cat > .gitignore << EOF
.DS_Store
*.log
node_modules/
EOF

# Inicializar git
echo "🔧 Inicializando repositorio Git..."
git init
git add .
git commit -m "🚀 Initial commit: obs-websocket interactive web client"

# Autenticarse con GitHub si es necesario
echo ""
echo "🔐 Verificando autenticación con GitHub..."
gh auth status || gh auth login

# Crear repositorio
echo ""
echo "📦 Creando repositorio en GitHub..."
if gh repo create "$REPO_NAME" --public --source=. --remote=origin --push; then
    echo ""
    echo "🌐 Habilitando GitHub Pages..."
    sleep 2
    gh api repos/${GITHUB_USER}/${REPO_NAME}/pages \
        -X POST \
        -f source[branch]=main \
        -f source[path]=/ 2>/dev/null || echo "⚠️  Habilita Pages manualmente en Settings"

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              ✅  ¡PUBLICADO EXITOSAMENTE!  ✅               ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 URL de tu página:"
    echo ""
    echo "   https://${GITHUB_USER}.github.io/${REPO_NAME}/"
    echo ""
    echo "📝 Repositorio:"
    echo ""
    echo "   https://github.com/${GITHUB_USER}/${REPO_NAME}"
    echo ""
    echo "⏳ La página estará lista en 1-2 minutos"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Próximos pasos:"
    echo ""
    echo "1. Espera 1-2 minutos a que GitHub Pages construya la página"
    echo "2. Abre: https://${GITHUB_USER}.github.io/${REPO_NAME}/"
    echo "3. Configura tu servidor obs-websocket"
    echo "4. ¡Disfruta!"
    echo ""
else
    echo ""
    echo "❌ Error al crear el repositorio"
    echo ""
    echo "Pasos manuales:"
    echo "1. Crea el repo: https://github.com/new"
    echo "2. Nombre: $REPO_NAME (público)"
    echo "3. Ejecuta:"
    echo "   git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo "4. Settings → Pages → Source: main branch"
fi

echo ""
echo "🗂️  Archivos temporales en: $TMP_DIR"
echo ""
