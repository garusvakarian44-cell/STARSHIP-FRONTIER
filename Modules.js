import { BaseModule } from './BaseModule.js';
import { PlayerInventory } from './PlayerInventory.js';
import { Antigravity } from './engine.js';

export class CryptoGenerator extends BaseModule {
    constructor() {
        super();
        this.BaseGenerationRate = 0.5; // 1 crypto toutes les 2 secondes (0.5/sec)
        this.EnergyConsumption = 2.0;  // Nouveau : Consomme 1 énergie/sec
        this.Name = "Mineur de Crypto";
        this.CryptoCost = 50;
    }

    UpdateProduction(deltaTime, energyRatio, bonusMultiplier = 1.0) {
        const effectiveProduction = this.BaseGenerationRate * energyRatio * bonusMultiplier;
        PlayerInventory.CryptoAmount += effectiveProduction * deltaTime;
    }

    Render(draw) {
        draw.IsometricImage(this.Position, 'cryptoModule.png', "Mineur de Crypto");
    }
}

export class SolarPanel extends BaseModule {
    constructor() {
        super();
        this.EnergyGenerated = 2.0; // Nouveau : Créée 2 énergies/sec
        this.Name = "Panneau Solaire";
        this.CryptoCost = 30;
    }

    Render(draw) {
        draw.IsometricImage(this.Position, 'panel.png', "Panneau Solaire");
    }
}

export class OxygenReserve extends BaseModule {
    constructor() {
        super();
        this.OxygenProduction = 3.0; // Nouveau : Créée 3 oxygène/sec
        this.Name = "Réserve d'Oxygène";
        this.CryptoCost = 40;
    }

    Render(draw) {
        draw.IsometricImage(this.Position, 'oxygen.png', "Réserve d'Oxygène");
    }
}


export class Dortoir extends BaseModule {
    constructor() {
        super();
        this.OccupantGenerated = 2; // Crée 2 habitants
        this.Name = "Dortoir";
        this.CryptoCost = 60;
        this.OxygenConsumption = 1.2; // Réduit de 2.0 à 1.2 pour l'équilibrage
        this.FoodConsumption = 0.5;   // 0.5 nourriture par habitant/sec
    }

    Render(draw) {
        draw.IsometricImage(this.Position, 'dortoir.png', "Dortoir");
    }
}

export class Greenhouse extends BaseModule {
    constructor() {
        super();
        this.Name = "Serre";
        this.CryptoCost = 80;
        this.OxygenConsumption = 1.0; // Consomme 1 oxygène/sec
        this.FoodProduction = 2.0;   // Produit 2 nourriture/sec
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'serre.png', "Serre");
    }
}

export class BatteryModule extends BaseModule {
    constructor() {
        super();
        this.Name = "Banque de Batteries";
        this.CryptoCost = 100;
        this.StorageBonus = 500; // Ajoute 500 de capacité
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'batterie.png', "Banque de Batteries");
    }
}

export class RadioAntenna extends BaseModule {
    constructor() {
        super();
        this.Name = "Antenne Comm";
        this.CryptoCost = 150;
        this.EnergySpike = 20.0; // Consomme 20 d'énergie par envoi
        this.CryptoGain = 200;   // Rapport 200 Crypto
        this.Timer = 30;         // Toutes les 30 secondes
        this.CurrentTimer = 30;
    }
    Update(deltaTime) {
        this.CurrentTimer -= deltaTime;
        if (this.CurrentTimer <= 0) {
            if (PlayerInventory.EnergyLevel >= this.EnergySpike) {
                PlayerInventory.EnergyLevel -= this.EnergySpike;
                PlayerInventory.CryptoAmount += this.CryptoGain * PlayerInventory.CryptoEfficiency;
                this.CurrentTimer = 30;
            }
        }
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'antenne.png', "Antenne Comm");
    }
}

export class RecyclingModule extends BaseModule {
    constructor() {
        super();
        this.Name = "Unité de Recyclage";
        this.CryptoCost = 100;
        this.StorageBonus = 500; // Ajoute 500 de capacité d'oxygène
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'recyclage.png', "Unité de Recyclage");
    }
}

export class ScienceLab extends BaseModule {
    constructor() {
        super();
        this.Name = "Laboratoire";
        this.CryptoCost = 200;
        this.ScienceRate = 1; // 1 point par minute (géré par Main)
        this.EnergyConsumption = 5.0;
    }
    Render(draw) {
        draw.IsometricCube(this.Position, '#f1c40f', this.Name);
    }
}

export class JumpDrive extends BaseModule {
    constructor() {
        super();
        this.Name = "Cœur de Saut";
        this.CryptoCost = 0; // Special
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'coeurTP.png', "SAUTER !", 'cyan');
    }
}
