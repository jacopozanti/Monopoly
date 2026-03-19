import { useCallback } from "react";
import { useSettings } from "../contexts/SettingsContext";

export function useAudio() {
	const { settings } = useSettings();

	const playSfx = useCallback(
		(src: string, volumeMultiplier: number = 1) => {
			const audio = new Audio(src);
			const master = (settings?.audio[0] ?? 100) / 100;
			const sfx = (settings?.audio[1] ?? 100) / 100;
			audio.volume = Math.min(1, volumeMultiplier * sfx * master);
			audio.play().catch(() => {});
			return audio;
		},
		[settings]
	);

	const playMusic = useCallback(
		(src: string, volumeMultiplier: number = 1, loop: boolean = false) => {
			const audio = new Audio(src);
			const master = (settings?.audio[0] ?? 100) / 100;
			const music = (settings?.audio[2] ?? 100) / 100;
			audio.volume = Math.min(1, volumeMultiplier * music * master);
			audio.loop = loop;
			audio.play().catch(() => {});
			return audio;
		},
		[settings]
	);

	return { playSfx, playMusic };
}
