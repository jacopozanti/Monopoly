import { Player } from "../../assets/player";
import type { MonopolySettings } from "../../assets/types";

interface PlayerTokenProps {
	player: Player;
	rotation: number;
	settings: MonopolySettings | undefined;
	animationClass?: string;
}

export default function PlayerToken({ player, rotation, settings, animationClass }: PlayerTokenProps) {
	const icon = player.icon + 1;
	const showColors = settings !== undefined && settings.accessibility[4] === true;

	return (
		<div
			className={`player ${animationClass || ""}`}
			player-id={player.id}
			player-position={player.position.toString()}
		>
			<div
				data-tooltip-hover={player.username}
				{...(showColors ? { "data-tooltip-color": player.color } : {})}
				style={{ rotate: `${-rotation}deg`, aspectRatio: "1" }}
			>
				<img src={`./p${icon}.png`} alt="" />
				{player.isInJail && <img className="jailIcon" src="./jail.png" alt="" />}
			</div>
		</div>
	);
}
