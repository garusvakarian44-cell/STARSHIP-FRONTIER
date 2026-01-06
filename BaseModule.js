import { PlayerInventory } from './PlayerInventory.js';

export class BaseModule {
    constructor() {
        this.Name = "";
        this.CryptoCost = 0;
        this.EnergyConsumption = 0;
        this.Position = { x: 0, y: 0, z: 0 };
        this.GridX = 0;
        this.GridZ = 0;
    }

    Update(deltaTime) {
        // Logique de maintenance supprimée
    }

    Render(draw) {
        // Sera implémenté dans les classes enfants
    }
}
