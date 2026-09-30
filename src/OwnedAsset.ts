import {Asset} from "./Asset.js";
import {Player} from "./Player.js";

export interface OwnedAssetSave {
    assetId: string;
    value: number;
    years: number;
}

export class OwnedAsset {
    public _value: number;
    /**
     * Used by Luxury Car to keep track of years until the car becomes classic
     */
    public years: number = 0;

    public constructor(public readonly asset: Asset) {
        this._value = asset.buyCost;
        if (asset === Asset.LuxuryCar)
            this.years = 15;
    }

    public onNewTurn(player: Player) {
        this.asset.onNewTurn(this, player);
    }

    public remove(player: Player) {
        player.removeAsset(this.asset);
    }

    public toJSON(): OwnedAssetSave {
        return {assetId: this.asset.id, value: this._value, years: this.years};
    }

    public static fromJSON(data: OwnedAssetSave): OwnedAsset {
        const ownedAsset = new OwnedAsset(Asset.byId(data.assetId));
        ownedAsset._value = data.value;
        ownedAsset.years = data.years;
        return ownedAsset;
    }
}