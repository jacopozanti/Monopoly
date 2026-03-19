import { Server } from "../../assets/sockets";

interface ServerPanelProps {
	server: Server;
	onClose: () => void;
}

export default function ServerPanel({ onClose }: ServerPanelProps) {
	return (
		<div id="server">
			<header>
				<img src="./server.png" alt="" />
			</header>
			<main>
				<div className="upper">
					<img src="./icon.png" alt="" />
					<p>server.exe</p>
					<div>
						<button onClick={onClose}>X</button>
					</div>
				</div>
				<div className="middle"></div>
				<div className="lower">
					<input disabled />
				</div>
			</main>
		</div>
	);
}
