/**
 * AI-Generated Animations for OBS Online
 *
 * Genera animaciones dinámicas usando IA (GroqAI, OpenAI, etc)
 * Renderiza widgets transparentes: relojes, chats, tablas, superchats
 */

class AIAnimationSource {
    constructor(config = {}) {
        this.id = config.id || 'ai-anim-' + Date.now();
        this.name = config.name || 'AI Animation';
        this.width = config.width || 800;
        this.height = config.height || 600;

        // Canvas para la animación
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');

        // Configuración de IA
        this.aiProvider = config.aiProvider || 'groq'; // groq, openai, claude, custom
        this.apiKey = config.apiKey || '';
        this.apiUrl = this.getApiUrl();

        // Estado de la animación
        this.animationCode = '';
        this.animationFunction = null;
        this.isRunning = false;
        this.lastFrame = 0;

        // Widgets predefinidos
        this.widgetType = config.widgetType || null; // clock, chat, table, superchat, scoreboard
        this.widgetData = config.widgetData || {};

        console.log(`🎨 AI Animation Source created: ${this.name}`);
    }

    getApiUrl() {
        const urls = {
            'groq': 'https://api.groq.com/openai/v1/chat/completions',
            'openai': 'https://api.openai.com/v1/chat/completions',
            'claude': 'https://api.anthropic.com/v1/messages',
            'custom': this.customApiUrl || ''
        };
        return urls[this.aiProvider] || urls['groq'];
    }

    /**
     * Genera código de animación usando IA
     */
    async generateAnimation(prompt) {
        if (!this.apiKey) {
            throw new Error('API Key no configurada. Por favor ingresa tu API Key.');
        }

        console.log(`🤖 Generando animación con ${this.aiProvider}...`);
        console.log(`📝 Prompt: ${prompt}`);

        const systemPrompt = `Eres un experto en animaciones JavaScript para canvas HTML5.
Genera código JavaScript para una animación que se ejecute en un canvas transparente.

IMPORTANTE:
- El código debe ser una función llamada animate(ctx, width, height, time, data)
- ctx es el contexto 2D del canvas
- width y height son las dimensiones del canvas
- time es el timestamp en milisegundos
- data es un objeto con datos opcionales
- El fondo debe ser TRANSPARENTE (no uses fillRect para el fondo)
- Usa colores vibrantes y efectos visuales modernos
- La animación debe verse profesional, tipo overlay de streaming
- NO incluyas explicaciones, solo el código de la función

Ejemplo:
function animate(ctx, width, height, time, data) {
    // Limpiar con transparencia
    ctx.clearRect(0, 0, width, height);

    // Tu animación aquí
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('Hola Mundo', width/2, height/2);
}`;

        const userPrompt = `Crea una animación para: ${prompt}

Requisitos específicos:
- Dimensiones: ${this.width}x${this.height}
- Debe ser visualmente atractiva
- Fondo transparente
- Animación fluida
- Estilo moderno de streaming

Genera SOLO el código de la función animate().`;

        try {
            let response;

            if (this.aiProvider === 'groq' || this.aiProvider === 'openai') {
                response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.aiProvider === 'groq' ? 'mixtral-8x7b-32768' : 'gpt-4',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Error en la API');
                }

                const data = await response.json();
                this.animationCode = data.choices[0].message.content;
            }

            console.log('✅ Código generado por IA');
            console.log(this.animationCode);

            // Extraer solo la función del código
            this.extractAnimationFunction();

            return this.animationCode;

        } catch (error) {
            console.error('❌ Error generando animación:', error);
            throw error;
        }
    }

    /**
     * Extrae la función animate() del código generado
     */
    extractAnimationFunction() {
        try {
            // Limpiar el código (quitar markdown, explicaciones, etc)
            let code = this.animationCode;

            // Remover bloques de código markdown
            code = code.replace(/```javascript/g, '');
            code = code.replace(/```js/g, '');
            code = code.replace(/```/g, '');

            // Buscar la función animate
            const funcMatch = code.match(/function\s+animate\s*\([^)]*\)\s*\{[\s\S]*\}/);

            if (funcMatch) {
                const funcCode = funcMatch[0];
                // Crear la función dinámicamente
                this.animationFunction = new Function('return ' + funcCode)();
                console.log('✅ Función de animación extraída y compilada');
            } else {
                throw new Error('No se encontró la función animate() en el código generado');
            }
        } catch (error) {
            console.error('❌ Error compilando animación:', error);
            throw error;
        }
    }

    /**
     * Widgets predefinidos (sin IA)
     */
    loadPredefinedWidget(type, data = {}) {
        this.widgetType = type;
        this.widgetData = data;

        const widgets = {
            'clock': this.createClockWidget,
            'chat': this.createChatWidget,
            'superchat': this.createSuperChatWidget,
            'table': this.createTableWidget,
            'scoreboard': this.createScoreboardWidget
        };

        if (widgets[type]) {
            this.animationFunction = widgets[type].bind(this);
            console.log(`✅ Widget predefinido cargado: ${type}`);
        } else {
            throw new Error(`Widget desconocido: ${type}`);
        }
    }

    // Widget: Reloj digital animado
    createClockWidget(ctx, width, height, time, data) {
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timeStr = `${hours}:${minutes}:${seconds}`;

        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(20, 20, width - 40, height - 40, 20);
        ctx.fill();

        // Borde brillante
        ctx.strokeStyle = `hsl(${(time / 10) % 360}, 100%, 50%)`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Texto del reloj
        ctx.font = 'bold 72px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Sombra del texto
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Gradiente para el texto
        const gradient = ctx.createLinearGradient(0, height/2 - 50, 0, height/2 + 50);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#0099ff');

        ctx.fillStyle = gradient;
        ctx.fillText(timeStr, width / 2, height / 2);

        ctx.shadowColor = 'transparent';
    }

    // Widget: Chat en vivo
    createChatWidget(ctx, width, height, time, data) {
        ctx.clearRect(0, 0, width, height);

        const messages = data.messages || [
            { user: 'Usuario1', text: 'Hola! 👋', color: '#ff6b6b' },
            { user: 'Usuario2', text: 'Qué buen stream!', color: '#4ecdc4' },
            { user: 'Usuario3', text: '🔥🔥🔥', color: '#ffe66d' }
        ];

        // Fondo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Título
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('💬 CHAT EN VIVO', 20, 40);

        // Mensajes
        let y = 80;
        messages.forEach((msg, i) => {
            const offset = Math.sin((time / 500) + i) * 3;

            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = msg.color;
            ctx.fillText(msg.user + ':', 20, y + offset);

            ctx.font = '18px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(msg.text, 150, y + offset);

            y += 50;
        });
    }

    // Widget: Super Chat
    createSuperChatWidget(ctx, width, height, time, data) {
        ctx.clearRect(0, 0, width, height);

        const superchat = data.superchat || {
            user: 'MegaFan',
            amount: '$50',
            message: '¡Increíble contenido! Sigue así! 🎉',
            color: '#ffd700'
        };

        // Animación de entrada
        const scale = Math.min(1, (time % 3000) / 500);
        const shake = Math.sin(time / 50) * 2;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.rotate(shake * 0.01);

        // Fondo dorado brillante
        const gradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
        gradient.addColorStop(0, superchat.color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, superchat.color);

        ctx.fillStyle = gradient;
        ctx.fillRect(-width/2 + 20, -height/2 + 20, width - 40, height - 40);

        // Texto
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${superchat.user} - ${superchat.amount}`, 0, -20);

        ctx.font = '24px Arial';
        ctx.fillText(superchat.message, 0, 20);

        ctx.restore();
    }

    // Widget: Tabla de resultados
    createTableWidget(ctx, width, height, time, data) {
        ctx.clearRect(0, 0, width, height);

        const scores = data.scores || [
            { name: 'Jugador 1', score: 1500, rank: 1 },
            { name: 'Jugador 2', score: 1350, rank: 2 },
            { name: 'Jugador 3', score: 1200, rank: 3 }
        ];

        // Fondo
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.fillRect(0, 0, width, height);

        // Título
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 CLASIFICACIÓN', width / 2, 50);

        // Tabla
        let y = 100;
        scores.forEach((player, i) => {
            const pulse = Math.sin((time / 300) + i) * 5;

            // Fila
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(20, y + pulse, width - 40, 60);

            // Rank
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = player.rank === 1 ? '#ffd700' : player.rank === 2 ? '#c0c0c0' : '#cd7f32';
            ctx.textAlign = 'left';
            ctx.fillText(`#${player.rank}`, 40, y + 35 + pulse);

            // Nombre
            ctx.fillStyle = '#ffffff';
            ctx.fillText(player.name, 120, y + 35 + pulse);

            // Puntuación
            ctx.textAlign = 'right';
            ctx.fillStyle = '#00ff00';
            ctx.fillText(player.score, width - 40, y + 35 + pulse);

            y += 70;
        });
    }

    // Widget: Marcador
    createScoreboardWidget(ctx, width, height, time, data) {
        ctx.clearRect(0, 0, width, height);

        const team1 = data.team1 || { name: 'TEAM A', score: 2, color: '#ff4444' };
        const team2 = data.team2 || { name: 'TEAM B', score: 1, color: '#4444ff' };

        // Fondo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Team 1
        ctx.fillStyle = team1.color;
        ctx.fillRect(0, 0, width / 2 - 2, height);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(team1.name, width / 4, height / 2 - 20);

        ctx.font = 'bold 72px Arial';
        ctx.fillText(team1.score, width / 4, height / 2 + 50);

        // Team 2
        ctx.fillStyle = team2.color;
        ctx.fillRect(width / 2 + 2, 0, width / 2 - 2, height);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(team2.name, width * 3 / 4, height / 2 - 20);

        ctx.font = 'bold 72px Arial';
        ctx.fillText(team2.score, width * 3 / 4, height / 2 + 50);

        // Separador animado
        const pulseWidth = 4 + Math.sin(time / 200) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(width / 2 - pulseWidth / 2, 0, pulseWidth, height);
    }

    /**
     * Inicia el loop de animación
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrame = performance.now();
        this.animate();

        console.log('▶️ Animación iniciada');
    }

    /**
     * Detiene la animación
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Animación detenida');
    }

    /**
     * Loop de animación
     */
    animate() {
        if (!this.isRunning) return;

        const now = performance.now();

        if (this.animationFunction) {
            try {
                this.animationFunction(this.ctx, this.width, this.height, now, this.widgetData);
            } catch (error) {
                console.error('❌ Error ejecutando animación:', error);
                this.stop();
                return;
            }
        }

        this.lastFrame = now;
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Obtiene el canvas para renderizar en OBS
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Actualiza datos del widget
     */
    updateData(newData) {
        this.widgetData = { ...this.widgetData, ...newData };
    }
}

// Extensión de CanvasRenderingContext2D para roundRect si no existe
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Exportar para uso en OBS Online
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnimationSource;
}
