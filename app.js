import { Antigravity, Draw, UI, Input, Vector3, Rect, Color } from './engine.js';
import { GridManager } from './GridManager.js';
import { PlayerInventory } from './PlayerInventory.js';
import { ShopManager } from './ShopManager.js';
import { CryptoGenerator, SolarPanel } from './Modules.js';

class MyGame {
    constructor() {
        this.myBase = [];
        this.shop = new ShopManager();
        this.EnergyRatio = 1.0;
    }

    Start() {
        Antigravity.camera.IsOrthographic = true;
        Antigravity.camera.Rotation = new Vector3(35.264, 45, 0);

        // Positionnement initial
        this.myBase.push(Object.assign(new CryptoGenerator(), { Position: GridManager.GridToWorld(0, 0), CurrentHealth: 100 }));
        this.myBase.push(Object.assign(new SolarPanel(), { Position: GridManager.GridToWorld(1, 0), CurrentHealth: 100 }));
    }

    Update(deltaTime) {
        // 1. BILAN ÉNERGÉTIQUE
        let totalProd = 0;
        let totalDemand = 0;
        for (const m of this.myBase) {
            if (m instanceof SolarPanel && m.CurrentHealth > 0) totalProd += m.EnergyGenerated;
            if (m instanceof CryptoGenerator) totalDemand += m.EnergyConsumption || 0;
        }
        this.EnergyRatio = (totalDemand > 0) ? Math.min(Math.max(totalProd / totalDemand, 0), 1) : 1;

        // 2. MISE À JOUR ET RENDU
        for (const module of this.myBase) {
            module.Update(deltaTime);
            if (module instanceof CryptoGenerator) {
                module.UpdateProduction(deltaTime, module.CurrentHealth > 0 ? this.EnergyRatio : 0);
            }
            module.Render(Draw);
        }

        // 3. INTERFACE
        this.shop.RenderShopWindow(Draw, UI);
        UI.DrawText(new Rect(20, 320, 200, 30), `Crypto: ${Math.floor(PlayerInventory.CryptoAmount)}`);
        UI.DrawText(new Rect(20, 350, 200, 30), `Énergie: ${totalProd.toFixed(0)}/${totalDemand.toFixed(0)} (${(this.EnergyRatio * 100).toFixed(0)}%)`);

        // 4. LOGIQUE DE PLACEMENT
        if (this.shop.selectedModuleForPlacement != null) {
            const mousePos = Input.GetMouseToWorldPlane();
            // On aligne sur la grille (simple mapping pour la démo)
            const gridX = Math.round(mousePos.X);
            const gridZ = Math.round(mousePos.Z);
            const snappedPos = GridManager.GridToWorld(gridX, gridZ);

            // Dessiner le fantôme
            Draw.IsometricCube(snappedPos, 'rgba(255, 255, 255, 0.5)', "Placer ici ?");

            if (Input.GetMouseButtonDown(0)) {
                const cost = this.shop.selectedModuleForPlacement.CryptoCost;
                if (PlayerInventory.CanAfford(cost)) {
                    PlayerInventory.SpendCrypto(cost);

                    // Créer une copie
                    const proto = this.shop.selectedModuleForPlacement;
                    const newModule = new proto.constructor();
                    newModule.Position = snappedPos;
                    newModule.Name = proto.Name;
                    this.myBase.push(newModule);

                    this.shop.selectedModuleForPlacement = null;
                }
            }
        }
    }
}

const game = new MyGame();
game.Start();

let lastTime = 0;
function loop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    Antigravity.Clear();
    game.Update(deltaTime || 0);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
