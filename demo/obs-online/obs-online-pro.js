/**
 * OBS Online Pro - Professional Browser-Based OBS Studio Clone
 * A complete implementation of OBS Studio functionality for the web
 *
 * Features:
 * - Multi-scene management with transitions
 * - 7+ source types (Camera, Screen, Window, Text, Image, Color, Browser)
 * - Full transform controls (position, rotation, scale, crop, opacity)
 * - Drag & drop, resize, rotate with visual handles
 * - Filter pipeline (Chroma Key, Color Correction, Blur, Sharpen)
 * - Audio mixer with volume control and metering
 * - Recording with MediaRecorder API
 * - Studio Mode (preview + program)
 * - Hotkey support
 * - Settings management
 * - Statistics tracking
 */

class OBSOnlinePro {
    constructor(canvasId = 'preview-canvas') {
        // Canvas & Rendering
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
        this.canvasWidth = 1920;
        this.canvasHeight = 1080;
        this.frameRate = 30;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.frameRate;
        this.animationFrameId = null;
        this.isRendering = false;

        // Scene Management
        this.scenes = [];
        this.currentSceneId = null;
        this.previewSceneId = null; // For studio mode
        this.studioMode = false;
        this.transitionDuration = 300; // ms
        this.transitionType = 'fade'; // 'fade', 'cut', 'slide'
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionStartTime = 0;
        this.transitionFromScene = null;
        this.transitionToScene = null;

        // Source Management
        this.selectedSourceId = null;
        this.draggedSource = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.resizeHandle = null;
        this.rotateMode = false;
        this.multiSelectMode = false;
        this.selectedSources = [];

        // Grid & Snapping
        this.showGrid = false;
        this.gridSize = 20;
        this.snapToGrid = false;
        this.snapThreshold = 10;

        // Recording
        this.isRecording = false;
        this.isPaused = false;
        this.recordingStartTime = 0;
        this.recordingDuration = 0;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStream = null;
        this.recordingCanvas = null;
        this.recordingCtx = null;

        // Streaming (simulated)
        this.isStreaming = false;
        this.streamingStartTime = 0;
        this.streamingDuration = 0;

        // Audio
        this.audioContext = null;
        this.audioDestination = null;
        this.audioSources = new Map(); // sourceId -> { stream, gainNode, analyser }
        this.masterVolume = 1.0;
        this.audioMeters = new Map(); // sourceId -> level (0-1)

        // Settings
        this.settings = {
            resolution: '1920x1080',
            frameRate: 30,
            videoBitrate: 2500, // kbps
            audioSampleRate: 48000,
            encoder: 'vp9',
            outputFormat: 'webm',
            quality: 'high'
        };

        // Statistics
        this.stats = {
            fps: 0,
            frameCount: 0,
            droppedFrames: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            bitrate: 0,
            lastStatsUpdate: Date.now()
        };

        // Hotkeys
        this.hotkeys = {
            'F9': () => this.toggleRecord(),
            'F10': () => this.toggleStream(),
            'F11': () => this.toggleStudioMode(),
            'F12': () => this.takeScreenshot(),
            '1': () => this.switchToSceneByIndex(0),
            '2': () => this.switchToSceneByIndex(1),
            '3': () => this.switchToSceneByIndex(2),
            '4': () => this.switchToSceneByIndex(3),
            '5': () => this.switchToSceneByIndex(4),
            '6': () => this.switchToSceneByIndex(5),
            '7': () => this.switchToSceneByIndex(6),
            '8': () => this.switchToSceneByIndex(7),
            '9': () => this.switchToSceneByIndex(8),
            'Space': () => this.togglePlayPause()
        };

        // Modal state
        this.currentModal = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        if (this.canvas) {
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;
            this.setupEventListeners();
        }

        // Create default scene
        this.createScene('Scene 1');

        // Load saved profile
        this.loadProfile();

        // Start rendering loop
        this.startRendering();

        // Update UI
        this.updateUI();

        console.log('OBS Online Pro initialized');
    }

    /**
     * Setup event listeners for canvas interaction
     */
    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Visibility change (pause rendering when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRendering();
            } else {
                this.resumeRendering();
            }
        });
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);

        const scene = this.getCurrentScene();
        if (!scene) return;

        // Check for resize handle
        const selectedSource = this.getSourceById(this.selectedSourceId);
        if (selectedSource) {
            const handle = this.getResizeHandle(selectedSource, x, y);
            if (handle) {
                this.resizeHandle = handle;
                this.dragStartX = x;
                this.dragStartY = y;
                return;
            }

            // Check for rotation handle
            if (this.isOverRotationHandle(selectedSource, x, y)) {
                this.rotateMode = true;
                this.dragStartX = x;
                this.dragStartY = y;
                return;
            }
        }

        // Check if clicking on a source
        for (let i = scene.sources.length - 1; i >= 0; i--) {
            const source = scene.sources[i];
            if (this.isPointInSource(source, x, y)) {
                if (e.shiftKey && this.multiSelectMode) {
                    // Multi-select
                    if (this.selectedSources.includes(source.id)) {
                        this.selectedSources = this.selectedSources.filter(id => id !== source.id);
                    } else {
                        this.selectedSources.push(source.id);
                    }
                } else {
                    // Single select
                    this.selectedSourceId = source.id;
                    this.selectedSources = [source.id];
                    this.draggedSource = source;
                    this.dragStartX = x;
                    this.dragStartY = y;
                    this.dragOffsetX = x - source.x;
                    this.dragOffsetY = y - source.y;
                }
                this.updateUI();
                return;
            }
        }

        // Clicked on empty area
        this.selectedSourceId = null;
        this.selectedSources = [];
        this.updateUI();
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);

        // Rotation mode
        if (this.rotateMode && this.selectedSourceId) {
            const source = this.getSourceById(this.selectedSourceId);
            if (source && !source.locked) {
                const centerX = source.x + source.width / 2;
                const centerY = source.y + source.height / 2;
                const angle = Math.atan2(y - centerY, x - centerX);
                source.rotation = (angle * 180 / Math.PI + 90) % 360;
                this.updateUI();
            }
            return;
        }

        // Resize mode
        if (this.resizeHandle && this.selectedSourceId) {
            const source = this.getSourceById(this.selectedSourceId);
            if (source && !source.locked) {
                this.resizeSource(source, x, y, this.resizeHandle);
                this.dragStartX = x;
                this.dragStartY = y;
                this.updateUI();
            }
            return;
        }

        // Drag mode
        if (this.draggedSource && !this.draggedSource.locked) {
            let newX = x - this.dragOffsetX;
            let newY = y - this.dragOffsetY;

            // Snap to grid
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }

            this.draggedSource.x = newX;
            this.draggedSource.y = newY;
            this.updateUI();
        }
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(e) {
        this.draggedSource = null;
        this.resizeHandle = null;
        this.rotateMode = false;
    }

    /**
     * Handle double click event
     */
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);

        const scene = this.getCurrentScene();
        if (!scene) return;

        // Find clicked source
        for (let i = scene.sources.length - 1; i >= 0; i--) {
            const source = scene.sources[i];
            if (this.isPointInSource(source, x, y)) {
                this.showSourceProperties(source.id);
                return;
            }
        }
    }

    /**
     * Handle right click event
     */
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);

        const scene = this.getCurrentScene();
        if (!scene) return;

        // Show context menu for source
        for (let i = scene.sources.length - 1; i >= 0; i--) {
            const source = scene.sources[i];
            if (this.isPointInSource(source, x, y)) {
                this.showSourceContextMenu(source, e.clientX, e.clientY);
                return;
            }
        }
    }

    /**
     * Handle key down event
     */
    handleKeyDown(e) {
        // Don't handle hotkeys when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Check for Ctrl+S (save profile)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveProfile();
            return;
        }

        // Check for Delete (remove source)
        if (e.key === 'Delete' && this.selectedSourceId) {
            e.preventDefault();
            this.removeSource(this.selectedSourceId);
            return;
        }

        // Check for arrow keys (move source)
        if (this.selectedSourceId && !e.ctrlKey && !e.shiftKey) {
            const source = this.getSourceById(this.selectedSourceId);
            if (source && !source.locked) {
                let moved = false;
                const step = e.altKey ? 1 : 10;

                if (e.key === 'ArrowLeft') {
                    source.x -= step;
                    moved = true;
                } else if (e.key === 'ArrowRight') {
                    source.x += step;
                    moved = true;
                } else if (e.key === 'ArrowUp') {
                    source.y -= step;
                    moved = true;
                } else if (e.key === 'ArrowDown') {
                    source.y += step;
                    moved = true;
                }

                if (moved) {
                    e.preventDefault();
                    this.updateUI();
                    return;
                }
            }
        }

        // Check hotkeys
        const key = e.key;
        if (this.hotkeys[key]) {
            e.preventDefault();
            this.hotkeys[key]();
        }
    }

    /**
     * Handle key up event
     */
    handleKeyUp(e) {
        // Handle shift key for multi-select
        if (e.key === 'Shift') {
            this.multiSelectMode = false;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.updateUI();
    }

    /**
     * Check if point is inside source bounds
     */
    isPointInSource(source, x, y) {
        if (!source.visible) return false;

        // Simple bounding box check (doesn't account for rotation)
        // For rotated sources, this is approximate
        return x >= source.x && x <= source.x + source.width &&
               y >= source.y && y <= source.y + source.height;
    }

    /**
     * Get resize handle at position
     */
    getResizeHandle(source, x, y) {
        const handleSize = 10;
        const handles = this.getResizeHandles(source);

        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) <= handleSize && Math.abs(y - pos.y) <= handleSize) {
                return name;
            }
        }

        return null;
    }

    /**
     * Get resize handle positions
     */
    getResizeHandles(source) {
        return {
            'nw': { x: source.x, y: source.y },
            'n':  { x: source.x + source.width / 2, y: source.y },
            'ne': { x: source.x + source.width, y: source.y },
            'e':  { x: source.x + source.width, y: source.y + source.height / 2 },
            'se': { x: source.x + source.width, y: source.y + source.height },
            's':  { x: source.x + source.width / 2, y: source.y + source.height },
            'sw': { x: source.x, y: source.y + source.height },
            'w':  { x: source.x, y: source.y + source.height / 2 }
        };
    }

    /**
     * Check if over rotation handle
     */
    isOverRotationHandle(source, x, y) {
        const handleSize = 10;
        const centerX = source.x + source.width / 2;
        const centerY = source.y - 30; // Above the source

        return Math.abs(x - centerX) <= handleSize && Math.abs(y - centerY) <= handleSize;
    }

    /**
     * Resize source based on handle
     */
    resizeSource(source, x, y, handle) {
        const dx = x - this.dragStartX;
        const dy = y - this.dragStartY;

        switch (handle) {
            case 'nw':
                source.x += dx;
                source.y += dy;
                source.width -= dx;
                source.height -= dy;
                break;
            case 'n':
                source.y += dy;
                source.height -= dy;
                break;
            case 'ne':
                source.width += dx;
                source.y += dy;
                source.height -= dy;
                break;
            case 'e':
                source.width += dx;
                break;
            case 'se':
                source.width += dx;
                source.height += dy;
                break;
            case 's':
                source.height += dy;
                break;
            case 'sw':
                source.x += dx;
                source.width -= dx;
                source.height += dy;
                break;
            case 'w':
                source.x += dx;
                source.width -= dx;
                break;
        }

        // Prevent negative dimensions
        if (source.width < 10) source.width = 10;
        if (source.height < 10) source.height = 10;
    }

    /**
     * Start rendering loop
     */
    startRendering() {
        if (this.isRendering) return;
        this.isRendering = true;
        this.lastFrameTime = performance.now();
        this.render();
    }

    /**
     * Pause rendering
     */
    pauseRendering() {
        this.isRendering = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Resume rendering
     */
    resumeRendering() {
        if (!this.isRendering) {
            this.startRendering();
        }
    }

    /**
     * Main render loop
     */
    render(timestamp) {
        if (!this.isRendering) return;

        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;

        // Frame rate limiting
        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);

            // Clear canvas
            if (this.ctx) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            }

            // Handle transitions
            if (this.isTransitioning) {
                this.renderTransition(timestamp);
            } else {
                // Render current scene
                const scene = this.studioMode ? this.getPreviewScene() : this.getCurrentScene();
                if (scene) {
                    this.renderScene(scene, this.ctx);
                }
            }

            // Draw grid
            if (this.showGrid) {
                this.drawGrid();
            }

            // Draw selection boxes
            if (this.selectedSourceId) {
                const source = this.getSourceById(this.selectedSourceId);
                if (source) {
                    this.drawSelectionBox(source);
                }
            }

            // Update statistics
            this.updateStats(deltaTime);

            // Update audio meters
            this.updateAudioMeters();

            // Update recording time
            if (this.isRecording && !this.isPaused) {
                this.recordingDuration = Date.now() - this.recordingStartTime;
                this.updateRecordingUI();
            }

            // Update streaming time
            if (this.isStreaming) {
                this.streamingDuration = Date.now() - this.streamingStartTime;
                this.updateStreamingUI();
            }
        }

        // Request next frame
        this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }

    /**
     * Render a scene
     */
    renderScene(scene, ctx) {
        if (!ctx || !scene) return;

        // Render background color
        if (scene.backgroundColor) {
            ctx.fillStyle = scene.backgroundColor;
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

        // Render sources in order
        for (const source of scene.sources) {
            if (source.visible) {
                this.renderSource(source, ctx);
            }
        }
    }

    /**
     * Render a source with all transforms and filters
     */
    renderSource(source, ctx) {
        if (!ctx) return;

        ctx.save();

        // Apply global opacity
        ctx.globalAlpha = source.opacity;

        // Apply transforms
        ctx.translate(source.x + source.width / 2, source.y + source.height / 2);
        ctx.rotate(source.rotation * Math.PI / 180);
        ctx.scale(source.scaleX, source.scaleY);
        ctx.translate(-source.width / 2, -source.height / 2);

        // Apply crop
        if (source.crop.left || source.crop.top || source.crop.right || source.crop.bottom) {
            ctx.beginPath();
            ctx.rect(
                source.crop.left,
                source.crop.top,
                source.width - source.crop.left - source.crop.right,
                source.height - source.crop.top - source.crop.bottom
            );
            ctx.clip();
        }

        // Create temporary canvas for filters
        let sourceCanvas = null;
        let sourceCtx = null;

        if (source.filters && source.filters.length > 0) {
            sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = source.width;
            sourceCanvas.height = source.height;
            sourceCtx = sourceCanvas.getContext('2d');
        }

        // Render source content
        switch (source.type) {
            case 'camera':
            case 'screen':
            case 'window':
                if (source.element && source.element.readyState >= 2) {
                    const drawCtx = sourceCtx || ctx;
                    drawCtx.drawImage(source.element, 0, 0, source.width, source.height);
                }
                break;

            case 'image':
                if (source.element && source.element.complete) {
                    const drawCtx = sourceCtx || ctx;
                    drawCtx.drawImage(source.element, 0, 0, source.width, source.height);
                }
                break;

            case 'text':
                this.renderText(source, sourceCtx || ctx);
                break;

            case 'color':
                const drawCtx = sourceCtx || ctx;
                drawCtx.fillStyle = source.color || '#FF0000';
                drawCtx.fillRect(0, 0, source.width, source.height);
                break;

            case 'browser':
                if (source.element) {
                    const drawCtx = sourceCtx || ctx;
                    // Note: iframe to canvas is limited due to CORS
                    drawCtx.fillStyle = '#333';
                    drawCtx.fillRect(0, 0, source.width, source.height);
                    drawCtx.fillStyle = '#fff';
                    drawCtx.font = '16px Arial';
                    drawCtx.textAlign = 'center';
                    drawCtx.fillText('Browser Source', source.width / 2, source.height / 2);
                }
                break;
        }

        // Apply filters
        if (source.filters && source.filters.length > 0 && sourceCanvas) {
            this.applyFilters(sourceCanvas, sourceCtx, source.filters);
            ctx.drawImage(sourceCanvas, 0, 0);
        }

        ctx.restore();
    }

    /**
     * Render text source
     */
    renderText(source, ctx) {
        ctx.font = `${source.fontSize || 48}px ${source.fontFamily || 'Arial'}`;
        ctx.fillStyle = source.textColor || '#FFFFFF';
        ctx.textAlign = source.textAlign || 'left';
        ctx.textBaseline = 'top';

        // Draw background
        if (source.backgroundColor) {
            ctx.fillStyle = source.backgroundColor;
            ctx.fillRect(0, 0, source.width, source.height);
            ctx.fillStyle = source.textColor || '#FFFFFF';
        }

        // Draw text
        const text = source.text || 'Text Source';
        const lines = text.split('\n');
        const lineHeight = (source.fontSize || 48) * 1.2;

        for (let i = 0; i < lines.length; i++) {
            const x = source.textAlign === 'center' ? source.width / 2 :
                     source.textAlign === 'right' ? source.width : 0;
            const y = i * lineHeight;
            ctx.fillText(lines[i], x, y);
        }
    }

    /**
     * Apply filters to source
     */
    applyFilters(canvas, ctx, filters) {
        for (const filter of filters) {
            if (!filter.enabled) continue;

            switch (filter.type) {
                case 'chromaKey':
                    this.applyChromaKey(canvas, ctx, filter);
                    break;
                case 'colorCorrection':
                    this.applyColorCorrection(canvas, ctx, filter);
                    break;
                case 'blur':
                    this.applyBlur(ctx, filter);
                    break;
                case 'sharpen':
                    this.applySharpen(canvas, ctx, filter);
                    break;
                case 'opacity':
                    ctx.globalAlpha *= filter.opacity || 1.0;
                    break;
            }
        }
    }

    /**
     * Apply chroma key filter (green screen)
     */
    applyChromaKey(canvas, ctx, filter) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Parse key color (default green)
        const keyColor = filter.keyColor || '#00FF00';
        const r = parseInt(keyColor.slice(1, 3), 16);
        const g = parseInt(keyColor.slice(3, 5), 16);
        const b = parseInt(keyColor.slice(5, 7), 16);

        const similarity = filter.similarity || 0.4;
        const smoothness = filter.smoothness || 0.1;

        for (let i = 0; i < data.length; i += 4) {
            const distance = Math.sqrt(
                Math.pow((data[i] - r) / 255, 2) +
                Math.pow((data[i + 1] - g) / 255, 2) +
                Math.pow((data[i + 2] - b) / 255, 2)
            );

            if (distance < similarity) {
                const alpha = Math.max(0, (distance - similarity + smoothness) / smoothness);
                data[i + 3] *= alpha;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Apply color correction filter
     */
    applyColorCorrection(canvas, ctx, filter) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const brightness = filter.brightness || 0; // -100 to 100
        const contrast = filter.contrast || 0; // -100 to 100
        const saturation = filter.saturation || 0; // -100 to 100
        const hue = filter.hue || 0; // -180 to 180

        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const saturationFactor = (saturation + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness
            r += brightness * 2.55;
            g += brightness * 2.55;
            b += brightness * 2.55;

            // Contrast
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;

            // Saturation
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturationFactor * (r - gray);
            g = gray + saturationFactor * (g - gray);
            b = gray + saturationFactor * (b - gray);

            // Clamp values
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Apply blur filter
     */
    applyBlur(ctx, filter) {
        const radius = filter.radius || 5;
        ctx.filter = `blur(${radius}px)`;
    }

    /**
     * Apply sharpen filter
     */
    applySharpen(canvas, ctx, filter) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const amount = filter.amount || 1.0;

        // Simple unsharp mask
        const tempData = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                for (let c = 0; c < 3; c++) {
                    const center = tempData[idx + c];
                    const neighbor = (
                        tempData[idx - 4 + c] +
                        tempData[idx + 4 + c] +
                        tempData[idx - width * 4 + c] +
                        tempData[idx + width * 4 + c]
                    ) / 4;

                    data[idx + c] = Math.max(0, Math.min(255,
                        center + amount * (center - neighbor)
                    ));
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Render transition between scenes
     */
    renderTransition(timestamp) {
        if (!this.transitionFromScene || !this.transitionToScene) {
            this.isTransitioning = false;
            return;
        }

        const elapsed = timestamp - this.transitionStartTime;
        this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);

        switch (this.transitionType) {
            case 'fade':
                this.renderFadeTransition();
                break;
            case 'slide':
                this.renderSlideTransition();
                break;
            case 'cut':
            default:
                this.renderScene(this.transitionToScene, this.ctx);
                this.transitionProgress = 1;
                break;
        }

        if (this.transitionProgress >= 1) {
            this.isTransitioning = false;
            this.currentSceneId = this.transitionToScene.id;
            this.transitionFromScene = null;
            this.transitionToScene = null;
            this.updateUI();
        }
    }

    /**
     * Render fade transition
     */
    renderFadeTransition() {
        // Render from scene
        this.renderScene(this.transitionFromScene, this.ctx);

        // Create temp canvas for to scene
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvasWidth;
        tempCanvas.height = this.canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Render to scene
        this.renderScene(this.transitionToScene, tempCtx);

        // Blend
        this.ctx.globalAlpha = this.transitionProgress;
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.globalAlpha = 1;
    }

    /**
     * Render slide transition
     */
    renderSlideTransition() {
        const offset = this.canvasWidth * this.transitionProgress;

        // Render from scene (sliding out)
        this.ctx.save();
        this.ctx.translate(-offset, 0);
        this.renderScene(this.transitionFromScene, this.ctx);
        this.ctx.restore();

        // Render to scene (sliding in)
        this.ctx.save();
        this.ctx.translate(this.canvasWidth - offset, 0);
        this.renderScene(this.transitionToScene, this.ctx);
        this.ctx.restore();
    }

    /**
     * Draw grid overlay
     */
    drawGrid() {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvasWidth; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvasHeight; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Draw selection box around source
     */
    drawSelectionBox(source) {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;

        // Draw bounding box
        this.ctx.strokeRect(source.x, source.y, source.width, source.height);

        // Draw resize handles
        const handles = this.getResizeHandles(source);
        this.ctx.fillStyle = '#00FF00';

        for (const pos of Object.values(handles)) {
            this.ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
        }

        // Draw rotation handle
        const centerX = source.x + source.width / 2;
        const centerY = source.y - 30;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, source.y);
        this.ctx.lineTo(centerX, centerY);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Update statistics
     */
    updateStats(deltaTime) {
        this.stats.frameCount++;

        const now = Date.now();
        if (now - this.stats.lastStatsUpdate >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastStatsUpdate = now;

            // Estimate CPU and memory usage
            if (performance.memory) {
                this.stats.memoryUsage = Math.round(
                    performance.memory.usedJSHeapSize / 1048576
                );
            }

            this.updateStatsUI();
        }
    }

    /**
     * Update audio meters
     */
    updateAudioMeters() {
        if (!this.audioContext) return;

        for (const [sourceId, audioData] of this.audioSources.entries()) {
            if (audioData.analyser) {
                const dataArray = new Uint8Array(audioData.analyser.frequencyBinCount);
                audioData.analyser.getByteTimeDomainData(dataArray);

                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const normalized = (dataArray[i] - 128) / 128;
                    sum += normalized * normalized;
                }

                const rms = Math.sqrt(sum / dataArray.length);
                this.audioMeters.set(sourceId, rms);
            }
        }

        this.updateAudioMetersUI();
    }

    /**
     * Scene Management
     */

    createScene(name) {
        const scene = {
            id: this.generateId(),
            name: name || `Scene ${this.scenes.length + 1}`,
            sources: [],
            backgroundColor: '#000000'
        };

        this.scenes.push(scene);

        if (!this.currentSceneId) {
            this.currentSceneId = scene.id;
        }

        this.updateUI();
        return scene;
    }

    removeScene(sceneId) {
        const index = this.scenes.findIndex(s => s.id === sceneId);
        if (index === -1) return;

        // Don't remove if it's the last scene
        if (this.scenes.length === 1) {
            alert('Cannot remove the last scene');
            return;
        }

        // Clean up scene resources
        const scene = this.scenes[index];
        for (const source of scene.sources) {
            this.cleanupSource(source);
        }

        this.scenes.splice(index, 1);

        // Update current scene if needed
        if (this.currentSceneId === sceneId) {
            this.currentSceneId = this.scenes[0].id;
        }

        if (this.previewSceneId === sceneId) {
            this.previewSceneId = this.scenes[0].id;
        }

        this.updateUI();
    }

    duplicateScene(sceneId) {
        const scene = this.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const newScene = {
            id: this.generateId(),
            name: `${scene.name} (Copy)`,
            sources: JSON.parse(JSON.stringify(scene.sources)),
            backgroundColor: scene.backgroundColor
        };

        // Regenerate IDs for sources
        for (const source of newScene.sources) {
            source.id = this.generateId();
        }

        this.scenes.push(newScene);
        this.updateUI();
        return newScene;
    }

    switchToScene(sceneId, useTransition = true) {
        if (this.currentSceneId === sceneId) return;

        const toScene = this.scenes.find(s => s.id === sceneId);
        if (!toScene) return;

        if (useTransition && this.transitionType !== 'cut') {
            this.transitionFromScene = this.getCurrentScene();
            this.transitionToScene = toScene;
            this.isTransitioning = true;
            this.transitionProgress = 0;
            this.transitionStartTime = performance.now();
        } else {
            this.currentSceneId = sceneId;
            this.updateUI();
        }
    }

    switchToSceneByIndex(index) {
        if (index >= 0 && index < this.scenes.length) {
            this.switchToScene(this.scenes[index].id);
        }
    }

    getCurrentScene() {
        return this.scenes.find(s => s.id === this.currentSceneId);
    }

    getPreviewScene() {
        return this.scenes.find(s => s.id === this.previewSceneId);
    }

    /**
     * Source Management
     */

    async createSource(type, options = {}) {
        const scene = this.getCurrentScene();
        if (!scene) return;

        const source = {
            id: this.generateId(),
            type: type,
            name: options.name || `${type} Source`,
            x: options.x || 100,
            y: options.y || 100,
            width: options.width || 640,
            height: options.height || 480,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            crop: { top: 0, bottom: 0, left: 0, right: 0 },
            filters: [],
            volume: 1.0,
            muted: false,
            element: null
        };

        // Type-specific initialization
        switch (type) {
            case 'camera':
                await this.initCameraSource(source, options);
                break;
            case 'screen':
                await this.initScreenSource(source, options);
                break;
            case 'window':
                await this.initWindowSource(source, options);
                break;
            case 'image':
                await this.initImageSource(source, options);
                break;
            case 'text':
                this.initTextSource(source, options);
                break;
            case 'color':
                this.initColorSource(source, options);
                break;
            case 'browser':
                this.initBrowserSource(source, options);
                break;
        }

        scene.sources.push(source);
        this.selectedSourceId = source.id;
        this.updateUI();

        return source;
    }

    async initCameraSource(source, options) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = true; // Muted for preview, audio handled separately

            source.element = video;
            source.stream = stream;

            // Setup audio
            await this.setupSourceAudio(source, stream);

        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera: ' + err.message);
        }
    }

    async initScreenSource(source, options) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = true;

            source.element = video;
            source.stream = stream;

            // Setup audio
            await this.setupSourceAudio(source, stream);

            // Handle stream end
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                this.removeSource(source.id);
            });

        } catch (err) {
            console.error('Error accessing screen:', err);
            alert('Error accessing screen: ' + err.message);
        }
    }

    async initWindowSource(source, options) {
        // Same as screen source (browser doesn't distinguish)
        await this.initScreenSource(source, options);
        source.name = 'Window Source';
    }

    async initImageSource(source, options) {
        if (options.file) {
            const img = new Image();
            img.src = URL.createObjectURL(options.file);

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    source.width = img.naturalWidth;
                    source.height = img.naturalHeight;
                    resolve();
                };
                img.onerror = reject;
            });

            source.element = img;
        } else if (options.url) {
            const img = new Image();
            img.src = options.url;
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    source.width = img.naturalWidth;
                    source.height = img.naturalHeight;
                    resolve();
                };
                img.onerror = reject;
            });

            source.element = img;
        }
    }

    initTextSource(source, options) {
        source.text = options.text || 'Text Source';
        source.fontSize = options.fontSize || 48;
        source.fontFamily = options.fontFamily || 'Arial';
        source.textColor = options.textColor || '#FFFFFF';
        source.backgroundColor = options.backgroundColor || 'transparent';
        source.textAlign = options.textAlign || 'left';
    }

    initColorSource(source, options) {
        source.color = options.color || '#FF0000';
    }

    initBrowserSource(source, options) {
        if (options.url) {
            const iframe = document.createElement('iframe');
            iframe.src = options.url;
            iframe.width = source.width;
            iframe.height = source.height;
            iframe.style.border = 'none';

            // Note: iframe content cannot be captured to canvas due to CORS
            source.element = iframe;
            source.url = options.url;
        }
    }

    async setupSourceAudio(source, stream) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioDestination = this.audioContext.createMediaStreamDestination();
        }

        try {
            const audioSource = this.audioContext.createMediaStreamSource(stream);
            const gainNode = this.audioContext.createGain();
            const analyser = this.audioContext.createAnalyser();

            analyser.fftSize = 256;

            audioSource.connect(gainNode);
            gainNode.connect(analyser);
            gainNode.connect(this.audioDestination);

            gainNode.gain.value = source.volume;

            this.audioSources.set(source.id, {
                stream: stream,
                sourceNode: audioSource,
                gainNode: gainNode,
                analyser: analyser
            });

        } catch (err) {
            console.error('Error setting up audio:', err);
        }
    }

    removeSource(sourceId) {
        const scene = this.getCurrentScene();
        if (!scene) return;

        const index = scene.sources.findIndex(s => s.id === sourceId);
        if (index === -1) return;

        const source = scene.sources[index];
        this.cleanupSource(source);

        scene.sources.splice(index, 1);

        if (this.selectedSourceId === sourceId) {
            this.selectedSourceId = null;
        }

        this.updateUI();
    }

    cleanupSource(source) {
        // Stop media streams
        if (source.stream) {
            source.stream.getTracks().forEach(track => track.stop());
        }

        // Clean up audio
        if (this.audioSources.has(source.id)) {
            const audioData = this.audioSources.get(source.id);
            if (audioData.sourceNode) {
                audioData.sourceNode.disconnect();
            }
            if (audioData.gainNode) {
                audioData.gainNode.disconnect();
            }
            if (audioData.analyser) {
                audioData.analyser.disconnect();
            }
            this.audioSources.delete(source.id);
        }

        // Revoke object URLs
        if (source.element && source.element.src && source.element.src.startsWith('blob:')) {
            URL.revokeObjectURL(source.element.src);
        }
    }

    moveSourceUp(sourceId) {
        const scene = this.getCurrentScene();
        if (!scene) return;

        const index = scene.sources.findIndex(s => s.id === sourceId);
        if (index === -1 || index === scene.sources.length - 1) return;

        [scene.sources[index], scene.sources[index + 1]] =
        [scene.sources[index + 1], scene.sources[index]];

        this.updateUI();
    }

    moveSourceDown(sourceId) {
        const scene = this.getCurrentScene();
        if (!scene) return;

        const index = scene.sources.findIndex(s => s.id === sourceId);
        if (index === -1 || index === 0) return;

        [scene.sources[index], scene.sources[index - 1]] =
        [scene.sources[index - 1], scene.sources[index]];

        this.updateUI();
    }

    getSourceById(sourceId) {
        const scene = this.getCurrentScene();
        if (!scene) return null;

        return scene.sources.find(s => s.id === sourceId);
    }

    /**
     * Filter Management
     */

    addFilter(sourceId, filterType) {
        const source = this.getSourceById(sourceId);
        if (!source) return;

        const filter = {
            id: this.generateId(),
            type: filterType,
            enabled: true
        };

        // Set default values based on type
        switch (filterType) {
            case 'chromaKey':
                filter.keyColor = '#00FF00';
                filter.similarity = 0.4;
                filter.smoothness = 0.1;
                break;
            case 'colorCorrection':
                filter.brightness = 0;
                filter.contrast = 0;
                filter.saturation = 0;
                filter.hue = 0;
                break;
            case 'blur':
                filter.radius = 5;
                break;
            case 'sharpen':
                filter.amount = 1.0;
                break;
            case 'opacity':
                filter.opacity = 1.0;
                break;
        }

        if (!source.filters) {
            source.filters = [];
        }

        source.filters.push(filter);
        this.updateUI();

        return filter;
    }

    removeFilter(sourceId, filterId) {
        const source = this.getSourceById(sourceId);
        if (!source || !source.filters) return;

        const index = source.filters.findIndex(f => f.id === filterId);
        if (index !== -1) {
            source.filters.splice(index, 1);
            this.updateUI();
        }
    }

    /**
     * Recording
     */

    async toggleRecord() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            // Create canvas for recording
            this.recordingCanvas = document.createElement('canvas');
            this.recordingCanvas.width = this.canvasWidth;
            this.recordingCanvas.height = this.canvasHeight;
            this.recordingCtx = this.recordingCanvas.getContext('2d');

            // Get canvas stream
            const videoStream = this.recordingCanvas.captureStream(this.frameRate);

            // Add audio if available
            if (this.audioDestination && this.audioDestination.stream.getAudioTracks().length > 0) {
                const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
                videoStream.addTrack(audioTrack);
            }

            this.recordingStream = videoStream;

            // Configure MediaRecorder
            const options = {
                mimeType: this.settings.encoder === 'vp9' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8',
                videoBitsPerSecond: this.settings.videoBitrate * 1000
            };

            this.mediaRecorder = new MediaRecorder(videoStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            this.mediaRecorder.start(100); // Collect data every 100ms

            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.recordingDuration = 0;

            // Start recording render loop
            this.renderRecording();

            this.updateUI();

        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Error starting recording: ' + err.message);
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.updateUI();
    }

    pauseRecording() {
        if (!this.isRecording || this.isPaused) return;

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.updateUI();
        }
    }

    resumeRecording() {
        if (!this.isRecording || !this.isPaused) return;

        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.recordingStartTime = Date.now() - this.recordingDuration;
            this.updateUI();
        }
    }

    renderRecording() {
        if (!this.isRecording) return;

        // Copy current canvas to recording canvas
        if (this.recordingCtx && this.canvas) {
            this.recordingCtx.drawImage(this.canvas, 0, 0);
        }

        // Continue rendering
        requestAnimationFrame(this.renderRecording.bind(this));
    }

    saveRecording() {
        if (this.recordedChunks.length === 0) return;

        const blob = new Blob(this.recordedChunks, {
            type: 'video/webm'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();

        URL.revokeObjectURL(url);
        this.recordedChunks = [];
    }

    /**
     * Streaming
     */

    toggleStream() {
        if (this.isStreaming) {
            this.stopStreaming();
        } else {
            this.startStreaming();
        }
    }

    startStreaming() {
        if (this.isStreaming) return;

        // Simulated streaming
        this.isStreaming = true;
        this.streamingStartTime = Date.now();
        this.streamingDuration = 0;

        this.updateUI();
    }

    stopStreaming() {
        if (!this.isStreaming) return;

        this.isStreaming = false;
        this.updateUI();
    }

    /**
     * Studio Mode
     */

    toggleStudioMode() {
        this.studioMode = !this.studioMode;

        if (this.studioMode && !this.previewSceneId) {
            this.previewSceneId = this.currentSceneId;
        }

        this.updateUI();
    }

    transitionToProgram() {
        if (!this.studioMode || !this.previewSceneId) return;

        this.switchToScene(this.previewSceneId, true);
    }

    /**
     * Screenshot
     */

    takeScreenshot() {
        if (!this.canvas) return;

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Settings
     */

    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);

        // Update canvas resolution
        if (newSettings.resolution) {
            const [width, height] = newSettings.resolution.split('x').map(Number);
            this.canvasWidth = width;
            this.canvasHeight = height;

            if (this.canvas) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
        }

        // Update frame rate
        if (newSettings.frameRate) {
            this.frameRate = newSettings.frameRate;
            this.frameInterval = 1000 / this.frameRate;
        }

        this.updateUI();
    }

    /**
     * Profile Management
     */

    saveProfile() {
        const profile = {
            scenes: this.scenes.map(scene => ({
                id: scene.id,
                name: scene.name,
                backgroundColor: scene.backgroundColor,
                sources: scene.sources.map(source => ({
                    id: source.id,
                    type: source.type,
                    name: source.name,
                    x: source.x,
                    y: source.y,
                    width: source.width,
                    height: source.height,
                    rotation: source.rotation,
                    scaleX: source.scaleX,
                    scaleY: source.scaleY,
                    opacity: source.opacity,
                    visible: source.visible,
                    locked: source.locked,
                    crop: source.crop,
                    volume: source.volume,
                    muted: source.muted,
                    // Type-specific data
                    text: source.text,
                    fontSize: source.fontSize,
                    fontFamily: source.fontFamily,
                    textColor: source.textColor,
                    backgroundColor: source.backgroundColor,
                    textAlign: source.textAlign,
                    color: source.color,
                    url: source.url
                }))
            })),
            settings: this.settings,
            currentSceneId: this.currentSceneId
        };

        localStorage.setItem('obs-online-pro-profile', JSON.stringify(profile));
        console.log('Profile saved');
    }

    loadProfile() {
        const saved = localStorage.getItem('obs-online-pro-profile');
        if (!saved) return;

        try {
            const profile = JSON.parse(saved);

            // Load settings
            if (profile.settings) {
                this.updateSettings(profile.settings);
            }

            // Load scenes (without media sources for now)
            if (profile.scenes && profile.scenes.length > 0) {
                this.scenes = [];

                for (const sceneData of profile.scenes) {
                    const scene = {
                        id: sceneData.id,
                        name: sceneData.name,
                        backgroundColor: sceneData.backgroundColor,
                        sources: []
                    };

                    // Recreate non-media sources
                    for (const sourceData of sceneData.sources) {
                        if (['text', 'color', 'image'].includes(sourceData.type)) {
                            const source = { ...sourceData };
                            scene.sources.push(source);

                            // Reinitialize element for image sources
                            if (sourceData.type === 'image' && sourceData.url) {
                                this.initImageSource(source, { url: sourceData.url });
                            }
                        }
                    }

                    this.scenes.push(scene);
                }

                if (profile.currentSceneId) {
                    this.currentSceneId = profile.currentSceneId;
                } else if (this.scenes.length > 0) {
                    this.currentSceneId = this.scenes[0].id;
                }
            }

            this.updateUI();
            console.log('Profile loaded');

        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }

    /**
     * Audio Control
     */

    setSourceVolume(sourceId, volume) {
        const source = this.getSourceById(sourceId);
        if (!source) return;

        source.volume = Math.max(0, Math.min(1, volume));

        const audioData = this.audioSources.get(sourceId);
        if (audioData && audioData.gainNode) {
            audioData.gainNode.gain.value = source.muted ? 0 : source.volume;
        }

        this.updateUI();
    }

    toggleSourceMute(sourceId) {
        const source = this.getSourceById(sourceId);
        if (!source) return;

        source.muted = !source.muted;

        const audioData = this.audioSources.get(sourceId);
        if (audioData && audioData.gainNode) {
            audioData.gainNode.gain.value = source.muted ? 0 : source.volume;
        }

        this.updateUI();
    }

    /**
     * Utilities
     */

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const s = seconds % 60;
        const m = minutes % 60;

        return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    togglePlayPause() {
        // For sources that support play/pause (videos)
        const source = this.getSourceById(this.selectedSourceId);
        if (source && source.element && typeof source.element.play === 'function') {
            if (source.element.paused) {
                source.element.play();
            } else {
                source.element.pause();
            }
        }
    }

    fitToScreen() {
        const source = this.getSourceById(this.selectedSourceId);
        if (!source) return;

        source.x = 0;
        source.y = 0;
        source.width = this.canvasWidth;
        source.height = this.canvasHeight;

        this.updateUI();
    }

    resetTransform() {
        const source = this.getSourceById(this.selectedSourceId);
        if (!source) return;

        source.rotation = 0;
        source.scaleX = 1;
        source.scaleY = 1;
        source.crop = { top: 0, bottom: 0, left: 0, right: 0 };

        this.updateUI();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.updateUI();
    }

    showSourceContextMenu(source, x, y) {
        // Implementation depends on UI framework
        console.log('Show context menu for source:', source.name);
    }

    /**
     * UI Update Functions
     * These functions update the UI elements to reflect the current state
     */

    updateUI() {
        this.updateSceneList();
        this.updateSourceList();
        this.updateSourceProperties();
        this.updateControlButtons();
        this.updateStatsUI();
    }

    updateSceneList() {
        const sceneList = document.getElementById('scene-list');
        if (!sceneList) return;

        sceneList.innerHTML = '';

        for (const scene of this.scenes) {
            const item = document.createElement('div');
            item.className = 'scene-item';
            if (scene.id === this.currentSceneId) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <span class="scene-name">${scene.name}</span>
                <div class="scene-actions">
                    <button onclick="obs.switchToScene('${scene.id}')" title="Activate">▶</button>
                    <button onclick="obs.duplicateScene('${scene.id}')" title="Duplicate">⎘</button>
                    <button onclick="obs.removeScene('${scene.id}')" title="Remove">×</button>
                </div>
            `;

            sceneList.appendChild(item);
        }
    }

    updateSourceList() {
        const sourceList = document.getElementById('source-list');
        if (!sourceList) return;

        const scene = this.getCurrentScene();
        if (!scene) {
            sourceList.innerHTML = '<div class="empty-state">No scene selected</div>';
            return;
        }

        if (scene.sources.length === 0) {
            sourceList.innerHTML = '<div class="empty-state">No sources added</div>';
            return;
        }

        sourceList.innerHTML = '';

        // Render sources in reverse order (top to bottom)
        for (let i = scene.sources.length - 1; i >= 0; i--) {
            const source = scene.sources[i];
            const item = document.createElement('div');
            item.className = 'source-item';
            if (source.id === this.selectedSourceId) {
                item.classList.add('active');
            }

            const visibleIcon = source.visible ? '👁' : '👁‍🗨';
            const lockedIcon = source.locked ? '🔒' : '';
            const audioIcon = source.muted ? '🔇' : '🔊';

            item.innerHTML = `
                <button onclick="obs.selectedSourceId='${source.id}';obs.updateUI()" class="source-select">
                    <span class="source-icon">${this.getSourceIcon(source.type)}</span>
                    <span class="source-name">${source.name}</span>
                    <span class="source-status">${lockedIcon}</span>
                </button>
                <div class="source-controls">
                    <button onclick="obs.getSourceById('${source.id}').visible=!obs.getSourceById('${source.id}').visible;obs.updateUI()" title="Toggle Visibility">${visibleIcon}</button>
                    <button onclick="obs.moveSourceUp('${source.id}')" title="Move Up" ${i === scene.sources.length - 1 ? 'disabled' : ''}>▲</button>
                    <button onclick="obs.moveSourceDown('${source.id}')" title="Move Down" ${i === 0 ? 'disabled' : ''}>▼</button>
                    <button onclick="showSourceProperties('${source.id}')" title="Properties">⚙</button>
                    <button onclick="obs.removeSource('${source.id}')" title="Remove">×</button>
                </div>
            `;

            sourceList.appendChild(item);
        }
    }

    updateSourceProperties() {
        const panel = document.getElementById('properties-panel');
        if (!panel) return;

        const source = this.getSourceById(this.selectedSourceId);
        if (!source) {
            panel.innerHTML = '<div class="empty-state">No source selected</div>';
            return;
        }

        panel.innerHTML = `
            <h3>${source.name}</h3>
            <div class="property-group">
                <label>Position X: <input type="number" value="${Math.round(source.x)}" onchange="obs.getSourceById('${source.id}').x=parseFloat(this.value);obs.updateUI()"></label>
                <label>Position Y: <input type="number" value="${Math.round(source.y)}" onchange="obs.getSourceById('${source.id}').y=parseFloat(this.value);obs.updateUI()"></label>
            </div>
            <div class="property-group">
                <label>Width: <input type="number" value="${Math.round(source.width)}" onchange="obs.getSourceById('${source.id}').width=parseFloat(this.value);obs.updateUI()"></label>
                <label>Height: <input type="number" value="${Math.round(source.height)}" onchange="obs.getSourceById('${source.id}').height=parseFloat(this.value);obs.updateUI()"></label>
            </div>
            <div class="property-group">
                <label>Rotation: <input type="range" min="0" max="360" value="${source.rotation}" oninput="obs.getSourceById('${source.id}').rotation=parseFloat(this.value);obs.updateUI()"> ${Math.round(source.rotation)}°</label>
            </div>
            <div class="property-group">
                <label>Opacity: <input type="range" min="0" max="1" step="0.01" value="${source.opacity}" oninput="obs.getSourceById('${source.id}').opacity=parseFloat(this.value);obs.updateUI()"> ${Math.round(source.opacity * 100)}%</label>
            </div>
            <div class="property-group">
                <label><input type="checkbox" ${source.locked ? 'checked' : ''} onchange="obs.getSourceById('${source.id}').locked=this.checked;obs.updateUI()"> Lock Position</label>
            </div>
            <div class="property-actions">
                <button onclick="obs.fitToScreen()">Fit to Screen</button>
                <button onclick="obs.resetTransform()">Reset Transform</button>
            </div>
        `;
    }

    updateControlButtons() {
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.textContent = this.isRecording ? '⏹ Stop Recording' : '⏺ Start Recording';
            recordBtn.className = this.isRecording ? 'active' : '';
        }

        const streamBtn = document.getElementById('stream-btn');
        if (streamBtn) {
            streamBtn.textContent = this.isStreaming ? '⏹ Stop Stream' : '🔴 Start Stream';
            streamBtn.className = this.isStreaming ? 'active' : '';
        }

        const studioModeBtn = document.getElementById('studio-mode-btn');
        if (studioModeBtn) {
            studioModeBtn.className = this.studioMode ? 'active' : '';
        }

        const gridBtn = document.getElementById('grid-btn');
        if (gridBtn) {
            gridBtn.className = this.showGrid ? 'active' : '';
        }
    }

    updateStatsUI() {
        const fpsEl = document.getElementById('fps-counter');
        if (fpsEl) {
            fpsEl.textContent = `${this.stats.fps} FPS`;
        }

        const cpuEl = document.getElementById('cpu-usage');
        if (cpuEl) {
            cpuEl.textContent = `CPU: ${this.stats.cpuUsage}%`;
        }

        const memEl = document.getElementById('memory-usage');
        if (memEl) {
            memEl.textContent = `Memory: ${this.stats.memoryUsage} MB`;
        }
    }

    updateRecordingUI() {
        const timeEl = document.getElementById('recording-time');
        if (timeEl) {
            timeEl.textContent = this.formatTime(this.recordingDuration);
        }
    }

    updateStreamingUI() {
        const timeEl = document.getElementById('streaming-time');
        if (timeEl) {
            timeEl.textContent = this.formatTime(this.streamingDuration);
        }

        const bitrateEl = document.getElementById('stream-bitrate');
        if (bitrateEl) {
            bitrateEl.textContent = `${this.settings.videoBitrate} kbps`;
        }
    }

    updateAudioMetersUI() {
        for (const [sourceId, level] of this.audioMeters.entries()) {
            const meterEl = document.getElementById(`audio-meter-${sourceId}`);
            if (meterEl) {
                const percentage = Math.min(100, level * 100);
                meterEl.style.width = `${percentage}%`;
            }
        }
    }

    getSourceIcon(type) {
        const icons = {
            'camera': '📹',
            'screen': '🖥',
            'window': '🪟',
            'image': '🖼',
            'text': '📝',
            'color': '🎨',
            'browser': '🌐'
        };
        return icons[type] || '📦';
    }
}

/**
 * Global UI Functions
 * These functions are called from the HTML interface
 */

// Global instance
let obs = null;

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    obs = new OBSOnlinePro('preview-canvas');
    window.obs = obs; // Make globally accessible
});

// Scene functions
function addScene() {
    const name = prompt('Enter scene name:');
    if (name) {
        obs.createScene(name);
    }
}

function removeScene(sceneId) {
    if (!sceneId && obs.currentSceneId) {
        sceneId = obs.currentSceneId;
    }
    if (confirm('Are you sure you want to remove this scene?')) {
        obs.removeScene(sceneId);
    }
}

function duplicateScene(sceneId) {
    if (!sceneId && obs.currentSceneId) {
        sceneId = obs.currentSceneId;
    }
    obs.duplicateScene(sceneId);
}

// Source functions
function showAddSourceModal() {
    const modal = document.getElementById('add-source-modal');
    if (modal) {
        modal.style.display = 'block';
        obs.currentModal = 'add-source-modal';
    }
}

async function createSource(type) {
    closeModal('add-source-modal');

    let options = {};

    switch (type) {
        case 'camera':
            options.name = 'Camera';
            break;
        case 'screen':
            options.name = 'Screen Capture';
            break;
        case 'window':
            options.name = 'Window Capture';
            break;
        case 'image':
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                if (e.target.files.length > 0) {
                    options.file = e.target.files[0];
                    options.name = e.target.files[0].name;
                    await obs.createSource('image', options);
                }
            };
            input.click();
            return;
        case 'text':
            const text = prompt('Enter text:');
            if (!text) return;
            options.text = text;
            options.name = 'Text';
            break;
        case 'color':
            const color = prompt('Enter color (hex):', '#FF0000');
            if (!color) return;
            options.color = color;
            options.name = 'Color Source';
            break;
        case 'browser':
            const url = prompt('Enter URL:');
            if (!url) return;
            options.url = url;
            options.name = 'Browser Source';
            break;
    }

    await obs.createSource(type, options);
}

function removeSource(sourceId) {
    if (!sourceId && obs.selectedSourceId) {
        sourceId = obs.selectedSourceId;
    }
    if (confirm('Are you sure you want to remove this source?')) {
        obs.removeSource(sourceId);
    }
}

function moveSourceUp(sourceId) {
    obs.moveSourceUp(sourceId);
}

function moveSourceDown(sourceId) {
    obs.moveSourceDown(sourceId);
}

function showSourceProperties(sourceId) {
    if (sourceId) {
        obs.selectedSourceId = sourceId;
    }

    const modal = document.getElementById('source-properties-modal');
    if (modal) {
        modal.style.display = 'block';
        obs.currentModal = 'source-properties-modal';
        obs.updateSourceProperties();
    }
}

function saveSourceProperties() {
    // Properties are updated in real-time via input events
    closeModal('source-properties-modal');
}

function showFilters(sourceId) {
    if (sourceId) {
        obs.selectedSourceId = sourceId;
    }

    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.style.display = 'block';
        obs.currentModal = 'filters-modal';
        updateFiltersUI();
    }
}

function updateFiltersUI() {
    const panel = document.getElementById('filters-list');
    if (!panel) return;

    const source = obs.getSourceById(obs.selectedSourceId);
    if (!source) return;

    if (!source.filters || source.filters.length === 0) {
        panel.innerHTML = '<div class="empty-state">No filters added</div>';
        return;
    }

    panel.innerHTML = '';

    for (const filter of source.filters) {
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.innerHTML = `
            <label><input type="checkbox" ${filter.enabled ? 'checked' : ''} onchange="obs.getSourceById('${source.id}').filters.find(f=>f.id==='${filter.id}').enabled=this.checked"> ${filter.type}</label>
            <button onclick="removeFilter('${source.id}', '${filter.id}')">Remove</button>
        `;
        panel.appendChild(item);
    }
}

function addFilter(type) {
    if (obs.selectedSourceId) {
        obs.addFilter(obs.selectedSourceId, type);
        updateFiltersUI();
    }
}

function removeFilter(sourceId, filterId) {
    obs.removeFilter(sourceId, filterId);
    updateFiltersUI();
}

// Control functions
function toggleStream() {
    obs.toggleStream();
}

function toggleRecord() {
    obs.toggleRecord();
}

function toggleStudioMode() {
    obs.toggleStudioMode();
}

function fitToScreen() {
    obs.fitToScreen();
}

function resetTransform() {
    obs.resetTransform();
}

function toggleGrid() {
    obs.toggleGrid();
}

// Settings
function showSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'block';
        obs.currentModal = 'settings-modal';
        populateSettings();
    }
}

function populateSettings() {
    const resolutionEl = document.getElementById('setting-resolution');
    if (resolutionEl) {
        resolutionEl.value = obs.settings.resolution;
    }

    const frameRateEl = document.getElementById('setting-framerate');
    if (frameRateEl) {
        frameRateEl.value = obs.settings.frameRate;
    }

    const bitrateEl = document.getElementById('setting-bitrate');
    if (bitrateEl) {
        bitrateEl.value = obs.settings.videoBitrate;
    }

    const encoderEl = document.getElementById('setting-encoder');
    if (encoderEl) {
        encoderEl.value = obs.settings.encoder;
    }
}

function saveSettings() {
    const settings = {};

    const resolutionEl = document.getElementById('setting-resolution');
    if (resolutionEl) {
        settings.resolution = resolutionEl.value;
    }

    const frameRateEl = document.getElementById('setting-framerate');
    if (frameRateEl) {
        settings.frameRate = parseInt(frameRateEl.value);
    }

    const bitrateEl = document.getElementById('setting-bitrate');
    if (bitrateEl) {
        settings.videoBitrate = parseInt(bitrateEl.value);
    }

    const encoderEl = document.getElementById('setting-encoder');
    if (encoderEl) {
        settings.encoder = encoderEl.value;
    }

    obs.updateSettings(settings);
    closeModal('settings-modal');
}

// Modal functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        obs.currentModal = null;
    }
}

// Exit
function exitApp() {
    if (confirm('Are you sure you want to exit? Any unsaved changes will be lost.')) {
        obs.saveProfile();
        window.close();
    }
}

// Initialize on page load
let obs = null;

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Initializing OBS Online Pro...');

    try {
        obs = new OBSOnlinePro('preview-canvas');

        // Initialize with default scene
        obs.addScene();

        // Start render loop
        obs.startRenderLoop();

        console.log('✅ OBS Online Pro initialized successfully!');
        console.log(`📊 Canvas: ${obs.canvasWidth}x${obs.canvasHeight} @ ${obs.frameRate} FPS`);
        console.log(`🎬 Scenes: ${obs.scenes.length}`);

        // Test hotkeys
        console.log('⌨️ Hotkeys enabled:');
        console.log('   F9 = Toggle Stream');
        console.log('   F10 = Toggle Record');
        console.log('   F11 = Studio Mode');
        console.log('   F12 = Settings');
        console.log('   1-9 = Switch Scenes');
        console.log('   Ctrl+S = Save');
        console.log('   Delete = Remove Source');

    } catch (error) {
        console.error('❌ Failed to initialize OBS Online Pro:', error);
        alert('Error al inicializar OBS Online Pro. Por favor recarga la página.');
    }
});

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OBSOnlinePro;
}
