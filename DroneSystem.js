import { BaseModule } from './BaseModule.js';
import { PlayerInventory } from './PlayerInventory.js';

export class DroneHangar extends BaseModule {
    constructor() {
        super();
        this.Name = "Hangar de Drones";
        this.CryptoCost = 250;
        this.EnergyConsumption = 3.0;
        this.droneCount = 0; // Nombre de drones possédés
        this.drones = []; // Drones déployés (instances de Drone)
    }
    Render(draw) {
        draw.IsometricImage(this.Position, 'drone_module.png', this.Name);
    }
}

export class Asteroid {
    constructor(gridX, gridZ) {
        this.GridX = gridX;
        this.GridZ = gridZ;
        this.Position = { x: gridX, y: 0, z: gridZ };
        this.targetX = 0; // Cible vers le centre
        this.targetZ = 0;
        this.moveTimer = 0;
        this.moveInterval = 3; // Bouge toutes les 3 secondes
        this.scienceValue = 5 + Math.floor(Math.random() * 10); // 5-15 science
    }

    Update(deltaTime, stationModules) {
        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;

            // Trouver le module le plus proche
            let closestDist = Infinity;
            let closestModule = null;

            for (const mod of stationModules) {
                const dist = Math.abs(mod.GridX - this.GridX) + Math.abs(mod.GridZ - this.GridZ);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestModule = mod;
                }
            }

            if (closestModule) {
                // Se déplacer d'une case vers le module
                if (this.GridX < closestModule.GridX) this.GridX++;
                else if (this.GridX > closestModule.GridX) this.GridX--;
                else if (this.GridZ < closestModule.GridZ) this.GridZ++;
                else if (this.GridZ > closestModule.GridZ) this.GridZ--;

                this.Position = { x: this.GridX, y: 0, z: this.GridZ };
            }
        }
    }

    Render(draw) {
        draw.IsometricImage(this.Position, 'meteorite.png', '');
    }
}

export class Drone {
    constructor(hangarX, hangarZ) {
        this.homeX = hangarX;
        this.homeZ = hangarZ;
        this.GridX = hangarX;
        this.GridZ = hangarZ;
        this.Position = { x: hangarX, y: 0, z: hangarZ };
        this.state = 'idle'; // idle, moving-to-asteroid, mining, returning
        this.targetAsteroid = null;
        this.scienceCollected = 0;
        this.moveTimer = 0;
        this.moveInterval = 0.5; // Drones plus rapides que les astéroïdes
    }

    Update(deltaTime, asteroids) {
        this.moveTimer += deltaTime;

        if (this.state === 'idle') {
            // Chercher un astéroïde
            if (asteroids.length > 0) {
                this.targetAsteroid = asteroids[0]; // Prend le premier
                this.state = 'moving-to-asteroid';
            }
        } else if (this.state === 'moving-to-asteroid' && this.targetAsteroid) {
            if (this.moveTimer >= this.moveInterval) {
                this.moveTimer = 0;

                // Se déplacer vers l'astéroïde
                if (this.GridX < this.targetAsteroid.GridX) this.GridX++;
                else if (this.GridX > this.targetAsteroid.GridX) this.GridX--;
                else if (this.GridZ < this.targetAsteroid.GridZ) this.GridZ++;
                else if (this.GridZ > this.targetAsteroid.GridZ) this.GridZ--;
                else {
                    // Arrivé à l'astéroïde
                    this.state = 'mining';
                    this.scienceCollected = this.targetAsteroid.scienceValue;
                    return 'destroy-asteroid'; // Signal pour détruire l'astéroïde
                }

                this.Position = { x: this.GridX, y: 0, z: this.GridZ };
            }
        } else if (this.state === 'mining') {
            // Immédiatement après mining, retourner
            this.state = 'returning';
        } else if (this.state === 'returning') {
            if (this.moveTimer >= this.moveInterval) {
                this.moveTimer = 0;

                // Retourner au hangar
                if (this.GridX < this.homeX) this.GridX++;
                else if (this.GridX > this.homeX) this.GridX--;
                else if (this.GridZ < this.homeZ) this.GridZ++;
                else if (this.GridZ > this.homeZ) this.GridZ--;
                else {
                    // Arrivé au hangar
                    return 'returned'; // Signal pour retour complet
                }

                this.Position = { x: this.GridX, y: 0, z: this.GridZ };
            }
        }

        return null;
    }

    Render(draw) {
        if (this.state !== 'idle') {
            draw.IsometricImage(this.Position, 'drone.png', '');
        }
    }
}
