import {OwnedAsset} from "./OwnedAsset";
import {Player} from "./Player";

export class Asset {
    private static readonly houseOnNewTurn: (ownedAsset: OwnedAsset, player: Player) => void = (ownedAsset, player) => {
        ownedAsset._value *= 1.06;
        player.addLifePoints(ownedAsset.asset.lifePointsPerTurn);
    };

    public static EconomyCar: Asset = new Asset(10000, 100, 0.1, (ownedAsset, player) => {
        ownedAsset._value -= 1000;
        if (ownedAsset._value <= 0)
            ownedAsset.remove(player);
        player.addLifePoints(ownedAsset.asset.lifePointsPerTurn);
    });
    public static LuxuryCar: Asset = new Asset(50000, 200, 0.1, (ownedAsset, player) => {
        ownedAsset.years--;
        if (ownedAsset.years <= 0) {
            ownedAsset._value += 5000;
        }
        else {
            ownedAsset._value -= 5000;
            if (ownedAsset._value <= 10000)
                ownedAsset._value = 10000;
        }
        player.addLifePoints(ownedAsset.asset.lifePointsPerTurn);
    });
    public static SmallHouse: Asset = new Asset(200000, 100, 0, Asset.houseOnNewTurn);
    public static MediumHouse: Asset = new Asset(500000, 100, 0, Asset.houseOnNewTurn);
    public static BigHouse: Asset = new Asset(1000000, 100, 0, Asset.houseOnNewTurn);

    private constructor(
        public readonly buyCost: number,
        public readonly lifePointsPerTurn: number,
        public readonly costPerTurn: number,
        public readonly onNewTurn: (ownedAsset: OwnedAsset, player: Player) => void,
    ) {

    }
}