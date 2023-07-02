import React from "react";
import Logo from "../../icons/logo.svg";
import "./navigation.css";

export const Navigation = () => {
    return (
        <header className="dropShadow">
            <div className="headerWrapper">
                <div className="headerContainer flex">
                    <div className="headerLogoLinkWrapper">
                        <div className="headerLogoLink">
                            <a href="/">
                                <div className="headerLogo flex flex-row">
                                    <div className="logoImg">
                                        <img src={Logo} alt="Logo" />
                                    </div>
                                    <div className="logoText">Video Chat</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
