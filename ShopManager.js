import { CryptoGenerator, SolarPanel, OxygenReserve, Dortoir, Greenhouse, BatteryModule, RadioAntenna, RecyclingModule } from './Modules.js';
import { PlayerInventory } from './PlayerInventory.js';
import { Antigravity } from './engine.js';

export class ShopManager {
    constructor() {
        this.availableModules = [
            new CryptoGenerator(),
            new SolarPanel(),
            new OxygenReserve(),
            new Dortoir(),
            new Greenhouse(),
            new BatteryModule(),
            new RecyclingModule(),
            new RadioAntenna()
        ];
        this.selectedModuleForPlacement = null;
        this.scrollY = 0;
        this.isDragging = false;
        this.lastMouseY = 0;
        this.isMouseOver = false;
        this.isDraggingScrollbar = false;
    }

    RenderShopWindow(draw, ui) {
        const windowRect = { x: 40, y: 100, width: 220, height: 350 };
        draw.Window(windowRect, "STATION SHOP");

        // Gestion de la molette
        const isHoverWindow = Antigravity.mousePos.x > windowRect.x && Antigravity.mousePos.x < windowRect.x + windowRect.width &&
            Antigravity.mousePos.y > windowRect.y && Antigravity.mousePos.y < windowRect.y + windowRect.height;

        this.isMouseOver = isHoverWindow;

        if (isHoverWindow && Math.abs(Antigravity.mouseWheel) > 0) {
            this.scrollY -= Antigravity.mouseWheel * 0.65; // Sensibilité +30% (0.5 * 1.3)
            Antigravity.mouseWheel = 0; // Consommer l'event
        }

        // Paramètres de taille pour le calcul du scroll
        const displayedModulesCount = this.availableModules.filter(m => {
            const isAdvanced = m instanceof Greenhouse || m instanceof BatteryModule ||
                m instanceof RadioAntenna || m instanceof RecyclingModule;
            return !isAdvanced || PlayerInventory.isSandboxMode;
        }).length;

        const contentHeight = displayedModulesCount * 50;
        const viewHeight = windowRect.height - 50;
        const maxScroll = Math.max(0, contentHeight - (viewHeight - 20));

        // Interaction avec la barre de défilement latérale (Décalée vers la droite)
        const scrollBarTrack = { x: windowRect.x + windowRect.width - 8, y: windowRect.y + 50, width: 6, height: viewHeight - 10 };
        const isHoverScrollBar = Antigravity.mousePos.x > scrollBarTrack.x - 5 && Antigravity.mousePos.x < scrollBarTrack.x + scrollBarTrack.width + 5 &&
            Antigravity.mousePos.y > scrollBarTrack.y && Antigravity.mousePos.y < scrollBarTrack.y + scrollBarTrack.height;

        if (Antigravity.mouseClicked && (isHoverScrollBar || this.isDraggingScrollbar)) {
            this.isDraggingScrollbar = true;
            // Calculer le pourcentage de scroll basé sur la position Y de la souris
            const relativeY = (Antigravity.mousePos.y - scrollBarTrack.y) / scrollBarTrack.height;
            this.scrollY = -relativeY * maxScroll;
        } else if (!Antigravity.mouseClicked) {
            this.isDraggingScrollbar = false;
        }

        // Si on ne drag pas la scrollbar, on peut drag le contenu
        if (!this.isDraggingScrollbar) {
            const isDraggingThisFrame = Antigravity.mouseClicked && isHoverWindow;
            if (isDraggingThisFrame) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.lastMouseY = Antigravity.mousePos.y;
                } else {
                    const deltaY = Antigravity.mousePos.y - this.lastMouseY;
                    this.scrollY += deltaY * 1.3; // Sensibilité +30%
                    this.lastMouseY = Antigravity.mousePos.y;
                }
            } else {
                this.isDragging = false;
            }
        }

        // Application des limites
        this.scrollY = Math.max(Math.min(0, this.scrollY), -maxScroll);

        const ctx = Antigravity.ctx;
        ctx.save();
        // Zone de clipping (sous le titre)
        ctx.beginPath();
        ctx.rect(windowRect.x, windowRect.y + 40, windowRect.width, windowRect.height - 50);
        ctx.clip();

        let yOffset = windowRect.y + 50 + this.scrollY;
        for (const module of this.availableModules) {
            // Cacher les modules avancés pendant le tuto, sauf si mode libre
            const isAdvanced = module instanceof Greenhouse || module instanceof BatteryModule ||
                module instanceof RadioAntenna || module instanceof RecyclingModule;

            if (isAdvanced && !PlayerInventory.isSandboxMode) continue;

            // On ne déclenche le bouton que si on n'est pas en train de draguer (glisser)
            if (draw.Button({ x: windowRect.x + 10, y: yOffset, width: 200, height: 40 }, `${module.Name} - ${module.CryptoCost}C`)) {
                if (!this.isDragging || Math.abs(Antigravity.mousePos.y - this.lastMouseY) < 5) {
                    this.selectedModuleForPlacement = module;
                }
            }
            yOffset += 50;
        }
        ctx.restore();

        // Indication de scroll (Décalée et affinée)
        if (contentHeight > viewHeight) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(scrollBarTrack.x + 1, scrollBarTrack.y, 4, scrollBarTrack.height);

            const scrollBarHeight = Math.max(30, (viewHeight / contentHeight) * scrollBarTrack.height);
            const scrollPercent = maxScroll > 0 ? (-this.scrollY / maxScroll) : 0;
            const scrollBarY = scrollBarTrack.y + (scrollPercent * (scrollBarTrack.height - scrollBarHeight));

            ctx.fillStyle = this.isDraggingScrollbar ? '#fff' : '#00f2ff';
            ctx.fillRect(scrollBarTrack.x, scrollBarY, 6, scrollBarHeight);
        }
    }
}
