import { Player } from "../../assets/player";
import type { MonopolySettings } from "../../assets/types";

interface CursorOverlayProps {
	clients: Map<string, Player>;
	localId: string;
	settings: MonopolySettings | undefined;
}

export default function CursorOverlay({ clients, localId, settings }: CursorOverlayProps) {
	if (!settings?.accessibility[3]) return null;

	return (
		<>
			{Array.from(clients.values())
				.filter((v) => v.id !== localId)
				.map((v, i) => (
					<img
						key={i}
						data-tooltip-hover={v.username}
						style={{
							position: "fixed",
							top: v.positions.y,
							left: v.positions.x,
							width: 25,
							translate: "-50% -50%",
							zIndex: 100,
						}}
						src="./cursor.png"
						alt=""
					/>
				))}
		</>
	);
}
