import { CryptoGenerator, SolarPanel, OxygenReserve, Dortoir, Greenhouse, BatteryModule, RadioAntenna, RecyclingModule, ScienceLab, DroneHangar } from './Modules.js';
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
            new RadioAntenna(),
            new ScienceLab(),
            new DroneHangar()
        ];
        this.selectedModuleForPlacement = null;
        this.scrollY = 0;
        this.isDragging = false;
        this.lastMouseY = 0;
        this.isMouseOver = false;
        this.isDraggingScrollbar = false;
    }

    RenderShopWindow(draw, ui, tutorialStep = 0) {
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
            const isScience = m instanceof ScienceLab;

            if (PlayerInventory.isSandboxMode) return true; // Tout est dispo en sandbox/survival
            if (isScience) return tutorialStep >= 106; // Labo dispo à l'étape 106
            if (isAdvanced) return tutorialStep >= 100; // Les autres avancés dispos au début du tuto avancé (100+)
            return true; // Les bases (Solaire, Dortoir, Oxy, Crypto) toujours dispos
        }).length;

        const contentHeight = displayedModulesCount * 50;
        const viewHeight = windowRect.height - 50;
        const maxScroll = Math.max(0, contentHeight - (viewHeight - 20));

        // Interaction avec la barre de défilement latérale (Décalée vers la droite)
        const scrollBarTrack = { x: windowRect.x + windowRect.width - 8, y: windowRect.y + 50, width: 6, height: viewHeight - 10 };
        let scrollBarHeight = 0;
        let scrollPercent = 0;
        let scrollBarY = 0;

        if (contentHeight > viewHeight) {
            scrollBarHeight = Math.max(30, (viewHeight / contentHeight) * scrollBarTrack.height);
            scrollPercent = maxScroll > 0 ? (-this.scrollY / maxScroll) : 0;
            scrollBarY = scrollBarTrack.y + (scrollPercent * (scrollBarTrack.height - scrollBarHeight));
        }

        const isHoverHandle = Antigravity.mousePos.x > scrollBarTrack.x - 5 && Antigravity.mousePos.x < scrollBarTrack.x + scrollBarTrack.width + 5 &&
            Antigravity.mousePos.y > scrollBarY && Antigravity.mousePos.y < scrollBarY + scrollBarHeight;

        if (Antigravity.mouseClicked) {
            if (!this.isDraggingScrollbar && isHoverHandle) {
                this.isDraggingScrollbar = true;
                // Calculer où l'on a cliqué dans le handle (offset)
                this.dragOffsetY = Antigravity.mousePos.y - scrollBarY;
            } else if (this.isDraggingScrollbar) {
                // Positionner le haut du handle par rapport à la souris sans lâcher l'offset
                const desiredHandleY = Antigravity.mousePos.y - this.dragOffsetY;
                const usableTrackHeight = scrollBarTrack.height - scrollBarHeight;

                if (maxScroll > 0 && usableTrackHeight > 0) {
                    const scrollPercent = (desiredHandleY - scrollBarTrack.y) / usableTrackHeight;
                    // On reste entre 0 (haut) et 1 (bas)
                    const clampedPercent = Math.max(0, Math.min(1, scrollPercent));
                    this.scrollY = -clampedPercent * maxScroll;
                }
            }
        } else {
            this.isDraggingScrollbar = false;
        }

        // Gestion du drag du contenu (si on ne drag pas la scrollbar)
        if (!this.isDraggingScrollbar) {
            if (Antigravity.mouseClicked) {
                if (!this.isDragging && isHoverWindow && !isHoverHandle) {
                    this.isDragging = true;
                    this.lastMouseY = Antigravity.mousePos.y;
                } else if (this.isDragging) {
                    const deltaY = Antigravity.mousePos.y - this.lastMouseY;
                    this.scrollY += deltaY * 1.3;
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
            // Logique d'affichage
            const isAdvanced = module instanceof Greenhouse || module instanceof BatteryModule ||
                module instanceof RadioAntenna || module instanceof RecyclingModule;
            const isScience = module instanceof ScienceLab;

            let isVisible = true;
            if (!PlayerInventory.isSandboxMode) {
                if (isScience) isVisible = (tutorialStep >= 106);
                else if (isAdvanced) isVisible = (tutorialStep >= 100);
            }

            if (!isVisible) continue;

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

            // Recalculer après interaction pour un rendu fluide
            scrollPercent = maxScroll > 0 ? (-this.scrollY / maxScroll) : 0;
            scrollBarY = scrollBarTrack.y + (scrollPercent * (scrollBarTrack.height - scrollBarHeight));

            ctx.fillStyle = this.isDraggingScrollbar ? '#fff' : '#00f2ff';
            ctx.fillRect(scrollBarTrack.x, scrollBarY, 6, scrollBarHeight);
        }
    }
}
