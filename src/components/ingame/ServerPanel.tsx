interface ServerPanelProps {
	logs: Array<any[]>;
	onClose: () => void;
}

export default function ServerPanel({ logs, onClose }: ServerPanelProps) {
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
				<div className="middle">
					{logs.map((v, i) => (
						<p key={i}>{v.join("\t")}</p>
					))}
				</div>
				<div className="lower">
					<input disabled />
				</div>
			</main>
		</div>
	);
}
