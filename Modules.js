import { BaseModule } from './BaseModule.js';
import { PlayerInventory } from './PlayerInventory.js';
import { Antigravity } from './engine.js';

// Import et ré-export des classes du système de drones
export { DroneHangar, Asteroid, Drone } from './DroneSystem.js';

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
        if (PlayerInventory.isVirusActive) {
            // Glow rouge pulsant
            const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            draw.IsometricCube(this.Position, `rgba(255, 0, 0, ${alpha})`);
        }
        draw.IsometricImage(this.Position, 'images/cryptoModule.png', "Mineur de Crypto");
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
        draw.IsometricImage(this.Position, 'images/panel.png', "Panneau Solaire");
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
        draw.IsometricImage(this.Position, 'images/oxygen.png', "Réserve d'Oxygène");
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
        draw.IsometricImage(this.Position, 'images/dortoir.png', "Dortoir");
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
        draw.IsometricImage(this.Position, 'images/serre.png', "Serre");
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
        draw.IsometricImage(this.Position, 'images/batterie.png', "Banque de Batteries");
    }
}

export class RadioAntenna extends BaseModule {
    constructor() {
        super();
        this.Name = "Antenne Comm";
        this.CryptoCost = 200;
        this.timer = 0;
        this.incomeInterval = 60; // 1 minute
        this.incomeAmount = 50;
    }

    Update(deltaTime) {
        // Le malware stoppe la progression du timer de l'antenne
        if (PlayerInventory.isVirusActive) return;

        this.timer += deltaTime;
        if (this.timer >= this.incomeInterval) {
            PlayerInventory.CryptoAmount += this.incomeAmount;
            // Optionnel : Feedback visuel ou sonore ici
            this.timer = 0;
        }
    }
    Render(draw) {
        if (PlayerInventory.isVirusActive) {
            // Glow rouge pulsant
            const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            draw.IsometricCube(this.Position, `rgba(255, 0, 0, ${alpha})`);
        }
        draw.IsometricImage(this.Position, 'images/antenne.png', "Antenne Comm");
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
        draw.IsometricImage(this.Position, 'images/recyclage.png', "Unité de Recyclage");
    }
}

export class ScienceLab extends BaseModule {
    constructor() {
        super();
        this.Name = "Laboratoire";
        this.CryptoCost = 200;
        this.ScienceRate = 1; // 1 point par minute
        this.EnergyConsumption = 5.0;
        this.timer = 0;
    }

    Update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= 60) { // Every 60 seconds (1 minute)
            PlayerInventory.SciencePoints += this.ScienceRate;
            this.timer = 0;
        }
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'images/labo.png', this.Name);
    }
}

export class JumpDrive extends BaseModule {
    constructor() {
        super();
        this.Name = "Cœur de Saut";
        this.CryptoCost = 0; // Special
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'images/coeurTP.png');
    }
}
