import { useState, useEffect, useRef } from "react";
import { Server, Socket } from "../../assets/sockets.ts";
import { Player, PlayerJSON } from "../../assets/player.ts";
import "../../monopoly.css";
import MonopolyNav, { type MonopolyNavApi } from "../../components/ingame/nav.tsx";
import MonopolyGame, { type MonopolyGameApi } from "../../components/ingame/game.tsx";
import NotificationOverlay from "../../components/NotificationOverlay.tsx";
import { useNotifications } from "../../contexts/NotificationContext.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import { MonopolyModes, historyAction, history, GameTrading, MonopolyMode } from "../../assets/types.ts";
import { useSettings } from "../../contexts/SettingsContext.tsx";
import Lobby from "../../components/ingame/Lobby.tsx";
import CursorOverlay from "../../components/ingame/CursorOverlay.tsx";
import ServerPanel from "../../components/ingame/ServerPanel.tsx";
function App({ socket, name, server }: { socket: Socket; name: string; server: Server | undefined }) {
    const [clients, SetClients] = useState<Map<string, Player>>(new Map());
    const players = Array.from(clients.values());

    const [currentId, SetCurrent] = useState<string>("");
    const [gameStarted, SetGameStarted] = useState<boolean>(false);
    const [gameStartedDisplay, SetGameStartedDisplay] = useState<boolean>(false);
    const [imReady, SetReady] = useState<boolean>(false);
    const [selectedMode, SetMode] = useState<MonopolyMode>(MonopolyModes[0]);
    const { settings: globalSettings } = useSettings();
    const settingsRef = useRef(globalSettings);
    settingsRef.current = globalSettings;
    const [mainTheme, SetTheme] = useState(new Audio("./main-theme.mp3"));
    const [startTIme, SetStartTime] = useState<Date>(new Date());
    const [histories, SetHistories] = useState<Array<historyAction>>([]);

    const [currentTrade, setTrade] = useState<GameTrading | boolean | undefined>(undefined);
    const [serverLogs, setServerLogs] = useState<Array<any[]>>([]);
    const [countdownValue, setCountdownValue] = useState<number | null>(null);

    useEffect(() => {
        if (!gameStartedDisplay) return;
        // Sound Effect
        mainTheme.loop = true;
        mainTheme.play();

        mainTheme.volume = 0.25;
        if (globalSettings !== undefined) {
            mainTheme.volume = (globalSettings.audio[0] / 100) * (globalSettings.audio[2] / 100);
        }
        SetTheme(mainTheme);
        SetStartTime(new Date());
    }, [gameStartedDisplay]);

    useEffect(() => {
        if (globalSettings !== undefined) {
            mainTheme.volume = (globalSettings.audio[0] / 100) * (globalSettings.audio[2] / 100);
        }
    }, [globalSettings]);

    const { showNotification, showDialog, dismissDialog } = useNotifications();
    const notifyActionsRef = useRef({ showNotification, showDialog, dismissDialog });
    notifyActionsRef.current = { showNotification, showDialog, dismissDialog };

    const engineRef = useRef<MonopolyGameApi | null>(null);
    const navRef = useRef<MonopolyNavApi | null>(null);

    const propretyMap = new Map(
        monopolyJSON.properties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );
    useEffect(() => {
        if (server === undefined) return;
        server.RenderLogs((array) => {
            setServerLogs([...array]);
        });
    }, [server]);
    useEffect(() => {
        // Live reference to latest settings via ref (replaces cookie polling setInterval)
        const getSettings = () => settingsRef.current;

        function mouseMove(e: MouseEvent) {
            const _pos = { x: e.clientX, y: e.clientY };
            const xplayer = clients.get(socket.id);
            socket.emit("mouse", _pos);
            xplayer ? (xplayer.positions = _pos) : "";
        }

        function destroyPlayer(playerId: string) {
            // remove player from clients
            function removePlayer() {
                clients.delete(playerId);
                SetClients(new Map(clients));

                // 1 frame to check if it isnt removed
                requestAnimationFrame(() => {
                    if (clients.has(playerId)) {
                        // request a loop frame!
                        requestAnimationFrame(removePlayer);
                    } else {
                    }
                });
            }
            removePlayer();

            // removing child from game div
            function removeChild() {
                const _element = document.querySelector(`div.player[player-id="${playerId}"]`);
                if (_element === null) return;
                if (_element.parentElement) _element.parentElement.removeChild(_element);
                _element.remove();

                // 1 frame to check if it isnt removed
                requestAnimationFrame(() => {
                    if (document.querySelector(`div.player[player-id="${playerId}"]`) !== null) {
                        // request a loop frame!
                        requestAnimationFrame(removeChild);
                    } else {
                    }
                });
            }
            removeChild();
        }

        function playerMoveGENERATOR(
            final_position: number,
            _xplayer: Player,
            get200whengo: boolean = true,
            afterFinished?: () => void,
            adding: boolean = true
        ) {
            var sum_moves = (final_position - _xplayer.position) % 40;
            if ((final_position < _xplayer.position || sum_moves < 0) && adding) {
                sum_moves = 40 - _xplayer.position + final_position;
            }

            if (!adding) {
                sum_moves = _xplayer.position - final_position;
                if (sum_moves < 0) {
                    sum_moves += 40;
                }
            }

            const time = 0.35 * 1000 * sum_moves;

            console.log(`${new Date().toTimeString()} generator ${Math.random()} target ${final_position} time ${time} current ${_xplayer.position}`);
            function _playerMoveFunc() {
                var firstPosition = 0;
                var addedMoney = false;
                var i = 0;
                const element = document.querySelector(`div.player[player-id="${_xplayer.id}"]`) as HTMLDivElement;

                firstPosition = _xplayer.position;
                _xplayer.position += 1;
                var audio = new Audio("./step2.mp3");
                audio.volume = 0.1 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                element.style.animation = "jumpstreet 0.35s cubic-bezier(.26,1.5,.65,1.02)";
                const movingAnim = () => {
                    if (i < sum_moves) {
                        i += 1;
                        var audio = new Audio("./step2.mp3");
                        audio.volume = 1 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                        audio.loop = false;
                        audio.play();
                        _xplayer.position = (_xplayer.position + (adding ? 1 : -1)) % 40;
                        if (_xplayer.position == 0 && get200whengo) {
                            _xplayer.balance += 200;
                            var audio = new Audio("./moneyplus.mp3");
                            audio.volume = 1 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            if (_xplayer.id === socket.id) {
                                if (getSettings() !== undefined && getSettings()!.notifications === true)
                                    notifyActionsRef.current.showNotification(`${200} of money is added to the account`, "info", 2, () => {}, false);
                                engineRef.current?.applyAnimation(2);
                            }
                            addedMoney = true;
                            SetClients(new Map(clients.set(_xplayer.id, _xplayer)));
                        }
                        if (i == sum_moves - 1) {
                            _xplayer.position = final_position;
                            element.style.animation = "part 0.9s cubic-bezier(0,.7,.57,1)";
                            setTimeout(() => {
                                element.style.animation = "";
                            }, 900);

                            if (!addedMoney && firstPosition > _xplayer.position && get200whengo) {
                                var audio = new Audio("./moneyplus.mp3");
                                audio.volume = 1 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                audio.loop = false;
                                audio.play();
                                _xplayer.balance += 200;
                                if (_xplayer.id === socket.id) {
                                    if (getSettings() !== undefined && getSettings()!.notifications === true)
                                        notifyActionsRef.current.showNotification(`${200} of money is added to the account`, "info", 2, () => {}, false);
                                    engineRef.current?.applyAnimation(2);
                                }
                                addedMoney = true;

                                SetClients(new Map(clients.set(_xplayer.id, _xplayer)));
                            }
                            if (afterFinished) afterFinished();
                        } else {
                            element.style.animation = "jumpstreet 0.35s cubic-bezier(.26,1.5,.65,1.02)";
                            setTimeout(movingAnim, 0.35 * 1000);
                        }
                    }
                };
                setTimeout(movingAnim, 0.35 * 1000);
            }

            return {
                func: _playerMoveFunc,
                time,
            };
        }

        //#region socket handeling
        const socket_Initials = (args: { turn_id: string; other_players: Array<PlayerJSON>; selectedMode: MonopolyMode }) => {
            SetCurrent(args.turn_id.toString());
            for (const x of args.other_players) {
                SetClients(clients.set(x.id, new Player(x.id, x.username).recieveJson(x)));
            }
            SetMode(args.selectedMode);
        };

        const socket_NewPlayer = (args: PlayerJSON) => {
            SetClients(new Map(clients.set(args.id, new Player(args.id, args.username).recieveJson(args))));
        };

        const socket_Ready = (args: { id: string; state: boolean; selectedMode: MonopolyMode }) => {
            const x = clients.get(args.id);
            if (x === undefined) return;
            x.ready = args.state;
            SetClients(new Map(clients.set(x.id, x)));
            SetMode(args.selectedMode);
        };
        const socket_StartGame = () => {
            SetGameStarted(true);
            setCountdownValue(3);
            setTimeout(() => {
                setCountdownValue(2);
                setTimeout(() => {
                    setCountdownValue(1);
                    setTimeout(() => {
                        setCountdownValue(null);
                        SetGameStartedDisplay(true);
                    }, 1000);
                }, 1000);
            }, 1000);
        };

        const socket_DisconnectedPlayer = (args: { id: string; turn: string }) => {
            SetCurrent(args.turn);
            if (clients.size > 2) {
                const name = clients.get(args.id)?.username ?? "player";
                notifyActionsRef.current.showNotification(`${name} disconected`, "error");
            } else if (clients.has(args.id)) {
                mainTheme.pause();
                notifyActionsRef.current.showDialog({
                    title: "YOU WON!",
                    body: `your the only left player with the balance of ${clients.get(socket.id)?.balance ?? 0}`,
                    buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                    soundtrack: "winning",
                });
            }
            destroyPlayer(args.id);
        };

        const socket_TurnFinished = (args: { from: string; turnId: string; pJson: PlayerJSON; WinningMode: string }) => {
            const x = clients.get(args.from);

            if (x !== undefined && JSON.stringify(x.properties) != JSON.stringify(args.pJson.properties)) {
                // sound part - other player part
                var audio = new Audio("./buying1.mp3");
                audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
            }

            if (args.from !== socket.id && x) {
                x.recieveJson(args.pJson);
                SetClients(new Map(clients.set(args.from, x)));
            }

            if (args.pJson.balance < 0) {
                if (args.pJson.id !== socket.id) {
                    if (clients.size > 2) {
                        const name = args.pJson.username;
                        notifyActionsRef.current.showNotification(`${name} lost`, "info");
                    } else {
                        if (clients.has(socket.id)) {
                            mainTheme.pause();
                            notifyActionsRef.current.showDialog({
                                title: "YOU WON!",
                                body: `your the only left player with the balance of ${clients.get(socket.id)?.balance ?? 0}`,
                                buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                soundtrack: "winning",
                            });
                        } else {
                            const xclient = Array.from(clients.values()).filter((v) => v.id !== args.pJson.id)[0];
                            const name = xclient.username ?? 0;
                            mainTheme.pause();
                            notifyActionsRef.current.showDialog({
                                title: `${name} WON!`,
                                body: `${name} won with the balance of ${clients.get(socket.id)?.balance ?? 0}`,
                                buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                soundtrack: "winning",
                            });
                        }
                    }
                } else {
                    mainTheme.pause();
                    notifyActionsRef.current.showDialog({
                        title: "YOU LOST!",
                        body: `you lost your money and lost the monopol with a wanted balance of ${-(clients.get(socket.id)?.balance ?? 0)}`,
                        buttons: [
                            { label: "CONTINUE WATCHING", onClick: () => { notifyActionsRef.current.dismissDialog(); } },
                            { label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } },
                        ],
                        soundtrack: "loosing",
                    });
                }

                destroyPlayer(args.pJson.id);
            }
            if (args.WinningMode === "monopols" || args.WinningMode === "monopols & trains") {
                function removeDuplicates(originalList: Array<any>) {
                    // Create an empty array to store unique values
                    const uniqueList: Array<any> = [];

                    // Use the filter method to iterate through the original list
                    originalList.filter(function (item) {
                        // If the item is not already in the uniqueList, add it
                        if (!uniqueList.includes(item)) {
                            uniqueList.push(item);
                        }
                        // Always return false in the filter function to skip duplicates
                        return false;
                    });

                    // Return the uniqueList
                    return uniqueList;
                }
                for (const p of Array.from(clients.values())) {
                    const prpGrups = [];
                    for (const prp of p.properties) {
                        if (!["Special", "Railroad", "Utilities"].includes(prp.group)) prpGrups.push(prp.group);
                    }
                    let x: number = 0;

                    for (const g of removeDuplicates(prpGrups)) {
                        const c = prpGrups.filter((v) => v === g).length;
                        const cc = monopolyJSON.properties.filter((v) => v.group === g).length;
                        if (c === cc) {
                            x += 1;
                        }
                    }
                    if (x === 3) {
                        mainTheme.pause();
                        if (p.id === socket.id) {
                            notifyActionsRef.current.showDialog({
                                title: "YOU WON!",
                                body: "you have 3 sets!",
                                buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                soundtrack: "winning",
                            });
                        } else {
                            notifyActionsRef.current.showDialog({
                                title: `${p.username} WON!`,
                                body: "got 3 sets!",
                                buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                soundtrack: "winning",
                            });
                        }
                        return;
                    }
                }
                if (args.WinningMode === "monopols & trains") {
                    // continue with trains winning state!
                    for (const p of Array.from(clients.values())) {
                        const c = p.properties.filter((v) => v.group === "Railroad").length;
                        if (c === 4) {
                            mainTheme.pause();
                            if (p.id === socket.id) {
                                notifyActionsRef.current.showDialog({
                                    title: "YOU WON!",
                                    body: "you have 4 railroads!",
                                    buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                    soundtrack: "winning",
                                });
                            } else {
                                notifyActionsRef.current.showDialog({
                                    title: `${p.username} WON!`,
                                    body: "got 4 railroads!",
                                    buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                                    soundtrack: "winning",
                                });
                            }
                            return;
                        }
                    }
                }
            }

            SetCurrent(args.turnId);
            if (args.turnId === socket.id) {
                const x = clients.get(args.turnId);
                if (x && x.isInJail) {
                    engineRef.current?.showJailsButtons((x?.getoutCards ?? -1) > 0);
                } else {
                }
            }
            navRef.current?.reRenderPlayerList();
        };

        const socket_Message = (message: { from: string; message: string }) => {
            navRef.current?.addMessage(message);
        };
        const socket_DiceRollResult = (args: { listOfNums: [number, number, number]; turnId: string }) => {
            SetHistories((old) => [
                ...old,
                history(
                    `${clients.get(args.turnId)?.username ?? "unknown player"} rolled [${args.listOfNums[0]}, ${args.listOfNums[1]}] moving to "${
                        propretyMap.get(args.listOfNums[2])?.name ?? ""
                    }"`
                ),
            ]);
            var audio = new Audio("./rolling.mp3");
            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
            audio.loop = false;
            audio.play();
            // const sumTimes = args.listOfNums[0] + args.listOfNums[1];
            const localPlayer = clients.get(socket.id) as Player;
            const xplayer = clients.get(args.turnId) as Player;
            const dice_generatorResults = playerMoveGENERATOR(args.listOfNums[2], xplayer, true, () => {
                if (args.turnId != socket.id && args.listOfNums[2] === 30) {
                    setTimeout(() => {
                        SetHistories((old) => [...old, history(`${clients.get(args.turnId)?.username ?? "unknown player"} goes to jail`)]);
                        const generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                            xplayer.position = 10;
                            xplayer.isInJail = true;
                            var audio = new Audio("./jail.mp3");
                            audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            xplayer.jailTurnsRemaining = 3;
                        });
                        generatorResults.func();
                    }, 800);
                }
            });

            engineRef.current?.diceResults({
                l: [args.listOfNums[0], args.listOfNums[1]],
                time: localPlayer.isInJail ? 2000 : dice_generatorResults.time + 2000 + 800,
                onDone: () => {
                    if (socket.id !== args.turnId) return;

                    const location = clients.get(socket.id)?.position ?? -1;
                    const proprety = propretyMap.get(location);
                    if (proprety != undefined) {
                        if (proprety.id === "communitychest" || proprety.id === "chance") {
                            socket.emit("chorch_roll", { is_chance: proprety.id === "chance", rolls: args.listOfNums[0] + args.listOfNums[1] });
                        } else {
                            engineRef.current?.setStreet({
                                location,
                                rolls: args.listOfNums[1] + args.listOfNums[0],
                                onResponse: (b, info) => {
                                    var time_till_free = 0;
                                    if (b === "buy") {
                                        if (getSettings() !== undefined && getSettings()!.notifications === true)
                                            notifyActionsRef.current.showNotification(
                                                `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                                "info",
                                                2,
                                                () => {},
                                                false
                                            );
                                        localPlayer.balance -= (proprety?.price ?? 0) * 1;
                                        engineRef.current?.applyAnimation(1);
                                        localPlayer.properties.push({
                                            posistion: localPlayer.position,
                                            count: 0,
                                            group: propretyMap.get(localPlayer.position)?.group ?? "",
                                        });
                                        var audio = new Audio("./buying1.mp3");
                                        audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                        audio.loop = false;
                                        audio.play();

                                        socket.emit(
                                            "history",
                                            history(`${clients.get(socket.id)?.username ?? "unknown player"} bought ${proprety.name}`)
                                        );
                                    } else if (b === "advance-buy") {
                                        var audio = new Audio("./buying1.mp3");
                                        audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                        audio.loop = false;
                                        audio.play();
                                        const propId = Array.from(new Map(localPlayer.properties.map((v, i) => [i, v])).entries()).filter(
                                            (v) => v[1].posistion === location
                                        )[0][0];

                                        const _info = info as {
                                            state: 1 | 2 | 3 | 4 | 5;
                                            money: number;
                                        };

                                        localPlayer.properties[propId].count = _info.state === 5 ? "h" : _info.state;

                                        if (_info.state === 5) {
                                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                notifyActionsRef.current.showNotification(
                                                    `${proprety.ohousecost ?? 0} of money is deducted from the account`,
                                                    "info",
                                                    2,
                                                    () => {},
                                                    false
                                                );
                                            localPlayer.balance -= proprety.ohousecost ?? 0;
                                            engineRef.current?.applyAnimation(1);
                                        } else {
                                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                notifyActionsRef.current.showNotification(
                                                    `${proprety.housecost ?? 0} of money is deducted from the account`,
                                                    "info",
                                                    2,
                                                    () => {},
                                                    false
                                                );
                                            localPlayer.balance -= (proprety.housecost ?? 0) * _info.money;
                                            engineRef.current?.applyAnimation(1);
                                        }

                                        socket.emit(
                                            "history",
                                            history(`${clients.get(socket.id)?.username ?? "unknown player"} advanced ${proprety.name}`)
                                        );
                                    } else if (b === "someones") {
                                        const players = Array.from(clients.values());
                                        for (const p of players) {
                                            for (const prp of p.properties) {
                                                if (prp.posistion === location) {
                                                    var payment_ammount = 0;

                                                    if (proprety.group === "Utilities" && prp.rent) {
                                                        const multy_ = p.properties.filter((v) => v.group === "Utilities").length === 2 ? 10 : 4;
                                                        payment_ammount = prp.rent * multy_;
                                                    } else if (proprety.group === "Railroad") {
                                                        const count = p.properties
                                                            .filter((v) => v.group === "Railroad")
                                                            .filter(
                                                                (v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false)
                                                            ).length;
                                                        const rents = [0, 25, 50, 100, 200];
                                                        payment_ammount = rents[count];
                                                    } else if (prp.count === 0) {
                                                        payment_ammount = proprety?.rent ?? 0;
                                                    } else if (typeof prp.count === "number" && prp.count > 0) {
                                                        payment_ammount = (proprety?.multpliedrent ?? [0, 0, 0, 0])[prp.count - 1] ?? 0;
                                                    } else if (prp.count === "h") {
                                                        payment_ammount = (proprety?.multpliedrent ?? [0, 0, 0, 0, 0])[4] ?? 0;
                                                    }
                                                    if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                        notifyActionsRef.current.showNotification(
                                                            `${payment_ammount} of money is deducted from the account`,
                                                            "info",
                                                            2,
                                                            () => {},
                                                            false
                                                        );
                                                    var audio = new Audio("./moneyminus.mp3");
                                                    audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                                    audio.loop = false;
                                                    audio.play();
                                                    if (prp.morgage === undefined || (prp.morgage !== undefined && prp.morgage === false))
                                                        localPlayer.balance -= payment_ammount;
                                                    engineRef.current?.applyAnimation(1);
                                                    socket.emit("pay", {
                                                        balance: payment_ammount,
                                                        from: socket.id,
                                                        to: p.id,
                                                    });
                                                    engineRef.current?.applyAnimation(1);

                                                    socket.emit(
                                                        "history",
                                                        history(`
                                                    ${clients.get(socket.id)?.username ?? "unknown user"} pay ${payment_ammount} to ${
                                                            clients.get(p.id)?.username ?? "unknown user"
                                                        }
                                                    `)
                                                    );
                                                }
                                            }
                                        }
                                    } else if (b === "nothing") {
                                        if ((proprety?.id ?? "") == "gotojail") {
                                            const generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                                                xplayer.position = 10;
                                                xplayer.isInJail = true;
                                                xplayer.jailTurnsRemaining = 3;
                                            });

                                            time_till_free = generatorResults.time;
                                            generatorResults.func();
                                        }

                                        if (proprety?.id === "incometax") {
                                            localPlayer.balance -= 200;
                                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                notifyActionsRef.current.showNotification(
                                                    `${200} of money is deducted from the account`,
                                                    "info",
                                                    2,
                                                    () => {},
                                                    false
                                                );
                                            var audio = new Audio("./moneyminus.mp3");
                                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                            audio.loop = false;
                                            audio.play();
                                            engineRef.current?.applyAnimation(1);
                                            socket.emit(
                                                "history",
                                                history(`${clients.get(socket.id)?.username ?? "unknown player"} payed income taxes`)
                                            );
                                        }
                                        if (proprety?.id === "luxerytax") {
                                            localPlayer.balance -= 100;
                                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                notifyActionsRef.current.showNotification(
                                                    `${100} of money is deducted from the account`,
                                                    "info",
                                                    2,
                                                    () => {},
                                                    false
                                                );
                                            var audio = new Audio("./moneyminus.mp3");
                                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                            audio.loop = false;
                                            audio.play();
                                            engineRef.current?.applyAnimation(1);
                                            socket.emit(
                                                "history",
                                                history(`${clients.get(socket.id)?.username ?? "unknown player"} payed luxery taxes`)
                                            );
                                        }
                                    } else if (b === "special_action") {
                                        if (getSettings() !== undefined && getSettings()!.notifications === true)
                                            notifyActionsRef.current.showNotification(
                                                `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                                "info",
                                                2,
                                                () => {},
                                                false
                                            );
                                        var audio = new Audio("./buying1.mp3");
                                        audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                        audio.loop = false;
                                        audio.play();
                                        localPlayer.balance -= (proprety?.price ?? 0) * 1;
                                        engineRef.current?.applyAnimation(1);

                                        const _info = info as {
                                            rolls: number;
                                        };
                                        const prp = propretyMap.get(localPlayer.position);
                                        const calculateRent = _info.rolls;
                                        localPlayer.properties.push({
                                            posistion: localPlayer.position,
                                            count: 0,
                                            rent: calculateRent,
                                            group: prp?.group ?? "",
                                        });

                                        socket.emit(
                                            "history",
                                            history(
                                                `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                                    prp?.name ?? "unkown place"
                                                } with rent of ${calculateRent}`
                                            )
                                        );
                                    }

                                    setTimeout(() => {
                                        SetClients(new Map(clients.set(socket.id, localPlayer)));
                                        engineRef.current?.freeDice();
                                        const json = (clients.get(socket.id) as Player).toJson();
                                        socket.emit("finish-turn", json);
                                    }, time_till_free);
                                },
                            });
                        }
                    }
                },
            });

            if (xplayer.isInJail) {
                setTimeout(() => {
                    if (args.listOfNums[0] == args.listOfNums[1]) {
                        xplayer.isInJail = false;
                        setTimeout(() => {
                            dice_generatorResults.func();
                        }, 2000);
                    } else if (xplayer.jailTurnsRemaining > 0) {
                        xplayer.jailTurnsRemaining -= 1;
                        if (xplayer.jailTurnsRemaining === 0) {
                            xplayer.isInJail = false;
                        }
                    }
                    SetClients(new Map(clients.set(args.turnId, xplayer)));
                }, 1500);
            } else {
                setTimeout(() => {
                    dice_generatorResults.func();
                }, 2000);
            }
        };
        const socket_Unjail = (args: { to: string; option: "card" | "pay" }) => {
            const x = clients.get(args.to);
            if (x) {
                if (args.option === "card") {
                    x.getoutCards -= 1;
                } else {
                    x.balance -= 50;
                    if (x.id === socket.id && getSettings() !== undefined && getSettings()!.notifications === true)
                        notifyActionsRef.current.showNotification(`${50} of money is deducted from the account`, "info", 2, () => {}, false);
                    var audio = new Audio("./moneyminus.mp3");
                    audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                    audio.loop = false;
                    audio.play();
                }
                x.isInJail = false;
                x.jailTurnsRemaining = 0;
                SetClients(new Map(clients.set(args.to, x)));
            }
        };
        const socket_MemberUpdating = (args: {
            playerId: string;
            animation: "recieveMoney";
            additional_props: any[];
            pJson: [PlayerJSON, PlayerJSON];
        }) => {
            for (const x of args.pJson) {
                const p = clients.get(x.id);
                x.position = p?.position ?? x.position;
                p?.recieveJson(x);
            }

            if (socket.id === args.playerId) {
                engineRef.current?.applyAnimation(2);
            }
        };
        const socket_ChorchResult = (args: {
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
            };
            rolls: number;
            is_chance: boolean;
            turnId: string;
        }) => {
            SetHistories((old) => [
                ...old,
                history(
                    `${clients.get(args.turnId)?.username ?? "unknown player"} got ${
                        args.is_chance ? "chance" : "community chest "
                    } card that said "${args.element.title}"`
                ),
            ]);
            const numOfTime = 3000;
            engineRef.current?.chorch(args.element, args.is_chance, numOfTime);

            setTimeout(() => {
                const c = args.element;
                const xplayer = clients.get(args.turnId);
                if (xplayer === undefined) return;
                function addBalanceToOthers(amnout: number) {
                    if (xplayer === undefined) return 0;

                    const other_players = Array.from(clients.values()).filter((v) => v.id !== xplayer.id);

                    if (xplayer.id === socket.id) {
                        if (amnout > 0) {
                            // give money
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} gave ${amnout} money to [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        } else {
                            // get money!
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} recieve ${-amnout} money from [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        }
                    }

                    for (const p of other_players) {
                        p.balance += amnout;
                        if (p.id === socket.id && getSettings() !== undefined && getSettings()!.notifications === true) {
                            notifyActionsRef.current.showNotification(`${amnout} of money is added to the account`, "info", 2, () => {}, false);
                            var audio = new Audio("./moneyplus.mp3");
                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                        }
                        SetClients(new Map(clients.set(p.id, p)));

                        if (xplayer.id === socket.id) {
                            if (amnout > 0) {
                                socket.emit("pay", {
                                    balance: amnout,
                                    from: socket.id,
                                    to: p.id,
                                });
                            } else {
                                // recieve money
                                socket.emit("pay", {
                                    balance: amnout,
                                    from: p.id,
                                    to: socket.id,
                                });

                                socket.emit(
                                    "history",
                                    history(`
                                ${clients.get(socket.id)?.username ?? "unknown user"} pay ${payment_ammount} to ${
                                        clients.get(xplayer.id)?.username ?? "unknown user"
                                    }
                                `)
                                );
                            }
                        }
                    }
                    return other_players.length;
                }

                var time_till_finish = 0;
                switch (c.action) {
                    case "move":
                        if (c.tileid) {
                            const p = new Map(
                                monopolyJSON.properties.map((obj) => {
                                    return [obj.id, obj];
                                })
                            );
                            const targetPos = p.get(c.tileid)?.posistion;
                            if (targetPos === undefined) break;

                            const _generatorResults = playerMoveGENERATOR(targetPos, xplayer);
                            time_till_finish = _generatorResults.time;
                            _generatorResults.func();
                        } else if (c.count) {
                            const _generatorResults = playerMoveGENERATOR((xplayer.position + c.count) % 40, xplayer, true, () => {}, c.count >= 0);
                            time_till_finish = _generatorResults.time;
                            _generatorResults.func();
                        }
                        break;

                    case "addfunds":
                        xplayer.balance += c.amount ?? 0;
                        if (xplayer.id === socket.id) {
                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                notifyActionsRef.current.showNotification(`${c.amount ?? 0} of money is added to the account`, "info", 2, () => {}, false);
                            var audio = new Audio("./moneyplus.mp3");
                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            engineRef.current?.applyAnimation(2);
                        }
                        break;
                    case "jail":
                        if (c.subaction !== undefined) {
                            switch (c.subaction) {
                                case "getout":
                                    xplayer.getoutCards += 1;
                                    break;
                                case "goto":
                                    const _generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                                        xplayer.position = 10;
                                        xplayer.isInJail = true;
                                        var audio = new Audio("./jail.mp3");
                                        audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                        audio.loop = false;
                                        audio.play();
                                        xplayer.jailTurnsRemaining = 3;
                                    });
                                    time_till_finish = _generatorResults.time;
                                    _generatorResults.func();
                                    break;
                            }
                            SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        }
                        break;

                    case "removefunds":
                        xplayer.balance -= c.amount ?? 0;
                        if (xplayer.id === socket.id) {
                            engineRef.current?.applyAnimation(1);
                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                notifyActionsRef.current.showNotification(`${c.amount ?? 0} of money is deducted from the account`, "info", 2, () => {}, false);
                            var audio = new Audio("./moneyminus.mp3");
                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                        }
                        break;
                    // amount
                    case "removefundstoplayers":
                        addBalanceToOthers(c.amount ?? 0);
                        // xplayer.balance -= (c.amount ?? 0) * l;
                        if (xplayer.id === socket.id) engineRef.current?.applyAnimation(1);
                        break;

                    case "addfundsfromplayers":
                        addBalanceToOthers(-(c.amount ?? 0));
                        // xplayer.balance += (c.amount ?? 0) * l;
                        // if (xplayer.id === socket.id)
                        //     engineRef.current?.applyAnimation(2);
                        break;

                    case "movenearest":
                        if (!c.groupid) return;

                        function findNextValue(arr: number[], X: number) {
                            // Sort the array in ascending order
                            arr.sort((a, b) => a - b);

                            // Loop through the array to find the next value
                            for (let i = 0; i < arr.length; i++) {
                                if (arr[i] > X) {
                                    return arr[i];
                                }
                            }

                            // If no value greater than X is found, return the first element (wrap around)
                            return arr[0];
                        }

                        var p = "";

                        if (c.groupid === "utility") {
                            p = "Utilities";
                        } else {
                            p = "Railroad";
                        }
                        const arr = monopolyJSON.properties.filter((v) => v.group === p).map((v) => v.posistion);
                        const ongoingLocation = findNextValue(arr, xplayer.position);
                        const _generatorResults = playerMoveGENERATOR(ongoingLocation, xplayer);
                        time_till_finish = -1;
                        _generatorResults.func();
                        setTimeout(() => {
                            if (xplayer.id === socket.id) {
                                const location = xplayer?.position ?? -1;
                                const proprety = propretyMap.get(location);
                                if (proprety !== undefined) {
                                    engineRef.current?.setStreet({
                                        location,
                                        rolls: args.rolls,
                                        onResponse: (b, info) => {
                                            if (b === "buy") {
                                                if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                    notifyActionsRef.current.showNotification(
                                                        `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                                        "info",
                                                        2,
                                                        () => {},
                                                        false
                                                    );
                                                xplayer.balance -= (proprety?.price ?? 0) * 1;

                                                engineRef.current?.applyAnimation(1);
                                                const prp = propretyMap.get(xplayer.position);
                                                xplayer.properties.push({
                                                    posistion: xplayer.position,
                                                    count: 0,
                                                    group: prp?.group ?? "",
                                                });

                                                var audio = new Audio("./buying1.mp3");
                                                audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                                audio.loop = false;
                                                audio.play();

                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);

                                                socket.emit(
                                                    "history",
                                                    history(
                                                        `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                                            prp?.name ?? "unkown place"
                                                        }`
                                                    )
                                                );
                                            } else if (b === "special_action") {
                                                console.log(info);
                                                if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                    notifyActionsRef.current.showNotification(
                                                        `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                                        "info",
                                                        2,
                                                        () => {},
                                                        false
                                                    );
                                                xplayer.balance -= (proprety?.price ?? 0) * 1;

                                                const _info = info as {
                                                    rolls: number;
                                                };

                                                const calculateRent = _info.rolls;
                                                engineRef.current?.applyAnimation(1);
                                                const prp = propretyMap.get(xplayer.position);
                                                xplayer.properties.push({
                                                    posistion: xplayer.position,
                                                    count: 0,
                                                    rent: calculateRent,
                                                    group: prp?.group ?? "",
                                                });
                                                var audio = new Audio("./buying1.mp3");
                                                audio.volume = 0.5 * ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                                audio.loop = false;
                                                audio.play();

                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);

                                                socket.emit(
                                                    "history",
                                                    history(
                                                        `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                                            prp?.name ?? "unkown place"
                                                        } with rent of ${calculateRent}`
                                                    )
                                                );
                                            } else if (b === "someones") {
                                                const players = Array.from(clients.values());

                                                for (const p of players) {
                                                    for (const prp of p.properties) {
                                                        if (prp.posistion === location) {
                                                            var payment_ammount = 0;

                                                            if (proprety.group === "Utilities" && prp.rent) {
                                                                const l = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
                                                                socket.emit(
                                                                    "history",
                                                                    history(
                                                                        `${clients.get(socket.id)?.username ?? "unknown player"} rolled [${l[0]}, ${
                                                                            l[1]
                                                                        }]`
                                                                    )
                                                                );

                                                                engineRef.current?.diceResults({
                                                                    l: [l[0], l[1]],
                                                                    time: 2000,
                                                                    onDone: () => {
                                                                        payment_ammount = (l[0] + l[1]) * (c.rentmultiplier ?? 1);
                                                                        if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                                            notifyActionsRef.current.showNotification(
                                                                                `${payment_ammount} of money is deducted from the account`,
                                                                                "info",
                                                                                2,
                                                                                () => {},
                                                                                false
                                                                            );
                                                                        var audio = new Audio("./moneyminus.mp3");
                                                                        audio.volume =
                                                                            ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                                                        audio.loop = false;
                                                                        audio.play();

                                                                        xplayer.balance -= payment_ammount;
                                                                        engineRef.current?.applyAnimation(1);
                                                                        socket.emit("pay", {
                                                                            balance: payment_ammount,
                                                                            from: socket.id,
                                                                            to: p.id,
                                                                        });

                                                                        socket.emit(
                                                                            "history",
                                                                            history(
                                                                                `${
                                                                                    clients.get(socket.id)?.username ?? "unknown player"
                                                                                } pay ${payment_ammount} to ${
                                                                                    clients.get(p.id)?.username ?? "unknown player"
                                                                                }`
                                                                            )
                                                                        );

                                                                        SetClients(new Map(clients.set(socket.id, xplayer)));
                                                                        engineRef.current?.freeDice();
                                                                        const json = (clients.get(socket.id) as Player).toJson();
                                                                        socket.emit("finish-turn", json);
                                                                    },
                                                                });
                                                            } else if (proprety.group === "Railroad") {
                                                                const count = p.properties
                                                                    .filter((v) => v.group === "Railroad")
                                                                    .filter(
                                                                        (v) =>
                                                                            v.morgage === undefined ||
                                                                            (v.morgage !== undefined && v.morgage === false)
                                                                    ).length;
                                                                const rents = [0, 25, 50, 100, 200];
                                                                payment_ammount = rents[count] * (c.rentmultiplier ?? 1);

                                                                if (getSettings() !== undefined && getSettings()!.notifications === true)
                                                                    notifyActionsRef.current.showNotification(
                                                                        `${payment_ammount} of money is deducted from the account`,
                                                                        "info",
                                                                        2,
                                                                        () => {},
                                                                        false
                                                                    );
                                                                var audio = new Audio("./moneyminus.mp3");
                                                                audio.volume =
                                                                    ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                                                                audio.loop = false;
                                                                audio.play();
                                                                if (prp.morgage === undefined || (prp.morgage !== undefined && prp.morgage === false))
                                                                    xplayer.balance -= payment_ammount;
                                                                engineRef.current?.applyAnimation(1);
                                                                socket.emit("pay", {
                                                                    balance: payment_ammount,
                                                                    from: socket.id,
                                                                    to: p.id,
                                                                });
                                                                socket.emit(
                                                                    "history",
                                                                    history(
                                                                        `${
                                                                            clients.get(socket.id)?.username ?? "unknown player"
                                                                        } pay ${payment_ammount} to ${
                                                                            clients.get(p.id)?.username ?? "unknown player"
                                                                        }`
                                                                    )
                                                                );
                                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                                engineRef.current?.freeDice();
                                                                const json = (clients.get(socket.id) as Player).toJson();
                                                                socket.emit("finish-turn", json);
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);
                                            }
                                        },
                                    });
                                }
                            }
                        }, _generatorResults.time);
                        break;

                    case "propertycharges":
                        function sum(b: number[]) {
                            var s = 0;
                            for (const x of b) {
                                s += x;
                            }
                            return 1;
                        }
                        var payment_ammount =
                            (c.buildings ?? 1) * sum(xplayer.properties.filter((v) => typeof v.count === "number").map((v) => v.count as number)) +
                            (c.hotels ?? 1) * xplayer.properties.filter((v) => v.count === "h").length;
                        console.log(`
${(c.buildings ?? 1) * sum(xplayer.properties.filter((v) => typeof v.count === "number").map((v) => v.count as number))} + 
${(c.hotels ?? 1) * xplayer.properties.filter((v) => v.count === "h").length} 
which is ${payment_ammount}
                        `);
                        if (xplayer.id === socket.id && payment_ammount > 0) {
                            if (getSettings() !== undefined && getSettings()!.notifications === true)
                                notifyActionsRef.current.showNotification(`${payment_ammount} of money is deducted from the account`, "info", 2, () => {}, false);
                            var audio = new Audio("./moneyminus.mp3");
                            audio.volume = ((getSettings()?.audio[1] ?? 100) / 100) * ((getSettings()?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            engineRef.current?.applyAnimation(1);
                        }
                        xplayer.balance -= payment_ammount;
                        SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        break;
                    default:
                        break;
                }

                if (time_till_finish >= 0) {
                    setTimeout(() => {
                        SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        if (xplayer.id === socket.id) {
                            engineRef.current?.freeDice();
                            socket.emit("finish-turn", (clients.get(socket.id) as Player).toJson());
                        }
                    }, time_till_finish);
                }
            }, numOfTime);
        };
        function socket_Mouse(args: { id: string; x: number; y: number }) {
            const xplayer = clients.get(args.id);
            if (xplayer === undefined) return;
            xplayer.positions = { x: args.x, y: args.y };
            clients.set(args.id, xplayer);
        }
        function socket_networkDisconnect() {
            mainTheme.pause();
            notifyActionsRef.current.showDialog({
                title: "LOST CONNECTION",
                body: "you were disconnected from the game",
                buttons: [{ label: "PLAY ANOTHER GAME", onClick: () => { notifyActionsRef.current.dismissDialog(); document.location.reload(); } }],
                soundtrack: "loosing",
            });
        }

        function socket_history(args: historyAction) {
            SetHistories((old) => [...old, args]);
        }

        function socket_playerUpdate(args: { playerId: string; pJson: PlayerJSON }) {
            const x = clients.get(args.playerId);
            if (x === undefined) return;
            x.recieveJson(args.pJson);
        }
        document.addEventListener("mousemove", mouseMove);
        socket.on("initials", socket_Initials);
        socket.on("new-player", socket_NewPlayer);
        socket.on("ready", socket_Ready);
        socket.on("start-game", socket_StartGame);
        socket.on("disconnected-player", socket_DisconnectedPlayer);
        socket.on("turn-finished", socket_TurnFinished);
        socket.on("message", socket_Message);
        socket.on("dice_roll_result", socket_DiceRollResult);
        socket.on("unjail", socket_Unjail);
        socket.on("member_updating", socket_MemberUpdating);
        socket.on("chorch_result", socket_ChorchResult);
        socket.on("mouse", socket_Mouse);
        socket.on("disconnect", socket_networkDisconnect);
        socket.on("player_update", socket_playerUpdate);
        socket.on("history", socket_history);

        // Trade
        socket.on("trade", () => {
            if (!selectedMode.AllowDeals) return;
            setTrade(true);
        });
        socket.on("cancel-trade", () => {
            if (!selectedMode.AllowDeals) return;
            setTrade(undefined);
        });
        socket.on("trade-update", (x: GameTrading) => {
            if (!selectedMode.AllowDeals) return;
            setTrade(x);
        });

        socket.on("submit-trade", (args: { pJsons: [PlayerJSON, PlayerJSON]; action: string }) => {
            if (!selectedMode.AllowDeals) return;
            setTrade(undefined);
            for (const PJS of args.pJsons) {
                const client = clients.get(PJS.id);
                if (client !== undefined) {
                    client.recieveJson(PJS);
                }
            }
            SetHistories((old) => [...old, history(args.action)]);
        });

        var to_emit_name = true;
        //#endregion
        if (to_emit_name) socket.emit("name", name);

        return () => {
            to_emit_name = false;
            document.removeEventListener("mousemove", mouseMove);
        };
    }, []);

    useEffect(() => {
        navRef.current?.reRenderPlayerList();
    }, [clients]);

    return gameStartedDisplay ? (
        <>
            <CursorOverlay clients={clients} localId={socket.id} settings={globalSettings} />
            <main>
                <MonopolyNav
                    currentTurn={currentId}
                    onReady={(api) => { navRef.current = api; }}
                    name={name}
                    socket={socket}
                    players={players}
                    server={server}
                    Morgage={{
                        onCanc: (a, prpName: string) => {
                            const settings = settingsRef.current;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyActionsRef.current.showNotification(
                                    `${a} of money is deducted from the account for canceling mortgage`,
                                    "info",
                                    2,
                                    () => {},
                                    false
                                );

                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            var audio = new Audio("./buying1.mp3");
                            audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} cancel mortgage on ${prpName}`));
                            SetClients(new Map(clients.set(socket.id, localPlayer)));
                        },
                        onMort: (a, prpName) => {
                            const settings = settingsRef.current;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyActionsRef.current.showNotification(`${a} of money is deducted from the account for mortgage`, "info", 2, () => {}, false);
                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            var audio = new Audio("./buying1.mp3");
                            audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} mortgaged ${prpName}`));
                            SetClients(new Map(clients.set(socket.id, localPlayer)));
                        },
                    }}
                    callServer={() => {
                        const root = document.body.querySelector("#root") as HTMLDivElement;

                        root.style.transform = "translateX(100%)";
                    }}
                    history={histories}
                    time={startTIme}
                    selectedMode={selectedMode}
                />

                <MonopolyGame
                    clickedOnBoard={(a) => {
                        navRef.current?.clickedOnBoard(a);
                    }}
                    onReady={(api) => { engineRef.current = api; }}
                    socket={socket}
                    players={Array.from(clients.values())}
                    myTurn={currentId === socket.id}
                    tradeObj={currentTrade}
                    tradeApi={{
                        onSelectPlayer(pId) {
                            const xplayer = clients.get(pId);
                            const localPlayer = clients.get(socket.id);
                            if (xplayer === undefined || localPlayer === undefined) return;
                            const x = {
                                turnPlayer: {
                                    id: localPlayer.id,
                                    balance: 0,
                                    prop: [],
                                },
                                againstPlayer: {
                                    id: xplayer.id,
                                    balance: 0,
                                    prop: [],
                                },
                            };
                            socket.emit("trade-update", x);
                        },
                    }}
                    selectedMode={selectedMode}
                />
            </main>
            <NotificationOverlay />
            {server && (
                <ServerPanel
                    logs={serverLogs}
                    onClose={() => {
                        const root = document.body.querySelector("#root") as HTMLDivElement;
                        root.style.transform = "";
                    }}
                />
            )}
        </>
    ) : (
        <Lobby
            name={name}
            clients={clients}
            socket={socket}
            server={server}
            imReady={imReady}
            gameStarted={gameStarted}
            selectedMode={selectedMode}
            countdownValue={countdownValue}
            onToggleReady={() => {
                socket.emit("ready", { ready: !imReady });
                SetReady(!imReady);
            }}
        />
    );
}

export default App;
