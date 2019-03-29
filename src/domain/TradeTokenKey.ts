import { Asset } from "./Asset";
import { PositionType } from "./PositionType";

export class TradeTokenKey {
  public asset: Asset;
  public positionType: PositionType;
  public leverage: number;

  constructor(asset: Asset, positionType: PositionType, leverage: number) {
    this.asset = asset;
    this.positionType = positionType;
    this.leverage = leverage;
  }

  public static empty(): TradeTokenKey {
    return new TradeTokenKey(Asset.UNKNOWN, PositionType.SHORT, 0);
  }

  public toString(): string {
    return `${this.asset}_${this.positionType}_${this.leverage}`;
  }
}