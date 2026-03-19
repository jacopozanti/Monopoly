import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { CookieManager } from "../assets/cookieManager";
import type { MonopolyCookie, MonopolySettings } from "../assets/types";

// ── Types ────────────────────────────────────────────────────

interface SettingsContextValue {
	settings: MonopolySettings | undefined;
	updateSettings: (partial: Partial<MonopolySettings>) => void;
}

// ── Helpers ──────────────────────────────────────────────────

function readSettingsFromCookie(): MonopolySettings | undefined {
	try {
		const raw = CookieManager.get("monopolySettings");
		if (!raw) return undefined;
		const cookie = JSON.parse(decodeURIComponent(raw)) as MonopolyCookie;
		return cookie.settings;
	} catch {
		return undefined;
	}
}

function writeSettingsToCookie(settings: MonopolySettings): void {
	const raw = CookieManager.get("monopolySettings");
	let cookie: MonopolyCookie;
	try {
		cookie = raw
			? (JSON.parse(decodeURIComponent(raw)) as MonopolyCookie)
			: { login: { id: "", remember: false } };
	} catch {
		cookie = { login: { id: "", remember: false } };
	}
	cookie.settings = settings;
	CookieManager.set(
		"monopolySettings",
		encodeURIComponent(JSON.stringify(cookie)),
		365
	);
}

// ── Context ──────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextValue>({
	settings: undefined,
	updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<MonopolySettings | undefined>(
		readSettingsFromCookie
	);

	const updateSettings = useCallback(
		(partial: Partial<MonopolySettings>) => {
			setSettings((prev) => {
				const next: MonopolySettings = {
					gameEngine: prev?.gameEngine ?? "2d",
					accessibility: prev?.accessibility ?? [0, 0, false, false, false],
					audio: prev?.audio ?? [100, 100, 100],
					notifications: prev?.notifications ?? true,
					...partial,
				};
				writeSettingsToCookie(next);
				return next;
			});
		},
		[]
	);

	return (
		<SettingsContext.Provider value={{ settings, updateSettings }}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	return useContext(SettingsContext);
}
