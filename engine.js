export const Color = {
    White: 'white',
    Green: 'green',
    Yellow: 'yellow',
    Blue: 'blue',
    Gray: 'gray',
    Purple: 'purple',
    Black: 'black'
};

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class Engine {
    constructor() {
        this.canvas = document.createElement('canvas');
        const container = document.getElementById('game-container') || document.body;
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.mousePos = { x: 0, y: 0 };
        this.mouseClicked = false;
        this.mouseWheel = 0;
        this.isTrackpadPinch = false;
        this.keys = {};

        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        window.addEventListener('mousedown', () => {
            this.mouseClicked = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouseClicked = false;
        });

        window.addEventListener('wheel', (e) => {
            this.mouseWheel = e.deltaY;
            this.isTrackpadPinch = e.ctrlKey; // Détecte le geste de pincement sur trackpad
            if (e.ctrlKey) {
                e.preventDefault(); // Empêche le zoom de la page
            }
        }, { passive: false });

        this.keys = {};
        this.keysDown = {};

        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) this.keysDown[e.code] = true;
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysDown[e.code] = false;
        });

        this.camera = {
            IsOrthographic: true,
            Rotation: new Vector3(35.264, 45, 0),
            Position: new Vector3(this.width / 2, this.height / 2, 0),
            Zoom: 1.0
        };
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if (this.camera) {
            this.camera.Position = new Vector3(this.width / 2, this.height / 2, 0);
        }
    }

    GetMouseToWorldPlane() {
        // Simple mapping for isometric 2D
        // This is a placeholder since the actual projection depends on the camera
        const x = this.mousePos.x - this.camera.Position.x;
        const y = this.mousePos.y - this.camera.Position.y;

        // Reverse isometric projection (approximate)
        const tileW = 2.0; // matching GridManager default
        const tileH = 1.0;

        // z = (y / (tileH/2) + x / (tileW/2)) / 2
        // x_grid = (y / (tileH/2) - x / (tileW/2)) / 2

        const worldX = (y / (tileH / 2) + x / (tileW / 2)) * 10; // scale factor
        const worldZ = (y / (tileH / 2) - x / (tileW / 2)) * 10;

        return { X: x / 20, Z: y / 20 }; // Temporary simple mapping to match GridManager scale
    }

    GetMouseButtonDown(button) {
        if (button === 0 && this.mouseClicked) {
            this.mouseClicked = false; // Reset to simulate "Down" event once
            return true;
        }
        return false;
    }

    GetKeyDown(code) {
        if (this.keysDown[code]) {
            this.keysDown[code] = false;
            return true;
        }
        return false;
    }

    Clear() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}

export const Antigravity = new Engine();

export const Draw = {
    IsometricCube: function (pos, color, label, strokeColor = 'white') {
        const ctx = Antigravity.ctx;
        const zoom = Antigravity.camera.Zoom;
        const centerX = Antigravity.camera.Position.x + pos.x * 40 * zoom;
        const centerY = Antigravity.camera.Position.y + pos.z * 40 * zoom;

        const w = 40 * zoom;
        const h = 20 * zoom;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - h);
        ctx.lineTo(centerX + w, centerY);
        ctx.lineTo(centerX, centerY + h);
        ctx.lineTo(centerX - w, centerY);
        ctx.closePath();

        if (color !== 'transparent') ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (label) {
            const oldStroke = ctx.strokeStyle;
            const oldWidth = ctx.lineWidth;
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(label, centerX, centerY);
            ctx.fillText(label, centerX, centerY);
            ctx.strokeStyle = oldStroke;
            ctx.lineWidth = oldWidth;
        }
    },

    IsometricImage: function (pos, imagePath, label) {
        const ctx = Antigravity.ctx;
        const zoom = Antigravity.camera.Zoom;
        const centerX = Antigravity.camera.Position.x + pos.x * 40 * zoom;
        const centerY = Antigravity.camera.Position.y + pos.z * 40 * zoom;

        // On charge l'image si elle n'est pas déjà en cache
        if (!this._imageCache) this._imageCache = {};
        if (!this._imageCache[imagePath]) {
            const img = new Image();
            img.src = imagePath;
            this._imageCache[imagePath] = img;
        }

        const img = this._imageCache[imagePath];
        if (img.complete && img.naturalWidth > 0) {
            // L'image fait 80x40 à la base (le losange)
            // L'ancrage doit être le milieu bas du losange de base
            const drawW = img.width * zoom;
            const drawH = img.height * zoom;
            const drawX = centerX - 40 * zoom;
            const drawY = centerY - (img.height - 20) * zoom;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else if (img.complete && img.naturalWidth === 0) {
            // Image cassée : on affiche un cube de secours pour ne pas planter le jeu
            this.IsometricCube(pos, 'rgba(255,0,0,0.5)', "Erreur Image");
        } else {
            // En cours de chargement
            this.IsometricCube(pos, 'rgba(0,255,255,0.1)', "Chargement...");
        }

        if (label) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(label, centerX, centerY);
            ctx.fillText(label, centerX, centerY);
        }
    },

    Window: function (rect, title) {
        const ctx = Antigravity.ctx;

        // Background - Glass effect
        ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        // Main Glow Border
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        // Corner Accents (Futuristic detail)
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        const cl = 15; // corner length
        // Top Left
        ctx.beginPath(); ctx.moveTo(rect.x, rect.y + cl); ctx.lineTo(rect.x, rect.y); ctx.lineTo(rect.x + cl, rect.y); ctx.stroke();
        // Top Right
        ctx.beginPath(); ctx.moveTo(rect.x + rect.width - cl, rect.y); ctx.lineTo(rect.x + rect.width, rect.y); ctx.lineTo(rect.x + rect.width, rect.y + cl); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(rect.x + rect.width, rect.y + rect.height - cl); ctx.lineTo(rect.x + rect.width, rect.y + rect.height); ctx.lineTo(rect.x + rect.width - cl, rect.y + rect.height); ctx.stroke();
        // Bottom Left
        ctx.beginPath(); ctx.moveTo(rect.x + cl, rect.y + rect.height); ctx.lineTo(rect.x, rect.y + rect.height); ctx.lineTo(rect.x, rect.y + rect.height - cl); ctx.stroke();

        // Title Bar Area
        ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.fillRect(rect.x, rect.y, rect.width, 35);

        ctx.fillStyle = '#00f2ff';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title.toUpperCase(), rect.x + 15, rect.y + 22);
    },

    Button: function (rect, text) {
        const ctx = Antigravity.ctx;
        const isHover = Antigravity.mousePos.x > rect.x && Antigravity.mousePos.x < rect.x + rect.width &&
            Antigravity.mousePos.y > rect.y && Antigravity.mousePos.y < rect.y + rect.height;

        // Button Background
        ctx.fillStyle = isHover ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        // Accent Line
        ctx.fillStyle = isHover ? '#00f2ff' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(rect.x, rect.y, 2, rect.height);

        // Button Border
        ctx.strokeStyle = isHover ? 'rgba(0, 242, 255, 0.6)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        // Button Text
        ctx.fillStyle = isHover ? '#fff' : '#a0a0a0';
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2 + 5);

        if (isHover && Antigravity.mouseClicked) {
            Antigravity.mouseClicked = false;
            return true;
        }
        return false;
    }
};

export const UI = {
    DrawText: function (rect, text) {
        const ctx = Antigravity.ctx;
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(text, rect.x, rect.y + 15);
    }
};

export const Input = {
    GetMouseToWorldPlane: () => {
        const zoom = Antigravity.camera.Zoom;
        const relX = Antigravity.mousePos.x - Antigravity.camera.Position.x;
        const relY = Antigravity.mousePos.y - Antigravity.camera.Position.y;

        // Inversion de la projection isométrique avec prise en compte du zoom
        const gridX = (relX / (40 * zoom) + relY / (20 * zoom)) / 2;
        const gridZ = (relY / (20 * zoom) - relX / (40 * zoom)) / 2;

        return { X: gridX, Z: gridZ };
    },
    GetMouseButtonDown: (btn) => Antigravity.GetMouseButtonDown(btn),
    GetMouseWheel: () => {
        const val = Antigravity.mouseWheel;
        return val;
    },
    GetKey: (code) => Antigravity.keys[code] === true,
    GetKeyDown: (code) => Antigravity.GetKeyDown(code)
};
