export const GridManager = {
    TileWidth: 2.0,
    TileHeight: 1.0,

    // Convertit des coordonnées entières (x, z) en position 3D Isométrique
    GridToWorld: function (x, z) {
        const worldX = (x - z) * (this.TileWidth / 2);
        const worldZ = (x + z) * (this.TileHeight / 2);
        return { x: worldX, y: 0, z: worldZ };
    }
};
