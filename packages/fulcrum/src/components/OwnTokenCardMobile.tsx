import { BigNumber } from "@0x/utils";
import React, { Component } from "react";
import { Asset } from "../domain/Asset";
import { AssetDetails } from "../domain/AssetDetails";
import { AssetsDictionary } from "../domain/AssetsDictionary";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { PositionType } from "../domain/PositionType";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { TradeType } from "../domain/TradeType";
import { FulcrumProviderEvents } from "../services/events/FulcrumProviderEvents";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";
import { TradeTransactionMinedEvent } from "../services/events/TradeTransactionMinedEvent";
import { FulcrumProvider } from "../services/FulcrumProvider";
import { PositionTypeMarkerAlt } from "./PositionTypeMarkerAlt";
import { Preloader } from "./Preloader";
import { ReactComponent as OpenManageCollateral } from "../assets/images/openManageCollateral.svg";
import { ManageCollateralRequest } from "../domain/ManageCollateralRequest";

import "../styles/components/own-token-card-mobile.scss";
import { IBorrowedFundsState } from "../domain/IBorrowedFundsState";

export interface IOwnTokenCardMobileProps {
  loan: IBorrowedFundsState;
  currentKey: TradeTokenKey;
  onTrade: (request: TradeRequest) => void;
  onManageCollateralOpen: (request: ManageCollateralRequest) => void;
}

interface IOwnTokenCardMobileState {
  assetDetails: AssetDetails | null;

  latestAssetPriceDataPoint: IPriceDataPoint;
  assetBalance: BigNumber | null;
  profit: BigNumber | null;
  isLoading: boolean;
}

export class OwnTokenCardMobile extends Component<IOwnTokenCardMobileProps, IOwnTokenCardMobileState> {
  constructor(props: IOwnTokenCardMobileProps, context?: any) {
    super(props, context);

    const assetDetails = AssetsDictionary.assets.get(props.currentKey.asset);

    this._isMounted = false;
    this.state = {
      assetDetails: assetDetails || null,
      latestAssetPriceDataPoint: FulcrumProvider.Instance.getPriceDefaultDataPoint(),
      assetBalance: new BigNumber(0),
      profit: new BigNumber(0),
      isLoading: true
    };

    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderAvailable, this.onProviderAvailable);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.TradeTransactionMined, this.onTradeTransactionMined);
  }

  private _isMounted: boolean;

  private async derivedUpdate() {
    const tradeTokenKey = this.props.currentKey;
    const latestAssetPriceDataPoint = await FulcrumProvider.Instance.getTradeTokenAssetLatestDataPoint(tradeTokenKey);

    const data: [BigNumber | null, BigNumber | null] = await FulcrumProvider.Instance.getTradeBalanceAndProfit(tradeTokenKey);
    const assetBalance = data[0];
    const profit = data[1];

    this._isMounted && this.setState(p => ({
      ...this.state,
      latestAssetPriceDataPoint: latestAssetPriceDataPoint,
      assetBalance: assetBalance,
      profit: profit,
      isLoading: latestAssetPriceDataPoint.price !== 0 ? false : p.isLoading
    }));
  }

  private onProviderAvailable = async () => {
    await this.derivedUpdate();
  };

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  private onTradeTransactionMined = async (event: TradeTransactionMinedEvent) => {
    if (event.key.toString() === this.props.currentKey.toString()) {
      await this.derivedUpdate();
    }
  };

  public componentWillUnmount(): void {
    this._isMounted = false;

    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderAvailable, this.onProviderAvailable);
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.TradeTransactionMined, this.onTradeTransactionMined);
  }

  public componentDidMount(): void {
    this._isMounted = true;

    this.derivedUpdate();
  }
  public render() {
    if (!this.state.assetDetails) {
      return null;
    }

    const bnPrice = new BigNumber(this.state.latestAssetPriceDataPoint.price);
    const bnLiquidationPrice = new BigNumber(this.state.latestAssetPriceDataPoint.liquidationPrice);
    return (
      <div className="own-token-card-mobile">
        <div className="own-token-card-mobile__body">
          <div className="own-token-card-mobile__body-header">
            <span className="own-token-card-mobile__asset-name">Asset</span>
            <span className="own-token-card-mobile__position-type">Type</span>
            <span className="own-token-card-mobile__unit-of-account">Unit of Account</span>
          </div>
          <div className="own-token-card-mobile__body-row">
            <div className="own-token-card-mobile__asset-name">
              <span className="own-token-card-mobile__value">
                {`${this.state.assetDetails.displayName}`}
              </span>
            </div>
            <div className="own-token-card-mobile__position-type">
              <span className="position-type-marker">{`${this.props.currentKey.leverage}x`}&nbsp;{this.props.currentKey.positionType}</span>
            </div>
            <div title={this.props.currentKey.unitOfAccount} className="own-token-card-mobile__unit-of-account">
              <span className="own-token-card-mobile__value">{this.props.currentKey.unitOfAccount}</span>
            </div>
            <div className="own-token-card-mobile__action">
              <button className="own-token-card-mobile__sell-button own-token-card-mobile__button--size-half" onClick={this.onSellClick}>
                {TradeType.SELL}
              </button>
            </div>
          </div>
          <div className="own-token-card-mobile__body-row">
            <div className="own-token-card-mobile__position">
              <span className="own-token-card-mobile__body-header">Position({this.props.currentKey.asset})</span>
              <span className="own-token-card-mobile__value">
                {!this.state.isLoading ?
                  <React.Fragment><span className="sign-currency">$</span>0.8884</React.Fragment>
                  : <Preloader width="74px" />
                }
              </span>
            </div>
            <div title={`$${bnPrice.toFixed(18)}`} className="own-token-card-mobile__price">
              <span className="own-token-card-mobile__body-header">Asset Price</span>
              <span className="own-token-card-mobile__value">
                {!this.state.isLoading ?
                  <React.Fragment><span className="sign-currency">$</span>{bnPrice.toFixed(2)}</React.Fragment>
                  : <Preloader width="74px" />
                }
              </span>
            </div>
            <div title={`$${bnLiquidationPrice.toFixed(18)}`} className="own-token-card-mobile__liquidation-price">
              <span className="own-token-card-mobile__body-header">Liq. Price</span>
              <span className="own-token-card-mobile__value">
                {!this.state.isLoading ?
                  <React.Fragment><span className="sign-currency">$</span>{bnLiquidationPrice.toFixed(2)}</React.Fragment>
                  : <Preloader width="74px" />
                }
              </span>
            </div>
          </div>
          <div className="own-token-card-mobile__body-row">
            <div className="own-token-card-mobile__collateral">
              <span className="own-token-card-mobile__body-header">Collateral</span>
              <div className="own-token-card-mobile__col-collateral-wrapper">
                <span className="own-token-card-mobile__value"><span className="sign-currency">$</span>15.25</span>
                <span className="own-token-card-mobile__col-asset-collateral-small">16.5%</span>
              </div>
              <div className="own-token-card-mobile__open-manage-collateral" onClick={this.onManageClick}>
                <OpenManageCollateral />
              </div>
            </div>
            <div title={this.state.assetBalance ? `$${this.state.assetBalance.toFixed(18)}` : ``} className="own-token-card-mobile__position-value">
              <span className="own-token-card-mobile__body-header">Value</span>
              <span className="own-token-card-mobile__value">
                {!this.state.isLoading ?
                  this.state.assetBalance ?
                    <React.Fragment><span className="sign-currency">$</span>{this.state.assetBalance.toFixed(2)}</React.Fragment> :
                    <React.Fragment><span className="sign-currency">$</span>0.00</React.Fragment> :
                  <Preloader width="74px" />
                }
              </span>
            </div>
            <div title={this.state.profit ? `$${this.state.profit.toFixed(18)}` : ``} className="own-token-card-mobile__profit">
              <span className="own-token-card-mobile__body-header">Profit</span>
              <span className="own-token-card-mobile__value">
                {!this.state.isLoading ?
                  this.state.profit ?
                    <React.Fragment><span className="sign-currency">$</span>{this.state.profit.toFixed(2)}</React.Fragment> :
                    <React.Fragment><span className="sign-currency">$</span>0.0000</React.Fragment> :
                  <Preloader width="74px" />
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  public onDetailsClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  public onManageClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    this.props.onManageCollateralOpen(
      new ManageCollateralRequest(
        new BigNumber(0),
        TradeType.BUY,
        this.props.currentKey.asset,
        this.props.currentKey.unitOfAccount,
        this.props.currentKey.positionType === PositionType.SHORT ? this.props.currentKey.asset : Asset.USDC,
        this.props.currentKey.positionType,
        this.props.currentKey.leverage,
        new BigNumber(0),
        this.props.currentKey.isTokenized,
        this.props.currentKey.version
      )
    );
  };

  public onSellClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onTrade(
      new TradeRequest(
        this.props.loan.loanId,
        TradeType.SELL,
        this.props.loan.loanAsset,
        Asset.UNKNOWN,
        this.props.loan.collateralAsset,
        this.props.loan.collateralAsset === Asset.ETH 
        ? PositionType.LONG 
        : PositionType.SHORT,
        this.props.currentKey.leverage,
        new BigNumber(0)
      )
    );
  };
}