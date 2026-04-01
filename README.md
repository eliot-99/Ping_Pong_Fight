# ██████╗ ███████╗██████╗ ███████╗██╗     ██╗ ██████╗████████╗
# ██╔══██╗██╔════╝██╔══██╗██╔════╝██║     ██║██╔════╝╚══██╔══╝
# ██║  ██║█████╗  ██████╔╝█████╗  ██║     ██║██║        ██║
# ██║  ██║██╔══╝  ██╔══██╗██╔══╝  ██║     ██║██║        ██║
# ██████╔╝███████╗██║  ██║███████╗███████╗██║╚██████╗   ██║
# ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝   ╚═╝
#
#     ██████╗  █████╗ ███╗   ██╗██╗  ██╗
#    ██╔════╝ ██╔══██╗████╗  ██║██║ ██╔╝
#    ██║  ███╗███████║██╔██╗ ██║█████╔╝
#    ██║   ██║██╔══██║██║╚██╗██║██╔═██╗
#    ╚██████╔╝██║  ██║██║ ╚████║██║  ██╗
#     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
#
#            ██╗    ██╗ ██████╗ ██████╗ ██████╗
#            ██║    ██║██╔═══██╗██╔══██╗██╔══██╗
#            ██║ █╗ ██║██║   ██║██████╔╝██║  ██║
#            ██║███╗██║██║   ██║██╔══██╗██║  ██║
#            ╚███╔███╔╝╚██████╔╝██║  ██║██████╔╝
#             ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝

---

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Platform-Vercel-black?style=for-the-badge&logo=vercel" alt="Platform">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</p>

---

## ╔════════════════════════════════════════╗
## ║           🎮 GAME OVERVIEW 🎮           ║
## ╚════════════════════════════════════════╝

**PING PONG GOAL** is a retro arcade-style 2D physics game featuring:

- 🕹️ **Single Player Mode** - Battle against AI with 3 difficulty levels
- 👥 **Multiplayer Mode** - Local 2-player competitive play
- 🎨 **Stunning Retro Visuals** - CRT effects, pixel art aesthetic
- 🔊 **8-bit Audio System** - Immersive sound effects
- 📱 **Responsive Design** - Play anywhere, any screen size

```
    ┌─────────────────────────────────────────┐
    │  DIFFICULTY LEVELS                      │
    ├─────────────────────────────────────────┤
    │  🐢 EASY   - Perfect for beginners       │
    │  🏃 MEDIUM - Balanced challenge         │
    │  ⚡ HARD   - For expert players only     │
    └─────────────────────────────────────────┘
```

---

## ╔════════════════════════════════════════╗
## ║         ⌨️ CONTROLS GUIDE ⌨️            ║
## ╚════════════════════════════════════════╝

```
╔═══════════════════════════════════════════════════════════╗
║  PLAYER 1 (LEFT)              │  PLAYER 2 (RIGHT)         ║
╠══════════════════════════════╪════════════════════════════╣
║  ← →  Move Left/Right        │  A D  Move Left/Right     ║
║  SPACE  Jump                 │  W  Jump                  ║
║  ↑  Hold Aim Up → Release    │  ↑  Hold Aim Up → Release ║
║     to Shoot                 │     to Shoot             ║
║  ↓  Hold Aim Down → Release  │  ↓  Hold Aim Down →      ║
║     to Shoot                 │     Release to Shoot     ║
╚═══════════════════════════════════════════════════════════╝
```

### 🎯 AIMING MECHANICS

```
    ┌────────────────────────────────────────────────────────┐
    │                                                         │
    │     HOLD ↑      →      AIM UP      →    RELEASE FIRE  │
    │                                                         │
    │            ▲ ▲ ▲ ▲ ▲                                    │
    │          ▲           ▲                                  │
    │        ▲               ▲                                │
    │      ▲                   ▲                              │
    │    ▲         PLAYER        ▲                            │
    │                                                         │
    │     HOLD ↓      →     AIM DOWN    →    RELEASE FIRE    │
    │                                                         │
    └────────────────────────────────────────────────────────┘
```

---

## ╔════════════════════════════════════════╗
## ║         🏗️ PROJECT STRUCTURE 🏗️         ║
## ╚════════════════════════════════════════╝

```
ping-pong-goal/
│
├── 📁 public/                 # Static assets served directly
│   └── index.html            # Main HTML entry point
│
├── 📁 src/                    # Source code
│   ├── game.js               # Core game logic (~66KB)
│   └── styles.css            # Retro CSS styling (~19KB)
│
├── 📁 api/                    # Serverless functions (Vercel)
│   └── rooms.js              # Multiplayer room management
│
├── 📄 vercel.json            # Vercel deployment config
├── 📄 package.json           # Node.js dependencies
├── 📄 .firebaserc            # Firebase configuration
└── 📄 README.md              # This file
```

---

## ╔════════════════════════════════════════╗
## ║       🚀 QUICK START GUIDE 🚀           ║
## ╚════════════════════════════════════════╝

### **Local Development**

```bash
# Install serve (one-time)
npm install -g serve

# Run locally
npm run dev

# Or use serve directly
serve .
```

Then open **http://localhost:3000** in your browser.

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## ╔════════════════════════════════════════╗
## ║      🎨 FEATURE HIGHLIGHTS 🎨           ║
## ╚════════════════════════════════════════╝

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ SPRING-BASED CHARACTERS                                 │
│                                                             │
│      ___                                                   │
│     /   \        Animated spring legs that bounce           │
│    | O O |       with physics-based animation              │
│    |  ^  |                                                  │
│    | ___ |       Each character has unique personality!     │
│    /|   |\                                                │
│   / |   | \                                               │
│      ║   ║                                                │
│    ═══════════════                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🐦 ENVIRONMENT                                            │
│                                                             │
│     \  ◠‿◠  /        Colorful birds flying in sky         │
│      \______/                                                │
│                    ☁️        ☁️                             │
│        ☁️                    ☁️        ☁️                  │
│                                                             │
│   ════════════════════════════════════════════════       │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📺 CRT MONITOR EFFECTS                                    │
│                                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░░░  Scanlines ░░░  Screen glow ░░░  Vignette ░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────────────────────────────┘
```

---

## ╔════════════════════════════════════════╗
## ║        🛠️ TECH STACK 🛠️                  ║
## ╚════════════════════════════════════════╝

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | HTML5 Canvas | Game rendering |
| **Styling** | CSS3 + Tailwind | UI components |
| **Logic** | Vanilla JavaScript | Game physics & AI |
| **Audio** | Web Audio API | 8-bit sound effects |
| **Backend** | Vercel Serverless | Multiplayer rooms |
| **Database** | Vercel KV (Redis) | Room state storage |
| **Hosting** | Vercel | CDN deployment |

---

## ╔════════════════════════════════════════╗
## ║       🎯 GAME MECHANICS 🎯              ║
## ╚════════════════════════════════════════╝

### Scoring
```
┌────────────────────────────────────────────────┐
│                                                │
│   🎯 Hit opponent with ball = +1 POINT         │
│   🎯 Ball hits bird = Ball destroyed           │
│   🎯 Ball hits wall = Ball destroyed           │
│                                                │
│   ⏱️ Highest score when timer ends = WINNER    │
│                                                │
└────────────────────────────────────────────────┘
```

### Physics
- **Gravity**: 0.6 units/frame
- **Jump Velocity**: -16 units
- **Ball Speed**: 7 units
- **Player Speed**: 8 units

---

## ╔════════════════════════════════════════╗
## ║      📋 MULTIPLAYER SETUP 📋           ║
## ╚════════════════════════════════════════╝

For multiplayer functionality:

1. **Create Vercel Account** at [vercel.com](https://vercel.com)

2. **Connect GitHub Repository** to Vercel

3. **Configure Vercel KV** (optional for production):
   ```bash
   vercel env add KV_REST_API_URL
   vercel env add KV_REST_API_TOKEN
   ```

4. **Deploy!**
   ```bash
   vercel --prod
   ```

---

## ╔════════════════════════════════════════╗
## ║        📄 LICENSE 📄                    ║
## ╚════════════════════════════════════════╝

```
MIT License

Copyright (c) 2026 Ping Pong Goal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<p align="center">
  <strong>Made with ❤️ and 8-bit nostalgia</strong>
  <br>
  <em>PING PONG GOAL</em> © 2026
</p>

---

```
    ██████╗  █████╗ ███╗   ██╗███████╗██████╗  ██████╗ ██╗   ██╗███████╗██████╗
    ██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔══██╗██╔═══██╗██║   ██║██╔════╝██╔══██╗
    ██║  ██║███████║██╔██╗ ██║███████╗██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝
    ██║  ██║██╔══██║██║╚██╗██║╚════██║██╔═══╝ ██║   ██║██║   ██║██╔══╝  ██╔══██╗
    ██████╔╝██║  ██║██║ ╚████║███████║██║     ╚██████╔╝╚██████╔╝███████╗██║  ██║
    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝      ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
```
