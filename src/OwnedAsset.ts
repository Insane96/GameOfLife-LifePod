import {Asset} from "./Asset";
import {Player} from "./Player";

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
}