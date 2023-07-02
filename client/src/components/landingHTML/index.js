import React from "react";
import { Navigation } from "../navigation";

export const LandingHTML = (props) => {
    return (
        <>
            <Navigation />
            <main>
                <div className="u-margin-top-xxlarge u-margin-bottom-xxlarge">
                    <div className="o-wrapper-l">
                        <div className="hero flex flex-column">
                            <div>
                                <div className="actionText">
                                    Your username:{" "}
                                    <span
                                        className={
                                            props.copied
                                                ? "username highlight copied"
                                                : "username highlight"
                                        }
                                        onClick={() => {
                                            props.showCopiedMessage();
                                        }}
                                    >
                                        {props.yourID}
                                    </span>
                                </div>
                            </div>
                            <div className="callBox flex">
                                <input
                                    type="text"
                                    placeholder="Enter Peer username"
                                    value={props.receiverID}
                                    onChange={(e) =>
                                        props.setReceiverID(e.target.value)
                                    }
                                    className="form-input"
                                />
                                <button
                                    onClick={() => {
                                        props.callPeer(
                                            props.receiverID
                                                .toLowerCase()
                                                .trim()
                                        );
                                    }}
                                    className="primaryButton"
                                >
                                    Call
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};
