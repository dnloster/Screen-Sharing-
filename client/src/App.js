import React, { useEffect, useState, useRef, Suspense } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import Rodal from "rodal";
import { Howl } from "howler";

import "rodal/lib/rodal.css";

import { LandingHTML } from "./components/landingHTML";

import camera from "./icons/camera.svg";
import camerastop from "./icons/cameraStop.svg";
import microphone from "./icons/microphone.svg";
import microphonestop from "./icons/microphoneStop.svg";
import share from "./icons/screen-share.svg";
import hangup from "./icons/hang-up.svg";
import fullscreen from "./icons/fullscreen.svg";
import minimize from "./icons/minimize.svg";
import draw from "./icons/draw.svg";
import ringtone from "./sound/ringtone.mp3";

const ringtoneSound = new Howl({
    src: [ringtone],
    loop: true,
    preload: true,
});

function App() {
    const [yourID, setYourID] = useState("");
    const [users, setUsers] = useState({});
    const [stream, setStream] = useState();
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callingFriend, setCallingFriend] = useState(false);
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callRejected, setCallRejected] = useState(false);
    const [receiverID, setReceiverID] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [audioMuted, setAudioMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [isfullscreen, setFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);

    const userVideo = useRef();
    const partnerVideo = useRef();
    const socket = useRef();
    const myPeer = useRef();

    useEffect(() => {
        socket.current = io.connect("http://localhost:4444");

        socket.current.on("yourID", (id) => {
            setYourID(id);
        });
        socket.current.on("allUsers", (users) => {
            setUsers(users);
        });

        socket.current.on("calling", (data) => {
            setReceivingCall(true);
            ringtoneSound.play();
            setCaller(data.from);
            setCallerSignal(data.signal);
        });
    }, []);

    function callPeer(id) {
        if (id !== "" && users[id] && id !== yourID) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    setStream(stream);
                    setCallingFriend(true);
                    setCaller(id);
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                    }
                    const peer = new Peer({
                        initiator: true,
                        trickle: false,
                        stream: stream,
                    });

                    myPeer.current = peer;

                    peer.on("signal", (data) => {
                        socket.current.emit("callUser", {
                            userToCall: id,
                            signalData: data,
                            from: yourID,
                        });
                    });

                    peer.on("stream", (stream) => {
                        if (partnerVideo.current) {
                            partnerVideo.current.srcObject = stream;
                        }
                    });

                    peer.on("error", (err) => {
                        endCall();
                    });

                    socket.current.on("callAccepted", (signal) => {
                        setCallAccepted(true);
                        peer.signal(signal);
                    });

                    socket.current.on("close", () => {
                        window.location.reload();
                    });

                    socket.current.on("rejected", () => {
                        window.location.reload();
                    });
                })
                .catch(() => {
                    setModalMessage(
                        "You cannot place/ receive a call without granting video and audio permissions! Please change your settings."
                    );
                    setModalVisible(true);
                });
        } else {
            setModalMessage("Username is not valid. Please try again!");
            setModalVisible(true);
            return;
        }
    }

    function acceptCall() {
        ringtoneSound.unload();
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
                setCallAccepted(true);
                const peer = new Peer({
                    initiator: false,
                    trickle: false,
                    stream: stream,
                });

                myPeer.current = peer;

                peer.on("signal", (data) => {
                    socket.current.emit("acceptCall", {
                        signal: data,
                        to: caller,
                    });
                });

                peer.on("stream", (stream) => {
                    partnerVideo.current.srcObject = stream;
                });

                peer.on("error", (err) => {
                    endCall();
                });

                peer.signal(callerSignal);

                socket.current.on("close", () => {
                    setCallAccepted(false);
                    setCallingFriend(false);
                    setReceivingCall(false);
                    setCaller("");
                    setCallerSignal(null);
                    setCallRejected(false);
                    if (myPeer.current) {
                        myPeer.current.destroy();
                    }
                    if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    if (userVideo.current) {
                        userVideo.current.srcObject = null;
                    }
                    if (partnerVideo.current) {
                        partnerVideo.current.srcObject = null;
                    }
                });
            })
            .catch(() => {
                setModalMessage(
                    "You cannot place/ receive a call without granting video and audio permissions! Please change settings."
                );
                setModalVisible(true);
            });
    }

    function rejectCall() {
        ringtoneSound.unload();
        setCallRejected(true);
        socket.current.emit("rejected", { to: caller });
        // window.location.reload();
    }

    function endCall() {
        // myPeer.current.destroy();
        setCallAccepted(false);
        setCallingFriend(false);
        setReceivingCall(false);
        setCaller("");
        setCallerSignal(null);
        setCallRejected(false);
        if (myPeer.current) {
            myPeer.current.destroy();
        }
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        if (userVideo.current) {
            userVideo.current.srcObject = null;
        }
        if (partnerVideo.current) {
            partnerVideo.current.srcObject = null;
        }
        socket.current.emit("close", { to: caller });
        // window.location.reload();
    }

    function shareScreen() {
        if (stream) {
            stream.getTracks().forEach((track) => {
                if (track.kind === "video") {
                    track.stop();
                }
            });
        }
        navigator.mediaDevices
            .getDisplayMedia({ cursor: true })
            .then((screenStream) => {
                myPeer.current.replaceTrack(
                    stream.getVideoTracks()[0],
                    screenStream.getVideoTracks()[0],
                    stream
                );
                userVideo.current.srcObject = screenStream;
                screenStream.getTracks()[0].onended = () => {
                    myPeer.current.replaceTrack(
                        screenStream.getVideoTracks()[0],
                        stream.getVideoTracks()[0],
                        stream
                    );
                    userVideo.current.srcObject = stream;
                };
            })
            .catch((error) => {
                console.error("Error accessing screen media.", error);
            });
    }

    function toggleMuteAudio() {
        if (stream) {
            setAudioMuted(!audioMuted);
            stream.getAudioTracks()[0].enabled = audioMuted;
        }
    }

    function toggleMuteVideo() {
        if (stream) {
            setVideoMuted(!videoMuted);
            stream.getVideoTracks()[0].enabled = videoMuted;
        }
    }

    function showCopiedMessage() {
        navigator.clipboard.writeText(yourID);
        setCopied(true);
        setInterval(() => {
            setCopied(false);
        }, 1000);
    }

    let PartnerVideo;
    if (callAccepted && isfullscreen) {
        PartnerVideo = (
            <video
                className="partnerVideo cover"
                playsInline
                ref={partnerVideo}
                autoPlay
            />
        );
    } else if (callAccepted && !isfullscreen) {
        PartnerVideo = (
            <video
                className="partnerVideo"
                playsInline
                ref={partnerVideo}
                autoPlay
            />
        );
    }

    return (
        <>
            <div
                style={{
                    display:
                        !callRejected && !callAccepted && !callingFriend
                            ? "block"
                            : "none",
                }}
            >
                <LandingHTML
                    copied={copied}
                    showCopiedMessage={showCopiedMessage}
                    yourID={yourID}
                    receiverID={receiverID}
                    setReceiverID={setReceiverID}
                    callPeer={callPeer}
                />
                <Rodal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    width={20}
                    height={2}
                    measure={"em"}
                    closeOnEsc={true}
                >
                    <div>{modalMessage}</div>
                </Rodal>
                {receivingCall && !callAccepted && !callRejected && (
                    <div className="incomingCallContainer">
                        <div className="incomingCall flex flex-column">
                            <div>
                                <span className="callerID">{caller}</span> is
                                calling you!
                            </div>
                            <div className="incomingCallButtons flex">
                                <button
                                    name="accept"
                                    className="alertButtonPrimary"
                                    onClick={() => acceptCall()}
                                >
                                    Accept
                                </button>
                                <button
                                    name="reject"
                                    className="alertButtonSecondary"
                                    onClick={() => rejectCall()}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div
                className="callContainer"
                style={{
                    display:
                        !callRejected && !callAccepted && !callingFriend
                            ? "none"
                            : "block",
                }}
            >
                <Suspense fallback={<div>Loading...</div>}></Suspense>
                <div className="partnerVideoContainer">{PartnerVideo}</div>

                <div className="userVideoContainer">
                    {/* {console.log(stream)} */}
                    {stream !== "undefined" && stream && (
                        <video
                            className="userVideo"
                            playsInline
                            muted
                            ref={userVideo}
                            autoPlay
                        />
                    )}
                </div>

                <div className="controlsContainer flex">
                    {/* toggle audio */}
                    {audioMuted ? (
                        <span
                            className="iconContainer"
                            onClick={() => toggleMuteAudio()}
                        >
                            <img src={microphonestop} alt="Unmute audio" />
                        </span>
                    ) : (
                        <span
                            className="iconContainer"
                            onClick={() => toggleMuteAudio()}
                        >
                            <img src={microphone} alt="Mute audio" />
                        </span>
                    )}

                    {/* toggle video */}
                    {videoMuted ? (
                        <span
                            className="iconContainer"
                            onClick={() => toggleMuteVideo()}
                        >
                            <img src={camerastop} alt="Resume video" />
                        </span>
                    ) : (
                        <span
                            className="iconContainer"
                            onClick={() => toggleMuteVideo()}
                        >
                            <img src={camera} alt="Stop audio" />
                        </span>
                    )}

                    {/* share screen */}
                    <span
                        className="iconContainer"
                        onClick={() => shareScreen()}
                    >
                        <img src={share} alt="Share screen" />
                    </span>

                    <span
                        className="iconContainer"
                        // onClick={() => toggleDrawing()}
                    >
                        <img src={draw} alt="Draw" />
                    </span>

                    {/* toggle full screen */}
                    {isfullscreen ? (
                        <>
                            <span
                                className="iconContainer"
                                onClick={() => {
                                    setFullscreen(false);
                                }}
                            >
                                <img src={minimize} alt="fullscreen" />
                            </span>
                        </>
                    ) : (
                        <>
                            <span
                                className="iconContainer"
                                onClick={() => {
                                    setFullscreen(true);
                                }}
                            >
                                <img src={fullscreen} alt="fullscreen" />
                            </span>
                        </>
                    )}

                    {/* End call */}
                    <span className="iconContainer" onClick={() => endCall()}>
                        <img src={hangup} alt="End call" />
                    </span>
                </div>
            </div>
        </>
    );
}

export default App;
