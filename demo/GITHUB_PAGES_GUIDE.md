# 🌐 Cómo Publicar la Página en GitHub Pages

## 📋 Pasos para publicar tu demo en GitHub Pages

### Opción 1: Crear un nuevo repositorio (RECOMENDADO)

#### 1. Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repo: `obs-websocket-demo` (o el que quieras)
3. Marca como **Public**
4. NO inicialices con README
5. Click en "Create repository"

#### 2. Preparar los archivos

```bash
# Crear directorio para el nuevo repo
mkdir -p /tmp/obs-websocket-demo
cd /tmp/obs-websocket-demo

# Copiar solo los archivos del demo
cp /workspaces/obs-websocket/demo/obs_websocket_test.html index.html
cp /workspaces/obs-websocket/demo/README.md .
cp /workspaces/obs-websocket/demo/DEMO_SUMMARY.md .

# Inicializar git
git init
git add .
git commit -m "Initial commit: obs-websocket demo"

# Conectar con tu repo (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/obs-websocket-demo.git
git branch -M main
git push -u origin main
```

#### 3. Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` → carpeta: `/ (root)`
5. Save

#### 4. Esperar y acceder

- GitHub Pages tarda 1-2 minutos en construirse
- Tu página estará en: `https://TU_USUARIO.github.io/obs-websocket-demo/`

---

### Opción 2: Usar GitHub CLI (más rápido)

Si tienes `gh` instalado:

```bash
# Crear directorio temporal
mkdir -p /tmp/obs-websocket-demo
cd /tmp/obs-websocket-demo

# Copiar archivo HTML como index.html
cp /workspaces/obs-websocket/demo/obs_websocket_test.html index.html

# Crear README
cat > README.md << 'EOF'
# obs-websocket Demo Client

Cliente web interactivo para probar obs-websocket.

🌐 [Ver Demo](https://TU_USUARIO.github.io/obs-websocket-demo/)

## Uso

1. Abre la página
2. Configura la conexión a tu servidor obs-websocket
3. ¡Prueba los diferentes requests!

EOF

# Inicializar repo
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub y pushear
gh repo create obs-websocket-demo --public --source=. --remote=origin --push

# Activar GitHub Pages
gh repo edit --enable-pages --pages-branch main --pages-path /
```

---

### Opción 3: Usar un solo archivo HTML estático

**SUPER SIMPLE**: Solo sube el archivo HTML a GitHub Gist:

1. Ve a https://gist.github.com/
2. Copia el contenido de `demo/obs_websocket_test.html`
3. Pégalo en el gist
4. Nombre del archivo: `obs-websocket-client.html`
5. Crea el Gist (público)
6. Copia la URL del "Raw"
7. Usa https://htmlpreview.github.io/?URL_DE_TU_GIST_RAW

---

## 🔧 Modificaciones necesarias para conectar al servidor

Una vez publicado, los usuarios necesitarán:

### Si el servidor WebSocket está en Codespaces:

Actualizar en la página:
- Host: `TU-CODESPACE-4455.preview.app.github.dev`
- Port: `443`
- Password: `supersecretpassword`

### Si el servidor está en local:

Los usuarios deben tener el servidor corriendo en su máquina:
- Host: `localhost`
- Port: `4455`
- Password: (el que configuren)

### Si tienes un servidor público:

- Host: `tu-servidor.com`
- Port: `4455`
- Password: (el configurado)

---

## 🚀 Script automatizado

Aquí está un script completo para publicar:

```bash
#!/bin/bash

# Configuración
REPO_NAME="obs-websocket-demo"
GITHUB_USER="TU_USUARIO"  # ⚠️ CAMBIA ESTO

echo "🚀 Publicando obs-websocket demo en GitHub Pages..."

# Crear directorio temporal
TMP_DIR="/tmp/$REPO_NAME"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

# Copiar archivos
cp /workspaces/obs-websocket/demo/obs_websocket_test.html index.html
cp /workspaces/obs-websocket/demo/README.md .

# Crear README para GitHub
cat > README.md << EOF
# 🎬 obs-websocket Demo Client

Cliente web interactivo para probar y controlar obs-websocket.

## 🌐 Demo en vivo

👉 [Abrir Demo](https://${GITHUB_USER}.github.io/${REPO_NAME}/)

## 📋 Características

- ✅ Conexión WebSocket con autenticación SHA256
- ✅ 9+ requests implementados
- ✅ Visualización de eventos en tiempo real
- ✅ Log de comunicación completo
- ✅ Interfaz moderna y responsive

## 🚀 Uso

1. Abre la demo
2. Configura tu servidor obs-websocket:
   - Host del servidor
   - Puerto (default: 4455)
   - Password
3. Click en "Conectar"
4. ¡Prueba los botones de control!

## 🔧 Requisitos

Necesitas un servidor obs-websocket corriendo:
- OBS Studio 28.0+ (incluye obs-websocket)
- O un servidor simulado

## 📚 Más información

- [Documentación oficial de obs-websocket](https://github.com/obsproject/obs-websocket)
- [Protocolo obs-websocket 5.x](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)

EOF

# Inicializar git
git init
git add .
git commit -m "🚀 Initial commit: obs-websocket interactive demo"

# Crear repo (requiere gh cli)
if command -v gh &> /dev/null; then
    echo "📦 Creando repositorio en GitHub..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

    echo "🌐 Habilitando GitHub Pages..."
    gh repo edit --enable-pages --pages-branch main --pages-path /

    echo ""
    echo "✅ ¡Publicado exitosamente!"
    echo "🌐 URL: https://${GITHUB_USER}.github.io/${REPO_NAME}/"
    echo ""
    echo "⏳ La página estará lista en 1-2 minutos"
else
    echo "⚠️  GitHub CLI no instalado"
    echo ""
    echo "Pasos manuales:"
    echo "1. Crea el repo: https://github.com/new"
    echo "2. Ejecuta:"
    echo "   git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo "3. Activa Pages en Settings → Pages"
fi
```

---

## 📝 Notas importantes

### Limitaciones de GitHub Pages:

- ✅ Archivos estáticos (HTML, CSS, JS)
- ❌ No puede ejecutar Python/Node
- ❌ No puede ser servidor WebSocket
- ✅ Puede ser **CLIENTE** de WebSocket

### Solución:

GitHub Pages servirá el **cliente HTML** (la interfaz web)
El **servidor WebSocket** debe estar en:
- Tu Codespace (como ahora)
- Tu máquina local
- Un servidor en la nube (Heroku, Railway, etc.)

---

## 🎯 Resumen rápido

**Para publicar tu página web:**
1. Crea un repo en GitHub
2. Sube `obs_websocket_test.html` como `index.html`
3. Activa GitHub Pages
4. Accede a `https://TU_USUARIO.github.io/NOMBRE_REPO/`

**El servidor WebSocket lo mantienes en:**
- Codespaces (temporal)
- VPS/Cloud (permanente)
- Local (solo para ti)

---

¿Necesitas ayuda con algún paso específico? 🚀
