# 🎨 AI Animations - Animaciones Generadas por IA

## 🚀 Descripción

Sistema de animaciones dinámicas para OBS Online que usa **Inteligencia Artificial** para generar código de animación en tiempo real.

## ✨ Características

### 🤖 Generación con IA
- **GroqAI** (GRATIS) - Modelo Mixtral 8x7B
- **OpenAI** - GPT-4
- **Claude** (próximamente)
- **API Personalizada** - Usa tu propia IA

### 🎬 Widgets Predefinidos

1. **⏰ Reloj Digital**
   - Reloj animado con efectos de color
   - Fondo transparente
   - Bordes brillantes animados

2. **💬 Chat en Vivo**
   - Muestra mensajes de chat
   - Animación de entrada
   - Colores personalizables por usuario

3. **💰 Super Chat**
   - Donaciones destacadas
   - Animación de entrada espectacular
   - Fondo dorado brillante

4. **🏆 Tabla de Clasificación**
   - Ranking de jugadores/participantes
   - Animación pulsante
   - Colores para top 3 (oro, plata, bronce)

5. **⚽ Marcador**
   - Score de 2 equipos
   - Colores personalizables
   - Separador animado

## 🔑 Configuración de API Keys

### GroqAI (GRATIS - Recomendado)

1. Ve a https://console.groq.com
2. Crea una cuenta gratis
3. Ve a "API Keys"
4. Crea una nueva key
5. Copia la key

**Límites gratuitos:**
- 30 requests por minuto
- Suficiente para animaciones

### OpenAI

1. Ve a https://platform.openai.com
2. Crea una cuenta
3. Ve a "API Keys"
4. Crea una nueva key
5. Agrega créditos ($5 mínimo)

## 💻 Uso en OBS Online

### Método 1: Widget Predefinido

```javascript
// Crear fuente de animación
const aiSource = new AIAnimationSource({
    name: 'Reloj Digital',
    width: 800,
    height: 200
});

// Cargar widget predefinido
aiSource.loadPredefinedWidget('clock');

// Iniciar animación
aiSource.start();

// Obtener canvas para OBS
const canvas = aiSource.getCanvas();
```

### Método 2: Generar con IA

```javascript
// Crear fuente con API key
const aiSource = new AIAnimationSource({
    name: 'Animación Custom',
    width: 1000,
    height: 300,
    aiProvider: 'groq', // o 'openai'
    apiKey: 'tu-api-key-aqui'
});

// Generar animación con prompt
await aiSource.generateAnimation(
    'Un contador regresivo desde 10 hasta 0 con efectos de neón'
);

// Iniciar
aiSource.start();
```

## 🎯 Ejemplos de Prompts

### Reloj Moderno
```
"Un reloj digital estilo cyberpunk con efectos de neón verde y azul,
números grandes y efecto de glitch cada 5 segundos"
```

### Contador de Viewers
```
"Un contador de espectadores en vivo con efecto de partículas,
que muestre el número con fuente grande y animación de incremento"
```

### Barra de Donaciones
```
"Una barra de progreso horizontal que se llena gradualmente,
con efecto de brillo arcoíris y texto indicando el objetivo"
```

### Alert de Seguidor
```
"Una animación explosiva de confeti cuando alguien hace follow,
con el nombre del usuario en el centro y efecto de zoom"
```

### Chat Ticker
```
"Un ticker de mensajes de chat que se desplazan horizontalmente,
estilo noticias de TV, con colores alternados"
```

## 📐 Estructura del Código Generado

El código que genera la IA debe seguir esta estructura:

```javascript
function animate(ctx, width, height, time, data) {
    // 1. Limpiar canvas (transparente)
    ctx.clearRect(0, 0, width, height);

    // 2. Dibujar elementos
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Hola Mundo', width/2, height/2);

    // 3. Animaciones (usar time para efectos)
    const pulse = Math.sin(time / 500) * 10;
    ctx.fillRect(100, 100 + pulse, 200, 100);
}
```

**Parámetros:**
- `ctx` - Contexto 2D del canvas
- `width` - Ancho del canvas
- `height` - Alto del canvas
- `time` - Timestamp en milisegundos (para animaciones)
- `data` - Objeto con datos personalizados

## 🎨 Estilos Recomendados

### Fuentes
- `'bold 72px Arial'` - Títulos grandes
- `'48px "Courier New"'` - Monoespaciado
- `'36px "Helvetica Neue"'` - Moderno

### Colores
- Neón: `#00ff00`, `#00ffff`, `#ff00ff`
- Pastel: `#ffb3ba`, `#bae1ff`, `#ffffba`
- Oscuro: `rgba(0, 0, 0, 0.8)`

### Efectos
```javascript
// Sombra
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 10;

// Gradiente
const gradient = ctx.createLinearGradient(0, 0, width, 0);
gradient.addColorStop(0, '#ff0000');
gradient.addColorStop(1, '#00ff00');
ctx.fillStyle = gradient;

// Transparencia
ctx.globalAlpha = 0.8;

// Animación pulsante
const pulse = Math.sin(time / 500) * 10;
```

## 🔧 API Reference

### Constructor
```javascript
new AIAnimationSource(config)
```

**Config:**
- `id` - ID único (opcional)
- `name` - Nombre del source
- `width` - Ancho en píxeles
- `height` - Alto en píxeles
- `aiProvider` - 'groq' | 'openai' | 'claude' | 'custom'
- `apiKey` - Tu API key
- `widgetType` - Widget predefinido (opcional)
- `widgetData` - Datos para el widget (opcional)

### Métodos

#### `generateAnimation(prompt)`
Genera código de animación usando IA

**Parámetros:**
- `prompt` (string) - Descripción de la animación

**Returns:** Promise<string> - Código generado

#### `loadPredefinedWidget(type, data)`
Carga un widget predefinido

**Parámetros:**
- `type` - 'clock' | 'chat' | 'superchat' | 'table' | 'scoreboard'
- `data` - Datos opcionales del widget

#### `start()`
Inicia el loop de animación

#### `stop()`
Detiene la animación

#### `getCanvas()`
Obtiene el canvas HTML

**Returns:** HTMLCanvasElement

#### `updateData(newData)`
Actualiza datos del widget

**Parámetros:**
- `newData` - Objeto con nuevos datos

## 🌐 Integración con Streaming

### Datos en Tiempo Real

```javascript
// Actualizar chat en vivo
aiSource.updateData({
    messages: [
        { user: 'Juan', text: 'Hola!', color: '#ff6b6b' },
        { user: 'María', text: 'Qué bien!', color: '#4ecdc4' }
    ]
});

// Actualizar super chat
aiSource.updateData({
    superchat: {
        user: 'MegaFan',
        amount: '$100',
        message: '¡Increíble stream!',
        color: '#ffd700'
    }
});

// Actualizar marcador
aiSource.updateData({
    team1: { name: 'BLUE', score: 3, color: '#4444ff' },
    team2: { name: 'RED', score: 2, color: '#ff4444' }
});
```

### Conectar con APIs Externas

```javascript
// Twitch Chat
const twitchChat = new TwitchChat('tu-canal');
twitchChat.onMessage((user, message) => {
    aiSource.updateData({
        messages: [
            ...aiSource.widgetData.messages,
            { user, text: message, color: randomColor() }
        ].slice(-5) // Últimos 5 mensajes
    });
});

// YouTube Super Chat
const ytChat = new YouTubeChat('video-id');
ytChat.onSuperChat((user, amount, message) => {
    aiSource.updateData({
        superchat: { user, amount, message, color: '#ffd700' }
    });
});
```

## ⚠️ Limitaciones

- Las animaciones se ejecutan en el navegador (no en servidor)
- El código generado por IA puede variar en calidad
- Requiere API key para generación con IA
- Los widgets predefinidos NO requieren API key

## 🎓 Mejores Prácticas

1. **Prueba primero los widgets predefinidos**
2. **Usa prompts claros y específicos**
3. **Especifica colores y tamaños**
4. **Menciona "fondo transparente"**
5. **Pide "estilo streaming/overlay"**
6. **Revisa el código generado antes de usarlo**

## 📝 Próximas Mejoras

- [ ] Editor de código en vivo
- [ ] Galería de animaciones guardadas
- [ ] Marketplace de animaciones
- [ ] Más widgets predefinidos
- [ ] Soporte para WebGL/Three.js
- [ ] Integración directa con Twitch/YouTube APIs

---

👨‍💻 **Desarrollado por:** Hector Nolivos
🤖 **Powered by:** GroqAI, OpenAI
