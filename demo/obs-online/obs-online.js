/**
 * OBS Online - Browser-based streaming studio
 * Compatible with obs-websocket protocol
 */

class OBSOnline {
    constructor() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');

        // State
        this.isStreaming = false;
        this.isRecording = false;
        this.currentScene = 'Scene 1';
        this.scenes = new Map();
        this.sources = new Map();
        this.selectedSourceId = null;
        this.showGrid = false;

        // Stats
        this.stats = {
            fps: 0,
            frames: 0,
            startTime: null,
            lastFrameTime: 0
        };

        // MediaRecorder
        this.mediaRecorder = null;
        this.recordedChunks = [];

        // WebSocket Server (simulated)
        this.wsServer = null;
        this.wsClients = [];

        // Animation
        this.animationFrame = null;
        this.targetFPS = 30;

        this.init();
    }

    init() {
        console.log('🎬 Initializing OBS Online...');

        // Initialize scenes
        this.initializeScenes();

        // Setup event listeners
        this.setupEventListeners();

        // Start rendering loop
        this.startRenderLoop();

        console.log('✅ OBS Online initialized');
    }

    initializeScenes() {
        // Create default scenes
        this.scenes.set('Scene 1', {
            name: 'Scene 1',
            sources: [],
            background: '#1a1a2e'
        });

        this.scenes.set('Scene 2', {
            name: 'Scene 2',
            sources: [],
            background: '#16213e'
        });

        this.scenes.set('Scene 3', {
            name: 'Scene 3',
            sources: [],
            background: '#0f3460'
        });
    }

    setupEventListeners() {
        // Scene selection
        document.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', () => {
                const sceneName = item.dataset.scene;
                this.switchScene(sceneName);
            });
        });
    }

    switchScene(sceneName) {
        if (!this.scenes.has(sceneName)) {
            console.error('Scene not found:', sceneName);
            return;
        }

        // Update UI
        document.querySelectorAll('.scene-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.scene === sceneName) {
                item.classList.add('active');
            }
        });

        this.currentScene = sceneName;
        document.getElementById('stat-scene').textContent = sceneName;

        console.log('📺 Switched to scene:', sceneName);

        // Emit event to WebSocket clients
        this.emitEvent('CurrentProgramSceneChanged', {
            sceneName: sceneName
        });
    }

    startRenderLoop() {
        const targetInterval = 1000 / this.targetFPS;
        let lastTime = performance.now();

        const render = (currentTime) => {
            this.animationFrame = requestAnimationFrame(render);

            const elapsed = currentTime - lastTime;

            if (elapsed >= targetInterval) {
                lastTime = currentTime - (elapsed % targetInterval);

                // Render frame
                this.renderFrame();

                // Update stats
                this.updateStats();
            }
        };

        this.animationFrame = requestAnimationFrame(render);
        console.log('🎥 Render loop started');
    }

    renderFrame() {
        const scene = this.scenes.get(this.currentScene);
        if (!scene) return;

        // Clear canvas
        this.ctx.fillStyle = scene.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid pattern (if enabled)
        if (this.showGrid) {
            this.drawGrid();
        }

        // Render sources
        scene.sources.forEach(source => {
            this.renderSource(source);
        });

        // Draw scene name overlay
        this.drawSceneOverlay();

        this.stats.frames++;
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ffffff10';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawSceneOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(145, 71, 255, 0.8)';
        this.ctx.fillRect(0, 0, 200, 40);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(this.currentScene, 10, 27);
        this.ctx.restore();
    }

    renderSource(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source || !source.visible) return;

        this.ctx.save();

        try {
            if (source.type === 'camera' || source.type === 'screen') {
                // Draw video source
                if (source.video && source.video.readyState >= 2) {
                    this.ctx.drawImage(
                        source.video,
                        source.x, source.y,
                        source.width, source.height
                    );

                    // Draw border
                    this.ctx.strokeStyle = '#9147ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(source.x, source.y, source.width, source.height);
                }
            } else if (source.type === 'text') {
                // Draw text overlay
                this.ctx.fillStyle = source.backgroundColor || 'transparent';
                this.ctx.fillRect(source.x, source.y, source.width, source.height);

                this.ctx.fillStyle = source.color || '#ffffff';
                this.ctx.font = `${source.fontSize || 48}px ${source.fontFamily || 'Arial'}`;
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(source.text || '', source.x + 10, source.y + 10);
            } else if (source.type === 'image') {
                // Draw image source
                if (source.image && source.image.complete) {
                    this.ctx.drawImage(
                        source.image,
                        source.x, source.y,
                        source.width, source.height
                    );
                }
            } else if (source.type === 'color') {
                // Draw solid color
                this.ctx.fillStyle = source.color;
                this.ctx.fillRect(source.x, source.y, source.width, source.height);
            } else if (source.type === 'browser') {
                // Draw browser/iframe
                if (source.iframe) {
                    try {
                        this.ctx.drawImage(
                            source.iframe,
                            source.x, source.y,
                            source.width, source.height
                        );
                    } catch (e) {
                        // Fallback: draw placeholder
                        this.ctx.fillStyle = '#1e1e1e';
                        this.ctx.fillRect(source.x, source.y, source.width, source.height);
                        this.ctx.fillStyle = '#fff';
                        this.ctx.font = '20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('🌐 ' + source.url, source.x + source.width/2, source.y + source.height/2);
                    }
                }
            }
        } catch (error) {
            console.error('Error rendering source:', error);
        }

        this.ctx.restore();
    }

    updateStats() {
        const now = performance.now();

        if (this.stats.lastFrameTime === 0) {
            this.stats.lastFrameTime = now;
            return;
        }

        const delta = now - this.stats.lastFrameTime;
        this.stats.fps = Math.round(1000 / delta);
        this.stats.lastFrameTime = now;

        // Update UI
        document.getElementById('stat-fps').textContent = this.stats.fps;
        document.getElementById('stat-frames').textContent = this.stats.frames;

        if (this.stats.startTime) {
            const duration = Math.floor((now - this.stats.startTime) / 1000);
            document.getElementById('stat-duration').textContent = this.formatTime(duration);
        }
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    async startRecording() {
        try {
            console.log('🔴 Starting recording...');

            const stream = this.canvas.captureStream(this.targetFPS);

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            this.mediaRecorder.start(1000); // Capture every second
            this.isRecording = true;
            this.stats.startTime = performance.now();

            // Update UI
            document.getElementById('rec-indicator').classList.add('active');
            document.getElementById('rec-btn').style.display = 'none';
            document.getElementById('stop-rec-btn').style.display = 'inline-block';

            // Update recording time
            this.updateRecordingTime();

            console.log('✅ Recording started');

            // Emit event
            this.emitEvent('RecordStateChanged', {
                outputActive: true,
                outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED'
            });

        } catch (error) {
            console.error('❌ Error starting recording:', error);
            alert('Error al iniciar grabación: ' + error.message);
        }
    }

    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return;

        console.log('⏹️ Stopping recording...');

        this.mediaRecorder.stop();
        this.isRecording = false;
        this.stats.startTime = null;

        // Update UI
        document.getElementById('rec-indicator').classList.remove('active');
        document.getElementById('rec-btn').style.display = 'inline-block';
        document.getElementById('stop-rec-btn').style.display = 'none';

        console.log('✅ Recording stopped');

        // Emit event
        this.emitEvent('RecordStateChanged', {
            outputActive: false,
            outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPED'
        });
    }

    updateRecordingTime() {
        if (!this.isRecording) return;

        const now = performance.now();
        const elapsed = Math.floor((now - this.stats.startTime) / 1000);
        document.getElementById('rec-time').textContent = this.formatTime(elapsed);

        setTimeout(() => this.updateRecordingTime(), 1000);
    }

    saveRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `obs-online-${Date.now()}.webm`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('💾 Recording saved');
    }

    async startStreaming() {
        console.log('▶️ Starting stream...');

        this.isStreaming = true;
        this.stats.startTime = performance.now();

        // Update UI
        document.getElementById('stream-status').classList.remove('offline');
        document.getElementById('stream-status').classList.add('live');
        document.getElementById('stream-status').textContent = 'LIVE';

        console.log('✅ Stream started (simulated)');

        // Emit event
        this.emitEvent('StreamStateChanged', {
            outputActive: true,
            outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED'
        });
    }

    stopStreaming() {
        console.log('⏹️ Stopping stream...');

        this.isStreaming = false;
        this.stats.startTime = null;

        // Update UI
        document.getElementById('stream-status').classList.remove('live');
        document.getElementById('stream-status').classList.add('offline');
        document.getElementById('stream-status').textContent = 'OFFLINE';

        console.log('✅ Stream stopped');

        // Emit event
        this.emitEvent('StreamStateChanged', {
            outputActive: false,
            outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPED'
        });
    }

    async addCameraSource() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: false
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            const sourceId = 'camera-' + Date.now();
            this.sources.set(sourceId, {
                id: sourceId,
                type: 'camera',
                name: 'Webcam',
                video: video,
                stream: stream,
                x: 100,
                y: 100,
                width: 640,
                height: 360,
                visible: true
            });

            // Add to current scene
            const scene = this.scenes.get(this.currentScene);
            scene.sources.push(sourceId);

            this.updateSourcesList();

            console.log('📹 Camera source added');

        } catch (error) {
            console.error('❌ Error adding camera:', error);
            alert('Error al acceder a la cámara: ' + error.message);
        }
    }

    async addScreenSource() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1920, height: 1080 },
                audio: false
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            const sourceId = 'screen-' + Date.now();
            this.sources.set(sourceId, {
                id: sourceId,
                type: 'screen',
                name: 'Pantalla',
                video: video,
                stream: stream,
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                visible: true
            });

            // Add to current scene
            const scene = this.scenes.get(this.currentScene);
            scene.sources.push(sourceId);

            this.updateSourcesList();

            console.log('🖥️ Screen source added');

        } catch (error) {
            console.error('❌ Error adding screen:', error);
            alert('Error al capturar pantalla: ' + error.message);
        }
    }

    addTextSource() {
        const text = prompt('Texto a mostrar:', 'OBS Online');
        if (!text) return;

        const sourceId = 'text-' + Date.now();
        this.sources.set(sourceId, {
            id: sourceId,
            type: 'text',
            name: 'Texto',
            text: text,
            x: 50,
            y: 50,
            width: 800,
            height: 100,
            fontSize: 64,
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            visible: true
        });

        // Add to current scene
        const scene = this.scenes.get(this.currentScene);
        scene.sources.push(sourceId);

        this.updateSourcesList();

        console.log('📝 Text source added');
    }

    async addImageSource() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const sourceId = 'image-' + Date.now();
                    this.sources.set(sourceId, {
                        id: sourceId,
                        type: 'image',
                        name: file.name,
                        image: img,
                        x: 100,
                        y: 100,
                        width: Math.min(img.width, 800),
                        height: Math.min(img.height, 600),
                        visible: true
                    });

                    // Add to current scene
                    const scene = this.scenes.get(this.currentScene);
                    scene.sources.push(sourceId);

                    this.updateSourcesList();

                    console.log('🖼️ Image source added');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }

    addColorSource() {
        const color = prompt('Color (hex o nombre):', '#FF0000');
        if (!color) return;

        const sourceId = 'color-' + Date.now();
        this.sources.set(sourceId, {
            id: sourceId,
            type: 'color',
            name: 'Color ' + color,
            color: color,
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            visible: true
        });

        const scene = this.scenes.get(this.currentScene);
        scene.sources.push(sourceId);

        this.updateSourcesList();
        console.log('🎨 Color source added:', color);
    }

    addBrowserSource() {
        const url = prompt('URL del navegador:', 'https://example.com');
        if (!url) return;

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = 1280;
        iframe.height = 720;
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);

        const sourceId = 'browser-' + Date.now();
        this.sources.set(sourceId, {
            id: sourceId,
            type: 'browser',
            name: 'Navegador',
            url: url,
            iframe: iframe,
            x: 320,
            y: 180,
            width: 1280,
            height: 720,
            visible: true
        });

        const scene = this.scenes.get(this.currentScene);
        scene.sources.push(sourceId);

        this.updateSourcesList();
        console.log('🌐 Browser source added:', url);
    }

    updateSourcesList() {
        const sourcesList = document.getElementById('sources-list');
        if (!sourcesList) return;

        sourcesList.innerHTML = '';

        const scene = this.scenes.get(this.currentScene);
        if (!scene) return;

        if (scene.sources.length === 0) {
            sourcesList.innerHTML = '<div class="source-item">👁️ Sin fuentes</div>';
            return;
        }

        scene.sources.forEach(sourceId => {
            const source = this.sources.get(sourceId);
            if (!source) return;

            const icons = {
                'camera': '📹',
                'screen': '🖥️',
                'text': '📝',
                'image': '🖼️',
                'color': '🎨',
                'browser': '🌐'
            };

            const item = document.createElement('div');
            item.className = 'source-item';

            if (sourceId === this.selectedSourceId) {
                item.classList.add('selected');
            }

            const visibilityIcon = source.visible ? '👁️' : '🚫';

            item.innerHTML = `
                <span class="source-visibility" onclick="event.stopPropagation(); toggleSourceVisibility('${sourceId}')">${visibilityIcon}</span>
                <span class="source-icon">${icons[source.type] || '📦'}</span>
                <span class="source-name">${source.name}</span>
            `;

            // Click to select
            item.addEventListener('click', () => {
                this.selectedSourceId = sourceId;
                this.updateSourcesList();
                console.log('✅ Source selected:', source.name);
            });

            // Double click for properties
            item.addEventListener('dblclick', () => {
                showSourcePropertiesFor(sourceId);
            });

            sourcesList.appendChild(item);
        });
    }

    updateScenesList() {
        const scenesList = document.getElementById('scenes-list');
        if (!scenesList) return;

        scenesList.innerHTML = '';

        if (this.scenes.size === 0) {
            scenesList.innerHTML = '<div class="scene-item">📺 Sin escenas</div>';
            return;
        }

        this.scenes.forEach((scene, sceneId) => {
            const item = document.createElement('div');
            item.className = 'scene-item';

            if (sceneId === this.currentScene) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <span class="scene-name">${scene.name}</span>
                <div class="scene-actions">
                    <span class="icon-btn" onclick="event.stopPropagation(); duplicateSceneById('${sceneId}')">📋</span>
                    <span class="icon-btn" onclick="event.stopPropagation(); removeSceneById('${sceneId}')">🗑️</span>
                </div>
            `;

            // Click to switch scene
            item.addEventListener('click', () => {
                obsOnline.currentScene = sceneId;
                obsOnline.updateScenesList();
                obsOnline.updateSourcesList();
                console.log('🎬 Switched to scene:', scene.name);
            });

            scenesList.appendChild(item);
        });
    }

    // WebSocket API (obs-websocket compatible)
    emitEvent(eventType, eventData) {
        // Placeholder for WebSocket event emission
        console.log('🔔 Event:', eventType, eventData);
    }

    handleRequest(requestType, requestData) {
        console.log('📥 Request:', requestType, requestData);

        switch (requestType) {
            case 'GetVersion':
                return this.getVersion();
            case 'GetStats':
                return this.getStats();
            case 'GetSceneList':
                return this.getSceneList();
            case 'GetCurrentProgramScene':
                return this.getCurrentScene();
            case 'SetCurrentProgramScene':
                return this.setCurrentScene(requestData);
            case 'StartRecord':
                return this.startRecording();
            case 'StopRecord':
                return this.stopRecording();
            case 'StartStream':
                return this.startStreaming();
            case 'StopStream':
                return this.stopStreaming();
            default:
                return { error: 'Unknown request type' };
        }
    }

    getVersion() {
        return {
            obsVersion: '30.0.0',
            obsWebSocketVersion: '5.6.3',
            rpcVersion: 1,
            availableRequests: [
                'GetVersion', 'GetStats', 'GetSceneList',
                'GetCurrentProgramScene', 'SetCurrentProgramScene',
                'StartRecord', 'StopRecord',
                'StartStream', 'StopStream'
            ],
            supportedImageFormats: ['png', 'jpg'],
            platform: 'web',
            platformDescription: 'OBS Online - Browser-based studio'
        };
    }

    getStats() {
        return {
            cpuUsage: 0,
            memoryUsage: 0,
            availableDiskSpace: 0,
            activeFps: this.stats.fps,
            averageFrameRenderTime: 1000 / this.stats.fps,
            renderSkippedFrames: 0,
            renderTotalFrames: this.stats.frames,
            outputSkippedFrames: 0,
            outputTotalFrames: this.stats.frames
        };
    }

    getSceneList() {
        const scenes = Array.from(this.scenes.keys()).map(name => ({ sceneName: name }));
        return {
            currentProgramSceneName: this.currentScene,
            scenes: scenes
        };
    }

    getCurrentScene() {
        return {
            currentProgramSceneName: this.currentScene
        };
    }

    setCurrentScene(data) {
        if (data.sceneName) {
            this.switchScene(data.sceneName);
        }
        return {};
    }
}

// Global instance
let obsOnline;

// Initialize on load
window.addEventListener('load', () => {
    obsOnline = new OBSOnline();

    // Load saved configuration from localStorage
    try {
        const savedConfig = localStorage.getItem('obs-online-config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);

            // Apply resolution
            if (config.resolution) {
                const [width, height] = config.resolution.split('x').map(Number);
                obsOnline.canvas.width = width;
                obsOnline.canvas.height = height;
            }

            // Apply FPS
            if (config.fps) {
                obsOnline.targetFPS = config.fps;
                obsOnline.frameInterval = 1000 / obsOnline.targetFPS;
            }

            // Apply bitrate
            if (config.bitrate) {
                obsOnline.bitrate = config.bitrate;
            }

            // Apply stream config
            if (config.streamConfig) {
                obsOnline.streamConfig = config.streamConfig;
            }

            // Apply record config
            if (config.recordConfig) {
                obsOnline.recordConfig = config.recordConfig;
            }

            console.log('✅ Configuración cargada desde localStorage:', config);
        }
    } catch (e) {
        console.warn('⚠️ No se pudo cargar configuración guardada:', e);
    }

    // Update UI after initialization
    obsOnline.updateScenesList();
    obsOnline.updateSourcesList();

    console.log('✅ OBS Online initialized with', obsOnline.scenes.size, 'scenes');
});

// Global functions for UI
function startRecording() {
    obsOnline.startRecording();
}

function stopRecording() {
    obsOnline.stopRecording();
}

function startStreaming() {
    obsOnline.startStreaming();
}

function stopStreaming() {
    obsOnline.stopStreaming();
}

function addSource() {
    const sourceType = prompt(
        'Tipo de fuente:\n\n' +
        '1 - Cámara\n' +
        '2 - Pantalla\n' +
        '3 - Texto\n' +
        '4 - Imagen\n\n' +
        'Ingresa el número:', '1'
    );

    if (!sourceType) return;

    switch (sourceType.trim()) {
        case '1':
            obsOnline.addCameraSource();
            break;
        case '2':
            obsOnline.addScreenSource();
            break;
        case '3':
            obsOnline.addTextSource();
            break;
        case '4':
            obsOnline.addImageSource();
            break;
        default:
            alert('Opción inválida');
    }
}

function startWebSocketServer() {
    alert('WebSocket server requiere backend. Usar el simulador Python en puerto 4455.');
}

// === Funciones adicionales para HTML Profesional ===

function addScene() {
    const sceneName = prompt('Nombre de la nueva escena:', `Escena ${obsOnline.scenes.size + 1}`);
    if (!sceneName) return;

    const sceneId = 'scene-' + Date.now();
    obsOnline.scenes.set(sceneId, {
        id: sceneId,
        name: sceneName,
        sources: []
    });

    if (!obsOnline.currentScene) {
        obsOnline.currentScene = sceneId;
    }

    obsOnline.updateScenesList();
    console.log('✅ Escena agregada:', sceneName);
}

function removeScene() {
    if (obsOnline.scenes.size <= 1) {
        alert('No puedes eliminar la última escena');
        return;
    }

    if (confirm(`¿Eliminar la escena "${obsOnline.scenes.get(obsOnline.currentScene).name}"?`)) {
        obsOnline.scenes.delete(obsOnline.currentScene);
        obsOnline.currentScene = obsOnline.scenes.keys().next().value;
        obsOnline.updateScenesList();
        console.log('✅ Escena eliminada');
    }
}

function duplicateScene() {
    const currentScene = obsOnline.scenes.get(obsOnline.currentScene);
    const newSceneId = 'scene-' + Date.now();
    const newName = prompt('Nombre para la escena duplicada:', currentScene.name + ' (copia)');
    if (!newName) return;

    obsOnline.scenes.set(newSceneId, {
        id: newSceneId,
        name: newName,
        sources: [...currentScene.sources]
    });

    obsOnline.updateScenesList();
    console.log('✅ Escena duplicada');
}

function showAddSourceModal() {
    const modal = document.getElementById('add-source-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function createSource() {
    const sourceType = document.getElementById('source-type').value;

    closeModal('add-source-modal');

    switch (sourceType) {
        case 'camera':
            obsOnline.addCameraSource();
            break;
        case 'screen':
            obsOnline.addScreenSource();
            break;
        case 'text':
            obsOnline.addTextSource();
            break;
        case 'image':
            obsOnline.addImageSource();
            break;
        case 'color':
            obsOnline.addColorSource();
            break;
        case 'browser':
            obsOnline.addBrowserSource();
            break;
        case 'window':
            alert('Captura de ventana: usa Captura de Pantalla');
            break;
        default:
            alert('Tipo de fuente no implementado');
    }
}

function removeSource() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const source = obsOnline.sources.get(obsOnline.selectedSourceId);
    if (!source) return;

    if (confirm(`¿Eliminar la fuente "${source.name}"?`)) {
        // Stop video streams if any
        if (source.stream) {
            source.stream.getTracks().forEach(track => track.stop());
        }

        // Remove from scene
        const scene = obsOnline.scenes.get(obsOnline.currentScene);
        const index = scene.sources.indexOf(obsOnline.selectedSourceId);
        if (index > -1) {
            scene.sources.splice(index, 1);
        }

        // Remove from sources map
        obsOnline.sources.delete(obsOnline.selectedSourceId);
        obsOnline.selectedSourceId = null;

        obsOnline.updateSourcesList();
        console.log('✅ Fuente eliminada:', source.name);
    }
}

function moveSourceUp() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const scene = obsOnline.scenes.get(obsOnline.currentScene);
    const index = scene.sources.indexOf(obsOnline.selectedSourceId);

    if (index > 0) {
        // Swap with previous
        [scene.sources[index - 1], scene.sources[index]] = [scene.sources[index], scene.sources[index - 1]];
        obsOnline.updateSourcesList();
        console.log('⬆️ Fuente movida arriba');
    } else {
        alert('La fuente ya está al principio');
    }
}

function moveSourceDown() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const scene = obsOnline.scenes.get(obsOnline.currentScene);
    const index = scene.sources.indexOf(obsOnline.selectedSourceId);

    if (index < scene.sources.length - 1) {
        // Swap with next
        [scene.sources[index], scene.sources[index + 1]] = [scene.sources[index + 1], scene.sources[index]];
        obsOnline.updateSourcesList();
        console.log('⬇️ Fuente movida abajo');
    } else {
        alert('La fuente ya está al final');
    }
}

function showSourceProperties() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }
    showSourcePropertiesFor(obsOnline.selectedSourceId);
}

function saveSourceProperties() {
    const modal = document.getElementById('source-props-modal');
    const sourceId = modal.dataset.sourceId;
    if (!sourceId) return;

    const source = obsOnline.sources.get(sourceId);
    if (!source) return;

    // Save properties based on source type
    if (source.type === 'text') {
        const textInput = document.getElementById('prop-text');
        const fontSizeInput = document.getElementById('prop-fontsize');
        const colorInput = document.getElementById('prop-color');

        if (textInput) source.text = textInput.value;
        if (fontSizeInput) source.fontSize = parseInt(fontSizeInput.value);
        if (colorInput) source.color = colorInput.value;

        console.log('✅ Text properties saved:', source.text);
    } else if (source.type === 'camera' || source.type === 'screen' || source.type === 'image') {
        const xInput = document.getElementById('prop-x');
        const yInput = document.getElementById('prop-y');
        const widthInput = document.getElementById('prop-width');
        const heightInput = document.getElementById('prop-height');

        if (xInput) source.x = parseInt(xInput.value);
        if (yInput) source.y = parseInt(yInput.value);
        if (widthInput) source.width = parseInt(widthInput.value);
        if (heightInput) source.height = parseInt(heightInput.value);

        console.log('✅ Transform properties saved:', source.x, source.y, source.width, source.height);
    }

    if (source.type === 'image') {
        const nameInput = document.getElementById('prop-name');
        if (nameInput) source.name = nameInput.value;
    }

    obsOnline.updateSourcesList();
    closeModal('source-props-modal');
}

function showFilters() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const source = obsOnline.sources.get(obsOnline.selectedSourceId);
    if (!source) return;

    const filters = [
        'Sin filtro',
        'Escala de grises',
        'Sepia',
        'Invertir colores',
        'Blur',
        'Brillo +50%',
        'Contraste +50%',
        'Saturación +50%'
    ];

    const choice = prompt(
        '🎨 FILTROS DISPONIBLES:\n\n' +
        filters.map((f, i) => `${i} - ${f}`).join('\n') +
        '\n\nIngresa el número:', '0'
    );

    if (choice === null) return;

    const index = parseInt(choice);
    if (isNaN(index) || index < 0 || index >= filters.length) {
        alert('Opción inválida');
        return;
    }

    source.filter = index;
    console.log('✅ Filtro aplicado:', filters[index]);
}

function toggleStream() {
    if (obsOnline.streaming) {
        obsOnline.stopStreaming();
    } else {
        obsOnline.startStreaming();
    }
}

function toggleRecord() {
    if (obsOnline.recording) {
        obsOnline.stopRecording();
    } else {
        obsOnline.startRecording();
    }
}

function toggleStudioMode() {
    const checkbox = document.getElementById('studio-mode');
    const isEnabled = checkbox && checkbox.checked;

    if (isEnabled) {
        console.log('🎬 Modo Estudio activado');
        alert('Modo Estudio activado\n\nEn este modo tendrías una vista previa y una vista en vivo.\nPuedes preparar escenas sin que se vean en el stream.');
    } else {
        console.log('🎬 Modo Estudio desactivado');
    }
}

function fitToScreen() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const source = obsOnline.sources.get(obsOnline.selectedSourceId);
    if (!source) return;

    // Ajustar al tamaño del canvas
    source.x = 0;
    source.y = 0;
    source.width = 1920;
    source.height = 1080;

    console.log('📐 Fuente ajustada a pantalla completa');
}

function resetTransform() {
    if (!obsOnline.selectedSourceId) {
        alert('Selecciona una fuente primero');
        return;
    }

    const source = obsOnline.sources.get(obsOnline.selectedSourceId);
    if (!source) return;

    // Reset to default position/size based on type
    if (source.type === 'camera') {
        source.x = 100;
        source.y = 100;
        source.width = 640;
        source.height = 360;
    } else if (source.type === 'screen' || source.type === 'color') {
        source.x = 0;
        source.y = 0;
        source.width = 1920;
        source.height = 1080;
    } else if (source.type === 'text') {
        source.x = 50;
        source.y = 50;
        source.width = 800;
        source.height = 100;
    } else if (source.type === 'image') {
        source.x = 100;
        source.y = 100;
        // Keep original size
    }

    console.log('🔄 Transformación reseteada');
}

function toggleGrid() {
    if (!obsOnline.showGrid) {
        obsOnline.showGrid = true;
        console.log('📊 Grid activado');
    } else {
        obsOnline.showGrid = false;
        console.log('📊 Grid desactivado');
    }
}

function showSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Cargar configuración actual en el formulario
    const resolution = obsOnline.canvas.width + 'x' + obsOnline.canvas.height;
    const resSelect = document.getElementById('config-resolution');
    if (resSelect) {
        resSelect.value = resolution;
    }

    const fpsSelect = document.getElementById('config-fps');
    if (fpsSelect) {
        fpsSelect.value = obsOnline.targetFPS || 30;
    }

    const bitrateInput = document.getElementById('config-bitrate');
    if (bitrateInput) {
        bitrateInput.value = obsOnline.bitrate || 5000;
    }

    // Cargar configuración de streaming si existe
    if (obsOnline.streamConfig) {
        const platformSelect = document.getElementById('config-platform');
        if (platformSelect && obsOnline.streamConfig.platform) {
            platformSelect.value = obsOnline.streamConfig.platform;
        }

        const serverUrlInput = document.getElementById('config-server-url');
        if (serverUrlInput && obsOnline.streamConfig.rtmpUrl) {
            serverUrlInput.value = obsOnline.streamConfig.rtmpUrl;
        }

        const streamKeyInput = document.getElementById('config-stream-key');
        if (streamKeyInput && obsOnline.streamConfig.streamKey) {
            streamKeyInput.value = obsOnline.streamConfig.streamKey;
        }
    }

    // Mostrar modal
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function toggleStreamKeyVisibility() {
    const streamKeyInput = document.getElementById('config-stream-key');
    const checkbox = document.getElementById('show-stream-key');

    if (streamKeyInput && checkbox) {
        streamKeyInput.type = checkbox.checked ? 'text' : 'password';
    }
}

function saveSettings() {
    // Leer resolución
    const resolutionSelect = document.getElementById('config-resolution');
    if (resolutionSelect) {
        const [width, height] = resolutionSelect.value.split('x').map(Number);
        obsOnline.canvas.width = width;
        obsOnline.canvas.height = height;
        console.log(`✅ Resolución actualizada: ${width}x${height}`);
    }

    // Leer FPS
    const fpsSelect = document.getElementById('config-fps');
    if (fpsSelect) {
        obsOnline.targetFPS = parseInt(fpsSelect.value);
        obsOnline.frameInterval = 1000 / obsOnline.targetFPS;
        console.log(`✅ FPS actualizado: ${obsOnline.targetFPS}`);
    }

    // Leer bitrate
    const bitrateInput = document.getElementById('config-bitrate');
    if (bitrateInput) {
        obsOnline.bitrate = parseInt(bitrateInput.value);
        console.log(`✅ Bitrate actualizado: ${obsOnline.bitrate} kbps`);
    }

    // Leer configuración de streaming
    const platformSelect = document.getElementById('config-platform');
    const serverUrlInput = document.getElementById('config-server-url');
    const streamKeyInput = document.getElementById('config-stream-key');

    if (!obsOnline.streamConfig) {
        obsOnline.streamConfig = {};
    }

    if (platformSelect) {
        obsOnline.streamConfig.platform = platformSelect.value;
    }

    if (serverUrlInput) {
        obsOnline.streamConfig.rtmpUrl = serverUrlInput.value;
    }

    if (streamKeyInput) {
        obsOnline.streamConfig.streamKey = streamKeyInput.value;
    }

    // Leer configuración de grabación
    const recordFormatSelect = document.getElementById('config-record-format');
    const recordQualitySelect = document.getElementById('config-record-quality');

    if (!obsOnline.recordConfig) {
        obsOnline.recordConfig = {};
    }

    if (recordFormatSelect) {
        obsOnline.recordConfig.format = recordFormatSelect.value;
    }

    if (recordQualitySelect) {
        obsOnline.recordConfig.quality = recordQualitySelect.value;
    }

    // Guardar en localStorage para persistencia
    try {
        const config = {
            resolution: resolutionSelect ? resolutionSelect.value : '1920x1080',
            fps: obsOnline.targetFPS,
            bitrate: obsOnline.bitrate,
            streamConfig: obsOnline.streamConfig,
            recordConfig: obsOnline.recordConfig
        };
        localStorage.setItem('obs-online-config', JSON.stringify(config));
        console.log('✅ Configuración guardada en localStorage');
    } catch (e) {
        console.warn('⚠️ No se pudo guardar en localStorage:', e);
    }

    // Cerrar modal y mostrar confirmación
    closeModal('settings-modal');

    const statusBar = document.getElementById('status-text');
    if (statusBar) {
        const originalText = statusBar.textContent;
        statusBar.textContent = '✅ Configuración guardada';
        statusBar.style.color = '#00ff00';

        setTimeout(() => {
            statusBar.textContent = originalText;
            statusBar.style.color = '';
        }, 3000);
    }

    console.log('✅ Configuración aplicada:', {
        resolution: obsOnline.canvas.width + 'x' + obsOnline.canvas.height,
        fps: obsOnline.targetFPS,
        bitrate: obsOnline.bitrate,
        streamConfig: obsOnline.streamConfig,
        recordConfig: obsOnline.recordConfig
    });
}

function updateRtmpUrl() {
    const platformSelect = document.getElementById('config-platform');
    const serverUrlInput = document.getElementById('config-server-url');

    if (!platformSelect || !serverUrlInput) return;

    const platform = platformSelect.value;

    // Auto-llenar URL RTMP según la plataforma
    const rtmpUrls = {
        'youtube': 'rtmp://a.rtmp.youtube.com/live2',
        'twitch': 'rtmp://live.twitch.tv/app',
        'facebook': 'rtmps://live-api-s.facebook.com:443/rtmp/',
        'custom': ''
    };

    if (rtmpUrls[platform] !== undefined) {
        serverUrlInput.value = rtmpUrls[platform];
        console.log(`✅ URL RTMP actualizada para ${platform}:`, rtmpUrls[platform]);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function exitApp() {
    if (confirm('¿Seguro que quieres salir?')) {
        window.close();
    }
}

// Helper functions for sources
function toggleSourceVisibility(sourceId) {
    const source = obsOnline.sources.get(sourceId);
    if (!source) return;

    source.visible = !source.visible;
    obsOnline.updateSourcesList();
    console.log(`👁️ Source ${source.visible ? 'shown' : 'hidden'}:`, source.name);
}

function showSourcePropertiesFor(sourceId) {
    const source = obsOnline.sources.get(sourceId);
    if (!source) return;

    const modal = document.getElementById('source-props-modal');
    const content = document.getElementById('source-props-content');
    if (!modal || !content) return;

    // Build properties form based on source type
    let propsHTML = `<h3>Propiedades de: ${source.name}</h3>`;

    if (source.type === 'text') {
        propsHTML += `
            <div class="form-group">
                <label class="form-label">Texto</label>
                <input type="text" class="form-input" id="prop-text" value="${source.text || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Tamaño de Fuente</label>
                <input type="number" class="form-input" id="prop-fontsize" value="${source.fontSize || 48}">
            </div>
            <div class="form-group">
                <label class="form-label">Color</label>
                <input type="color" class="form-input" id="prop-color" value="${source.color || '#ffffff'}">
            </div>
        `;
    } else if (source.type === 'camera' || source.type === 'screen') {
        propsHTML += `
            <div class="form-group">
                <label class="form-label">Posición X</label>
                <input type="number" class="form-input" id="prop-x" value="${source.x}">
            </div>
            <div class="form-group">
                <label class="form-label">Posición Y</label>
                <input type="number" class="form-input" id="prop-y" value="${source.y}">
            </div>
            <div class="form-group">
                <label class="form-label">Ancho</label>
                <input type="number" class="form-input" id="prop-width" value="${source.width}">
            </div>
            <div class="form-group">
                <label class="form-label">Alto</label>
                <input type="number" class="form-input" id="prop-height" value="${source.height}">
            </div>
        `;
    } else if (source.type === 'image') {
        propsHTML += `
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="prop-name" value="${source.name}">
            </div>
            <div class="form-group">
                <label class="form-label">Posición X</label>
                <input type="number" class="form-input" id="prop-x" value="${source.x}">
            </div>
            <div class="form-group">
                <label class="form-label">Posición Y</label>
                <input type="number" class="form-input" id="prop-y" value="${source.y}">
            </div>
            <div class="form-group">
                <label class="form-label">Ancho</label>
                <input type="number" class="form-input" id="prop-width" value="${source.width}">
            </div>
            <div class="form-group">
                <label class="form-label">Alto</label>
                <input type="number" class="form-input" id="prop-height" value="${source.height}">
            </div>
        `;
    }

    content.innerHTML = propsHTML;
    modal.style.display = 'flex';
    modal.classList.add('active');

    // Store current source ID for saving
    modal.dataset.sourceId = sourceId;
}

// Helper functions for inline onclick handlers
function duplicateSceneById(sceneId) {
    const scene = obsOnline.scenes.get(sceneId);
    if (!scene) return;

    const newSceneId = 'scene-' + Date.now();
    const newName = prompt('Nombre para la escena duplicada:', scene.name + ' (copia)');
    if (!newName) return;

    obsOnline.scenes.set(newSceneId, {
        id: newSceneId,
        name: newName,
        sources: [...scene.sources]
    });

    obsOnline.updateScenesList();
    console.log('✅ Escena duplicada:', newName);
}

function removeSceneById(sceneId) {
    if (obsOnline.scenes.size <= 1) {
        alert('No puedes eliminar la última escena');
        return;
    }

    const scene = obsOnline.scenes.get(sceneId);
    if (!scene) return;

    if (confirm(`¿Eliminar la escena "${scene.name}"?`)) {
        obsOnline.scenes.delete(sceneId);

        // If deleted scene was current, switch to first available
        if (obsOnline.currentScene === sceneId) {
            obsOnline.currentScene = obsOnline.scenes.keys().next().value;
        }

        obsOnline.updateScenesList();
        obsOnline.updateSourcesList();
        console.log('✅ Escena eliminada:', scene.name);
    }
}
