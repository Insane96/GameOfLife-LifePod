import {OwnedAsset} from "./OwnedAsset.js";
import {Player} from "./Player.js";

export class Asset {
    // Populated by the constructor as each static Asset below is initialized; must be declared
    // before them since static field initializers run in declaration order.
    private static readonly registry = new Map<string, Asset>();

    private static readonly houseOnNewTurn: (ownedAsset: OwnedAsset, player: Player) => void = (ownedAsset, player) => {
        ownedAsset._value *= 1.06;
    };

    public static EconomyCar: Asset = new Asset("EconomyCar", 10000, 100, 1000, (ownedAsset, player) => {
        ownedAsset._value -= 1000;
        if (ownedAsset._value <= 0)
            ownedAsset.remove(player);
    });
    public static LuxuryCar: Asset = new Asset("LuxuryCar", 50000, 200, 2000, (ownedAsset, player) => {
        ownedAsset.years--;
        if (ownedAsset.years <= 0) {
            ownedAsset._value += 5000;
        }
        else {
            ownedAsset._value -= 5000;
            if (ownedAsset._value <= 10000)
                ownedAsset._value = 10000;
        }
    });
    public static SmallHouse: Asset = new Asset("SmallHouse", 200000, 100, 0, Asset.houseOnNewTurn);
    public static MediumHouse: Asset = new Asset("MediumHouse", 500000, 100, 0, Asset.houseOnNewTurn);
    public static BigHouse: Asset = new Asset("BigHouse", 1000000, 100, 0, Asset.houseOnNewTurn);

    private constructor(
        public readonly id: string,
        public readonly buyCost: number,
        public readonly lifePointsPerTurn: number,
        public readonly costPerTurn: number,
        public readonly onNewTurnExtra: (ownedAsset: OwnedAsset, player: Player) => void,
    ) {
        Asset.registry.set(id, this);
    }

    /**
     * Reconstructs the singleton Asset instance saved by id (see toJSON()/fromJSON() on
     * OwnedAsset): an Asset itself can't be serialized, since onNewTurnExtra is a function.
     */
    public static byId(id: string): Asset {
        const asset = Asset.registry.get(id);
        if (asset === undefined)
            throw new Error(`Unknown asset id: ${id}`);
        return asset;
    }

    public onNewTurn(ownedAsset: OwnedAsset, player: Player) {
        if (this.lifePointsPerTurn > 0)
            player.addLifePoints(this.lifePointsPerTurn);
        if (this.costPerTurn > 0)
            player.removeMoney(this.costPerTurn);
        this.onNewTurnExtra(ownedAsset, player);
    }

    public isCar(): boolean {
        return this === Asset.EconomyCar || this === Asset.LuxuryCar;
    }

    public isHouse(): boolean {
        return this === Asset.SmallHouse || this === Asset.MediumHouse || this === Asset.BigHouse;
    }
}