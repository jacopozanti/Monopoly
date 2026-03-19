import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import RollIcon from "../../assets/images/roll.png";
import HouseIcon from "../../assets/images/h.png";
import HotelIcon from "../../assets/images/ho.png";
import { Player } from "./../../assets/player.ts";
import { Socket } from "../../assets/sockets.ts";
import StreetCard, { StreetDisplayInfo, UtilitiesDisplayInfo, RailroadDisplayInfo, translateGroup } from "./streetCard.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import ChacneCard, { ChanceDisplayInfo } from "./specialCards.tsx";
import { GameTrading, MonopolyMode } from "../../assets/types.ts";
import Slider from "../utils/slider.tsx";
import { useSettings } from "../../contexts/SettingsContext.tsx";
import DicePanel from "./DicePanel.tsx";
import BoardCell from "./BoardCell.tsx";
import { BOARD_POSITIONS } from "../../data/boardPositions.ts";
interface MonopolyGameProps {
    players: Array<Player>;
    myTurn: boolean;
    socket: Socket;
    clickedOnBoard: (a: number) => void;
    tradeObj?: undefined | GameTrading | boolean;
    tradeApi: {
        onSelectPlayer: (pId: string) => void;
    };
    selectedMode: MonopolyMode;
}
export interface MonopolyGameRef {
    diceResults: (args: { l: [number, number]; time: number; onDone: () => void }) => void;
    freeDice: () => void;
    setStreet: (args: {
        location: number;
        rolls: number;
        onResponse: (action: "nothing" | "buy" | "someones" | "special_action" | "advance-buy", info: object) => void;
    }) => void;
    chorch: (
        element: {
            title: string;
            action: string;
            tileid: string;
            groupid?: undefined;
            rentmultiplier?: undefined;
            amount?: undefined;
            subaction?: undefined;
            count?: undefined;
            buildings?: undefined;
            hotels?: undefined;
        },
        is_chance: boolean,
        time: number
    ) => void;
    applyAnimation: (type: number) => void;
    showJailsButtons: (is_card: boolean) => void;
}

export interface g_SpecialAction {}
export type g_Buy = 0 | 1 | 2 | 3 | 4 | "h";

// Create the component with forwardRef
const MonopolyGame = forwardRef<MonopolyGameRef, MonopolyGameProps>((prop, ref) => {
    const propretyMap = new Map(
        monopolyJSON.properties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );

    const [showDice, SetShowDice] = useState<boolean>(false);
    const [diceValues, SetDiceValues] = useState<[number, number] | null>(null);
    const [sended, SetSended] = useState<boolean>(false);
    const [showStreet, ShowStreet] = useState<boolean>(false);
    const [advnacedStreet, SetAdvancedStreet] = useState<boolean>(false);
    const [rotation, SetRotation] = useState<number>(0);
    const [scale, SetScale] = useState<number>(1);
    const { settings } = useSettings();
    const [timer, SetTimer] = useState<number>(0);

    const [streetDisplay, SetStreetDisplay] = useState<{}>({
        cardCost: -1,
        hotelsCost: -1,
        housesCost: -1,
        multpliedrent: [-1, -1, -1, -1, -1],
        rent: -1,
        rentWithColorSet: -1,
        title: "deafult",
        type: "electricity",
    } as UtilitiesDisplayInfo);

    const [streetType, SetStreetType] = useState<"Street" | "Utilities" | "Railroad" | "Chance" | "CommunityChest">("Street");

    // Dice animation is now handled by the DicePanel component
    function applyAnimation(type: number) {
        const element = document.querySelector("img#moneyAnimations");
        if (element === null) return;
        const imageElement = element as HTMLImageElement;
        imageElement.setAttribute("data-anim", "0");
        requestAnimationFrame(() => {
            imageElement.setAttribute("data-anim", type.toString());
            setTimeout(() => {
                imageElement.setAttribute("data-anim", "0");
            }, 1000);
        });
    }
    function swipeSound() {
        const _settings = settings;
        let audio = new Audio("./card.mp3");
        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
        audio.loop = false;
        audio.play();
    }

    useImperativeHandle(ref, () => ({
        diceResults: (args) => {
            SetDiceValues(args.l);
            SetShowDice(true);
            setTimeout(() => {
                SetShowDice(false);
                args.onDone();
            }, args.time);
        },
        freeDice: () => {
            SetDiceValues(null);
            SetSended(false);
        },
        setStreet: (args) => {
            // find data based on location
            const localPlayer = prop.players.filter((v) => v.id === prop.socket.id)[0];
            const x = propretyMap.get(args.location);

            if (x && args.location !== -1 && args.location < 40 && args.location >= 0) {
                function searchForButtons(
                    advanced: boolean,
                    location: number,
                    fartherInfo?: {
                        rolls: number;
                    }
                ) {
                    function clickSound() {
                        const _settings = settings;
                        let audio = new Audio("./click.mp3");
                        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
                        audio.loop = false;
                        audio.play();
                    }
                    function func() {
                        if (advanced) {
                            const b = document.querySelector("div#advanced-responses");

                            if (b) {
                                const _property = propretyMap.get(location);
                                if (!_property) return;
                                const divB = b as HTMLDivElement;
                                while (divB.firstChild) {
                                    divB.removeChild(divB.firstChild);
                                }
                                const propId = Array.from(new Map(localPlayer.properties.map((v, i) => [i, v])).entries()).filter(
                                    (v) => v[1].posistion === args.location
                                )[0][0];

                                function transformCount(v: 0 | 2 | 1 | 3 | 4 | "h") {
                                    switch (v) {
                                        case "h":
                                            return 5;

                                        default:
                                            return v;
                                    }
                                }
                                const count: number = transformCount(localPlayer.properties[propId].count);
                                for (let index = count + 1; index < 6; index++) {
                                    const myButton = document.createElement("button");
                                    if (index === 5) {
                                        myButton.innerHTML = `buy hotel`;
                                        // dont let someone buy hotel of not have a set of 4 houses
                                        myButton.disabled =
                                            index !== count + 1 ||
                                            (_property.ohousecost ?? 0) > (prop.players.filter((v) => v.id === prop.socket.id)[0].balance ?? 0);
                                        myButton.onclick = () => {
                                            args.onResponse("advance-buy", {
                                                state: index,
                                                money: 1,
                                            });
                                            ShowStreet(false);
                                        };
                                    } else {
                                        myButton.innerHTML = `buy ${index} house${index > 1 ? "s" : ""}`;
                                        myButton.onclick = () => {
                                            args.onResponse("advance-buy", {
                                                state: index,
                                                money: index - count,
                                            });
                                            ShowStreet(false);
                                        };
                                        myButton.disabled =
                                            (index - count) * (_property.housecost ?? 0) >
                                            (prop.players.filter((v) => v.id === prop.socket.id)[0].balance ?? 0);
                                    }
                                    divB.appendChild(myButton);
                                }
                                // last button of cancel
                                const continueButtons = document.createElement("button");
                                continueButtons.innerHTML = "CONTINUE";
                                continueButtons.onclick = () => {
                                    clickSound();
                                    args.onResponse("nothing", {});
                                    ShowStreet(false);
                                };
                                divB.appendChild(continueButtons);
                            } else {
                                requestAnimationFrame(func);
                            }
                        } else {
                            const b = document.querySelector("button#card-response-yes");

                            if (b) {
                                (b as HTMLButtonElement).onclick = () => {
                                    if (fartherInfo !== undefined)
                                        args.onResponse("special_action", {
                                            rolls: fartherInfo.rolls,
                                        });
                                    else args.onResponse("buy", {});
                                    ShowStreet(false);
                                };
                                (document.querySelector("button#card-response-no") as HTMLButtonElement).onclick = () => {
                                    clickSound();
                                    args.onResponse("nothing", {});
                                    ShowStreet(false);
                                };
                            } else {
                                requestAnimationFrame(func);
                            }
                        }
                    }
                    return func;
                }

                var belong_to_me = false;
                var belong_to_others = false;
                var count: 0 | 1 | 2 | 3 | 4 | "h" = 0;
                // check states
                for (const _prp of localPlayer.properties) {
                    if (!belong_to_me && _prp.posistion === args.location) {
                        belong_to_me = true;
                        count = _prp.count;
                    }
                }
                for (const _p of prop.players) {
                    for (const _prp of _p.properties) {
                        if (_prp.posistion === args.location && _p.id != localPlayer.id) belong_to_others = true;
                    }
                }

                if (x.group === "Special") {
                    args.onResponse("nothing", {});
                    ShowStreet(false);
                } else if (x.group === "Utilities") {
                    if (!belong_to_me) {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        } else {
                            if (localPlayer.balance - (x?.price ?? 0) < 0) {
                                ShowStreet(false);
                                args.onResponse("nothing", {});
                                return;
                            } else {
                                SetStreetType("Utilities");
                                const streetInfo = {
                                    cardCost: x.price ?? -1,
                                    title: x.name ?? "error",
                                    type: x.id.includes("water") ? "water" : "electricity",
                                } as UtilitiesDisplayInfo;
                                SetStreetDisplay(streetInfo);
                                SetAdvancedStreet(false);

                                swipeSound();
                                ShowStreet(true);
                                requestAnimationFrame(
                                    searchForButtons(false, args.location, {
                                        rolls: args.rolls,
                                    })
                                );
                            }
                        }
                    } else {
                        args.onResponse("nothing", {});
                    }
                } else if (x.group === "Railroad") {
                    if (!belong_to_me) {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        } else {
                            if (localPlayer.balance - (x?.price ?? 0) < 0) {
                                ShowStreet(false);
                                args.onResponse("nothing", {});
                                return;
                            } else {
                                SetStreetType("Railroad");
                                const streetInfo = {
                                    cardCost: x.price ?? -1,
                                    title: x.name ?? "error",
                                } as UtilitiesDisplayInfo;
                                SetStreetDisplay(streetInfo);
                                swipeSound();
                                ShowStreet(true);
                                requestAnimationFrame(searchForButtons(false, args.location));
                            }
                        }
                    } else {
                        args.onResponse("nothing", {});
                    }
                } else {
                    if (!belong_to_me && localPlayer.balance - (x?.price ?? 0) < 0) {
                        ShowStreet(false);
                        args.onResponse("nothing", {});
                        return;
                    }

                    if (belong_to_me) {
                    } else {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        }
                    }
                    if (belong_to_me && count === "h") {
                        ShowStreet(false);
                        args.onResponse("nothing", {});
                        return;
                    }
                    SetStreetType("Street");
                    const streetInfo = {
                        cardCost: x.price ?? -1,
                        hotelsCost: x.ohousecost ?? -1,
                        housesCost: x.housecost ?? -1,
                        rent: x.rent ?? -1,
                        multpliedrent: x.multpliedrent
                            ? [
                                  x.multpliedrent[0] ?? -1,
                                  x.multpliedrent[1] ?? -1,
                                  x.multpliedrent[2] ?? -1,
                                  x.multpliedrent[3] ?? -1,
                                  x.multpliedrent[4] ?? -1,
                              ]
                            : [-1, -1, -1, -1, -1],
                        rentWithColorSet: x.rent ? x.rent * 2 : -1,
                        title: x.name ?? "error",
                        group: x.group,
                    } as StreetDisplayInfo;
                    SetStreetDisplay(streetInfo);
                    belong_to_me ? SetAdvancedStreet(true) : SetAdvancedStreet(false);
                    swipeSound();
                    ShowStreet(true);
                    requestAnimationFrame(searchForButtons(belong_to_me, args.location));
                }
            } else {
                args.onResponse("nothing", {});
                ShowStreet(false);
            }
        },
        chorch(element, is_chance, time) {
            SetStreetType(is_chance ? "Chance" : "CommunityChest");
            SetStreetDisplay({
                title: element.title,
            } as ChanceDisplayInfo);
            swipeSound();
            ShowStreet(true);
            setTimeout(() => {
                ShowStreet(false);
            }, time);
        },
        applyAnimation(type) {
            applyAnimation(type);
        },
        showJailsButtons: (is_card: boolean) => {
            const payElement = document.querySelector(`button[data-button-type="pay"]`) as HTMLButtonElement;
            const cardElement = document.querySelector(`button[data-button-type="card"]`) as HTMLButtonElement;
            const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;

            function returnToNormal() {
                rollElement.onclick = () => {
                    SetSended(true);
                    prop.socket.emit("roll_dice");
                    console.warn("roll after return to normal");
                    SetTimer(0);
                };
                SetTimer(0);
                SetSended(true);
                cardElement.onclick = () => {};
                cardElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    cardElement.setAttribute("aria-disabled", "true");
                }, 300);

                payElement.style.translate = "0px 0px";
                payElement.onclick = () => {};
                payElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    payElement.setAttribute("aria-disabled", "true");
                }, 300);
            }

            payElement.setAttribute("aria-disabled", "false");
            payElement.onclick = () => {
                // handle paying
                applyAnimation(1);

                prop.socket.emit("unjail", "pay");
                prop.socket.emit("roll_dice");
                console.warn("pay");

                returnToNormal();
            };

            if (is_card) {
                const cardButton = cardElement as HTMLButtonElement;
                cardButton.setAttribute("aria-disabled", "false");
                cardButton.onclick = () => {
                    // take 1 card
                    prop.socket.emit("unjail", "card");
                    prop.socket.emit("roll_dice");
                    console.warn("card");
                    returnToNormal();
                };
            }
            rollElement.onclick = () => {
                prop.socket.emit("roll_dice");
                console.warn("roll when in jail");
                returnToNormal();
                SetSended(true);
                SetTimer(0);
            };
        },
    }));

    // Board cell click/hover is handled by BoardCell component props
    // Wheel handler is attached inline on the board div

    // Board rendering is now handled declaratively via BoardCell components
    // (replaces the old requestAnimationFrame loop)

    useEffect(() => {
        const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
        rollElement.onclick = () => {
            SetSended(true);
            prop.socket.emit("roll_dice");
            console.warn("first roll");
            SetTimer(0);
        };
    }, []);

    useEffect(() => {
        if (prop.myTurn && !sended) {
            var l: NodeJS.Timeout | undefined = undefined;
            if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                var x = 0;
                l = setInterval(() => {
                    x += 1;
                    SetTimer(x);
                    if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                        if (x >= prop.selectedMode.turnTimer) {
                            if (prop.myTurn && !sended) {
                                const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
                                rollElement.click();
                                SetTimer(0);
                                clearInterval(l);
                            }
                        }
                    }
                }, 1000);
            }
        }

        return () => {
            clearInterval(l);
            SetTimer(0);
            console.log("stopped");
        };
    }, [prop.myTurn, sended, prop.selectedMode]);
    return (
        <>
            <div className="game" style={prop.tradeObj !== undefined ? { translate: "0px -100%" } : {}}>
                <div style={{ overflowY: "hidden" }}>
                    <DicePanel show={showDice} finalValues={diceValues} />
                    <div
                        className="board"
                        style={{
                            transform: `translateX(-50%) translateY(-50%) rotate(${rotation}deg) scale(${scale})`,
                        }}
                        id="locations"
                        onWheel={(e) => {
                            if (e.shiftKey) {
                                SetScale((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[1] : 5)) / 5000);
                            } else {
                                SetRotation((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[0] : 45)) / 100);
                            }
                        }}
                    >
                        {BOARD_POSITIONS.map((pos) => (
                            <BoardCell
                                key={`cell-${pos.position}`}
                                pos={pos}
                                players={prop.players.filter(v => v.balance >= 0)}
                                rotation={rotation}
                                settings={settings}
                                onCellClick={prop.clickedOnBoard}
                                onOwnerClick={(playerId) => {
                                    const el = document.querySelector(`div.player[player-id="${playerId}"]`);
                                    if (el instanceof HTMLDivElement) {
                                        el.style.animation = "spin2 1s cubic-bezier(.21, 1.57, .55, 1) infinite";
                                        setTimeout(() => { el.style.animation = ""; }, 1000);
                                    }
                                }}
                            />
                        ))}
                    </div>
                    <div className="action-bar" style={prop.myTurn && !sended ? {} : { translate: "-50% 20vh" }}>
                        {prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0 ? (
                            <>
                                <p style={{ display: "inline-block", opacity: 1, color: "rgb(0, 114, 187)", marginRight: 5 }}>
                                    {prop.selectedMode.turnTimer - timer}{" "}
                                </p>
                                <hr style={{ display: "inline", opacity: 0.5 }} />
                            </>
                        ) : (
                            <></>
                        )}
                        <button data-button-type="roll" aria-disabled={false}>
                            <p>ROLL THE </p>
                            <img style={{ marginLeft: 10 }} src={RollIcon.replace("public/", "")} />
                        </button>
                        <button data-button-type="pay" data-tooltip-hover="pay" aria-disabled={true}>
                            <img src="pay1.png" />
                        </button>
                        <button data-button-type="card" data-tooltip-hover="card" aria-disabled={true}>
                            <img src="golden-card.png" />
                        </button>
                        {prop.selectedMode.AllowDeals ? (
                            <button
                                data-button-type="trade"
                                data-tooltip-hover="trade"
                                aria-disabled={false}
                                onClick={() => {
                                    SetSended(true);
                                    prop.socket.emit("trade");
                                }}
                            >
                                <img src="morgage.png" />
                            </button>
                        ) : (
                            <></>
                        )}
                    </div>
                    <div
                        className={streetType === "Chance" || streetType === "CommunityChest" ? "chance-display-actions" : "card-display-actions"}
                        style={
                            !showStreet
                                ? {
                                      transform: "translateY(-50%) translateX(-70vw)",
                                  }
                                : {}
                        }
                    >
                        {streetType === "Chance" || streetType === "CommunityChest" ? (
                            <>
                                {streetType === "Chance" ? (
                                    <ChacneCard chance={streetDisplay as ChanceDisplayInfo} />
                                ) : streetType === "CommunityChest" ? (
                                    <ChacneCard chance={streetDisplay as ChanceDisplayInfo} />
                                ) : (
                                    <></>
                                )}
                            </>
                        ) : (
                            <>
                                <h3>{advnacedStreet ? "would you like to buy this card?" : "you can buy houses and hotels"}</h3>
                                {streetType === "Railroad" ? (
                                    <StreetCard railroad={streetDisplay as RailroadDisplayInfo} />
                                ) : streetType === "Utilities" ? (
                                    <StreetCard utility={streetDisplay as UtilitiesDisplayInfo} />
                                ) : (
                                    <StreetCard street={streetDisplay as StreetDisplayInfo} />
                                )}
                                <div>
                                    <center>
                                        {advnacedStreet ? (
                                            <div id="advanced-responses"></div>
                                        ) : (
                                            <>
                                                <button id="card-response-yes">YES</button>
                                                <button id="card-response-no">NO</button>
                                            </>
                                        )}
                                    </center>
                                </div>
                            </>
                        )}
                    </div>
                    <img data-anim="0" id="moneyAnimations" alt="" />
                </div>
                <div className="trade-table">
                    <div className="middle">
                        <h3>Trade</h3>
                        {typeof prop.tradeObj !== "object" ? (
                            <>
                                <h2>Select your opponent</h2>
                                <center>
                                    <div className="select-players">
                                        {prop.players
                                            .filter((v) => v.id !== prop.socket.id)
                                            .map((v, i) => (
                                                <button
                                                    style={{ animation: "tradepopout .3s cubic-bezier(0.21, 1.57, 0.55, 1)" }}
                                                    data-selectable={prop.myTurn}
                                                    key={i}
                                                    onClick={() => {
                                                        if (prop.myTurn) {
                                                            prop.tradeApi.onSelectPlayer(v.id);
                                                        }
                                                    }}
                                                >
                                                    {v.username}
                                                </button>
                                            ))}
                                        <button
                                            data-selectable={prop.myTurn}
                                            onClick={() => {
                                                if (prop.myTurn) {
                                                    prop.socket.emit("cancel-trade");
                                                    SetSended(false);
                                                }
                                            }}
                                        >
                                            {" "}
                                            CANCEL TRADE
                                        </button>
                                    </div>
                                </center>
                            </>
                        ) : (
                            <>
                                <div className="trade-mission">
                                    <div className="flexchild">
                                        {prop.socket.id === prop.tradeObj.againstPlayer.id || prop.socket.id === prop.tradeObj.turnPlayer.id ? (
                                            <div className="trade-craft">
                                                <p>
                                                    {" "}
                                                    {prop.socket.id === prop.tradeObj.againstPlayer.id
                                                        ? "You are the Opponent"
                                                        : "You are the Current Player"}
                                                </p>
                                                <Slider
                                                    max={
                                                        prop.socket.id === prop.tradeObj.againstPlayer.id
                                                            ? prop.players.filter((v) => v.id === (prop.tradeObj as GameTrading).againstPlayer.id)[0]
                                                                  .balance
                                                            : prop.players.filter((v) => v.id === (prop.tradeObj as GameTrading).turnPlayer.id)[0]
                                                                  .balance
                                                    }
                                                    min={0}
                                                    step={25}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.currentTarget.value);
                                                        const b = JSON.parse(JSON.stringify(prop.tradeObj)) as GameTrading;
                                                        if (prop.socket.id === (prop.tradeObj as GameTrading).againstPlayer.id) {
                                                            b.againstPlayer.balance = v;
                                                        } else {
                                                            b.turnPlayer.balance = v;
                                                        }
                                                        prop.socket.emit("trade-update", b);
                                                    }}
                                                    suffix=" M"
                                                />
                                                <br />

                                                {prop.socket.id === prop.tradeObj.againstPlayer.id ? (
                                                    prop.players
                                                        .filter((v) => v.id === (prop.tradeObj as GameTrading).againstPlayer.id)[0]
                                                        .properties.filter(
                                                            (v) =>
                                                                !(prop.tradeObj as GameTrading).againstPlayer.prop
                                                                    .map((v) => JSON.stringify(v))
                                                                    .includes(JSON.stringify(v))
                                                        )
                                                        .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false))
                                                        .map((v, i) => (
                                                            <div
                                                                key={i}
                                                                className="proprety-nav"
                                                                onClick={() => {
                                                                    const b = JSON.parse(JSON.stringify(prop.tradeObj)) as GameTrading;
                                                                    b.againstPlayer.prop.push(v);
                                                                    prop.socket.emit("trade-update", b);
                                                                }}
                                                            >
                                                                <i
                                                                    className="box"
                                                                    style={{
                                                                        backgroundColor: translateGroup(v.group),
                                                                    }}
                                                                ></i>
                                                                <h3
                                                                    style={
                                                                        v.morgage !== undefined && v.morgage === true
                                                                            ? { textDecoration: "line-through white" }
                                                                            : {}
                                                                    }
                                                                >
                                                                    {propretyMap.get(v.posistion)?.name ?? ""}
                                                                </h3>
                                                                <div>
                                                                    {v.count == "h" ? (
                                                                        <img src={HotelIcon.replace("public/", "")} alt="" />
                                                                    ) : typeof v.count === "number" && v.count > 0 ? (
                                                                        <>
                                                                            <p>{v.count}</p>
                                                                            <img src={HouseIcon.replace("public/", "")} alt="" />
                                                                        </>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                ) : prop.socket.id === prop.tradeObj.turnPlayer.id ? (
                                                    prop.players
                                                        .filter((v) => v.id === (prop.tradeObj as GameTrading).turnPlayer.id)[0]
                                                        .properties.filter(
                                                            (v) =>
                                                                !(prop.tradeObj as GameTrading).turnPlayer.prop
                                                                    .map((v) => JSON.stringify(v))
                                                                    .includes(JSON.stringify(v))
                                                        )
                                                        .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false))
                                                        .map((v, i) => (
                                                            <div
                                                                key={i}
                                                                className="proprety-nav"
                                                                onClick={() => {
                                                                    const b = JSON.parse(JSON.stringify(prop.tradeObj)) as GameTrading;
                                                                    b.turnPlayer.prop.push(v);
                                                                    prop.socket.emit("trade-update", b);
                                                                }}
                                                            >
                                                                <i
                                                                    className="box"
                                                                    style={{
                                                                        backgroundColor: translateGroup(v.group),
                                                                    }}
                                                                ></i>
                                                                <h3
                                                                    style={
                                                                        v.morgage !== undefined && v.morgage === true
                                                                            ? { textDecoration: "line-through white" }
                                                                            : {}
                                                                    }
                                                                >
                                                                    {propretyMap.get(v.posistion)?.name ?? ""}
                                                                </h3>
                                                                <div>
                                                                    {v.count == "h" ? (
                                                                        <img src={HotelIcon.replace("public/", "")} alt="" />
                                                                    ) : typeof v.count === "number" && v.count > 0 ? (
                                                                        <>
                                                                            <p>{v.count}</p>
                                                                            <img src={HouseIcon.replace("public/", "")} alt="" />
                                                                        </>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <></>
                                                )}
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>

                                    <div className="flexchild">
                                        <div className="player">
                                            <h5>
                                                current player{" "}
                                                <h2>
                                                    {prop.players.filter((v) => v.id === (prop.tradeObj as GameTrading).turnPlayer.id)[0].username}
                                                </h2>
                                            </h5>
                                            <table>
                                                <tr>
                                                    <td>Balance</td>
                                                    <td>{prop.tradeObj.turnPlayer.balance} M</td>
                                                </tr>
                                                {prop.tradeObj.turnPlayer.prop.length > 0 ? (
                                                    <tr>
                                                        <td>Propreties</td>
                                                        <td>
                                                            {prop.tradeObj.turnPlayer.prop.map((v, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="proprety-nav"
                                                                    data-actionable={prop.socket.id === (prop.tradeObj as GameTrading).turnPlayer.id}
                                                                    onClick={() => {
                                                                        if (prop.socket.id === (prop.tradeObj as GameTrading).turnPlayer.id) {
                                                                            const b = JSON.parse(JSON.stringify(prop.tradeObj)) as GameTrading;
                                                                            b.turnPlayer.prop.splice(i, 1);
                                                                            prop.socket.emit("trade-update", b);
                                                                        }
                                                                    }}
                                                                >
                                                                    <i
                                                                        className="box"
                                                                        style={{
                                                                            backgroundColor: translateGroup(v.group),
                                                                        }}
                                                                    ></i>
                                                                    <h3
                                                                        style={
                                                                            v.morgage !== undefined && v.morgage === true
                                                                                ? { textDecoration: "line-through white" }
                                                                                : {}
                                                                        }
                                                                    >
                                                                        {propretyMap.get(v.posistion)?.name ?? ""}
                                                                    </h3>
                                                                    <div>
                                                                        {v.count == "h" ? (
                                                                            <img src={HotelIcon.replace("public/", "")} alt="" />
                                                                        ) : typeof v.count === "number" && v.count > 0 ? (
                                                                            <>
                                                                                <p>{v.count}</p>
                                                                                <img src={HouseIcon.replace("public/", "")} alt="" />
                                                                            </>
                                                                        ) : (
                                                                            <></>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <></>
                                                )}
                                            </table>
                                        </div>
                                        <div className="player">
                                            <h5>
                                                opponent player
                                                <h2>
                                                    {prop.players.filter((v) => v.id === (prop.tradeObj as GameTrading).againstPlayer.id)[0].username}
                                                </h2>
                                            </h5>
                                            <table>
                                                <tr>
                                                    <td>Balance</td>
                                                    <td>{prop.tradeObj.againstPlayer.balance} M</td>
                                                </tr>
                                                {prop.tradeObj.againstPlayer.prop.length > 0 ? (
                                                    <tr>
                                                        <td>Propreties</td>
                                                        <td>
                                                            {prop.tradeObj.againstPlayer.prop.map((v, i) => (
                                                                <div
                                                                    key={i}
                                                                    data-actionable={
                                                                        prop.socket.id === (prop.tradeObj as GameTrading).againstPlayer.id
                                                                    }
                                                                    className="proprety-nav"
                                                                    onClick={() => {
                                                                        if (prop.socket.id === (prop.tradeObj as GameTrading).againstPlayer.id) {
                                                                            const b = JSON.parse(JSON.stringify(prop.tradeObj)) as GameTrading;
                                                                            b.againstPlayer.prop.splice(i, 1);
                                                                            prop.socket.emit("trade-update", b);
                                                                        }
                                                                    }}
                                                                >
                                                                    <i
                                                                        className="box"
                                                                        style={{
                                                                            backgroundColor: translateGroup(v.group),
                                                                        }}
                                                                    ></i>
                                                                    <h3
                                                                        style={
                                                                            v.morgage !== undefined && v.morgage === true
                                                                                ? { textDecoration: "line-through white" }
                                                                                : {}
                                                                        }
                                                                    >
                                                                        {propretyMap.get(v.posistion)?.name ?? ""}
                                                                    </h3>
                                                                    <div>
                                                                        {v.count == "h" ? (
                                                                            <img src={HotelIcon.replace("public/", "")} alt="" />
                                                                        ) : typeof v.count === "number" && v.count > 0 ? (
                                                                            <>
                                                                                <p>{v.count}</p>
                                                                                <img src={HouseIcon.replace("public/", "")} alt="" />
                                                                            </>
                                                                        ) : (
                                                                            <></>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <></>
                                                )}
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flexchild"></div>
                                </div>

                                {prop.myTurn ? (
                                    <center>
                                        <div className="trade-craft-buttons">
                                            <button
                                                data-selectable={prop.myTurn}
                                                onClick={() => {
                                                    if (prop.myTurn) {
                                                        prop.socket.emit("cancel-trade");
                                                        SetSended(false);
                                                    }
                                                }}
                                            >
                                                {" "}
                                                CANCEL
                                            </button>
                                            <button
                                                data-selectable={prop.myTurn}
                                                onClick={() => {
                                                    if (prop.myTurn) {
                                                        prop.socket.emit("trade");
                                                    }
                                                }}
                                            >
                                                {" "}
                                                BACK
                                            </button>
                                            <button
                                                data-selectable={prop.myTurn}
                                                onClick={() => {
                                                    if (prop.myTurn) {
                                                        prop.socket.emit("submit-trade", prop.tradeObj);
                                                        SetSended(false);
                                                    }
                                                }}
                                            >
                                                {" "}
                                                SUBMIT
                                            </button>
                                        </div>
                                    </center>
                                ) : (prop.tradeObj as GameTrading).againstPlayer.id === prop.socket.id ? (
                                    <center>
                                        <div className="trade-craft-buttons">
                                            <button
                                                data-selectable={prop.myTurn}
                                                onClick={() => {
                                                    prop.socket.emit("trade");
                                                }}
                                            >
                                                {" "}
                                                CANCEL
                                            </button>
                                        </div>
                                    </center>
                                ) : (
                                    <></>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
});
export default MonopolyGame;
