import { BigNumber } from "@0x/utils";
import { Asset } from "./Asset";

export class ManageCollateralRequest {
  public asset: Asset;
  public repayPercent: BigNumber;

  constructor(asset: Asset, collateralPercent: BigNumber) {
    this.asset = asset;
    this.repayPercent = collateralPercent;
  }
}
