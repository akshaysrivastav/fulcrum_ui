import React, { Component } from "react";
import { ReactComponent as BzrxIcon } from "../assets/images/token-bzrx.svg"
import { ReactComponent as VBzrxIcon } from "../assets/images/token-vbzrx.svg"
import { ReactComponent as BPTIcon } from "../assets/images/token-bpt.svg"
import { StakingProvider } from "../services/StakingProvider";
import { StakingProviderEvents } from "../services/events/StakingProviderEvents";
import { BigNumber } from "@0x/utils";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";
import { Asset } from "../domain/Asset";
import { AddToBalance } from "./AddToBalance";
import Modal from "react-modal";
import { FindRepresentative } from "./FindRepresentative";
import { IRep } from "../domain/IRep";

import Representative1 from "../assets/images/representative1.png"
import Representative2 from "../assets/images/representative2.png"
import Representative3 from "../assets/images/representative3.png"

const Box = require('3box');


interface IFormState {
  bzrxV1Balance: BigNumber;
  bzrxBalance: BigNumber;
  bptBalance: BigNumber;
  vBzrxBalance: BigNumber;
  bzrxStakingBalance: BigNumber;
  bptStakingBalance: BigNumber;
  vBzrxStakingBalance: BigNumber;
  iEthBalance: BigNumber;
  iETHSwapRate: BigNumber;
  whitelistAmount: BigNumber;
  claimableAmount: BigNumber;
  userEarnings: BigNumber;
  canOptin: boolean;
  isFindRepresentativeOpen: boolean;
  selectedRepAddress: string;
  topRepsList: IRep[];
  otherRepsList: IRep[];
  repsList: IRep[];
  delegateAddress: string;
}

const networkName = process.env.REACT_APP_ETH_NETWORK;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export class Form extends Component<{}, IFormState> {
  constructor(props: any) {
    super(props);
    this.state = {
      bzrxV1Balance: new BigNumber(0),
      bzrxBalance: new BigNumber(0),
      vBzrxBalance: new BigNumber(0),
      bptBalance: new BigNumber(0),
      bzrxStakingBalance: new BigNumber(0),
      vBzrxStakingBalance: new BigNumber(0),
      bptStakingBalance: new BigNumber(0),
      iEthBalance: new BigNumber(0),
      iETHSwapRate: new BigNumber(0),
      whitelistAmount: new BigNumber(0),
      claimableAmount: new BigNumber(0),
      canOptin: false,
      isFindRepresentativeOpen: false,
      selectedRepAddress: "",
      topRepsList: [],
      otherRepsList: [],
      repsList: [],
      userEarnings: new BigNumber(0),
      delegateAddress: ""
    };

    this._isMounted = false;
    StakingProvider.Instance.eventEmitter.on(StakingProviderEvents.ProviderAvailable, this.onProviderAvailable);
    StakingProvider.Instance.eventEmitter.on(StakingProviderEvents.ProviderChanged, this.onProviderChanged);

  }

  private isAlreadyRepresentative: boolean = false;

  private _isMounted: boolean;

  private async derivedUpdate() {
    let selectedRepAddress = "";
    this.isAlreadyRepresentative = await StakingProvider.Instance.checkIsRep();

    const delegateAddress = await StakingProvider.Instance.getDelegateAddress();
    const repsList = await StakingProvider.Instance.getRepresentatives()
      .then(reps => Promise.all(reps.map((rep, index) => this.getRepInfo(rep, index))));
    const sortedList = repsList.sort((a: any, b: any) => b.BZRX.minus(a.BZRX).toNumber());
    let topRepsList = sortedList.slice(0, 3);
    const delegate = sortedList.find(e => e.wallet.toLowerCase() === delegateAddress.toLowerCase());
    if (delegate && !topRepsList.includes(delegate)) {
      topRepsList.push(delegate)
    }
    selectedRepAddress = delegateAddress;
    const otherRepsList = sortedList.slice(3, sortedList.length);
    const canOptin = await StakingProvider.Instance.canOptin();
    let claimableAmount = await StakingProvider.Instance.isClaimable();
    if (claimableAmount.gt(0)) {
      claimableAmount = claimableAmount.div(10 ** 18)
    }
    const bzrxV1Balance = (await StakingProvider.Instance.getAssetTokenBalanceOfUser(Asset.BZRXv1)).div(10 ** 18);
    const bzrxBalance = (await StakingProvider.Instance.stakeableByAsset(Asset.BZRX)).div(10 ** 18);
    const vBzrxBalance = (await StakingProvider.Instance.stakeableByAsset(Asset.vBZRX)).div(10 ** 18);
    //TODO: remove networkName
    const bptBalance = networkName === "kovan"
      ? (await StakingProvider.Instance.stakeableByAsset(Asset.BPT)).div(10 ** 6)
      : (await StakingProvider.Instance.stakeableByAsset(Asset.BPT)).div(10 ** 18);
    const iEthBalance = (await StakingProvider.Instance.getITokenBalanceOfUser(Asset.ETH)).div(10 ** 18);

    const bzrxStakingBalance = (await StakingProvider.Instance.balanceOfByAsset(Asset.BZRX)).div(10 ** 18);
    const vBzrxStakingBalance = (await StakingProvider.Instance.balanceOfByAsset(Asset.vBZRX)).div(10 ** 18);
    //TODO: remove networkName
    const bptStakingBalance = networkName === "kovan"
      ? (await StakingProvider.Instance.balanceOfByAsset(Asset.BPT)).div(10 ** 6)
      : (await StakingProvider.Instance.balanceOfByAsset(Asset.BPT)).div(10 ** 18);

    //const userData = await StakingProvider.Instance.getiETHSwapRateWithCheck();
    //const iETHSwapRate = userData[0].div(10 ** 18);
    //const whitelistAmount = userData[1].div(10 ** 18);

    const userEarnings = await StakingProvider.Instance.getUserEarnings();

    this._isMounted && this.setState({
      ...this.state,
      bzrxV1Balance,
      bzrxBalance,
      vBzrxBalance,
      bptBalance: bptBalance,
      bzrxStakingBalance,
      vBzrxStakingBalance,
      bptStakingBalance,
      iEthBalance,
      iETHSwapRate: new BigNumber(0),
      whitelistAmount: new BigNumber(0),
      claimableAmount,
      canOptin,
      repsList,
      topRepsList,
      otherRepsList,
      userEarnings,
      delegateAddress,
      selectedRepAddress
    })
  }

  private onProviderAvailable = async () => {
    await this.derivedUpdate();
  };

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  public componentDidMount(): void {
    this._isMounted = true;
    this.derivedUpdate();
  }

  public componentWillUnmount(): void {
    this._isMounted = false;

    StakingProvider.Instance.eventEmitter.removeListener(StakingProviderEvents.ProviderAvailable, this.onProviderAvailable);
    StakingProvider.Instance.eventEmitter.removeListener(StakingProviderEvents.ProviderChanged, this.onProviderChanged);
  }

  public onBzrxV1ToV2ConvertClick = async () => {
    const receipt = await StakingProvider.Instance.convertBzrxV1ToV2(this.state.bzrxV1Balance.times(10 ** 18));
    await this.derivedUpdate();
  }
  /*public onIETHtoVBZRXConvertClick = async () => {
    const swapAmountAllowed = !this.state.whitelistAmount.eq(0) && this.state.whitelistAmount.lt(this.state.iEthBalance) ?
      this.state.whitelistAmount :
      this.state.iEthBalance;
    const receipt = await StakingProvider.Instance.convertIETHToVBZRX(swapAmountAllowed.times(10 ** 18));
    await this.derivedUpdate();
  }*/

  public onOptinClick = async () => {
    const receipt = await StakingProvider.Instance.doOptin();
    await this.derivedUpdate();
  }

  public onClaimClick = async () => {
    const receipt = await StakingProvider.Instance.doClaim();
    await this.derivedUpdate();
  }

  public onBecomeRepresentativeClick = async () => {
    const receipt = await StakingProvider.Instance.doBecomeRepresentative();
    await this.derivedUpdate();
  }

  public onStakeClick = async (bzrx: BigNumber, vbzrx: BigNumber, bpt: BigNumber) => {
    if (this.state.selectedRepAddress === "") return;
    const receipt = await StakingProvider.Instance.stake(bzrx, vbzrx, bpt, this.state.selectedRepAddress);
    await this.derivedUpdate();
  }

  public setSelectedRepAddressClick = (e: React.MouseEvent<HTMLElement>) => {
    if (this.state.delegateAddress !== "" && this.state.delegateAddress !== ZERO_ADDRESS) return;
    const liElement = e.currentTarget;
    const address = liElement.dataset.address
    if (!address) return;
    this.setState({ ...this.state, selectedRepAddress: address });
  }

  private getShortHash = (hash: string, count: number) => {
    return hash.substring(0, 6) + '...' + hash.substring(hash.length - count);
  }

  private openFindRepresentative = () => {
    this._isMounted && !this.state.isFindRepresentativeOpen && this.setState({ ...this.state, isFindRepresentativeOpen: true });
  };

  private onAddRep = (wallet: string) => {
    const isAlreadyTopRep = this.state.topRepsList.find(item => item.wallet.toLowerCase() === wallet.toLowerCase());
    if (isAlreadyTopRep) return;
    const topRepsList = this.state.topRepsList.concat(this.state.otherRepsList.find(item => item.wallet === wallet)!);
    const otherRepsList = this.state.otherRepsList.filter(item => item.wallet !== wallet)

    this._isMounted &&
      this.setState({ ...this.state, topRepsList, otherRepsList, isFindRepresentativeOpen: false });
  };

  private onRequestClose = async () => {
    await this._isMounted && this.setState({
      ...this.state,
      isFindRepresentativeOpen: false
    });
  };

  private getRepInfo = async (item: any, index: number): Promise<IRep> => {
    const profile = await Box.getProfile(item.wallet);
    const name = profile.name ? profile.name : this.getShortHash(item.wallet, 4);
    const imageSrc = profile.image ?
      `https://ipfs.infura.io/ipfs/${profile.image[0].contentUrl["/"]}`
      : index % 3 === 0 ?
        Representative1
        : index % 2 === 0 ?
          Representative2 :
          Representative3;

    return {
      ...item,
      name,
      imageSrc,
      index
    };
  };

  public render() {
    // console.log(this.state.whitelistAmount.toString(), this.state.iEthBalance.toString());

    /*const swapAmountAllowed = !this.state.whitelistAmount.eq(0) && this.state.whitelistAmount.lt(this.state.iEthBalance) ?
      this.state.whitelistAmount :
      this.state.iEthBalance;*/

    const etherscanURL = StakingProvider.Instance.web3ProviderSettings
      ? StakingProvider.Instance.web3ProviderSettings.etherscanURL
      : "";
    //console.log(this.state.topRepsList);
    const topRepsLi = this.state.topRepsList.map((e) => {
      if (e === undefined) { return false; }
      //console.log(e);
      return (
        <li key={e.wallet}
          className={`button button-representative ${e.wallet.toLowerCase() === this.state.selectedRepAddress.toLowerCase()
            ? "active" : "no-active"}`}
          onClick={this.setSelectedRepAddressClick}
          data-address={e.wallet}>
          <img className="photo" src={e.imageSrc} alt={`Representative ${e.index}`} />
          <span className="name">{e.name}</span>
        </li>
      )
    })

    return (
      <React.Fragment>
        <Modal
          isOpen={this.state.isFindRepresentativeOpen}
          onRequestClose={this.onRequestClose}
          className="modal-content-div"
          overlayClassName="modal-overlay-div"
        >
          <FindRepresentative
            onFindRepresentativeClose={this.onRequestClose}
            onAddRepresentative={this.onAddRep}
            representative={this.state.repsList}
          />
        </Modal>
        <div className="container">
          <div className="calculator">
            <div className="calculator-row balance">
              <div className="balance-item">
                <div className="row-header">Wallet Balance:</div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/${this.state.bzrxV1Balance.gt(0) ? "0x1c74cFF0376FB4031Cd7492cD6dB2D66c3f2c6B9" : "0x56d811088235F11C8920698a204A5010a788f4b3"}`} target="_blank" rel="noopener noreferrer"><span className="icon"><BzrxIcon /></span></a>
                    <span title={this.state.bzrxBalance.toFixed(18)} className="value">
                      {this.state.bzrxBalance.toFixed(2)}
                    </span>
                    <div className="row-token">BZRX</div>
                  </div>
                </div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/0xB72B31907C1C95F3650b64b2469e08EdACeE5e8F`} target="_blank" rel="noopener noreferrer"><span className="icon"><VBzrxIcon /></span></a>

                    <span title={this.state.vBzrxBalance.toFixed(18)} className="value">
                      {Number(this.state.vBzrxBalance).toFixed(2)}
                    </span>
                    <div className="row-token">vBZRX</div>
                  </div>
                </div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/0xe26A220a341EAca116bDa64cF9D5638A935ae629`} target="_blank" rel="noopener noreferrer"><span className="icon"><BPTIcon /></span></a>
                    <span title={this.state.bptBalance.toFixed(18)} className="value">{this.state.bptBalance.toFixed(2)}</span>
                    <div className="row-token">BPT</div>
                  </div>
                </div>
              </div>
              <div className="balance-item">
                <div className="row-header">Staking Balance:</div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/0x56d811088235F11C8920698a204A5010a788f4b3"}`} target="_blank" rel="noopener noreferrer"><span className="icon"><BzrxIcon /></span></a>
                    <span title={this.state.bzrxStakingBalance.toFixed(18)} className="value">
                      {this.state.bzrxStakingBalance.toFixed(2)}
                    </span>
                    <div className="row-token">BZRX</div>
                  </div>
                </div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/0xB72B31907C1C95F3650b64b2469e08EdACeE5e8F`} target="_blank" rel="noopener noreferrer"><span className="icon"><VBzrxIcon /></span></a>

                    <span title={this.state.vBzrxStakingBalance.toFixed(18)} className="value">
                      {Number(this.state.vBzrxStakingBalance).toFixed(2)}
                    </span>
                    <div className="row-token">vBZRX</div>
                  </div>
                </div>
                <div className="row-container">
                  <div className="row-body">
                    <a href={`${etherscanURL}token/0xe26A220a341EAca116bDa64cF9D5638A935ae629`} target="_blank" rel="noopener noreferrer">
                      <span title={this.state.bptStakingBalance.toFixed(18)} className="icon"><BPTIcon /></span></a>
                    <span className="value">{this.state.bptStakingBalance.toFixed(2)}</span>
                    <div className="row-token">BPT</div>
                  </div>
                </div>
              </div>
              <p className="notice">If you move your tokens, they will be unstaked.</p>
            </div>
            <div className="calculator-row">
              <div className="reward-item">
                <div className="row-header">My rewards balance:</div>
                <div className="row-body">
                  <div className="reward-content">
                    <span title={this.state.userEarnings.toFixed(18)}>${this.state.userEarnings.toFixed(2)}</span>
                    {/* <div className="row-footer">bZxDAO-Balancer tokens</div> */}
                  </div>
                  <button title="Coming soon" disabled={true} className="button">Claim Rewards</button>
                </div>
              </div>
            </div>

            {this.state.bzrxV1Balance.gt(0) &&
              <div className="convert-button">
                <button className="button button-full-width" onClick={this.onBzrxV1ToV2ConvertClick}>
                  Convert BZRX v1 to v2
                    <span className="notice">You will need to confirm 2 transactions in your wallet.</span>
                </button>
              </div>
            }

            {/*this.state.iETHSwapRate.gt(0) && swapAmountAllowed.gt(0) &&
              <div className="convert-button">
                <button title={`Convert ${swapAmountAllowed.toFixed(18)} iETH into ${swapAmountAllowed.div(this.state.iETHSwapRate).toFixed(18)} vBZRX`} className="button button-full-width" onClick={this.onIETHtoVBZRXConvertClick}>
                  Convert&nbsp;
                  <span>{swapAmountAllowed.toFixed(4)}</span>
                  &nbsp;iETH into&nbsp;
                  <span>{swapAmountAllowed.div(this.state.iETHSwapRate).toFixed(4)}</span>
                  &nbsp;vBZRX
                    <span className="notice">Make sure you read and understand iETH Buyback Program terms and conditions </span>
                </button>
              </div>
            */}
            {this.state.claimableAmount.gt(0) &&
              <div className="convert-button">
                <button title={`Claim ${this.state.claimableAmount.toFixed(18)} vBZRX`} className="button button-full-width" onClick={this.onClaimClick}>
                  Claim&nbsp;
                  <span>{this.state.claimableAmount.toFixed(4)}</span>
                  &nbsp;vBZRX
                </button>
              </div>
            }
            {this.state.canOptin &&
            <div className="convert-button">
              <button className="button button-full-width" onClick={this.onOptinClick}>
                Opt-in to compensation program
                  <span className="notice">The program is open to anyone negatively impacted by the protocol pause on Feb-18-2020 04:21:52 AM +UTC</span>
              </button>
            </div>
            }
            {/*<div className="group-buttons">
              <button title="Coming soon" className="button" disabled={true}>Stake</button>
              <button title="Coming soon" className="button" disabled={true}>Unstake</button>
              <button title="Coming soon" className="button" disabled={true}>Claim Rewards</button>
              <button title="Coming soon" className="button" disabled={true}>Explore Reward Pool</button>
              <p className="notice">Coming soon</p>
            </div>*/}
            {/*{this.state.bzrxBalance.gt(0) || this.state.vBzrxBalance.gt(0) || this.state.bptBalance.gt(0) &&*/}
            <React.Fragment>
              <div className="calculator-row">
                <div className="row-header">Please select representative:</div>
                  <ul className={`group-buttons ${this.state.delegateAddress.toLowerCase() !== ZERO_ADDRESS ? "selected-delegate" : ""}`}>
                  {topRepsLi}
                </ul>
              </div>
              {this.state.selectedRepAddress !== "" &&
                <AddToBalance
                  bzrxMax={Number(this.state.bzrxBalance)}
                  vbzrxMax={Number(this.state.vBzrxBalance)}
                  bptMax={Number(this.state.bptBalance)}
                  stake={this.onStakeClick}
                />
              }
            </React.Fragment>
            {/*}*/}
            <div className="calculator-row">
              <div className="group-buttons">
                <button className="button" onClick={this.openFindRepresentative}>Find a Representative</button>
                <button className="button" disabled={this.isAlreadyRepresentative} onClick={this.onBecomeRepresentativeClick}>Become A Representative</button>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
