import { Player } from "../../assets/player";
import type { MonopolySettings } from "../../assets/types";
import type { BoardPosition } from "../../data/boardPositions";
import PlayerToken from "./PlayerToken";
import PropertyIndicator from "./PropertyIndicator";
import monopolyJSON from "../../assets/monopoly.json";

interface BoardCellProps {
	pos: BoardPosition;
	players: Player[];
	rotation: number;
	settings: MonopolySettings | undefined;
	onCellClick?: (position: number) => void;
	onOwnerClick?: (playerId: string) => void;
}

const propretyMap = new Map(
	monopolyJSON.properties.map((obj) => [obj.posistion ?? 0, obj])
);

export default function BoardCell({
	pos,
	players,
	rotation,
	settings,
	onCellClick,
	onOwnerClick,
}: BoardCellProps) {
	const playersHere = players.filter(
		(p) => p.position === pos.position && p.balance >= 0
	);
	const property = propretyMap.get(pos.position);
	const isClickable = property && property.group !== "Special";

	return (
		<>
			{/* Property ownership indicator (houses/hotels) */}
			{pos.house && (
				<div
					data-position={pos.position}
					data-rotate={pos.house.rotate}
					className="street-houses"
					style={{ top: pos.house.top, left: pos.house.left }}
				>
					<PropertyIndicator
						position={pos.position}
						players={players}
						settings={settings}
						onOwnerClick={onOwnerClick}
					/>
				</div>
			)}

			{/* Board cell with player tokens */}
			<div
				data-position={pos.position}
				className="street"
				style={{
					width: pos.width,
					height: pos.height,
					top: pos.top,
					left: pos.left,
				}}
				onClick={isClickable ? () => onCellClick?.(pos.position) : undefined}
				onMouseMove={
					isClickable
						? (e) => {
								const el = e.currentTarget;
								el.style.cursor = "pointer";
								el.style.backgroundColor = "rgba(0,0,0,15%)";
							}
						: undefined
				}
				onMouseLeave={
					isClickable
						? (e) => {
								const el = e.currentTarget;
								el.style.cursor = "";
								el.style.backgroundColor = "";
							}
						: undefined
				}
			>
				{playersHere.map((player) => (
					<PlayerToken
						key={player.id}
						player={player}
						rotation={rotation}
						settings={settings}
					/>
				))}
			</div>
		</>
	);
}
