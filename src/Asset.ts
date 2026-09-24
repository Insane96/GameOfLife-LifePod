import {OwnedAsset} from "./OwnedAsset.js";
import {Player} from "./Player.js";

export class Asset {
    private static readonly houseOnNewTurn: (ownedAsset: OwnedAsset, player: Player) => void = (ownedAsset, player) => {
        ownedAsset._value *= 1.06;
    };

    public static EconomyCar: Asset = new Asset(10000, 100, 1000, (ownedAsset, player) => {
        ownedAsset._value -= 1000;
        if (ownedAsset._value <= 0)
            ownedAsset.remove(player);
    });
    public static LuxuryCar: Asset = new Asset(50000, 200, 2000, (ownedAsset, player) => {
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
    public static SmallHouse: Asset = new Asset(200000, 100, 0, Asset.houseOnNewTurn);
    public static MediumHouse: Asset = new Asset(500000, 100, 0, Asset.houseOnNewTurn);
    public static BigHouse: Asset = new Asset(1000000, 100, 0, Asset.houseOnNewTurn);

    private constructor(
        public readonly buyCost: number,
        public readonly lifePointsPerTurn: number,
        public readonly costPerTurn: number,
        public readonly onNewTurnExtra: (ownedAsset: OwnedAsset, player: Player) => void,
    ) {

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