import type { ReactNode } from "react";
import { SettingsProvider } from "./SettingsContext";
import { GameStateProvider } from "./GameStateContext";
import { NotificationProvider } from "./NotificationContext";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<SettingsProvider>
			<GameStateProvider>
				<NotificationProvider>
					{children}
				</NotificationProvider>
			</GameStateProvider>
		</SettingsProvider>
	);
}
