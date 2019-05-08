import { BigNumber } from "@0x/utils";
import React, { Component } from "react";
import { AssetDetails } from "../domain/AssetDetails";
import { AssetsDictionary } from "../domain/AssetsDictionary";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { TradeType } from "../domain/TradeType";
import { FulcrumProviderEvents } from "../services/events/FulcrumProviderEvents";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";
import { FulcrumProvider } from "../services/FulcrumProvider";
//import { Change24HMarker, Change24HMarkerSize } from "./Change24HMarker";

export interface IOwnTokenGridRowProps {
  selectedKey: TradeTokenKey;
  currentKey: TradeTokenKey;
  balance: BigNumber;

  onSelect: (key: TradeTokenKey) => void;
  onDetails: (key: TradeTokenKey) => void;
  onTrade: (request: TradeRequest) => void;
}

interface IOwnTokenGridRowState {
  assetDetails: AssetDetails | null;

  latestPriceDataPoint: IPriceDataPoint;
  profit: BigNumber | null;
}

export class OwnTokenGridRow extends Component<IOwnTokenGridRowProps, IOwnTokenGridRowState> {
  constructor(props: IOwnTokenGridRowProps, context?: any) {
    super(props, context);

    const assetDetails = AssetsDictionary.assets.get(props.currentKey.asset);

    this.state = {
      assetDetails: assetDetails || null,
      latestPriceDataPoint: FulcrumProvider.Instance.getPriceDefaultDataPoint(),
      profit: new BigNumber(0)
    };

    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
  }

  private async derivedUpdate() {
    const tradeTokenKey = new TradeTokenKey(
      this.props.currentKey.asset,
      this.props.currentKey.positionType,
      this.props.currentKey.leverage
    );
    const latestPriceDataPoint = await FulcrumProvider.Instance.getPriceLatestDataPoint(tradeTokenKey);
    const profit = await FulcrumProvider.Instance.getTradeProfit(tradeTokenKey);

    this.setState({
      ...this.state,
      latestPriceDataPoint: latestPriceDataPoint,
      profit: profit
    });
  }

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  public componentWillUnmount(): void {
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
  }

  public componentDidMount(): void {
    this.derivedUpdate();
  }

  public componentDidUpdate(
    prevProps: Readonly<IOwnTokenGridRowProps>,
    prevState: Readonly<IOwnTokenGridRowState>,
    snapshot?: any
  ): void {
    if (
      prevProps.currentKey.leverage !== this.props.currentKey.leverage ||
      (prevProps.selectedKey.toString() === prevProps.currentKey.toString()) !==
        (this.props.selectedKey.toString() === this.props.currentKey.toString())
    ) {
      this.derivedUpdate();
    }
  }

  public render() {
    if (!this.state.assetDetails) {
      return null;
    }

    const balanceString = this.props.balance.dividedBy(10 ** 18).toFixed();
    const bnPrice = new BigNumber(this.state.latestPriceDataPoint.price);
    const bnLiquidationPrice = new BigNumber(this.state.latestPriceDataPoint.liquidationPrice);
    //const bnChange24h = new BigNumber(this.state.latestPriceDataPoint.change24h);
    const isActiveClassName =
      this.props.currentKey.toString() === this.props.selectedKey.toString() ? "trade-token-grid-row--active" : "";

    return (
      <div className={`trade-token-grid-row ${isActiveClassName}`} onClick={this.onSelectClick}>
        <div
          className="trade-token-grid-row__col-token-image"
          style={{ backgroundColor: this.state.assetDetails.bgColor, borderLeftColor: this.state.assetDetails.bgColor }}
        >
          <img src={this.state.assetDetails.logoSvg} alt={this.state.assetDetails.displayName} />
        </div>
        <div className="trade-token-grid-row__col-token-name-full">{this.props.currentKey.toString()}</div>
        <div className="trade-token-grid-row__col-amount">{`${balanceString}`}</div>
        <div className="trade-token-grid-row__col-price">{`$${bnPrice.div(1000).toFixed(2)}`}</div>
        <div className="trade-token-grid-row__col-price">{`$${bnLiquidationPrice.div(1000).toFixed(2)}`}</div>
        {/*<div className="trade-token-grid-row__col-change24h">
          <Change24HMarker value={bnChange24h} size={Change24HMarkerSize.MEDIUM} />
        </div>*/}
        <div className="trade-token-grid-row__col-profit">
          {this.state.profit ? `$${this.state.profit.toFixed(4)}` : "-"}
        </div>
        <div className="trade-token-grid-row__col-action">
          <button className="trade-token-grid-row__details-button" onClick={this.onDetailsClick}>
            &nbsp;
          </button>
          <button className="trade-token-grid-row__sell-button" onClick={this.onSellClick}>
            {TradeType.SELL}
          </button>
        </div>
      </div>
    );
  }

  public onSelectClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onSelect(this.props.currentKey);
  };

  public onDetailsClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onDetails(this.props.currentKey);
  };

  public onSellClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onTrade(
      new TradeRequest(TradeType.SELL, this.props.currentKey.asset, this.props.currentKey.positionType, this.props.currentKey.leverage, new BigNumber(0))
    );
  };
}