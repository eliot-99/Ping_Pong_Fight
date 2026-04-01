// ============================================
// PING PONG GOAL - State of Art Final Edition
// ============================================

// Vercel API Configuration
const API_BASE = '/api';

// Database reference (null by default, only used for multiplayer via API)
let database = null;

// Check if running on Vercel (production) or local
const isVercel = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

let api = {
    async createRoom(roomCode, roomData) {
        try {
            const res = await fetch(`${API_BASE}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, ...roomData })
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to create room:', e);
            return { success: false, error: e.message };
        }
    },

    async getRoom(roomCode) {
        try {
            const res = await fetch(`${API_BASE}/rooms?code=${roomCode}`);
            return await res.json();
        } catch (e) {
            console.error('Failed to get room:', e);
            return { success: false, error: e.message };
        }
    },

    async updateRoom(roomCode, updates) {
        try {
            const res = await fetch(`${API_BASE}/rooms`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, ...updates })
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to update room:', e);
            return { success: false, error: e.message };
        }
    },

    async deleteRoom(roomCode) {
        try {
            const res = await fetch(`${API_BASE}/rooms?code=${roomCode}`, {
                method: 'DELETE'
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to delete room:', e);
            return { success: false, error: e.message };
        }
    }
};

// ============================================
// CANVAS POLYFILL FOR roundRect
// ============================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// ============================================
// AUDIO SYSTEM
// ============================================
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('AudioContext not available');
            }
        }
        // Resume context if suspended (browsers require user interaction)
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    },
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone(freq, duration, type = 'square', vol = 0.1) {
        if (!this.ctx) {
            if (!this.init()) return;
        }
        // Ensure context is running
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playJump() {
        this.playTone(200, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(300, 0.15, 'square', 0.12), 50);
        setTimeout(() => this.playTone(150, 0.1, 'square', 0.1), 100);
    },
    playSpring() {
        this.playTone(400, 0.08, 'square', 0.1);
        setTimeout(() => this.playTone(600, 0.06, 'square', 0.08), 40);
        setTimeout(() => this.playTone(300, 0.1, 'square', 0.08), 80);
    },
    playShoot() {
        this.playTone(800, 0.08, 'square', 0.12);
        setTimeout(() => this.playTone(1000, 0.1, 'square', 0.1), 30);
        setTimeout(() => this.playTone(600, 0.12, 'square', 0.08), 60);
    },
    playHit() {
        this.playTone(150, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.15), 100);
    },
    playBounce() {
        this.playTone(400, 0.1, 'square', 0.1);
        setTimeout(() => this.playTone(350, 0.08, 'square', 0.08), 50);
    },
    playScore() {
        this.playTone(880, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(1100, 0.2, 'square', 0.12), 100);
        setTimeout(() => this.playTone(1320, 0.3, 'square', 0.1), 200);
        setTimeout(() => this.playTone(1760, 0.4, 'square', 0.15), 300);
    },
    playMenuHover() { this.playTone(600, 0.05, 'square', 0.05); },
    playMenuClick() {
        this.playTone(880, 0.08, 'square', 0.1);
        setTimeout(() => this.playTone(1100, 0.1, 'square', 0.08), 50);
    },
    playGameStart() {
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'square', 0.15), i * 150);
        });
    },
    playGameOver() {
        [880, 698, 587, 494].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.4, 'sawtooth', 0.2), i * 300);
        });
    },
    playBirdHit() {
        this.playTone(200, 0.1, 'square', 0.1);
        this.playTone(150, 0.15, 'square', 0.1);
    },
    playWallBounce() {
        this.playTone(300, 0.08, 'square', 0.08);
    }
};

// ============================================
// GAME CONSTANTS - RESPONSIVE CANVAS
// ============================================
// Use window size for true full screen
let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight - 150; // Reserve space for HUD and controls
const GROUND_Y_RATIO = 0.82;
let GROUND_Y = CANVAS_HEIGHT * GROUND_Y_RATIO;

const WALL_WIDTH = 50;
const PLAYER_WIDTH = 85;
const PLAYER_HEIGHT = 90;
const PLAYER_SPEED = 8;
const JUMP_VELOCITY = -16;
const GRAVITY = 0.6;
const BALL_SPEED = 7;
const BALL_RADIUS = 12;
const RESPAWN_TIME = 1200;

// Movement boundaries (38% each side, 24% middle)
let LEFT_MAX_X = CANVAS_WIDTH * 0.36;
let RIGHT_MIN_X = CANVAS_WIDTH * 0.64;
let MIDDLE_START = CANVAS_WIDTH * 0.38;
let MIDDLE_END = CANVAS_WIDTH * 0.62;

// ============================================
// GAME STATE
// ============================================
let gameState = {
    roomCode: null,
    playerId: null,
    isHost: false,
    gameTime: 5,
    difficulty: 'medium',
    gameStarted: false,
    gameEnded: false,
    timerInterval: null,
    remainingTime: 0,
    playAgainVotes: { left: false, right: false }
};

let localPlayer = {
    x: 150,
    y: 0,
    vx: 0,
    vy: 0,
    isJumping: false,
    isDead: false,
    respawnTime: 0,
    canLaunch: true,
    side: 'left',
    isAiming: false,
    aimDirection: null,
    launcherAngle: 0,
    targetLauncherAngle: 0,
    springOffset: 0,
    animFrame: 0
};

let remotePlayer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isJumping: false,
    isDead: false,
    respawnTime: 0,
    canLaunch: true,
    side: 'right',
    isAiming: false,
    aimDirection: null,
    launcherAngle: 0,
    springOffset: 0,
    animFrame: 0
};

let localBall = null;
let remoteBall = null;
let birds = [];
let clouds = [];
let particles = [];
let keys = {};
let animationId = null;
let lastTime = 0;
let isSinglePlayer = false;

let aiState = {
    targetX: 0,
    moveSpeed: 5,
    shootCooldown: 0,
    dodgeCooldown: 0,
    aimTimer: 0,
    isAiming: false,
    aimDirection: 'up',
    launcherAngle: 0,
    targetLauncherAngle: 0,
    springOffset: 0,
    difficulty: 0.92
};

// Key state tracking for controls
let keyState = {
    up: false,
    down: false,
    upPressedTime: 0,
    downPressedTime: 0
};

// ============================================
// INITIALIZATION
// ============================================
function initCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return false;
    }

    const gameFrame = document.querySelector('.game-frame');
    const crtFrame = document.querySelector('.crt-frame');

    // Get the actual displayed size of the game frame
    let width, height;
    if (crtFrame) {
        const rect = crtFrame.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
    } else if (gameFrame) {
        const rect = gameFrame.getBoundingClientRect();
        width = rect.width;
        height = rect.height - 140; // Subtract HUD + controls
    } else {
        width = window.innerWidth;
        height = window.innerHeight - 140;
    }

    // Ensure minimum size
    if (width < 400) width = window.innerWidth;
    if (height < 300) height = window.innerHeight - 140;

    // Update dimensions based on actual container size
    CANVAS_WIDTH = Math.max(width, 800);
    CANVAS_HEIGHT = Math.max(height, 600);
    GROUND_Y = CANVAS_HEIGHT * GROUND_Y_RATIO;

    LEFT_MAX_X = CANVAS_WIDTH * 0.36;
    RIGHT_MIN_X = CANVAS_WIDTH * 0.64;
    MIDDLE_START = CANVAS_WIDTH * 0.38;
    MIDDLE_END = CANVAS_WIDTH * 0.62;

    // Set initial positions
    localPlayer.x = CANVAS_WIDTH * 0.15;
    localPlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;
    remotePlayer.x = CANVAS_WIDTH * 0.85 - PLAYER_WIDTH;
    remotePlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;

    aiState.targetX = CANVAS_WIDTH * 0.85 - PLAYER_WIDTH;

    // Critical: Set canvas width/height attributes (not just CSS)
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Verify context exists
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas 2D context!');
        return false;
    }

    ctx.imageSmoothingEnabled = false;
    return true;
}

// ============================================
// SCREEN NAVIGATION
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMenu() { showScreen('menuScreen'); }
function showGenerateRoom() { AudioSys.playMenuClick(); showScreen('generateScreen'); }
function showEnterRoom() {
    AudioSys.playMenuClick();
    showScreen('enterRoomScreen');
    document.getElementById('joinMessage').textContent = '';
    document.getElementById('roomCodeInput').value = '';
}

function showMultiplayerMenu() {
    AudioSys.playMenuClick();
    showScreen('multiplayerMenuScreen');
}

function showDifficultyScreen() {
    AudioSys.playMenuClick();
    showScreen('difficultyScreen');
}

function selectDifficulty(difficulty) {
    AudioSys.playMenuClick();
    gameState.difficulty = difficulty;

    // Update description based on selection
    const descEl = document.getElementById('difficultyDescription');
    const descriptions = {
        easy: 'Slower opponent, easier to score!',
        medium: 'Balanced challenge for casual play.',
        hard: 'Fast and smart - for experienced players!'
    };
    descEl.textContent = descriptions[difficulty];

    setTimeout(() => {
        showScreen('singlePlayerTimeScreen');
    }, 300);
}

function updateSinglePlayerTime(value) {
    document.getElementById('spTimeDisplay').textContent = value;
    gameState.gameTime = parseInt(value);
}

function updateTimeDisplay(value) {
    document.getElementById('timeDisplay').textContent = value;
    gameState.gameTime = parseInt(value);
}

// ============================================
// SINGLE PLAYER MODE
// ============================================
function startSinglePlayerGame() {
    startSinglePlayer(gameState.difficulty, gameState.gameTime);
}

function startSinglePlayer(difficulty = 'medium', gameTime = 5) {
    AudioSys.init();
    AudioSys.playMenuClick();
    AudioSys.playGameStart();
    isSinglePlayer = true;
    gameState.isHost = true;
    gameState.playerId = 'left';
    gameState.gameTime = gameTime;
    gameState.difficulty = difficulty;
    localPlayer.side = 'left';

    // Show game screen FIRST so canvas can get proper dimensions
    showScreen('gameScreen');

    // Small delay to ensure DOM is rendered
    setTimeout(() => {
        initCanvas();
        startGame();
    }, 50);

    // Reset and initialize remotePlayer (AI) completely
    remotePlayer.isDead = false;
    remotePlayer.canLaunch = true;
    remotePlayer.isAiming = false;
    remotePlayer.aimDirection = null;
    remotePlayer.launcherAngle = 0;
    remotePlayer.targetLauncherAngle = 0;
    remotePlayer.animFrame = 0;
    remotePlayer.side = 'right';
    remotePlayer.x = CANVAS_WIDTH * 0.85 - PLAYER_WIDTH;
    remotePlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;
    remotePlayer.vx = 0;
    remotePlayer.vy = 0;
    remotePlayer.isJumping = false;

    // Reset local player
    localPlayer.isDead = false;
    localPlayer.canLaunch = true;
    localPlayer.isAiming = false;
    localPlayer.aimDirection = null;
    localPlayer.launcherAngle = 0;
    localPlayer.targetLauncherAngle = 0;
    localPlayer.animFrame = 0;
    localPlayer.x = CANVAS_WIDTH * 0.15;
    localPlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;
    localPlayer.vx = 0;
    localPlayer.vy = 0;
    localPlayer.isJumping = false;

    // AI difficulty settings
    const difficultySettings = {
        easy: { moveSpeed: 3, shootCooldown: 120, dodgeCooldown: 90, missChance: 0.25, predictionEnabled: false },
        medium: { moveSpeed: 5, shootCooldown: 80, dodgeCooldown: 60, missChance: 0.12, predictionEnabled: true },
        hard: { moveSpeed: 7, shootCooldown: 45, dodgeCooldown: 35, missChance: 0.05, predictionEnabled: true }
    };
    const settings = difficultySettings[difficulty] || difficultySettings.medium;

    aiState = {
        targetX: CANVAS_WIDTH * 0.85 - PLAYER_WIDTH,
        moveSpeed: settings.moveSpeed,
        shootCooldown: settings.shootCooldown,
        shootCooldownMax: settings.shootCooldown,
        dodgeCooldown: settings.dodgeCooldown,
        dodgeCooldownMax: settings.dodgeCooldown,
        aimTimer: 0,
        isAiming: false,
        aimDirection: 'up',
        launcherAngle: 0,
        targetLauncherAngle: 0,
        springOffset: Math.random() * Math.PI * 2,
        difficulty: difficulty,
        missChance: settings.missChance,
        predictionEnabled: settings.predictionEnabled
    };

    localPlayer.springOffset = Math.random() * Math.PI * 2;
    remotePlayer.springOffset = Math.random() * Math.PI * 2;

    birds = generateBirds();
    clouds = generateClouds();
    particles = [];
    localBall = null;
    remoteBall = null;

    // Reset keys
    keys = {};
    keyState = { up: false, down: false, upPressedTime: 0, downPressedTime: 0 };

    startGame();
}

// ============================================
// AI LOGIC - IMPROVED AND ALIVE
// ============================================
function updateAI() {
    if (!isSinglePlayer || gameState.gameEnded) return;

    const ai = remotePlayer;
    const player = localPlayer;

    // Respawn
    if (ai.isDead) {
        if (performance.now() > ai.respawnTime) {
            ai.isDead = false;
            ai.y = GROUND_Y - PLAYER_HEIGHT - 60;
            ai.vy = 0;
            ai.canLaunch = true;
            ai.springOffset = Math.random() * Math.PI * 2;
        }
        return;
    }

    // Decrease cooldowns
    if (aiState.shootCooldown > 0) aiState.shootCooldown--;
    if (aiState.dodgeCooldown > 0) aiState.dodgeCooldown--;

    // Spring idle animation
    ai.springOffset += 0.08;

    updateAIMovement(ai, player);

    ai.vy += GRAVITY;
    ai.y += ai.vy;

    if (ai.y >= GROUND_Y - PLAYER_HEIGHT - 60) {
        ai.y = GROUND_Y - PLAYER_HEIGHT - 60;
        ai.vy = 0;
        ai.isJumping = false;
    }

    updateAIShooting(ai, player);
    updateAIBall();

    // Smooth launcher rotation
    ai.launcherAngle += (aiState.targetLauncherAngle - ai.launcherAngle) * 0.15;

    ai.animFrame += 0.12;
}

function updateAIMovement(ai, player) {
    const playerBall = localBall;
    let targetX = CANVAS_WIDTH * 0.8;

    // Only use ball prediction on medium/hard difficulty
    if (playerBall && playerBall.vx > 0 && aiState.predictionEnabled) {
        const timeToReach = Math.abs((ai.x - playerBall.x) / playerBall.vx);
        const predictedY = playerBall.y + playerBall.vy * timeToReach;

        // Dodge if ball is coming and will be at player height
        if (predictedY > GROUND_Y - 140 && !ai.isJumping && aiState.dodgeCooldown <= 0) {
            ai.vy = JUMP_VELOCITY - 2;
            ai.isJumping = true;
            AudioSys.playSpring();
            aiState.dodgeCooldown = aiState.dodgeCooldownMax;
        }

        targetX = playerBall.x > CANVAS_WIDTH * 0.5 ? CANVAS_WIDTH * 0.75 : CANVAS_WIDTH * 0.9;
    } else {
        const playerInRight = player.x > CANVAS_WIDTH * 0.5;
        if (playerInRight) {
            targetX = CANVAS_WIDTH * 0.75;
        } else {
            targetX = CANVAS_WIDTH * 0.85;
        }
    }

    targetX = Math.max(RIGHT_MIN_X, Math.min(targetX, CANVAS_WIDTH - WALL_WIDTH - PLAYER_WIDTH - 20));

    const dx = targetX - ai.x;
    // Use reaction threshold based on difficulty
    const reactionThreshold = aiState.difficulty === 'easy' ? 25 : 15;
    if (Math.abs(dx) > reactionThreshold) {
        const speed = aiState.moveSpeed;
        ai.x += dx > 0 ? speed : -speed;
    }
}

function updateAIShooting(ai, player) {
    if (!ai.canLaunch || aiState.shootCooldown > 0) return;

    const distance = Math.abs(player.x - ai.x);

    // Shooting frequency based on difficulty
    const shootChance = aiState.difficulty === 'easy' ? 0.015 :
                        aiState.difficulty === 'medium' ? 0.025 : 0.035;

    if (distance < CANVAS_WIDTH * 0.7 && Math.random() < shootChance) {
        // Determine aim direction - harder difficulties aim better
        let aimDir;
        if (aiState.difficulty === 'easy') {
            // Easy: random aim
            aimDir = Math.random() > 0.5 ? 'down' : 'up';
        } else if (aiState.difficulty === 'medium') {
            // Medium: some logic but not perfect
            aimDir = player.y < GROUND_Y - 200 ? 'down' : 'up';
        } else {
            // Hard: always aim at player
            aimDir = player.y < GROUND_Y - 180 ? 'down' : 'up';
        }

        aiState.isAiming = true;
        aiState.aimDirection = aimDir;
        aiState.targetLauncherAngle = aiState.aimDirection === 'up' ? -0.5 : 0.5;

        // Show aim line briefly then fire
        setTimeout(() => {
            if (aiState.isAiming) {
                // Check miss chance
                if (Math.random() < aiState.missChance) {
                    // Miss! Shoot in wrong direction
                    aimDir = aimDir === 'up' ? 'down' : 'up';
                }
                fireAIBall(ai, aimDir);
                aiState.isAiming = false;
                aiState.targetLauncherAngle = 0;
                aiState.shootCooldown = aiState.shootCooldownMax + Math.random() * 20;
            }
        }, 300 + Math.random() * 400);
    }
}

function fireAIBall(ai, direction) {
    AudioSys.playShoot();

    const barrelLength = 45;
    const angle = direction === 'up' ? -0.5 : 0.5;
    const startX = ai.x + 10 - Math.cos(angle) * barrelLength;
    const startY = ai.y + 35 + Math.sin(angle) * barrelLength;

    const vx = -BALL_SPEED;
    const vy = direction === 'up' ? -7 : 7;

    remoteBall = {
        x: startX,
        y: startY,
        vx: vx,
        vy: vy,
        owner: 'right'
    };

    ai.canLaunch = false;
    createParticles(startX, startY, '#a855f7', 10);
}

function updateAIBall() {
    if (!remoteBall) {
        remotePlayer.canLaunch = true;
        return;
    }

    remoteBall.x += remoteBall.vx;
    remoteBall.y += remoteBall.vy;

    if (remoteBall.y - BALL_RADIUS <= 0) {
        remoteBall.vy = -remoteBall.vy * 0.9;
        remoteBall.y = BALL_RADIUS;
        AudioSys.playBounce();
    }

    if (remoteBall.y + BALL_RADIUS >= GROUND_Y) {
        remoteBall.vy = -remoteBall.vy * 0.85;
        remoteBall.y = GROUND_Y - BALL_RADIUS;
        AudioSys.playBounce();
    }

    if (remoteBall.x - BALL_RADIUS <= WALL_WIDTH) {
        remoteBall = null;
        remotePlayer.canLaunch = true;
        return;
    }

    if (remoteBall.x + BALL_RADIUS >= CANVAS_WIDTH - WALL_WIDTH) {
        remoteBall = null;
        remotePlayer.canLaunch = true;
        return;
    }

    if (!localPlayer.isDead && rectCircleCollision(localPlayer.x, localPlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT,
                            remoteBall.x, remoteBall.y, BALL_RADIUS)) {
        handleAIHitPlayer();
    }
}

function handleAIHitPlayer() {
    AudioSys.playHit();
    createParticles(localPlayer.x + PLAYER_WIDTH/2, localPlayer.y + PLAYER_HEIGHT/2, '#ef4444', 15);
    localPlayer.isDead = true;
    localPlayer.respawnTime = performance.now() + RESPAWN_TIME;

    const aiScoreEl = document.getElementById('rightScore');
    aiScoreEl.textContent = parseInt(aiScoreEl.textContent) + 1;

    remoteBall = null;
    remotePlayer.canLaunch = true;
}

// ============================================
// ROOM MANAGEMENT
// ============================================
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generateRoom() {
    AudioSys.playMenuClick();

    gameState.roomCode = generateRoomCode();
    gameState.isHost = true;
    gameState.playerId = 'left';
    gameState.gameTime = parseInt(document.getElementById('timeDisplay').textContent) || 5;
    localPlayer.side = 'left';

    document.getElementById('roomCodeDisplay').textContent = gameState.roomCode;
    showScreen('waitingScreen');

    // Create room via API - with complete left player data
    api.createRoom(gameState.roomCode, {
        gameTime: gameState.gameTime,
        gameStarted: false,
        gameEnded: false,
        left: { 
            x: CANVAS_WIDTH * 0.15,
            y: GROUND_Y - PLAYER_HEIGHT - 60,
            score: 0, 
            connected: true, 
            playAgain: false,
            isDead: false
        },
        right: { 
            x: CANVAS_WIDTH * 0.85 - PLAYER_WIDTH,
            y: GROUND_Y - PLAYER_HEIGHT - 60,
            score: 0, 
            connected: false, 
            playAgain: false,
            isDead: false
        },
        timer: gameState.gameTime * 60,
        createdAt: Date.now()
    }).then(result => {
        if (!result.success) {
            alert('Failed to create room: ' + result.error);
            showMenu();
            return;
        }

        console.log('✓ Room created:', gameState.roomCode);

        // Poll for opponent connection
        gameState.roomPolling = setInterval(async () => {
            try {
                const roomData = await api.getRoom(gameState.roomCode);
                if (roomData && roomData.success && roomData.room) {
                    const right = roomData.room.right;
                    if (right && right.connected === true) {
                        console.log('✓ Guest connected! Preparing to start game...');
                        clearInterval(gameState.roomPolling);
                        
                        // Small delay to ensure guest has processed join confirmation
                        setTimeout(async () => {
                            // Update room to mark game as started
                            await api.updateRoom(gameState.roomCode, { gameStarted: true });
                            console.log('✓ Marked gameStarted=true in room');
                            
                            // Another small delay to let guest see the flag
                            setTimeout(() => {
                                resetForNewGame();
                                AudioSys.playGameStart();
                                startGame();
                            }, 200);
                        }, 300);
                    }
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 500); // Check every 500ms
    }).catch(err => {
        console.error('Failed to create room:', err);
        alert('Failed to create room');
        showMenu();
    });

    window.addEventListener('beforeunload', () => {
        if (gameState.roomCode && gameState.isHost) {
            api.deleteRoom(gameState.roomCode);
        }
    });
}

function joinRoom() {
    const code = document.getElementById('roomCodeInput').value.toUpperCase().trim();
    const msgEl = document.getElementById('joinMessage');

    if (code.length !== 6) {
        msgEl.textContent = 'Enter 6-character code!';
        msgEl.className = 'message error';
        return;
    }

    msgEl.textContent = 'Connecting...';
    msgEl.className = 'message';

    // Check if room exists via API
    api.getRoom(code).then(result => {
        if (!result.success || !result.room) {
            msgEl.textContent = 'Room not found!';
            msgEl.className = 'message error';
            return;
        }

        const room = result.room;
        const rightPlayer = room.right || {};
        
        if (rightPlayer.connected === true) {
            msgEl.textContent = 'Room is full!';
            msgEl.className = 'message error';
            return;
        }

        AudioSys.playMenuClick();

        gameState.roomCode = code;
        gameState.isHost = false;
        gameState.playerId = 'right';
        gameState.gameTime = room.gameTime || 5;
        localPlayer.side = 'right';

        msgEl.textContent = 'Joining...';
        msgEl.className = 'message success';

        // Update room to join as right player - preserve all other data
        api.updateRoom(code, {
            right: { 
                ...rightPlayer,
                connected: true, 
                score: 0, 
                playAgain: false,
                isDead: false
            }
        }).then(joinResult => {
            if (!joinResult.success) {
                msgEl.textContent = 'Failed to join room!';
                msgEl.className = 'message error';
                return;
            }

            console.log('✓ Successfully joined room:', code);
            
            // Load initial room state NOW, before waiting for game start
            api.getRoom(code).then(roomData => {
                if (roomData && roomData.success && roomData.room) {
                    // Store initial positions from room
                    if (roomData.room.left) {
                        localPlayer.x = roomData.room.left.x || CANVAS_WIDTH * 0.15;
                        localPlayer.y = roomData.room.left.y || (GROUND_Y - PLAYER_HEIGHT - 60);
                    }
                    console.log('✓ Loaded initial room state');
                }
                
                // Show waiting screen
                showScreen('waitingScreen');

                // NOW poll for game start signal from host
                gameState.roomPolling = setInterval(async () => {
                    try {
                        const roomData = await api.getRoom(code);
                        if (roomData && roomData.success && roomData.room) {
                            if (roomData.room.gameStarted === true && !gameState.gameStarted) {
                                console.log('✓ Host started game!');
                                clearInterval(gameState.roomPolling);
                                
                                resetForNewGame();
                                AudioSys.playGameStart();
                                startGame();
                            }
                        }
                    } catch (e) {
                        console.error('Polling error:', e);
                    }
                }, 500); // Check every 500ms
            }).catch(err => {
                console.error('Failed to load initial room state:', err);
                msgEl.textContent = 'Connection error!';
                msgEl.className = 'message error';
            });
        }).catch(err => {
            console.error('Failed to update room:', err);
            msgEl.textContent = 'Failed to join room!';
            msgEl.className = 'message error';
        });
    }).catch(err => {
        console.error('Failed to get room:', err);
        msgEl.textContent = 'Connection error!';
        msgEl.className = 'message error';
    });
}

function leaveRoom() {
    if (gameState.roomCode) {
        if (gameState.roomPolling) clearInterval(gameState.roomPolling);
        api.deleteRoom(gameState.roomCode);
    }
    resetGameState();
    showMenu();
}

function resetGameState() {
    gameState = {
        roomCode: null,
        playerId: null,
        isHost: false,
        gameTime: 5,
        gameStarted: false,
        gameEnded: false,
        timerInterval: null,
        remainingTime: 0,
        playAgainVotes: { left: false, right: false }
    };

    localPlayer = {
        x: CANVAS_WIDTH * 0.15,
        y: GROUND_Y - PLAYER_HEIGHT - 60,
        vx: 0,
        vy: 0,
        isJumping: false,
        isDead: false,
        respawnTime: 0,
        canLaunch: true,
        side: 'left',
        isAiming: false,
        aimDirection: null,
        launcherAngle: 0,
        targetLauncherAngle: 0,
        springOffset: Math.random() * Math.PI * 2,
        animFrame: 0
    };

    remotePlayer = {
        x: CANVAS_WIDTH * 0.85 - PLAYER_WIDTH,
        y: GROUND_Y - PLAYER_HEIGHT - 60,
        vx: 0,
        vy: 0,
        isJumping: false,
        isDead: false,
        respawnTime: 0,
        canLaunch: true,
        side: 'right',
        isAiming: false,
        aimDirection: null,
        launcherAngle: 0,
        springOffset: Math.random() * Math.PI * 2,
        animFrame: 0
    };

    localBall = null;
    remoteBall = null;
    birds = [];
    clouds = [];
    particles = [];
    keys = {};

    isSinglePlayer = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

function generateBirds() {
    const newBirds = [];
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#ef4444', '#3b82f6'];
    for (let i = 0; i < 6; i++) {
        newBirds.push({
            x: CANVAS_WIDTH * 0.1 + i * (CANVAS_WIDTH * 0.15),
            y: CANVAS_HEIGHT * 0.15 + Math.random() * (CANVAS_HEIGHT * 0.2),
            baseY: CANVAS_HEIGHT * 0.15 + Math.random() * (CANVAS_HEIGHT * 0.2),
            vx: (1 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
            vy: 0,
            frame: Math.random() * Math.PI * 2,
            wingSpeed: 0.08 + Math.random() * 0.08,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            wobbleAmount: 15 + Math.random() * 20,
            directionChangeTimer: Math.random() * 200,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 0.8 + Math.random() * 0.4
        });
    }
    return newBirds;
}

function generateClouds() {
    const newClouds = [];
    for (let i = 0; i < 10; i++) {
        newClouds.push({
            x: Math.random() * CANVAS_WIDTH * 1.5 - CANVAS_WIDTH * 0.25,
            y: CANVAS_HEIGHT * 0.05 + Math.random() * (CANVAS_HEIGHT * 0.18),
            baseY: CANVAS_HEIGHT * 0.05 + Math.random() * (CANVAS_HEIGHT * 0.18),
            speed: 0.3 + Math.random() * 0.5,
            baseSpeed: 0.3 + Math.random() * 0.5,
            size: CANVAS_WIDTH * 0.05 + Math.random() * (CANVAS_WIDTH * 0.04),
            opacity: 0.6 + Math.random() * 0.3,
            pulseSpeed: 0.01 + Math.random() * 0.02,
            pulsePhase: Math.random() * Math.PI * 2,
            driftOffset: Math.random() * Math.PI * 2,
            driftSpeed: 0.005 + Math.random() * 0.01
        });
    }
    return newClouds;
}

// ============================================
// GAME START
// ============================================
function startGame() {
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    gameState.remainingTime = gameState.gameTime * 60;
    gameState.playAgainVotes = { left: false, right: false };

    showScreen('gameScreen');
    
    // For multiplayer, add delay to ensure DOM is ready (like single player)
    const delayTime = isSinglePlayer ? 50 : 100;
    
    setTimeout(() => {
        // Initialize canvas
        const canvasInitSuccess = initCanvas();
        if (!canvasInitSuccess) {
            console.error('Canvas initialization failed!');
            alert('Graphics initialization failed');
            showMenu();
            return;
        }

        const canvas = document.getElementById('gameCanvas');
        if (!canvas || !canvas.getContext('2d')) {
            console.error('Canvas context failed!');
            alert('Graphics initialization failed');
            showMenu();
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Reset key states
        keyState = { up: false, down: false, upPressedTime: 0, downPressedTime: 0 };

        // Single player mode
        if (isSinglePlayer) {
            document.getElementById('leftScore').textContent = '0';
            document.getElementById('rightScore').textContent = '0';

            gameState.timerInterval = setInterval(() => {
                gameState.remainingTime--;
                updateTimerDisplay();
                if (gameState.remainingTime <= 0) endGame();
            }, 1000);

            updateTimerDisplay();
            startGameLoop();
            return;
        }

    // Multiplayer mode with API-based polling
    document.getElementById('leftScore').textContent = '0';
    document.getElementById('rightScore').textContent = '0';

    const opponentSide = gameState.playerId === 'left' ? 'right' : 'left';
    const SYNC_INTERVAL = 400; // Sync every 400ms for better responsiveness

    // Timer management
    if (gameState.isHost) {
        gameState.timerInterval = setInterval(() => {
            gameState.remainingTime--;
            updateTimerDisplay();
            
            // Update room timer
            api.updateRoom(gameState.roomCode, {
                timer: gameState.remainingTime,
                gameEnded: gameState.remainingTime <= 0
            });

            if (gameState.remainingTime <= 0) {
                endGame();
            }
        }, 1000);
    } else {
        // Non-host polls for timer
        gameState.timerInterval = setInterval(async () => {
            const result = await api.getRoom(gameState.roomCode);
            if (result.success && result.room) {
                gameState.remainingTime = result.room.timer || 0;
                updateTimerDisplay();
                
                if (gameState.remainingTime <= 0 && gameState.gameStarted && !gameState.gameEnded) {
                    endGame();
                }

                if (result.room.gameEnded && !gameState.gameEnded) {
                    endGame();
                }
            }
        }, 1000);
    }

    updateTimerDisplay();

    // Polling sync for opponent data
    gameState.syncPolling = setInterval(async () => {
        if (!gameState.gameStarted || gameState.gameEnded) return;

        const result = await api.getRoom(gameState.roomCode);
        if (!result.success || !result.room) return;

        const room = result.room;
        const opponentData = room[opponentSide];

        if (opponentData) {
            remotePlayer.x = opponentData.x || remotePlayer.x;
            remotePlayer.y = opponentData.y || remotePlayer.y;
            remotePlayer.isDead = opponentData.isDead || false;
            remotePlayer.isAiming = opponentData.isAiming || false;
            remotePlayer.aimDirection = opponentData.aimDirection || null;
            
            if (opponentData.aimDirection) {
                remotePlayer.targetLauncherAngle = opponentData.aimDirection === 'up' ? -0.6 : 0.6;
            } else {
                remotePlayer.targetLauncherAngle = 0;
            }

            if (opponentData.ball && opponentData.ball.owner !== gameState.playerId) {
                remoteBall = opponentData.ball;
            } else if (!opponentData.ball) {
                remoteBall = null;
            }

            // Update scores
            if (opponentData.score !== undefined) {
                updateScoreDisplay(opponentSide, opponentData.score);
            }

            // Check play again votes
            if (opponentData.playAgain && !gameState.playAgainVotes[opponentSide]) {
                gameState.playAgainVotes[opponentSide] = true;
                updatePlayAgainStatus();
            }
        }

        // Check if opponent left
        if (opponentData && opponentData.connected === false && gameState.gameStarted && !gameState.gameEnded) {
            console.warn('Opponent disconnected');
            alert('Opponent left the room!');
            exitGame();
        }
    }, SYNC_INTERVAL);

    startGameLoop();
        }, delayTime);
}

function startGameLoop() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        showMenu();
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        alert('Graphics error: Could not initialize canvas');
        showMenu();
        return;
    }

    lastTime = performance.now();
    gameLoop(ctx, canvas);
}

function gameLoop(ctx, canvas) {
    if (!gameState.gameStarted) return;

    const currentTime = performance.now();
    lastTime = currentTime;

    updateLocalPlayer();
    updateLocalBall();
    updateBirds();
    updateClouds();
    updateParticles();
    checkCollisions();

    if (isSinglePlayer) {
        updateAI();
    }

    if (!isSinglePlayer) {
        syncToDatabase();
    }

    draw(ctx, canvas);

    animationId = requestAnimationFrame(() => gameLoop(ctx, canvas));
}

// ============================================
// PLAYER UPDATE - FIXED CONTROLS
// ============================================
function updateLocalPlayer() {
    if (localPlayer.isDead) {
        if (performance.now() > localPlayer.respawnTime) {
            localPlayer.isDead = false;
            localPlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;
            localPlayer.canLaunch = true;
            localPlayer.isAiming = false;
            localPlayer.aimDirection = null;
        }
        return;
    }

    // Movement - Left/Right arrows
    localPlayer.vx = 0;
    if (keys['ArrowLeft']) {
        localPlayer.vx = -PLAYER_SPEED;
    }
    if (keys['ArrowRight']) {
        localPlayer.vx = PLAYER_SPEED;
    }

    localPlayer.x += localPlayer.vx;

    // Boundary checks - stay in 38% zone
    if (localPlayer.side === 'left') {
        localPlayer.x = Math.max(WALL_WIDTH + 20, Math.min(localPlayer.x, LEFT_MAX_X));
    } else {
        localPlayer.x = Math.max(RIGHT_MIN_X, Math.min(localPlayer.x, CANVAS_WIDTH - WALL_WIDTH - PLAYER_WIDTH - 20));
    }

    // Spring idle animation
    localPlayer.springOffset += 0.06;

    // Jump - Space key
    if (keys[' '] && !localPlayer.isJumping) {
        const onGround = localPlayer.y >= GROUND_Y - PLAYER_HEIGHT - 65;
        if (onGround) {
            localPlayer.vy = JUMP_VELOCITY;
            localPlayer.isJumping = true;
            AudioSys.playSpring();
            AudioSys.playJump();
            createParticles(localPlayer.x + PLAYER_WIDTH/2, GROUND_Y, '#9ca3af', 6);
        }
    }

    localPlayer.vy += GRAVITY;
    localPlayer.y += localPlayer.vy;

    if (localPlayer.y >= GROUND_Y - PLAYER_HEIGHT - 60) {
        localPlayer.y = GROUND_Y - PLAYER_HEIGHT - 60;
        localPlayer.vy = 0;
        localPlayer.isJumping = false;
    }

    if (localPlayer.y < 0) {
        localPlayer.y = 0;
        localPlayer.vy = 0;
    }

    // AIMING CONTROLS - FIXED
    // Up key: aim up when held, fire on release
    if (keys['ArrowUp'] && !keys['ArrowDown']) {
        if (!keyState.up) {
            keyState.up = true;
            keyState.upPressedTime = Date.now();
        }

        if (localPlayer.canLaunch) {
            localPlayer.isAiming = true;
            localPlayer.aimDirection = 'up';
            localPlayer.targetLauncherAngle = -0.6;
        }
    } else if (keyState.up) {
        // Up key released - FIRE!
        keyState.up = false;
        if (localPlayer.isAiming && localPlayer.aimDirection === 'up') {
            if (canLaunchFromPosition(localPlayer.x)) {
                launchBall('up');
            }
            localPlayer.isAiming = false;
            localPlayer.aimDirection = null;
            localPlayer.targetLauncherAngle = 0;
        }
    }

    // Down key: aim down when held, fire on release
    if (keys['ArrowDown'] && !keys['ArrowUp']) {
        if (!keyState.down) {
            keyState.down = true;
            keyState.downPressedTime = Date.now();
        }

        if (localPlayer.canLaunch) {
            localPlayer.isAiming = true;
            localPlayer.aimDirection = 'down';
            localPlayer.targetLauncherAngle = 0.6;
        }
    } else if (keyState.down) {
        // Down key released - FIRE!
        keyState.down = false;
        if (localPlayer.isAiming && localPlayer.aimDirection === 'down') {
            if (canLaunchFromPosition(localPlayer.x)) {
                launchBall('down');
            }
            localPlayer.isAiming = false;
            localPlayer.aimDirection = null;
            localPlayer.targetLauncherAngle = 0;
        }
    }

    // Smooth launcher rotation
    localPlayer.launcherAngle += (localPlayer.targetLauncherAngle - localPlayer.launcherAngle) * 0.2;

    localPlayer.animFrame += 0.15;
}

function canLaunchFromPosition(x) {
    if (localPlayer.side === 'left') {
        return x <= MIDDLE_START - 30;
    } else {
        return x >= MIDDLE_END + 30;
    }
}

// ============================================
// BALL PHYSICS
// ============================================
function launchBall(direction) {
    if (!localPlayer.canLaunch || localPlayer.isDead) return;

    AudioSys.playShoot();

    const isLeft = localPlayer.side === 'left';
    const angle = direction === 'up' ? -0.6 : 0.6;
    const barrelLength = 45;

    const startX = isLeft
        ? localPlayer.x + PLAYER_WIDTH - 15 + Math.cos(angle) * barrelLength
        : localPlayer.x + 15 - Math.cos(angle) * barrelLength;
    const startY = localPlayer.y + 35 + Math.sin(Math.abs(angle)) * barrelLength * (direction === 'up' ? -1 : 1);

    const vx = isLeft ? BALL_SPEED : -BALL_SPEED;
    const vy = direction === 'up' ? -8 : 8;

    localBall = {
        x: startX,
        y: startY,
        vx: vx,
        vy: vy,
        owner: localPlayer.side
    };

    localPlayer.canLaunch = false;

    const color = isLeft ? '#4ade80' : '#a855f7';
    createParticles(startX, startY, color, 10);
}

function updateLocalBall() {
    if (!localBall) {
        localPlayer.canLaunch = true;
        return;
    }

    localBall.x += localBall.vx;
    localBall.y += localBall.vy;

    if (localBall.y - BALL_RADIUS <= 0) {
        localBall.vy = -localBall.vy * 0.92;
        localBall.y = BALL_RADIUS;
        AudioSys.playBounce();
        createParticles(localBall.x, BALL_RADIUS, '#fff', 4);
    }

    if (localBall.y + BALL_RADIUS >= GROUND_Y) {
        localBall.vy = -localBall.vy * 0.87;
        localBall.y = GROUND_Y - BALL_RADIUS;
        AudioSys.playBounce();
        createParticles(localBall.x, GROUND_Y, '#5d4037', 3);
    }

    if (localBall.x - BALL_RADIUS <= WALL_WIDTH) {
        localBall = null;
        localPlayer.canLaunch = true;
        return;
    }

    if (localBall.x + BALL_RADIUS >= CANVAS_WIDTH - WALL_WIDTH) {
        localBall = null;
        localPlayer.canLaunch = true;
        return;
    }
}

// ============================================
// PARTICLES
// ============================================
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 3,
            life: 1.0,
            color: color,
            size: 4 + Math.random() * 6
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.life -= 0.025;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ============================================
// ENTITIES
// ============================================
function updateBirds() {
    birds.forEach(bird => {
        // Update frame for wing animation
        bird.frame += bird.wingSpeed;

        // Random direction changes
        bird.directionChangeTimer--;
        if (bird.directionChangeTimer <= 0) {
            bird.vx = (1 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1);
            bird.directionChangeTimer = 100 + Math.random() * 200;
        }

        // Move horizontally
        bird.x += bird.vx;

        // Vertical wobble (sine wave motion)
        bird.y = bird.baseY + Math.sin(bird.frame * 3) * bird.wobbleAmount;

        // Wrap around screen
        if (bird.x > CANVAS_WIDTH + 50) bird.x = -50;
        if (bird.x < -50) bird.x = CANVAS_WIDTH + 50;
    });
}

function updateClouds() {
    clouds.forEach(cloud => {
        // Move horizontally
        cloud.x += cloud.speed;

        // Vertical drift (slow sine wave)
        cloud.y = cloud.baseY + Math.sin(cloud.driftOffset) * 20;
        cloud.driftOffset += cloud.driftSpeed;

        // Pulsing opacity
        cloud.pulsePhase += cloud.pulseSpeed;
        cloud.opacity = 0.6 + Math.sin(cloud.pulsePhase) * 0.2;

        // Random speed variations
        if (Math.random() < 0.01) {
            cloud.speed = cloud.baseSpeed * (0.8 + Math.random() * 0.4);
        }

        // Wrap around screen
        if (cloud.x > CANVAS_WIDTH + cloud.size * 2) {
            cloud.x = -cloud.size * 2;
            cloud.y = CANVAS_HEIGHT * 0.05 + Math.random() * (CANVAS_HEIGHT * 0.18);
            cloud.baseY = cloud.y;
        }
        if (cloud.x < -cloud.size * 2) {
            cloud.x = CANVAS_WIDTH + cloud.size * 2;
        }
    });
}

// ============================================
// COLLISIONS
// ============================================
function checkCollisions() {
    if (!localBall) return;

    for (let bird of birds) {
        const dx = localBall.x - bird.x;
        const dy = localBall.y - bird.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BALL_RADIUS + 25) {
            AudioSys.playBirdHit();
            createParticles(bird.x, bird.y, bird.color, 8);
            localBall = null;
            localPlayer.canLaunch = true;
            return;
        }
    }

    if (!remotePlayer.isDead && rectCircleCollision(remotePlayer.x, remotePlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT,
                                   localBall.x, localBall.y, BALL_RADIUS)) {
        handleOpponentHit();
    }
}

function rectCircleCollision(rx, ry, rw, rh, cx, cy, cr) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= (cr * cr);
}

function handleOpponentHit() {
    AudioSys.playHit();
    AudioSys.playScore();

    createParticles(remotePlayer.x + PLAYER_WIDTH/2, remotePlayer.y + PLAYER_HEIGHT/2, '#ef4444', 15);

    if (isSinglePlayer) {
        remotePlayer.isDead = true;
        remotePlayer.respawnTime = performance.now() + RESPAWN_TIME;
        const leftScoreEl = document.getElementById('leftScore');
        leftScoreEl.textContent = parseInt(leftScoreEl.textContent) + 1;
        localBall = null;
        localPlayer.canLaunch = true;
        return;
    }

    // Update local score immediately
    const leftScoreEl = document.getElementById('leftScore');
    const rightScoreEl = document.getElementById('rightScore');
    
    if (gameState.playerId === 'left') {
        leftScoreEl.textContent = parseInt(leftScoreEl.textContent) + 1;
    } else {
        rightScoreEl.textContent = parseInt(rightScoreEl.textContent) + 1;
    }

    // Update opponent state in database
    const updateData = {
        [gameState.playerId === 'left' ? 'left' : 'right']: {
            score: parseInt(gameState.playerId === 'left' ? leftScoreEl.textContent : rightScoreEl.textContent)
        }
    };

    api.updateRoom(gameState.roomCode, updateData);

    localBall = null;
    localPlayer.canLaunch = true;
}

function syncToDatabase() {
    if (!gameState.roomCode) return;

    const playerData = {
        x: localPlayer.x,
        y: localPlayer.y,
        isDead: localPlayer.isDead,
        ball: localBall,
        isAiming: localPlayer.isAiming,
        aimDirection: localPlayer.aimDirection,
        connected: true
    };

    // Merge with opponent data using update
    const updateData = {};
    updateData[gameState.playerId] = playerData;
    
    api.updateRoom(gameState.roomCode, updateData);
}

// ============================================
// RENDERING - STATE OF ART
// ============================================
function draw(ctx, canvas) {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, '#0ea5e9');
    gradient.addColorStop(0.5, '#38bdf8');
    gradient.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    drawClouds(ctx);
    drawBirds(ctx);
    drawMiddleZone(ctx);
    drawWalls(ctx);
    drawGround(ctx);

    if (!localPlayer.isDead) {
        drawPlayer(ctx, localPlayer, true);
    }
    if (!remotePlayer.isDead) {
        drawPlayer(ctx, remotePlayer, false);
    }

    if (localBall) drawBall(ctx, localBall);
    if (remoteBall) drawBall(ctx, remoteBall);

    drawParticles(ctx);
}

function drawMiddleZone(ctx) {
    // Middle zone background - subtle
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    ctx.fillRect(MIDDLE_START, 0, MIDDLE_END - MIDDLE_START, GROUND_Y);

    // Animated border lines - NO TEXT
    const time = Date.now() / 500;
    const dashOffset = (time % 20);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -dashOffset;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(MIDDLE_START, 0);
    ctx.lineTo(MIDDLE_START, GROUND_Y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(MIDDLE_END, 0);
    ctx.lineTo(MIDDLE_END, GROUND_Y);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawClouds(ctx) {
    clouds.forEach(cloud => {
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = '#ffffff';

        // Draw main cloud body with multiple circles
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.35, cloud.y - cloud.size * 0.15, cloud.size * 0.45, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.35, cloud.y - cloud.size * 0.1, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.15, cloud.y + cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle shadow/depth
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(cloud.x - cloud.size * 0.2, cloud.y + cloud.size * 0.15, cloud.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });
}

function drawBirds(ctx) {
    birds.forEach(bird => {
        const size = bird.size;
        const wingOffset = Math.sin(bird.frame) * 8 * size;
        const direction = bird.vx > 0 ? 1 : -1;

        // Body
        ctx.fillStyle = bird.color;
        ctx.beginPath();
        ctx.ellipse(bird.x, bird.y, 18 * size, 12 * size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add body shading
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(bird.x + 3 * direction, bird.y + 2, 14 * size, 10 * size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(bird.x - 22 * size, bird.y + wingOffset);
        ctx.lineTo(bird.x - 10 * size, bird.y - 12 * size + wingOffset);
        ctx.lineTo(bird.x - 5 * size, bird.y + wingOffset);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(bird.x + 6 * size, bird.y + wingOffset);
        ctx.lineTo(bird.x + 10 * size, bird.y - 12 * size + wingOffset);
        ctx.lineTo(bird.x + 22 * size, bird.y + wingOffset);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(bird.x + (15 * direction * size), bird.y - 3 * size);
        ctx.lineTo(bird.x + (24 * direction * size), bird.y + 4 * size);
        ctx.lineTo(bird.x + (15 * direction * size), bird.y + 11 * size);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(bird.x + (6 * direction * size), bird.y - 4 * size, 3.5 * size, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bird.x + (5 * direction * size) - 1, bird.y - 5 * size - 1, 1.5 * size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawWalls(ctx) {
    const wallGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    wallGrad.addColorStop(0, '#4b5563');
    wallGrad.addColorStop(0.5, '#374151');
    wallGrad.addColorStop(1, '#1f2937');

    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, WALL_WIDTH, GROUND_Y);
    ctx.fillRect(CANVAS_WIDTH - WALL_WIDTH, 0, WALL_WIDTH, GROUND_Y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < GROUND_Y; y += 50) {
        ctx.fillRect(0, y, WALL_WIDTH, 4);
        ctx.fillRect(CANVAS_WIDTH - WALL_WIDTH, y, WALL_WIDTH, 4);
    }

    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 0, WALL_WIDTH, 10);
    ctx.fillRect(CANVAS_WIDTH - WALL_WIDTH, 0, WALL_WIDTH, 10);
}

function drawGround(ctx) {
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#5d4037');
    groundGrad.addColorStop(0.3, '#4e342e');
    groundGrad.addColorStop(1, '#3e2723');

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, GROUND_Y - 15, CANVAS_WIDTH, 15);

    ctx.fillStyle = '#22c55e';
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x, GROUND_Y - 12, 10, 10);
    }

    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, GROUND_Y - 4, CANVAS_WIDTH, 4);
}

// ============================================
// PLAYER DRAWING - ATTACHED SPRINGS & ROTATING LAUNCHER
// ============================================
function drawPlayer(ctx, player, isLocal) {
    const isLeft = player.side === 'left';
    const color = isLeft ? '#22c55e' : '#a855f7';
    const darkColor = isLeft ? '#15803d' : '#7c3aed';

    const x = player.x;
    const y = player.y;

    // Idle spring bounce - attached to player
    const idleBounce = Math.sin(player.springOffset) * 3;
    const springY = y + PLAYER_HEIGHT;

    // Draw springs ATTACHED to player bottom
    drawSpringAttached(ctx, x + 22, springY, idleBounce, color);
    drawSpringAttached(ctx, x + PLAYER_WIDTH - 22, springY, idleBounce, color);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + PLAYER_WIDTH/2, GROUND_Y - 8, PLAYER_WIDTH * 0.4, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, 22);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.roundRect(x + PLAYER_WIDTH - 18, y, 18, PLAYER_HEIGHT, 22);
    ctx.fill();

    // Belly
    ctx.fillStyle = isLeft ? '#4ade80' : '#c084fc';
    ctx.beginPath();
    ctx.ellipse(x + PLAYER_WIDTH/2, y + PLAYER_HEIGHT * 0.65, PLAYER_WIDTH * 0.38, PLAYER_HEIGHT * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // ROTATING LAUNCHER - Proper implementation
    drawRotatingLauncher(ctx, x, y, player.launcherAngle || 0, isLeft, color, darkColor);

    // Aim line from launcher if aiming
    if (player.isAiming && player.aimDirection) {
        drawAimLineFromLauncher(ctx, x, y, player.launcherAngle || 0, isLeft);
    }

    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + PLAYER_WIDTH/2, y - 8, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(x + PLAYER_WIDTH/2 + 10, y - 8, 24, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    drawEyes(ctx, x + PLAYER_WIDTH/2, y - 12, isLeft, player.isAiming);

    // Antennae
    drawAntennae(ctx, x + PLAYER_WIDTH/2, y - 38, color, darkColor);

    // Mouth
    drawMouth(ctx, x + PLAYER_WIDTH/2, y + 8, player.isAiming);

    // Cheeks
    ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    ctx.beginPath();
    ctx.arc(x + 18, y + 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + PLAYER_WIDTH - 18, y + 5, 10, 0, Math.PI * 2);
    ctx.fill();
}

// SPRINGS ATTACHED TO PLAYER BODY
function drawSpringAttached(ctx, x, y, bounceOffset, color) {
    const springLength = 50 + bounceOffset;
    const coils = 5;
    const coilHeight = springLength / coils;

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Gradient for 3D effect
    const grad = ctx.createLinearGradient(x - 8, y, x + 8, y + springLength);
    grad.addColorStop(0, '#9ca3af');
    grad.addColorStop(0.5, '#6b7280');
    grad.addColorStop(1, '#4b5563');
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < coils; i++) {
        const cy = y + (i + 0.5) * coilHeight;
        const offsetX = (i % 2 === 0) ? 10 : -10;
        ctx.lineTo(x + offsetX, cy);
        ctx.lineTo(x, y + (i + 1) * coilHeight);
    }

    ctx.stroke();

    // Spring base (on ground)
    ctx.fillStyle = '#374151';
    ctx.fillRect(x - 14, y + springLength - 4, 28, 10);

    // Highlight
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 3, y + springLength);
    ctx.stroke();
}

// ROTATING LAUNCHER - Proper pivot and rotation
function drawRotatingLauncher(ctx, px, py, angle, isLeft, color, darkColor) {
    const pivotX = isLeft ? px + PLAYER_WIDTH - 20 : px + 20;
    const pivotY = py + 30;

    ctx.save();
    ctx.translate(pivotX, pivotY);

    // Rotate - flip for right side
    const rotation = isLeft ? angle : -angle;
    ctx.rotate(rotation);

    // Launcher arm (extends outward)
    const armLength = 50;
    const direction = isLeft ? 1 : -1;

    // Arm gradient
    const armGrad = ctx.createLinearGradient(0, -8, armLength * direction, 8);
    armGrad.addColorStop(0, '#6b7280');
    armGrad.addColorStop(0.5, '#4b5563');
    armGrad.addColorStop(1, '#374151');

    // Draw arm
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.roundRect(0, -8, armLength * direction, 16, 6);
    ctx.fill();

    // Barrel (at end of arm)
    const barrelWidth = 20;
    const barrelLength = 35;

    ctx.fillStyle = '#374151';
    ctx.fillRect((armLength - 5) * direction, -barrelWidth/2, barrelLength * direction, barrelWidth);

    // Barrel highlight
    ctx.fillStyle = '#6b7280';
    ctx.fillRect((armLength - 5) * direction, -barrelWidth/2 + 3, barrelLength * direction - 3, 4);

    // Barrel opening
    ctx.fillStyle = '#1f2937';
    ctx.fillRect((armLength + barrelLength - 8) * direction, -barrelWidth/2 + 2, 8 * direction, barrelWidth - 4);

    ctx.restore();

    // Pivot joint
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();
}

// AIM LINE FROM LAUNCHER BARREL
function drawAimLineFromLauncher(ctx, px, py, angle, isLeft) {
    const pivotX = isLeft ? px + PLAYER_WIDTH - 20 : px + 20;
    const pivotY = py + 30;

    const armLength = 50;
    const barrelLength = 35;
    const totalLength = armLength + barrelLength - 5;
    const direction = isLeft ? 1 : -1;
    const rotation = isLeft ? angle : -angle;

    // Calculate barrel tip position
    const tipX = pivotX + Math.cos(rotation) * totalLength * direction;
    const tipY = pivotY + Math.sin(rotation) * totalLength;

    // Draw aim line from barrel tip
    const maxDist = 250;
    const dotSpacing = 16;

    ctx.save();

    for (let i = 1; i <= 12; i++) {
        const dist = i * dotSpacing;
        if (dist > maxDist) break;

        const dotX = tipX + Math.cos(rotation) * dist * direction;
        const dotY = tipY + Math.sin(rotation) * dist;

        if (dotX < WALL_WIDTH || dotX > CANVAS_WIDTH - WALL_WIDTH) break;
        if (dotY < 0 || dotY > GROUND_Y) break;

        const alpha = 1 - (dist / maxDist);
        const size = 5 * alpha;

        // Glow
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, size + 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(255, 255, 50, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawEyes(ctx, cx, cy, isLeft, isAiming) {
    const lookDir = isLeft ? 5 : -5;

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, cy, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils - look toward opponent or concentrate when aiming
    const pupilOffset = isAiming ? 0 : lookDir;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 20 + pupilOffset, cy + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 20 + pupilOffset, cy + 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx - 17 + pupilOffset, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 23 + pupilOffset, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawAntennae(ctx, cx, cy, color, darkColor) {
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Left antenna
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.quadraticCurveTo(cx - 28, cy - 25, cx - 22, cy - 50);
    ctx.stroke();

    // Right antenna
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy);
    ctx.quadraticCurveTo(cx + 28, cy - 25, cx + 22, cy - 50);
    ctx.stroke();

    // Balls
    const time = Date.now() / 250;
    const glowIntensity = 0.7 + Math.sin(time) * 0.3;

    ctx.fillStyle = `rgba(239, 68, 68, ${glowIntensity})`;
    ctx.beginPath();
    ctx.arc(cx - 22, cy - 50, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 50, 10, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * glowIntensity})`;
    ctx.beginPath();
    ctx.arc(cx - 22, cy - 50, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 50, 16, 0, Math.PI * 2);
    ctx.fill();
}

function drawMouth(ctx, cx, cy, isAiming) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (isAiming) {
        // O mouth when aiming
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy + 10, 7, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Happy smile
        ctx.beginPath();
        ctx.arc(cx, cy + 6, 14, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }
}

// ============================================
// BALL DRAWING
// ============================================
function drawBall(ctx, ball) {
    if (!ball) return;
    const x = ball.x;
    const y = ball.y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - 5, BALL_RADIUS * 0.8, BALL_RADIUS * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, BALL_RADIUS);
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(0.7, '#f0f0f0');
    ballGrad.addColorStop(1, '#d1d5db');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Lines
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS - 4, 0.5, 2.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS - 4, 3.6, 5.6);
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ============================================
// UI UPDATES
// ============================================
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.remainingTime / 60);
    const seconds = gameState.remainingTime % 60;
    document.getElementById('gameTimer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateScoreDisplay(side, score, increment = false) {
    const el = document.getElementById(side === 'left' ? 'leftScore' : 'rightScore');
    if (increment) {
        const current = parseInt(el.textContent);
        el.textContent = current + 1;
    } else if (score !== null) {
        el.textContent = score;
    }
}

// ============================================
// GAME END
// ============================================
function endGame() {
    if (gameState.gameEnded) return;
    gameState.gameEnded = true;
    AudioSys.playGameOver();

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    if (gameState.syncPolling) {
        clearInterval(gameState.syncPolling);
    }

    const leftScore = parseInt(document.getElementById('leftScore').textContent);
    const rightScore = parseInt(document.getElementById('rightScore').textContent);

    document.getElementById('finalLeftScore').textContent = leftScore;
    document.getElementById('finalRightScore').textContent = rightScore;

    const winnerText = document.getElementById('winnerText');
    if (leftScore > rightScore) {
        winnerText.textContent = isSinglePlayer ? 'YOU WIN!' : 'LEFTY WINS!';
        winnerText.style.color = '#4ade80';
    } else if (rightScore > leftScore) {
        winnerText.textContent = isSinglePlayer ? 'COMPUTER WINS!' : 'RIGHTY WINS!';
        winnerText.style.color = '#a855f7';
    } else {
        winnerText.textContent = "IT'S A TIE!";
        winnerText.style.color = '#fbbf24';
    }

    document.getElementById('gameOverOverlay').style.display = 'flex';

    if (gameState.isHost && !isSinglePlayer) {
        api.updateRoom(gameState.roomCode, { gameEnded: true });
    }
}

function playAgain() {
    if (isSinglePlayer) {
        AudioSys.playMenuClick();
        resetForNewGame();
        startGame();
        return;
    }

    if (gameState.playAgainVotes[gameState.playerId]) return;

    gameState.playAgainVotes[gameState.playerId] = true;
    api.updateRoom(gameState.roomCode, {
        [gameState.playerId]: { playAgain: true }
    });

    updatePlayAgainStatus();
    checkBothPlayAgain();
}

function updatePlayAgainStatus() {
    const statusEl = document.getElementById('playAgainStatus');
    const leftVoted = gameState.playAgainVotes.left;
    const rightVoted = gameState.playAgainVotes.right;

    if (leftVoted && rightVoted) {
        restartGame();
    } else if (leftVoted && !rightVoted) {
        statusEl.textContent = gameState.playerId === 'left' ? 'Waiting for Righty...' : 'Lefty wants rematch! Vote to play again.';
    } else if (!leftVoted && rightVoted) {
        statusEl.textContent = gameState.playerId === 'right' ? 'Waiting for Lefty...' : 'Righty wants rematch! Vote to play again.';
    } else {
        statusEl.textContent = 'Click Play Again to vote';
    }
}

function checkBothPlayAgain() {
    if (gameState.playAgainVotes.left && gameState.playAgainVotes.right) {
        if (gameState.isHost) {
            api.updateRoom(gameState.roomCode, {
                gameStarted: false,
                gameEnded: false,
                timer: gameState.gameTime * 60,
                left: { score: 0, playAgain: false },
                right: { score: 0, playAgain: false }
            });

            setTimeout(() => {
                resetForNewGame();
                startGame();
            }, 500);
        }
    }
}

function resetForNewGame() {
    gameState.gameStarted = false;
    gameState.gameEnded = false;
    gameState.remainingTime = gameState.gameTime * 60;
    gameState.playAgainVotes = { left: false, right: false };

    localPlayer.isDead = false;
    localPlayer.canLaunch = true;
    localPlayer.isAiming = false;
    localPlayer.aimDirection = null;
    localPlayer.launcherAngle = 0;
    localPlayer.targetLauncherAngle = 0;
    localBall = null;

    if (isSinglePlayer) {
        remotePlayer.isDead = false;
        remotePlayer.canLaunch = true;
        remotePlayer.isAiming = false;
        remotePlayer.aimDirection = null;
        remoteBall = null;
    }

    document.getElementById('leftScore').textContent = '0';
    document.getElementById('rightScore').textContent = '0';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('playAgainStatus').textContent = '';
}

function exitGame() {
    AudioSys.playMenuClick();
    
    if (gameState.roomCode) {
        api.updateRoom(gameState.roomCode, {
            [gameState.playerId]: { connected: false }
        });
    }

    if (gameState.syncPolling) {
        clearInterval(gameState.syncPolling);
    }

    resetGameState();
    showMenu();
}

// ============================================
// INPUT HANDLING - FIXED
// ============================================
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.addEventListener('beforeunload', () => {
    if (gameState.roomCode) {
        api.updateRoom(gameState.roomCode, {
            [gameState.playerId]: { connected: false }
        });
        api.deleteRoom(gameState.roomCode);
    }
});

// Resize handler for full screen
window.addEventListener('resize', () => {
    if (gameState.gameStarted) {
        initCanvas();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.retro-button-shine, .retro-button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => AudioSys.playMenuHover());
    });
});
