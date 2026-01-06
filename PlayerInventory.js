export const PlayerInventory = {
    CryptoAmount: 500.0,
    EnergyLevel: 100.0,
    EnergyMax: 200.0,      // Nouveau : Limite de base
    OxygenLevel: 100.0,
    OxygenMax: 200.0,      // Nouveau : Limite de base
    FoodLevel: 50.0,       // Nouveau : Stock de nourriture
    FoodMax: 100.0,
    isSandboxMode: false,

    // Boons Multipliers
    SolarEfficiency: 1.0,
    CryptoEfficiency: 1.0,
    OxygenEfficiency: 1.0,
    FoodEfficiency: 1.0,
    ModuleCostMultiplier: 1.0,
    PopulationConsumption: 1.0,

    // States
    isVirusActive: false,
    virusTimer: 0,

    // Science & Research
    SciencePoints: 0,
    ScienceEfficiency: 1.0,
    ResearchedTechs: [],

    Reset: function () {
        this.CryptoAmount = 500.0;
        this.EnergyLevel = 100.0;
        this.EnergyMax = 200.0;
        this.OxygenLevel = 100.0;
        this.OxygenMax = 200.0;
        this.FoodLevel = 50.0;
        this.FoodMax = 100.0;
        this.isSandboxMode = false;
        this.SolarEfficiency = 1.0;
        this.CryptoEfficiency = 1.0;
        this.OxygenEfficiency = 1.0;
        this.FoodEfficiency = 1.0;
        this.ModuleCostMultiplier = 1.0;
        this.PopulationConsumption = 1.0;
        this.isVirusActive = false;
        this.virusTimer = 0;
        this.SciencePoints = 0;
        this.ScienceEfficiency = 1.0;
        this.ResearchedTechs = [];
    },

    CanAfford: function (cost) {
        const actualCost = cost * this.ModuleCostMultiplier;
        return this.CryptoAmount >= actualCost;
    },

    SpendCrypto: function (cost) {
        const actualCost = cost * this.ModuleCostMultiplier;
        if (this.CanAfford(cost)) {
            this.CryptoAmount -= actualCost;
            return true;
        }
        return false;
    }
};
