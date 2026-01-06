import { Antigravity, Draw, UI, Input, Vector3, Rect, Color } from './engine.js';
import { GridManager } from './GridManager.js';
import { PlayerInventory } from './PlayerInventory.js';
import { ShopManager } from './ShopManager.js';
import { CryptoGenerator, SolarPanel, OxygenReserve, Dortoir, Greenhouse, BatteryModule, RadioAntenna, RecyclingModule } from './Modules.js';

class MyGame {
    constructor() {
        this.myBase = [];
        this.shop = new ShopManager();
        this.EnergyRatio = 1.0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.tutorialStep = 0;
        this.tutorialTimer = 0;
        this.lastMousePos = { x: 0, y: 0 };
        this.isGamePaused = false;

        // Persistance Roguelite
        this.completedRuns = parseInt(localStorage.getItem('apex_horizons_completed_runs') || '0');
        this.unlockedStarters = JSON.parse(localStorage.getItem('apex_horizons_starters') || '[]');

        // Système de Boons
        this.boonTimer = 300; // Tous les 5 min (300 sec)
        this.boonsPool = [
            { id: 'solar', name: "Solaire ++", desc: "+20% Production Énergie", apply: () => PlayerInventory.SolarEfficiency += 0.2 },
            { id: 'crypto', name: "Crypto Guru", desc: "+20% Gains Crypto", apply: () => PlayerInventory.CryptoEfficiency += 0.2 },
            { id: 'oxygen', name: "Recycleur Pro", desc: "+20% Production Oxygène", apply: () => PlayerInventory.OxygenEfficiency += 0.2 },
            { id: 'food', name: "Serre Bio", desc: "+20% Production Nourriture", apply: () => PlayerInventory.FoodEfficiency += 0.2 },
            { id: 'cost', name: "Standardisation", desc: "-15% Coût des Modules", apply: () => PlayerInventory.ModuleCostMultiplier *= 0.85 },
            { id: 'pop', name: "Sobriété", desc: "-15% Consommation Habitants", apply: () => PlayerInventory.PopulationConsumption *= 0.85 },
            { id: 'storage', name: "Cuves Étendues", desc: "+20% Capacité Max", apply: () => { PlayerInventory.EnergyMax *= 1.2; PlayerInventory.OxygenMax *= 1.2; } },
            { id: 'radio', name: "Relais Boosté", desc: "+25% Gains Antenne", apply: () => { /* Géré via une variable globale si besoin */ } },
            { id: 'drill', name: "Foreuses Turbo", desc: "+25% Efficacité Mineurs", apply: () => PlayerInventory.CryptoEfficiency += 0.25 }
        ];

        // Système d'Objectifs évolutifs
        this.currentGoal = null;
        this.GenerateGoals();

        // Système de Signaux
        this.signalTimer = 45 + Math.random() * 60; // Premier signal entre 45s et 1m45s

        // Définition globale pour le menu HTML
        // Définition globale pour le menu HTML
        window.startGame = (isSandbox) => {
            const isAfterGame = sessionStorage.getItem('apex_horizons_after_game') === 'true';

            // Si on lance depuis le menu sans avoir fait de partie juste avant (ex: restart browser)
            if (!isAfterGame) {
                this.completedRuns = 0;
                this.unlockedStarters = [];
                localStorage.setItem('apex_horizons_completed_runs', '0');
                localStorage.setItem('apex_horizons_starters', '[]');
                localStorage.removeItem('apex_horizons_visited_sandbox');
            }

            if (isSandbox && this.completedRuns > 0) {
                this.ShowGiftSelection();
            } else {
                this.StartRun(isSandbox);
            }
        };

        window.startSandbox = () => window.startGame(true);

    }

    GenerateGoals() {
        const scale = 1 + (this.completedRuns * 0.4);
        this.goalsList = [
            { id: 'crypto', title: "Fortune Spatiale", desc: `Accumuler ${Math.round(5000 * scale)} Crypto`, check: () => PlayerInventory.CryptoAmount >= 5000 * scale, progress: () => (PlayerInventory.CryptoAmount / (5000 * scale)) * 100 },
            { id: 'pop', title: "Station-Monde", desc: `Atteindre ${Math.round(25 * scale)} Habitants`, check: (game) => game.currentPopulation >= 25 * scale, progress: (game) => (game.currentPopulation / (25 * scale)) * 100 },
            { id: 'food', title: "Grenier Stellaire", desc: `Stocker ${Math.round(1000 * scale)} Nourriture`, check: () => PlayerInventory.FoodLevel >= 1000 * scale, progress: () => (PlayerInventory.FoodLevel / (1000 * scale)) * 100 },
            { id: 'oxygen', title: "Atmosphère Pure", desc: `${Math.round(3000 * scale)} Capacité Oxygène`, check: () => PlayerInventory.OxygenMax >= 3000 * scale, progress: () => (PlayerInventory.OxygenMax / (3000 * scale)) * 100 },
            { id: 'energy', title: "Cœur Énergétique", desc: `${Math.round(2500 * scale)} Capacité Énergie`, check: () => PlayerInventory.EnergyMax >= 2500 * scale, progress: () => (PlayerInventory.EnergyLevel / (2500 * scale)) * 100 },
            { id: 'modules', title: "Expansion Infinie", desc: `Construire ${Math.round(30 * scale)} Modules`, check: (game) => game.myBase.length >= 30 * scale, progress: (game) => (game.myBase.length / (30 * scale)) * 100 },
            { id: 'green', title: "Écosystème Scellé", desc: `Avoir ${Math.round(5 * scale)} Serres`, check: (game) => game.myBase.filter(m => m instanceof Greenhouse).length >= 5 * scale, progress: (game) => (game.myBase.filter(m => m instanceof Greenhouse).length / (5 * scale)) * 100 },
            { id: 'antennas', title: "Réseau Profond", desc: `Bâtir ${Math.round(3 * scale)} Antennes`, check: (game) => game.myBase.filter(m => m instanceof RadioAntenna).length >= 3 * scale, progress: (game) => (game.myBase.filter(m => m instanceof RadioAntenna).length / (3 * scale)) * 100 }
        ];
    }

    ShowGiftSelection() {
        const modal = document.getElementById('gift-modal');
        const container = document.getElementById('gift-choices');
        if (!modal || !container) return;

        this.isGamePaused = true;
        modal.style.display = 'flex';
        container.innerHTML = "";

        const options = [
            { name: "Panneau Solaire", type: "solar", icon: "⚡" },
            { name: "Soutien Oxygène", type: "oxygen", icon: "🌬️" },
            { name: "Dortoir d'Appoint", type: "pop", icon: "🏠" }
        ];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.style.flex = "1";
            btn.style.padding = "20px";
            btn.style.background = "rgba(255,255,255,0.05)";
            btn.style.border = "1px solid var(--accent-color)";
            btn.style.color = "white";
            btn.style.cursor = "pointer";
            btn.innerHTML = `<div style='font-size:2rem'>${opt.icon}</div><br><strong>${opt.name}</strong>`;

            btn.onclick = () => {
                this.unlockedStarters.push(opt.type);
                localStorage.setItem('apex_horizons_starters', JSON.stringify(this.unlockedStarters));
                modal.style.display = 'none';
                this.isGamePaused = false;
                this.StartRun(true);
            };
            container.appendChild(btn);
        });
    }

    StartRun(isSandbox) {
        const menu = document.getElementById('main-menu');
        const successModal = document.getElementById('tutorial-success');
        const hintPopup = document.getElementById('start-hint');
        const hintTitle = document.getElementById('hint-title');
        const hintDesc = document.getElementById('hint-desc');
        const hintIcon = document.getElementById('hint-icon');

        if (menu) menu.style.display = 'none';
        if (successModal) successModal.style.display = 'none';

        // Reset & Scaling
        this.GenerateGoals();
        PlayerInventory.Reset();
        this.boonTimer = 120;

        this.isGameStarted = true;
        this.isGamePaused = false;
        this.myBase = [];

        if (isSandbox) {
            this.currentGoal = this.goalsList[Math.floor(Math.random() * this.goalsList.length)];
            const goalHUD = document.getElementById('goal-hud');
            const goalText = document.getElementById('goal-text');
            if (goalHUD) goalHUD.style.display = 'block';
            if (goalText) goalText.innerText = this.currentGoal.desc;
            PlayerInventory.isSandboxMode = true;
            this.tutorialStep = 10;
            PlayerInventory.CryptoAmount = 1000;
            PlayerInventory.EnergyLevel = 100;
            PlayerInventory.OxygenLevel = 100;
            PlayerInventory.FoodLevel = 50;

            this.Start();

            const foodHUD = document.getElementById('food-display');
            if (foodHUD) foodHUD.style.display = 'flex';

            const hasVisitedSandbox = localStorage.getItem('apex_horizons_visited_sandbox');
            if (hintPopup && !hasVisitedSandbox) {
                hintPopup.style.display = 'block';
                hintIcon.innerText = "🚀";
                hintTitle.innerText = "Mode Survie Débloqué";
                hintTitle.style.color = "#00ff88";
                hintDesc.innerHTML = `
                    <strong>Meta-Progression :</strong> Vous garderez vos modules choisis au début pour toutes vos prochaines parties !<br>
                    <button onclick="document.getElementById('start-hint').style.display='none'; localStorage.setItem('apex_horizons_visited_sandbox', 'true');" style="margin-top:10px; padding:5px 10px; cursor:pointer; background:#00ff88; color:black; border:none; font-weight:bold;">C'EST PARTI !</button>
                `;
            }
        } else {
            PlayerInventory.isSandboxMode = false;
            this.tutorialStep = 0;
            PlayerInventory.CryptoAmount = 500;
            PlayerInventory.EnergyLevel = 100;
            PlayerInventory.OxygenLevel = 100;
            PlayerInventory.FoodLevel = 100;
            this.Start();
            const foodHUD = document.getElementById('food-display');
            if (foodHUD) foodHUD.style.display = 'none';
            if (hintPopup) {
                hintPopup.style.display = 'block';
                hintIcon.innerText = "⚠️";
                hintTitle.innerText = "Survie Initiale";
                hintTitle.style.color = "#ff6400";
                hintDesc.innerHTML = "Achetez <strong>2 Réservoirs à Oxygène</strong>.";
            }
        }
    }

    Start() {
        Antigravity.camera.IsOrthographic = true;
        Antigravity.camera.Rotation = new Vector3(35.264, 45, 0);

        const starterSolar = new SolarPanel();
        starterSolar.GridX = 0; starterSolar.GridZ = 0;
        starterSolar.Position = GridManager.GridToWorld(0, 0);

        const starterDortoir = new Dortoir();
        starterDortoir.GridX = 1; starterDortoir.GridZ = 0;
        starterDortoir.Position = GridManager.GridToWorld(1, 0);

        this.myBase.push(starterSolar);
        this.myBase.push(starterDortoir);

        // Placement des bonus d'héritage (Roguelite) - Placement proche du centre
        if (PlayerInventory.isSandboxMode) {
            // Liste ordonnée de positions candidates proches du hub (0,0) et (1,0)
            const candidates = [
                { x: 0, z: 1 }, { x: 1, z: 1 }, { x: 0, z: -1 }, { x: 1, z: -1 },
                { x: -1, z: 0 }, { x: 2, z: 0 }, { x: -1, z: 1 }, { x: 2, z: 1 },
                { x: -1, z: -1 }, { x: 2, z: -1 }, { x: 0, z: 2 }, { x: 1, z: 2 }
            ];

            let candIdx = 0;
            this.unlockedStarters.forEach((type) => {
                let mod;
                if (type === 'solar') mod = new SolarPanel();
                if (type === 'oxygen') mod = new OxygenReserve();
                if (type === 'pop') mod = new Dortoir();

                if (mod) {
                    // Trouver la prochaine position libre dans les candidats
                    while (candIdx < candidates.length) {
                        const pos = candidates[candIdx++];
                        const isOccupied = this.myBase.some(m => m.GridX === pos.x && m.GridZ === pos.z);
                        if (!isOccupied) {
                            mod.GridX = pos.x; mod.GridZ = pos.z;
                            mod.Position = GridManager.GridToWorld(pos.x, pos.z);
                            this.myBase.push(mod);
                            break;
                        }
                    }
                }
            });
        }
    }

    ShowBoonSelection() {
        this.isGamePaused = true;
        const modal = document.getElementById('boon-modal');
        const container = document.getElementById('boon-choices');
        if (!modal || !container) return;

        container.innerHTML = "";
        // Tirer 2 boons aléatoires
        const shuffled = [...this.boonsPool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        selected.forEach(boon => {
            const btn = document.createElement('button');
            btn.style.width = "200px";
            btn.style.padding = "15px";
            btn.style.background = "#1a1e29";
            btn.style.border = "2px solid #ffcc00";
            btn.style.color = "white";
            btn.style.cursor = "pointer";
            btn.style.display = "flex";
            btn.style.flexDirection = "column";
            btn.style.alignItems = "center";
            btn.style.gap = "5px";

            btn.innerHTML = `
                <strong style="color: #ffcc00;">${boon.name}</strong>
                <span style="font-size: 0.8rem; opacity: 0.8;">${boon.desc}</span>
            `;

            btn.onclick = () => {
                boon.apply();
                modal.style.display = "none";
                this.isGamePaused = false;
            };
            container.appendChild(btn);
        });

        modal.style.display = "flex";
    }

    ShowSignalEvent() {
        this.isGamePaused = true;
        const modal = document.getElementById('choice-modal');
        const yesBtn = document.getElementById('choice-yes');
        const noBtn = document.getElementById('choice-no');
        if (!modal) return;

        yesBtn.onclick = () => {
            modal.style.display = 'none';
            this.isGamePaused = false;
            // Chance de virus
            if (Math.random() < 0.4) {
                PlayerInventory.isVirusActive = true;
                PlayerInventory.virusTimer = 20;
                // Popup info
                const hintPopup = document.getElementById('start-hint');
                if (hintPopup) {
                    hintPopup.style.display = 'block';
                    document.getElementById('hint-icon').innerText = "👾";
                    document.getElementById('hint-title').innerText = "VIRUS DÉTECTÉ";
                    document.getElementById('hint-title').style.color = "#ff4444";
                    document.getElementById('hint-desc').innerText = "Un malware ralentit vos mineurs pendant 20s !";
                    setTimeout(() => hintPopup.style.display = 'none', 5000);
                }
            } else {
                // Récompense !
                PlayerInventory.CryptoAmount += 250;
                const hintPopup = document.getElementById('start-hint');
                if (hintPopup) {
                    hintPopup.style.display = 'block';
                    document.getElementById('hint-icon').innerText = "💎";
                    document.getElementById('hint-title').innerText = "DONNÉES VENDUES";
                    document.getElementById('hint-title').style.color = "#00ff88";
                    document.getElementById('hint-desc').innerText = "Le signal contenait des infos précieuses. +250 Crypto !";
                    setTimeout(() => hintPopup.style.display = 'none', 5000);
                }
            }
        };

        noBtn.onclick = () => {
            modal.style.display = 'none';
            this.isGamePaused = false;
        };

        modal.style.display = "flex";
    }

    ShowMerchant() {
        const modal = document.getElementById('merchant-modal');
        const container = document.getElementById('trade-container');
        if (!modal || !container) return;

        this.isGamePaused = true;
        modal.style.display = 'flex';
        container.innerHTML = "";

        const possibleTrades = [
            { id: 'c_to_o', name: "Achat Oxygène", text: "200 💎 -> 500 🌬️", icon: "🌬️", cost: { type: 'crypto', val: 200 }, give: { type: 'oxygen', val: 500 } },
            { id: 'c_to_f', name: "Achat Ration", text: "150 💎 -> 300 🍱", icon: "🍱", cost: { type: 'crypto', val: 150 }, give: { type: 'food', val: 300 } },
            { id: 'f_to_c', name: "Vente Surplus", text: "100 🍱 -> 250 💎", icon: "💎", cost: { type: 'food', val: 100 }, give: { type: 'crypto', val: 250 } },
            { id: 'o_to_c', name: "Vente Gaz", text: "200 🌬️ -> 300 💎", icon: "💎", cost: { type: 'oxygen', val: 200 }, give: { type: 'crypto', val: 300 } },
            { id: 'c_to_e', name: "Batterie Urgence", text: "100 💎 -> 400 ⚡", icon: "⚡", cost: { type: 'crypto', val: 100 }, give: { type: 'energy', val: 400 } }
        ];

        const trades = possibleTrades.sort(() => 0.5 - Math.random()).slice(0, 3);

        trades.forEach(t => {
            const row = document.createElement('div');
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.padding = "15px";
            row.style.background = "rgba(255,255,255,0.05)";
            row.style.border = "1px solid rgba(255,204,0,0.3)";
            row.style.borderRadius = "5px";
            row.innerHTML = `
                <div style="text-align: left;">
                    <div style="font-weight: bold; color: #ffcc00;">${t.name}</div>
                    <div style="font-size: 0.9em; opacity: 0.8;">${t.text}</div>
                </div>
                <button style="background: #ffcc00; color: black; border: none; padding: 5px 15px; font-weight: bold; cursor: pointer;">ÉCHANGER</button>
            `;
            row.querySelector('button').onclick = () => this.ExecuteTrade(t);
            container.appendChild(row);
        });
    }

    ExecuteTrade(trade) {
        let canAfford = false;
        if (trade.cost.type === 'crypto') canAfford = PlayerInventory.CryptoAmount >= trade.cost.val;
        if (trade.cost.type === 'food') canAfford = PlayerInventory.FoodLevel >= trade.cost.val;
        if (trade.cost.type === 'oxygen') canAfford = PlayerInventory.OxygenLevel >= trade.cost.val;

        if (canAfford) {
            if (trade.cost.type === 'crypto') PlayerInventory.CryptoAmount -= trade.cost.val;
            if (trade.cost.type === 'food') PlayerInventory.FoodLevel -= trade.cost.val;
            if (trade.cost.type === 'oxygen') PlayerInventory.OxygenLevel -= trade.cost.val;
            if (trade.give.type === 'crypto') PlayerInventory.CryptoAmount += trade.give.val;
            if (trade.give.type === 'food') PlayerInventory.FoodLevel += trade.give.val;
            if (trade.give.type === 'oxygen') PlayerInventory.OxygenLevel += trade.give.val;
            if (trade.give.type === 'energy') PlayerInventory.EnergyLevel += trade.give.val;
            this.ShowMerchant();
        } else {
            alert("Ressources insuffisantes !");
        }
    }

    getValidPlacementCoords(moduleToPlace) {
        const occupied = new Set();
        this.myBase.forEach(m => occupied.add(`${m.GridX},${m.GridZ}`));

        const candidates = new Set();
        this.myBase.forEach(m => {
            const neighbors = [
                { x: m.GridX + 1, z: m.GridZ },
                { x: m.GridX - 1, z: m.GridZ },
                { x: m.GridX, z: m.GridZ + 1 },
                { x: m.GridX, z: m.GridZ - 1 }
            ];

            // --- LOGIQUE DE PLACEMENT LOGIQUE ---
            let canConnect = true;

            // Règle pour les mineurs : doivent être à côté d'une source d'énergie ou antenne
            if (moduleToPlace instanceof CryptoGenerator) {
                canConnect = (m instanceof RadioAntenna || m instanceof SolarPanel ||
                    m instanceof BatteryModule || m instanceof RecyclingModule);
            }
            // Règle pour les serres : doivent être à côté d'une réserve d'oxygène ou recyclage
            else if (moduleToPlace instanceof Greenhouse) {
                canConnect = (m instanceof OxygenReserve || m instanceof RecyclingModule);
            }
            // Règle pour les batteries : doivent être à côté d'un panneau solaire
            else if (moduleToPlace instanceof BatteryModule) {
                canConnect = (m instanceof SolarPanel);
            }
            // Règle pour le recyclage : doit être à côté d'un générateur d'oxygène
            else if (moduleToPlace instanceof RecyclingModule) {
                canConnect = (m instanceof OxygenReserve);
            }
            // Les modules de base (Solaire, Oxygène, Dortoir) peuvent se connecter à tout
            // pour servir de noeuds de connexion.

            if (canConnect) {
                neighbors.forEach(n => {
                    if (!occupied.has(`${n.x},${n.z}`)) {
                        candidates.add(`${n.x},${n.z}`);
                    }
                });
            }
        });
        return Array.from(candidates).map(s => {
            const [x, z] = s.split(',').map(Number);
            return { x, z };
        });
    }

    Update(deltaTime) {
        if (!this.isGameStarted || this.isGameOver || this.isGamePaused) return;

        this.currentPopulation = 0; // Utilisé pour les objectifs

        // --- GESTION DE LA CAMÉRA (ESPACE + CLIC) ---
        if (Input.GetKey("Space") && Antigravity.mouseClicked) {
            const dx = Antigravity.mousePos.x - this.lastMousePos.x;
            const dy = Antigravity.mousePos.y - this.lastMousePos.y;
            Antigravity.camera.Position.x += dx;
            Antigravity.camera.Position.y += dy;
        }
        this.lastMousePos.x = Antigravity.mousePos.x;
        this.lastMousePos.y = Antigravity.mousePos.y;

        // 1. BILAN DES RESSOURCES
        let totalEnergyProd = 0;
        let totalEnergyDemand = 0;
        let totalOxygenProd = 0;
        let totalOxygenDemand = 0;
        let totalPopulation = 0;
        let totalFoodProd = 0;
        let totalFoodDemand = 0;
        let currentEnergyMax = PlayerInventory.EnergyMax;
        let currentOxygenMax = PlayerInventory.OxygenMax;

        // Mise à jour des états temporaires
        if (PlayerInventory.isVirusActive) {
            PlayerInventory.virusTimer -= deltaTime;
            if (PlayerInventory.virusTimer <= 0) PlayerInventory.isVirusActive = false;
        }

        // Timers d'événements (seulement en sandbox)
        if (PlayerInventory.isSandboxMode) {
            this.boonTimer -= deltaTime;
            if (this.boonTimer <= 0) {
                this.boonTimer = 300; // Reset 5 min
                this.ShowBoonSelection();
            }

            this.signalTimer -= deltaTime;
            if (this.signalTimer <= 0) {
                this.signalTimer = 60 + Math.random() * 120;
                this.ShowSignalEvent();
            }
        }

        for (const m of this.myBase) {
            if (m instanceof Dortoir) totalPopulation += m.OccupantGenerated || 0;
            if (m instanceof BatteryModule) currentEnergyMax += (m.StorageBonus || 0);
            if (m instanceof RecyclingModule) currentOxygenMax += (m.StorageBonus || 0);
        }
        this.currentPopulation = totalPopulation;

        const popBonus = 1 + (Math.max(0, totalPopulation - 2) * 0.05);
        const foodMultiplier = (PlayerInventory.FoodLevel > 0) ? 1.0 : 0.8;
        const globalMultiplier = popBonus * foodMultiplier;

        for (const m of this.myBase) {
            // Énergie + Bonus global
            if (m instanceof SolarPanel) {
                totalEnergyProd += m.EnergyGenerated * globalMultiplier * PlayerInventory.SolarEfficiency;
            }
            if (m instanceof CryptoGenerator) {
                totalEnergyDemand += m.EnergyConsumption || 0;
            }

            // Oxygène + Bonus global
            if (m instanceof OxygenReserve) {
                totalOxygenProd += (m.OxygenProduction || 0) * globalMultiplier * PlayerInventory.OxygenEfficiency;
            }
            if (m instanceof Dortoir) {
                totalOxygenDemand += (m.OxygenConsumption || 0) * (m.OccupantGenerated || 1) * PlayerInventory.PopulationConsumption;
            }
            if (m instanceof Greenhouse) {
                totalOxygenDemand += (m.OxygenConsumption || 0);
            }

            // Population & Food
            if (m instanceof Greenhouse) {
                totalFoodProd += (m.FoodProduction || 0) * globalMultiplier * PlayerInventory.FoodEfficiency;
            }
            if (m instanceof Dortoir) {
                totalFoodDemand += (m.FoodConsumption || 0) * (m.OccupantGenerated || 1) * PlayerInventory.PopulationConsumption;
            }
        }

        // Ratio pour la prod de crypto (Virus impact)
        let viralMalus = PlayerInventory.isVirusActive ? 0.3 : 1.0;
        this.EnergyRatio = ((PlayerInventory.EnergyLevel > 0 || totalEnergyProd >= totalEnergyDemand) ? 1 : 0) * viralMalus;
        // --- MISE À JOUR DES STOCKS ---
        PlayerInventory.EnergyLevel += (totalEnergyProd - totalEnergyDemand) * deltaTime;
        PlayerInventory.EnergyLevel = Math.min(currentEnergyMax, Math.max(0, PlayerInventory.EnergyLevel));

        PlayerInventory.OxygenLevel += (totalOxygenProd - totalOxygenDemand) * deltaTime;
        PlayerInventory.OxygenLevel = Math.min(currentOxygenMax, Math.max(0, PlayerInventory.OxygenLevel));

        PlayerInventory.FoodLevel += (totalFoodProd - totalFoodDemand) * deltaTime;
        PlayerInventory.FoodLevel = Math.max(0, PlayerInventory.FoodLevel);

        // --- CONDITIONS DE DÉFAITE ---
        if (PlayerInventory.EnergyLevel <= 0 || PlayerInventory.OxygenLevel <= 0) {
            this.isGameOver = true;
            const modal = document.getElementById('game-over');
            const reasonElem = document.getElementById('death-reason');
            if (modal && reasonElem) {
                modal.style.display = 'flex';
                reasonElem.innerText = PlayerInventory.OxygenLevel <= 0
                    ? "L'équipage a succombé par manque d'oxygène."
                    : "Panne d'énergie critique. Systèmes de survie HS.";

                if (PlayerInventory.isSandboxMode) {
                    // Reset Roguelite progress on death in survival mode
                    this.completedRuns = 0;
                    this.unlockedStarters = [];
                    localStorage.setItem('apex_horizons_completed_runs', '0');
                    localStorage.setItem('apex_horizons_starters', '[]');
                    sessionStorage.setItem('apex_horizons_after_game', 'true');
                    reasonElem.innerText += " Votre héritage a été perdu...";
                }
            }
            return;
        }

        // --- SYSTÈME DE TUTORIEL SÉQUENTIEL ---
        const hintTitle = document.getElementById('hint-title');
        const hintDesc = document.getElementById('hint-desc');
        const hintPopup = document.getElementById('start-hint');
        const hintIcon = document.getElementById('hint-icon');

        switch (this.tutorialStep) {
            case 0: // Étape Oxygène
                const oxygenCount = this.myBase.filter(m => m instanceof OxygenReserve).length;
                if (oxygenCount >= 2) {
                    if (hintPopup) hintPopup.style.display = 'none';
                    this.tutorialStep = 1;
                    this.tutorialTimer = 3; // Attendre 3 secondes
                }
                break;

            case 1: // Attente avant Crypto
                this.tutorialTimer -= deltaTime;
                if (this.tutorialTimer <= 0) {
                    this.tutorialStep = 2;
                    if (hintPopup) {
                        hintPopup.style.display = 'block';
                        hintIcon.innerText = "💰";
                        hintTitle.innerText = "Expansion Économique";
                        hintTitle.style.color = "#00ff88";
                        hintDesc.innerHTML = "Placez <strong>2 générateurs de crypto</strong> au total pour sécuriser vos revenus.";
                    }
                }
                break;

            case 2: // Étape Crypto
                const minerCount = this.myBase.filter(m => m instanceof CryptoGenerator).length;
                if (minerCount >= 2) {
                    if (hintPopup) hintPopup.style.display = 'none';
                    this.tutorialStep = 2.5;
                    this.tutorialTimer = 5; // Attendre 5 secondes
                }
                break;

            case 2.5: // Attente avant alerte Énergie
                this.tutorialTimer -= deltaTime;
                // On déclenche l'étape 3 seulement si le timer est fini ET que l'énergie baisse
                if (this.tutorialTimer <= 0 && totalEnergyProd < totalEnergyDemand) {
                    this.tutorialStep = 3;
                    if (hintPopup) {
                        hintPopup.style.display = 'block';
                        hintIcon.innerText = "⚡";
                        hintTitle.innerText = "Alerte Énergie";
                        hintTitle.style.color = "#ff4444";
                        hintDesc.innerHTML = "L'énergie est critique !<br>Posez <strong>3 Panneaux Solaires</strong> au total d'urgence !";
                    }
                }
                break;

            case 3: // Étape Énergie
                const solarCount = this.myBase.filter(m => m instanceof SolarPanel).length;
                if (hintDesc) {
                    hintDesc.innerHTML = `L'énergie est critique !<br>Posez <strong>3 Panneaux Solaires</strong> au total. (${solarCount}/4)`;
                }
                if (solarCount >= 4) {
                    if (hintPopup) hintPopup.style.display = 'none';
                    this.tutorialStep = 3.5;
                    this.tutorialTimer = 15; // Attendre 15 secondes après l'énergie
                }
                break;

            case 3.5: // Attente avant Population
                this.tutorialTimer -= deltaTime;
                if (this.tutorialTimer <= 0) {
                    this.tutorialStep = 4;
                    if (hintPopup) {
                        hintPopup.style.display = 'block';
                        hintIcon.innerText = "👥";
                        hintTitle.innerText = "Expansion Humaine";
                        hintTitle.style.color = "#00f2ff";
                        hintDesc.innerHTML = "Placez <strong>3 Dortoirs</strong> au total.<br>⚠️ Surveillez bien vos réserves d'<strong>Oxygène</strong> !";
                    }
                }
                break;

            case 4: // Étape Population (Fin du tuto)
                const dortoirCount = this.myBase.filter(m => m instanceof Dortoir).length;
                if (hintDesc) {
                    hintDesc.innerHTML = `Placez <strong>3 Dortoirs</strong> au total. (${dortoirCount}/4)<br>⚠️ Surveillez bien vos réserves d'<strong>Oxygène</strong> !`;
                }
                if (dortoirCount >= 4) {
                    this.tutorialStep = 5;
                    this.tutorialTimer = 60; // 60 secondes de survie
                    if (hintPopup) {
                        hintPopup.style.display = 'block';
                        hintIcon.innerText = "⏳";
                        hintTitle.innerText = "Phase de Survie";
                        hintTitle.style.color = "#ffcc00";
                    }
                }
                break;

            case 5: // Phase de survie finale
                this.tutorialTimer -= deltaTime;
                if (hintDesc) {
                    hintDesc.innerHTML = `Maintenez la station opérationnelle pendant encore <strong>${Math.ceil(this.tutorialTimer)}s</strong>.`;
                }
                if (this.tutorialTimer <= 0) {
                    this.tutorialStep = 6;
                    if (hintPopup) hintPopup.style.display = 'none';
                    const successModal = document.getElementById('tutorial-success');
                    if (successModal) successModal.style.display = 'flex';
                }
                break;

            case 6: // Attente action du joueur sur le modal
                break;
        }

        // Ratio pour la prod de crypto
        this.EnergyRatio = (PlayerInventory.EnergyLevel > 0 || totalEnergyProd >= totalEnergyDemand) ? 1 : 0;

        // 2. RENDU DE LA GRILLE GLOBALE
        const gridRange = 10; // Étendue de la grille
        for (let x = -gridRange; x <= gridRange; x++) {
            for (let z = -gridRange; z <= gridRange; z++) {
                const isOccupied = this.myBase.some(m => m.GridX === x && m.GridZ === z);
                if (!isOccupied) {
                    const worldPos = GridManager.GridToWorld(x, z);
                    // Dessiner juste le contour de la case en blanc très discret
                    Draw.IsometricCube(worldPos, 'transparent', null, 'rgba(255, 255, 255, 0.05)');
                }
            }
        }

        // 3. MISE À JOUR ET RENDU DES MODULES (Triés par profondeur)
        // On trie pour que les modules au "fond" soient dessinés en premier
        const sortedModules = [...this.myBase].sort((a, b) => (a.GridX + a.GridZ) - (b.GridX + b.GridZ));

        for (const module of sortedModules) {
            module.Update(deltaTime);
            if (module instanceof CryptoGenerator) {
                // Le mineur profite aussi du bonus !
                module.UpdateProduction(deltaTime, this.EnergyRatio, popBonus * PlayerInventory.CryptoEfficiency);
            }
            module.Render(Draw);
        }

        // 4. VÉRIFICATION OBJECTIF
        if (PlayerInventory.isSandboxMode && this.currentGoal) {
            const goalBar = document.getElementById('goal-bar');
            const progress = Math.min(100, this.currentGoal.progress(this));
            if (goalBar) goalBar.style.width = progress + "%";

            if (this.currentGoal.check(this)) {
                this.isGameOver = true;
                this.completedRuns++;
                localStorage.setItem('apex_horizons_completed_runs', this.completedRuns);
                sessionStorage.setItem('apex_horizons_after_game', 'true');

                const modal = document.getElementById('tutorial-success');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.querySelector('h1').innerText = "OBJECTIF ATTEINT !";
                    modal.querySelector('p').innerText = `Vous avez accompli : ${this.currentGoal.title}`;
                    const btn = modal.querySelector('button');
                    btn.innerText = "NOUVELLE RUN";
                    btn.onclick = () => location.reload();
                    modal.querySelector('button:last-child').style.display = "none";
                }
            }
        }

        // 5. INTERFACE
        this.shop.RenderShopWindow(Draw, UI);

        // Mise à jour du HUD HTML
        const cryptoElem = document.getElementById('crypto-val');
        if (cryptoElem) cryptoElem.innerText = Math.floor(PlayerInventory.CryptoAmount);

        const energyElem = document.getElementById('energy-val');
        if (energyElem) {
            const trend = (totalEnergyProd - totalEnergyDemand) >= 0 ? "+" : "";
            energyElem.innerText = `${Math.floor(PlayerInventory.EnergyLevel)}/${currentEnergyMax} (${trend}${(totalEnergyProd - totalEnergyDemand).toFixed(1)})`;
            energyElem.style.color = PlayerInventory.EnergyLevel < (currentEnergyMax * 0.2) ? "#ff4444" : "#00f2ff";
        }

        const oxygenElem = document.getElementById('oxygen-val');
        if (oxygenElem) {
            const trend = (totalOxygenProd - totalOxygenDemand) >= 0 ? "+" : "";
            oxygenElem.innerText = `${Math.floor(PlayerInventory.OxygenLevel)}/${currentOxygenMax} (${trend}${(totalOxygenProd - totalOxygenDemand).toFixed(1)})`;
            oxygenElem.style.color = PlayerInventory.OxygenLevel < (currentOxygenMax * 0.2) ? "#ff4444" : "#00f2ff";
        }

        const popElem = document.getElementById('pop-val');
        if (popElem) popElem.innerText = totalPopulation;

        const popBonusElem = document.getElementById('pop-bonus');
        if (popBonusElem) {
            const bonusPercent = Math.round((popBonus - 1) * 100);
            popBonusElem.innerText = `(+${bonusPercent}%)`;
        }

        const foodHUD = document.getElementById('food-display');
        if (foodHUD) foodHUD.style.display = PlayerInventory.isSandboxMode ? 'flex' : 'none';

        const foodElem = document.getElementById('food-val');
        if (foodElem) {
            const trend = (totalFoodProd - totalFoodDemand) >= 0 ? "+" : "";
            foodElem.innerText = `${Math.floor(PlayerInventory.FoodLevel)} (${trend}${(totalFoodProd - totalFoodDemand).toFixed(1)})`;
            foodElem.style.color = PlayerInventory.FoodLevel < 10 ? "#ff4444" : "#00ff88";
        }

        const currentModules = this.myBase.length;
        const moduleLimit = 4 + (totalPopulation * 3);
        const moduleValElem = document.getElementById('module-val');
        if (moduleValElem) {
            moduleValElem.innerText = `${currentModules}/${moduleLimit}`;
            moduleValElem.style.color = currentModules >= moduleLimit ? "#ff4444" : "#00f2ff";
        }

        // 4. LOGIQUE DE PLACEMENT (Le "fantôme" du module)
        if (this.shop.selectedModuleForPlacement != null && !this.shop.isMouseOver) {
            const proto = this.shop.selectedModuleForPlacement;
            const validCells = this.getValidPlacementCoords(proto);

            // Afficher les cases disponibles en gris clair
            validCells.forEach(cell => {
                const worldPos = GridManager.GridToWorld(cell.x, cell.z);
                Draw.IsometricCube(worldPos, 'rgba(200, 200, 200, 0.2)');
            });

            const mousePos = Input.GetMouseToWorldPlane();
            const gridX = Math.round(mousePos.X);
            const gridZ = Math.round(mousePos.Z);
            const snappedPos = GridManager.GridToWorld(gridX, gridZ);

            const existingModule = this.myBase.find(m => m.GridX === gridX && m.GridZ === gridZ);
            const isOccupied = existingModule !== undefined;
            const isAdjacent = validCells.some(c => c.x === gridX && c.z === gridZ);
            const canAfford = PlayerInventory.CanAfford(proto.CryptoCost);

            // Un dortoir peut remplacer n'importe quel module
            const isReplacement = isOccupied && (proto instanceof Dortoir);
            const hasSpace = isReplacement || (currentModules < moduleLimit);

            let statusMessage = "Placer";
            let ghostColor = 'rgba(0, 255, 0, 0.3)'; // Vert par défaut

            if (isOccupied && !isReplacement) {
                statusMessage = "Case occupée";
                ghostColor = 'rgba(255, 0, 0, 0.3)';
            } else if (isReplacement) {
                statusMessage = "Remplacer";
                ghostColor = 'rgba(0, 200, 255, 0.5)';
            } else if (!isAdjacent) {
                statusMessage = "Trop loin du hub";
                ghostColor = 'rgba(255, 100, 0, 0.3)';
            } else if (!canAfford) {
                statusMessage = `Pas assez de Crypto (${proto.CryptoCost})`;
                ghostColor = 'rgba(255, 255, 0, 0.3)';
            } else if (!hasSpace) {
                statusMessage = "Limite de modules (Ajoutez des Dortoirs)";
                ghostColor = 'rgba(255, 0, 255, 0.3)';
            }

            // Dessiner le fantôme avec le message correspondant
            Draw.IsometricCube(snappedPos, ghostColor, statusMessage);

            if (Input.GetMouseButtonDown(0)) {
                if ((!isOccupied || isReplacement) && isAdjacent && canAfford && hasSpace) {
                    if (isReplacement) {
                        // Supprimer l'ancien module
                        this.myBase = this.myBase.filter(m => m !== existingModule);
                    }

                    PlayerInventory.SpendCrypto(proto.CryptoCost);

                    // Créer une copie
                    const newModule = new proto.constructor();
                    newModule.GridX = gridX;
                    newModule.GridZ = gridZ;
                    newModule.Position = snappedPos;
                    newModule.Name = proto.Name;
                    this.myBase.push(newModule);

                    if (newModule instanceof RadioAntenna) {
                        this.ShowMerchant();
                    }

                    this.shop.selectedModuleForPlacement = null;
                }
            }
        }
    }
}

// Initialisation et boucle de jeu
const game = new MyGame();
// game.Start(); // NE PAS APPELER ICI, window.startGame s'en charge

let lastTime = 0;
function loop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    Antigravity.Clear();
    game.Update(deltaTime || 0);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);