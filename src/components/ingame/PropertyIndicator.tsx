import { Player } from "../../assets/player";
import type { MonopolySettings, PlayerProprety } from "../../assets/types";
import HouseIcon from "../../assets/images/h.png";
import HotelIcon from "../../assets/images/ho.png";

interface PropertyIndicatorProps {
	position: number;
	players: Player[];
	settings: MonopolySettings | undefined;
	onOwnerClick?: (playerId: string) => void;
}

export default function PropertyIndicator({ position, players, settings, onOwnerClick }: PropertyIndicatorProps) {
	let owner: Player | undefined;
	let prop: PlayerProprety | undefined;

	for (const player of players) {
		const found = player.properties.find((p) => p.posistion === position);
		if (found) {
			owner = player;
			prop = found;
			break;
		}
	}

	if (!owner || !prop) return null;

	const showColors = settings !== undefined && settings.accessibility[4] === true;

	function handleClick() {
		if (owner && onOwnerClick) onOwnerClick(owner.id);
	}

	function renderContent() {
		if (!prop) return null;
		const state = prop.count;

		switch (state) {
			case 0: {
				let paymentAmount = 0;
				if (prop.group === "Railroad") {
					const count = owner!.properties
						.filter((v) => v.group === "Railroad")
						.filter((v) => !v.morgage).length;
					const rents = [0, 25, 50, 100, 200];
					paymentAmount = rents[count];
				} else if (prop.group === "Utilities" && prop.rent) {
					const mult = owner!.properties.filter((v) => v.group === "Utilities").length === 2 ? 10 : 4;
					paymentAmount = prop.rent * mult;
				}
				if (paymentAmount !== 0) {
					return <p>{paymentAmount}M</p>;
				}
				return null;
			}
			case 1:
			case 2:
			case 3:
			case 4:
				return (
					<>
						{Array.from({ length: state }, (_, i) => (
							<img key={i} src={HouseIcon} alt="" />
						))}
					</>
				);
			case "h":
				return <img src={HotelIcon} alt="" />;
			default:
				return null;
		}
	}

	const hasPayment = prop.count === 0 && (prop.group === "Railroad" || (prop.group === "Utilities" && prop.rent));
	const bgColor = showColors
		? owner.color
		: hasPayment
			? "rgba(0,0,0,75%)"
			: "rgba(0,0,0,25%)";

	return (
		<div
			className="street-houses-content"
			data-tooltip-hover={owner.username}
			onClick={handleClick}
			style={{
				cursor: "pointer",
				zIndex: 5,
				backgroundColor: bgColor,
				boxShadow: showColors ? "0px 0px 5px black" : undefined,
			}}
		>
			{renderContent()}
		</div>
	);
}
