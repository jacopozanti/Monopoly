import { useEffect, useState } from "react";

interface DicePanelProps {
	show: boolean;
	finalValues: [number, number] | null;
}

export default function DicePanel({ show, finalValues }: DicePanelProps) {
	const [displayValues, setDisplayValues] = useState<[number, number]>([1, 1]);

	useEffect(() => {
		if (!finalValues || !show) return;

		// Animate random dice for ~1 second
		const interval = setInterval(() => {
			setDisplayValues([
				Math.floor(Math.random() * 6) + 1,
				Math.floor(Math.random() * 6) + 1,
			]);
		}, 50);

		const timeout = setTimeout(() => {
			clearInterval(interval);
			setDisplayValues(finalValues);
		}, 1000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [finalValues?.[0], finalValues?.[1], show]);

	if (!show || !finalValues) return <div id="dice-panel" data-show={false} />;

	return (
		<div id="dice-panel" data-show={true}>
			<img src={`./c${displayValues[0]}.png`} alt={`Dice ${displayValues[0]}`} />
			<img src={`./c${displayValues[1]}.png`} alt={`Dice ${displayValues[1]}`} />
		</div>
	);
}
