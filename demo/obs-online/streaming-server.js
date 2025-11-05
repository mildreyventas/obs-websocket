#!/usr/bin/env node

/**
 * OBS Online - RTMP Streaming Server
 *
 * Este servidor recibe video del navegador via WebSocket
 * y lo reenvía a plataformas de streaming (YouTube, Twitch, Facebook) via RTMP
 * usando FFmpeg
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const http = require('http');

const PORT = 9000;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OBS Online Streaming Server - Use WebSocket on port ' + PORT);
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

let ffmpegProcess = null;
let streamConfig = null;

console.log('🚀 OBS Online Streaming Server starting...');

wss.on('connection', (ws) => {
    console.log('📡 Client connected');

    ws.on('message', (message) => {
        try {
            // Si es un mensaje de configuración (JSON)
            if (typeof message === 'string' || message instanceof String) {
                const data = JSON.parse(message);

                if (data.type === 'config') {
                    console.log('⚙️ Received streaming configuration');
                    streamConfig = data;
                    console.log('📺 Platform:', streamConfig.platform);
                    console.log('📡 RTMP URL:', streamConfig.rtmpUrl);
                    console.log('🔑 Stream Key:', streamConfig.streamKey.substring(0, 4) + '****');

                    ws.send(JSON.stringify({
                        type: 'config_received',
                        status: 'ok'
                    }));
                }
                else if (data.type === 'start_stream') {
                    console.log('▶️ Starting stream...');
                    startFFmpeg(ws);
                }
                else if (data.type === 'stop_stream') {
                    console.log('⏹️ Stopping stream...');
                    stopFFmpeg();
                    ws.send(JSON.stringify({
                        type: 'stream_stopped',
                        status: 'ok'
                    }));
                }
            }
            // Si es video data (Binary)
            else if (message instanceof Buffer) {
                // Enviar al proceso FFmpeg
                if (ffmpegProcess && ffmpegProcess.stdin.writable) {
                    ffmpegProcess.stdin.write(message);
                }
            }
        } catch (error) {
            console.error('❌ Error processing message:', error.message);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('📴 Client disconnected');
        stopFFmpeg();
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
    });

    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'OBS Online Streaming Server Ready'
    }));
});

function startFFmpeg(ws) {
    if (!streamConfig) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No stream configuration provided'
        }));
        return;
    }

    // Detener stream anterior si existe
    stopFFmpeg();

    const rtmpUrl = `${streamConfig.rtmpUrl}/${streamConfig.streamKey}`;

    console.log('🎬 Spawning FFmpeg process...');
    console.log('📡 Streaming to:', rtmpUrl.replace(streamConfig.streamKey, '****'));

    // Comando FFmpeg para recibir video WebM y enviarlo a RTMP
    const ffmpegArgs = [
        // Input desde stdin (pipe)
        '-i', 'pipe:0',

        // Video codec
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-b:v', streamConfig.bitrate ? `${streamConfig.bitrate}k` : '2500k',
        '-maxrate', streamConfig.bitrate ? `${streamConfig.bitrate}k` : '2500k',
        '-bufsize', streamConfig.bitrate ? `${streamConfig.bitrate * 2}k` : '5000k',
        '-pix_fmt', 'yuv420p',
        '-g', '60',
        '-keyint_min', '60',

        // Audio codec
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',

        // FPS
        '-r', streamConfig.fps || '30',

        // Output format
        '-f', 'flv',
        rtmpUrl
    ];

    ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.on('data', (data) => {
        console.log('FFmpeg stdout:', data.toString());
    });

    ffmpegProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.log('FFmpeg:', message);

        // Notificar al cliente sobre el progreso
        if (message.includes('frame=')) {
            ws.send(JSON.stringify({
                type: 'stream_status',
                status: 'streaming',
                message: 'Streaming active'
            }));
        }
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`⏹️ FFmpeg process exited with code ${code}`);
        ffmpegProcess = null;

        ws.send(JSON.stringify({
            type: 'stream_ended',
            code: code
        }));
    });

    ffmpegProcess.on('error', (error) => {
        console.error('❌ FFmpeg error:', error.message);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'FFmpeg error: ' + error.message
        }));
    });

    ws.send(JSON.stringify({
        type: 'stream_started',
        status: 'ok',
        message: 'Stream started successfully'
    }));
}

function stopFFmpeg() {
    if (ffmpegProcess) {
        console.log('⏹️ Stopping FFmpeg...');
        ffmpegProcess.stdin.end();
        ffmpegProcess.kill('SIGTERM');
        ffmpegProcess = null;
    }
}

// Manejo de cierre del servidor
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    stopFFmpeg();
    wss.close();
    server.close();
    process.exit(0);
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`✅ Streaming server listening on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🎬 Ready to stream to RTMP platforms`);
});
