import React, { Component } from "react";
import { ReactComponent as LogoExplorer } from "../assets/images/logo-explorer.svg"
import { ReactComponent as LogoSign } from "../assets/images/logo-sign.svg"
import { HeaderMenu } from "./HeaderMenu";
import { Link } from "react-router-dom";
import { OnChainIndicator } from "../components/OnChainIndicator";
import { FooterSocial } from "../layout/FooterSocial";
import { ReactComponent as MenuIconClose } from "../assets/images/menu-close.svg";
import { ReactComponent as MenuIconOpen } from "../assets/images/menu-open.svg";

interface IHeaderProps {
  doNetworkConnect: () => void;
  isMobileMedia: boolean;
}
interface IHeaderState {
  isMenuOpen: boolean;
}

export class Header extends Component<IHeaderProps, IHeaderState> {
  constructor(props: IHeaderProps) {
    super(props);
    this.state = {
      isMenuOpen: false
    };
  }

  componentDidUpdate(prevProps: IHeaderProps, prevState: IHeaderState): void {
    if (this.state.isMenuOpen !== prevState.isMenuOpen) {
      this.state.isMenuOpen ? document.body.classList.add("overflow") : document.body.classList.remove("overflow");
    }
  }

  public render() {
    return !this.props.isMobileMedia ? this.renderDesktop() : this.renderMobile();
  }

  private renderDesktop = () => {
    return (
      <header>
        <div className="container container-md">
          <div className="flex jc-sb ai-c ta-c relative">
            <Link to="/" className="logo">
              <div className="wrapper-logo-sign">
                <LogoSign />
              </div>
              <LogoExplorer />
            </Link>
            <HeaderMenu />
            <div className="flex ai-c header-right">
              <a href="https://help.bzx.network/en/" className={`item-menu`} target="_blank" rel="noopener noreferrer">
                Help Center
                </a>
              <OnChainIndicator doNetworkConnect={this.props.doNetworkConnect} />
            </div>
          </div>
        </div>
      </header>
    );
  }

  private renderMobile = () => {
    return (
      <header className={`${this.state.isMenuOpen ? `open-menu` : ``}`}>
        <div className="flex fd-c h-100">
          <div className="flex jc-sb ai-c w-100 px-15">
            <Link to="/" className="logo">
              <div className="wrapper-logo-sign">
                <LogoSign />
              </div>
              <LogoExplorer />
            </Link>
            <div className="header_icon" onClick={this.onMenuToggle}>
              {!this.state.isMenuOpen ? <MenuIconOpen className="header__menu" /> : <MenuIconClose className="header__menu" />}
            </div>
          </div>
          <div className={`mobile-menu ${this.state.isMenuOpen ? `shown` : `hidden`}`}>
            <div className="w-100">
              <OnChainIndicator doNetworkConnect={this.props.doNetworkConnect} />
              <div className="header-menu">
                <Link to="/" className={`item-menu ${window.location.pathname === "/" ? `active` : ``}`} onClick={this.removeOverflow}>
                  Stats
                </Link>
                <Link to="/liquidations" className={`item-menu ${window.location.pathname === "/liquidations" ? `active` : ``}`} onClick={this.removeOverflow}>
                  Liquidations
                </Link>
                <a href="https://help.bzx.network/en/" className={`item-menu`} target="_blank">
                  Help Center
                </a>
              </div>
            </div>

            <FooterSocial isShowSocial={!this.state.isMenuOpen} />
          </div>
        </div>
      </header>
    );
  }

  private onMenuToggle = () => {
    this.setState({ ...this.state, isMenuOpen: !this.state.isMenuOpen });
  };

  public removeOverflow = () => {
    document.body.classList.remove("overflow");
  }
}
