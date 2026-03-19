import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { GameTrading } from "../../assets/types";
import { translateGroup } from "./streetCard";
import HouseIcon from "../../assets/images/h.png";
import HotelIcon from "../../assets/images/ho.png";
import Slider from "../utils/slider";
import monopolyJSON from "../../assets/monopoly.json";

const propretyMap = new Map(
    monopolyJSON.properties.map((obj) => [obj.posistion ?? 0, obj])
);

interface TradeTableProps {
    tradeObj: GameTrading | boolean | undefined;
    socket: Socket;
    players: Player[];
    myTurn: boolean;
    tradeApi: { onSelectPlayer: (pId: string) => void };
    onCancelSended: () => void;
}

export default function TradeTable({ tradeObj: tradeObjRaw, socket, players, myTurn, tradeApi, onCancelSended }: TradeTableProps) {
    const tradeObj = tradeObjRaw;
    return (
<div className="trade-table">
    <div className="middle">
        <h3>Trade</h3>
        {typeof tradeObj !== "object" ? (
            <>
                <h2>Select your opponent</h2>
                <center>
                    <div className="select-players">
                        {players
                            .filter((v) => v.id !== socket.id)
                            .map((v, i) => (
                                <button
                                    style={{ animation: "tradepopout .3s cubic-bezier(0.21, 1.57, 0.55, 1)" }}
                                    data-selectable={myTurn}
                                    key={i}
                                    onClick={() => {
                                        if (myTurn) {
                                            tradeApi.onSelectPlayer(v.id);
                                        }
                                    }}
                                >
                                    {v.username}
                                </button>
                            ))}
                        <button
                            data-selectable={myTurn}
                            onClick={() => {
                                if (myTurn) {
                                    socket.emit("cancel-trade");
                                    onCancelSended();
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
                        {socket.id === tradeObj.againstPlayer.id || socket.id === tradeObj.turnPlayer.id ? (
                            <div className="trade-craft">
                                <p>
                                    {" "}
                                    {socket.id === tradeObj.againstPlayer.id
                                        ? "You are the Opponent"
                                        : "You are the Current Player"}
                                </p>
                                <Slider
                                    max={
                                        socket.id === tradeObj.againstPlayer.id
                                            ? players.filter((v) => v.id === (tradeObj as GameTrading).againstPlayer.id)[0]
                                                  .balance
                                            : players.filter((v) => v.id === (tradeObj as GameTrading).turnPlayer.id)[0]
                                                  .balance
                                    }
                                    min={0}
                                    step={25}
                                    onChange={(e) => {
                                        const v = parseInt(e.currentTarget.value);
                                        const b = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
                                        if (socket.id === (tradeObj as GameTrading).againstPlayer.id) {
                                            b.againstPlayer.balance = v;
                                        } else {
                                            b.turnPlayer.balance = v;
                                        }
                                        socket.emit("trade-update", b);
                                    }}
                                    suffix=" M"
                                />
                                <br />

                                {socket.id === tradeObj.againstPlayer.id ? (
                                    players
                                        .filter((v) => v.id === (tradeObj as GameTrading).againstPlayer.id)[0]
                                        .properties.filter(
                                            (v) =>
                                                !(tradeObj as GameTrading).againstPlayer.prop
                                                    .map((v) => JSON.stringify(v))
                                                    .includes(JSON.stringify(v))
                                        )
                                        .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false))
                                        .map((v, i) => (
                                            <div
                                                key={i}
                                                className="proprety-nav"
                                                onClick={() => {
                                                    const b = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
                                                    b.againstPlayer.prop.push(v);
                                                    socket.emit("trade-update", b);
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
                                ) : socket.id === tradeObj.turnPlayer.id ? (
                                    players
                                        .filter((v) => v.id === (tradeObj as GameTrading).turnPlayer.id)[0]
                                        .properties.filter(
                                            (v) =>
                                                !(tradeObj as GameTrading).turnPlayer.prop
                                                    .map((v) => JSON.stringify(v))
                                                    .includes(JSON.stringify(v))
                                        )
                                        .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false))
                                        .map((v, i) => (
                                            <div
                                                key={i}
                                                className="proprety-nav"
                                                onClick={() => {
                                                    const b = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
                                                    b.turnPlayer.prop.push(v);
                                                    socket.emit("trade-update", b);
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
                                    {players.filter((v) => v.id === (tradeObj as GameTrading).turnPlayer.id)[0].username}
                                </h2>
                            </h5>
                            <table><tbody>
                                <tr>
                                    <td>Balance</td>
                                    <td>{tradeObj.turnPlayer.balance} M</td>
                                </tr>
                                {tradeObj.turnPlayer.prop.length > 0 ? (
                                    <tr>
                                        <td>Propreties</td>
                                        <td>
                                            {tradeObj.turnPlayer.prop.map((v, i) => (
                                                <div
                                                    key={i}
                                                    className="proprety-nav"
                                                    data-actionable={socket.id === (tradeObj as GameTrading).turnPlayer.id}
                                                    onClick={() => {
                                                        if (socket.id === (tradeObj as GameTrading).turnPlayer.id) {
                                                            const b = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
                                                            b.turnPlayer.prop.splice(i, 1);
                                                            socket.emit("trade-update", b);
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
                            </tbody></table>
                        </div>
                        <div className="player">
                            <h5>
                                opponent player
                                <h2>
                                    {players.filter((v) => v.id === (tradeObj as GameTrading).againstPlayer.id)[0].username}
                                </h2>
                            </h5>
                            <table><tbody>
                                <tr>
                                    <td>Balance</td>
                                    <td>{tradeObj.againstPlayer.balance} M</td>
                                </tr>
                                {tradeObj.againstPlayer.prop.length > 0 ? (
                                    <tr>
                                        <td>Propreties</td>
                                        <td>
                                            {tradeObj.againstPlayer.prop.map((v, i) => (
                                                <div
                                                    key={i}
                                                    data-actionable={
                                                        socket.id === (tradeObj as GameTrading).againstPlayer.id
                                                    }
                                                    className="proprety-nav"
                                                    onClick={() => {
                                                        if (socket.id === (tradeObj as GameTrading).againstPlayer.id) {
                                                            const b = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
                                                            b.againstPlayer.prop.splice(i, 1);
                                                            socket.emit("trade-update", b);
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
                            </tbody></table>
                        </div>
                    </div>
                    <div className="flexchild"></div>
                </div>

                {myTurn ? (
                    <center>
                        <div className="trade-craft-buttons">
                            <button
                                data-selectable={myTurn}
                                onClick={() => {
                                    if (myTurn) {
                                        socket.emit("cancel-trade");
                                        onCancelSended();
                                    }
                                }}
                            >
                                {" "}
                                CANCEL
                            </button>
                            <button
                                data-selectable={myTurn}
                                onClick={() => {
                                    if (myTurn) {
                                        socket.emit("trade");
                                    }
                                }}
                            >
                                {" "}
                                BACK
                            </button>
                            <button
                                data-selectable={myTurn}
                                onClick={() => {
                                    if (myTurn) {
                                        socket.emit("submit-trade", tradeObj);
                                        onCancelSended();
                                    }
                                }}
                            >
                                {" "}
                                SUBMIT
                            </button>
                        </div>
                    </center>
                ) : (tradeObj as GameTrading).againstPlayer.id === socket.id ? (
                    <center>
                        <div className="trade-craft-buttons">
                            <button
                                data-selectable={myTurn}
                                onClick={() => {
                                    socket.emit("trade");
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
    );
}
