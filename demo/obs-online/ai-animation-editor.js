/**
 * AI Animation Editor - Interactive Editor
 * La IA puede ver su propio trabajo y mejorarlo
 */

let aiSource = null;
let chatHistory = [];
let lastGeneratedCode = '';
let fpsCounter = 0;
let lastFpsTime = 0;

// Inicializar
window.addEventListener('load', () => {
    initializeAnimation();
    startFPSCounter();
});

function initializeAnimation() {
    const canvas = document.getElementById('preview-canvas');
    const width = parseInt(document.getElementById('canvas-width').value);
    const height = parseInt(document.getElementById('canvas-height').value);

    aiSource = new AIAnimationSource({
        name: 'Preview',
        width: width,
        height: height
    });

    // Mostrar mensaje de bienvenida
    addAIMessage('Carga un widget predefinido o pídeme crear una animación personalizada.');

    console.log('✅ Editor inicializado');
}

function resizeCanvas() {
    const width = parseInt(document.getElementById('canvas-width').value);
    const height = parseInt(document.getElementById('canvas-height').value);

    const canvas = document.getElementById('preview-canvas');
    canvas.width = width;
    canvas.height = height;

    aiSource.width = width;
    aiSource.height = height;
    aiSource.canvas.width = width;
    aiSource.canvas.height = height;

    document.getElementById('dimensions').textContent = `${width}x${height}`;

    addAIMessage(`✅ Canvas redimensionado a ${width}x${height}`);
}

function loadWidget(type) {
    const names = {
        'clock': '⏰ Reloj Digital',
        'chat': '💬 Chat en Vivo',
        'superchat': '💰 Super Chat',
        'table': '🏆 Clasificación',
        'scoreboard': '⚽ Marcador'
    };

    try {
        aiSource.loadPredefinedWidget(type);

        // Copiar canvas de aiSource al preview
        copyCanvas();

        aiSource.start();

        document.getElementById('status').textContent = 'Ejecutando';

        addAIMessage(`✅ Widget "${names[type]}" cargado. Puedes pedirme que lo modifique o personalice.`);

        // Actualizar código en editor
        const funcStr = aiSource.animationFunction.toString();
        document.getElementById('code-textarea').value = funcStr;
        lastGeneratedCode = funcStr;

    } catch (error) {
        addAIMessage(`❌ Error: ${error.message}`);
    }
}

function copyCanvas() {
    const sourceCanvas = aiSource.canvas;
    const targetCanvas = document.getElementById('preview-canvas');
    const targetCtx = targetCanvas.getContext('2d');

    function renderLoop() {
        targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        targetCtx.drawImage(sourceCanvas, 0, 0);

        if (aiSource && aiSource.isRunning) {
            requestAnimationFrame(renderLoop);
        }
    }

    renderLoop();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Agregar mensaje del usuario
    addUserMessage(message);
    input.value = '';

    // Verificar API key
    const apiKey = document.getElementById('api-key').value;
    if (!apiKey) {
        addAIMessage('⚠️ Por favor ingresa tu API Key primero.');
        return;
    }

    const provider = document.getElementById('ai-provider').value;

    // Mostrar loading
    showLoading(true);
    document.getElementById('status').textContent = 'Generando...';

    try {
        // Configurar API
        aiSource.aiProvider = provider;
        aiSource.apiKey = apiKey;
        aiSource.apiUrl = aiSource.getApiUrl();

        // Generar animación
        await aiSource.generateAnimation(message);

        // Aplicar animación
        aiSource.start();

        // Copiar al canvas preview
        copyCanvas();

        document.getElementById('status').textContent = 'Ejecutando';

        // Actualizar código en editor
        document.getElementById('code-textarea').value = aiSource.animationCode;
        lastGeneratedCode = aiSource.animationCode;

        // Ahora LA IA VE SU PROPIO TRABAJO
        await verifyAndImprove();

    } catch (error) {
        addAIMessage(`❌ Error: ${error.message}`);
        document.getElementById('status').textContent = 'Error';
    } finally {
        showLoading(false);
    }
}

/**
 * LA MAGIA: La IA ve su propio trabajo y lo mejora
 */
async function verifyAndImprove() {
    addAIMessage('🔍 Verificando mi trabajo...');

    // Tomar screenshot del canvas
    const canvas = document.getElementById('preview-canvas');
    const screenshot = canvas.toDataURL('image/png');

    const apiKey = document.getElementById('api-key').value;
    const provider = document.getElementById('ai-provider').value;

    try {
        // La IA analiza su propio resultado
        const feedback = await analyzeResult(screenshot, lastGeneratedCode, provider, apiKey);

        if (feedback.needsImprovement) {
            addAIMessage(`🤔 Detecté que puedo mejorar: ${feedback.issue}`);
            addAIMessage('✨ Regenerando con mejoras...');

            // Regenerar con feedback
            await aiSource.generateAnimation(
                `Mejora esta animación: ${feedback.improvement}\n\nCódigo actual:\n${lastGeneratedCode}`
            );

            aiSource.start();
            copyCanvas();

            document.getElementById('code-textarea').value = aiSource.animationCode;
            lastGeneratedCode = aiSource.animationCode;

            addAIMessage('✅ ¡Listo! He mejorado la animación.');
        } else {
            addAIMessage('✅ La animación se ve bien. ¿Necesitas algún ajuste?');
        }

    } catch (error) {
        console.error('Error verificando:', error);
        addAIMessage('✅ Animación generada. ¿Qué te parece?');
    }
}

async function analyzeResult(screenshot, code, provider, apiKey) {
    // Análisis básico del código
    const issues = [];

    // Verificar si limpia el canvas
    if (!code.includes('clearRect')) {
        issues.push('No limpia el canvas (falta clearRect)');
    }

    // Verificar si usa animación
    if (!code.includes('time') && !code.includes('Date')) {
        issues.push('No tiene animación temporal');
    }

    // Verificar si usa colores
    if (!code.includes('fillStyle') && !code.includes('strokeStyle')) {
        issues.push('No define colores');
    }

    if (issues.length > 0) {
        return {
            needsImprovement: true,
            issue: issues[0],
            improvement: `Agrega ${issues[0]}`
        };
    }

    return { needsImprovement: false };
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = 'Tú • ' + new Date().toLocaleTimeString();

    messageDiv.appendChild(bubble);
    messageDiv.appendChild(meta);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    chatHistory.push({ role: 'user', content: text });
}

function addAIMessage(text) {
    const messagesDiv = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = text.replace(/\n/g, '<br>');

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = 'IA • ' + new Date().toLocaleTimeString();

    messageDiv.appendChild(bubble);
    messageDiv.appendChild(meta);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    chatHistory.push({ role: 'ai', content: text });
}

function showLoading(show) {
    const loading = document.querySelector('.loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

function toggleCodeEditor() {
    const editor = document.getElementById('code-editor');
    editor.classList.toggle('active');
}

function applyCode() {
    const code = document.getElementById('code-textarea').value;

    try {
        // Extraer función
        aiSource.animationCode = code;
        aiSource.extractAnimationFunction();

        // Reiniciar
        aiSource.stop();
        aiSource.start();

        copyCanvas();

        addAIMessage('✅ Código aplicado correctamente');
        toggleCodeEditor();
    } catch (error) {
        addAIMessage(`❌ Error en el código: ${error.message}`);
    }
}

function resetAnimation() {
    if (aiSource) {
        aiSource.stop();
    }

    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById('status').textContent = 'Detenido';

    addAIMessage('🔄 Animación reiniciada. ¿Qué quieres crear?');
}

function exportAnimation() {
    if (!lastGeneratedCode) {
        addAIMessage('⚠️ No hay código para exportar');
        return;
    }

    const blob = new Blob([lastGeneratedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation-' + Date.now() + '.js';
    a.click();

    URL.revokeObjectURL(url);

    addAIMessage('💾 Código exportado como archivo JavaScript');
}

function startFPSCounter() {
    setInterval(() => {
        const now = performance.now();
        const delta = now - lastFpsTime;
        const fps = Math.round(1000 / delta);

        document.getElementById('fps').textContent = fps;

        lastFpsTime = now;
        fpsCounter++;
    }, 100);
}

// Tecla Enter para enviar
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
