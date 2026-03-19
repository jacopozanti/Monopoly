import { Player } from "../../assets/player";
import { Server, Socket } from "../../assets/sockets";
import { MonopolyMode, MonopolyModes } from "../../assets/types";

interface LobbyProps {
	name: string;
	clients: Map<string, Player>;
	socket: Socket;
	server: Server | undefined;
	imReady: boolean;
	gameStarted: boolean;
	selectedMode: MonopolyMode;
	onToggleReady: () => void;
	countdownValue: number | null;
}

export default function Lobby({
	name,
	clients,
	socket,
	server,
	imReady,
	gameStarted,
	selectedMode,
	onToggleReady,
	countdownValue,
}: LobbyProps) {
	return (
		<div className="lobby">
			<main>
				<section>
					<div>
						<h3>Hello there {name}</h3>
						the players that are currently in the lobby are
						<div>
							{Array.from(clients.values()).map((v, i) => (
								<p
									style={v.ready ? { backgroundColor: "#32a852" } : {}}
									className="lobby-players"
									key={i}
								>
									{v.username}
								</p>
							))}
							<center>
								<button disabled={gameStarted} onClick={onToggleReady}>
									{!imReady ? "Ready" : "Not Ready"}
								</button>
							</center>
						</div>
						<br />
					</div>
				</section>
				<div>
					{server === undefined ? (
						<p
							style={{
								opacity: 0.5,
								margin: 0,
								textAlign: "center",
								fontWeight: "100",
							}}
						>
							the server-admin is <br /> choosing the gamemode
						</p>
					) : (
						<></>
					)}

					<div className="modes">
						<main>
							<h3>{selectedMode.Name}</h3>
							<table>
								<tbody>
									<tr>
										<td>Winning State:</td>
										<td>{selectedMode.WinningMode.toUpperCase()}</td>
									</tr>
									<tr>
										<td>Trades: </td>
										<td>{selectedMode.AllowDeals ? "ALLOWED" : "NOT-ALLOWED"}</td>
									</tr>
									<tr>
										<td>Mortgage: </td>
										<td>{selectedMode.mortageAllowed ? "ALLOWED" : "NOT-ALLOWED"}</td>
									</tr>
									<tr>
										<td>Starting Cash: </td>
										<td>{selectedMode.startingCash} M</td>
									</tr>
									<tr>
										<td>Turn Timer: </td>
										<td>
											{selectedMode.turnTimer === undefined ||
											(typeof selectedMode.turnTimer === "number" && selectedMode.turnTimer === 0)
												? "No Timer"
												: JSON.stringify(selectedMode.turnTimer) + " Sec"}
										</td>
									</tr>
								</tbody>
							</table>
						</main>
						<div className="selecting-mde">
							{MonopolyModes.map((v, k) => (
								<p
									data-select={JSON.stringify(v) === JSON.stringify(selectedMode)}
									key={k}
									onClick={() => {
										if (server !== undefined)
											socket.emit("ready", { mode: v });
									}}
									data-disabled={server === undefined}
								>
									{v.Name}
								</p>
							))}
							<p
								data-select={selectedMode.Name === "Custom Mode"}
								data-disabled={server === undefined}
								onClick={() => {
									const winstateChoice = window.prompt(
										"Winning State\n1=last-standing\n2=monopols\n3=monopols & trains",
										"3"
									);
									const allowTrade = window.confirm("Allow Trades");
									const allowMortgage = window.confirm("Allow Mortgage");
									const startingCash = window.prompt("Starting Cash", "1500");
									const turnTimer = window.prompt("Turn Timer", "0");
									const v = {
										AllowDeals: allowTrade,
										WinningMode:
											winstateChoice === "2"
												? "monopols"
												: winstateChoice === "3"
													? "monopols & trains"
													: "last-standing",
										Name: "Custom Mode",
										mortageAllowed: allowMortgage,
										startingCash: startingCash === null ? 1500 : parseInt(startingCash) ?? 1500,
										turnTimer: turnTimer === null ? undefined : parseInt(turnTimer) ?? undefined,
									} as MonopolyMode;
									if (server !== undefined) socket.emit("ready", { mode: v });
								}}
							>
								Custom Mode
							</p>
						</div>
					</div>
				</div>
			</main>

			{countdownValue !== null && (
				<p id="floating-clock" className="clocking">{countdownValue}</p>
			)}
		</div>
	);
}
