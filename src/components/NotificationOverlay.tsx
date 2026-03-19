import { useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";

export default function NotificationOverlay() {
	const { notifications, currentDialog, dismissNotification } =
		useNotifications();
	const { settings } = useSettings();

	// Play notification sound for new notifications
	useEffect(() => {
		if (notifications.length === 0) return;
		const latest = notifications[notifications.length - 1];
		if (latest.sfx && !latest.dismissing) {
			const audio = new Audio("./notifications.mp3");
			const master = (settings?.audio[0] ?? 100) / 100;
			const sfx = (settings?.audio[1] ?? 100) / 100;
			audio.volume = Math.min(1, sfx * master);
			audio.play().catch(() => {});
		}
	}, [notifications.length]);

	// Play dialog soundtrack
	useEffect(() => {
		if (!currentDialog?.soundtrack || currentDialog.dismissing) return;
		const src =
			currentDialog.soundtrack === "winning"
				? "./winning.mp3"
				: "./dying.mp3";
		const audio = new Audio(src);
		const master = (settings?.audio[0] ?? 100) / 100;
		const sfx = (settings?.audio[1] ?? 100) / 100;
		const vol = currentDialog.soundtrack === "loosing" ? 0.16 : 1;
		audio.volume = Math.min(1, vol * sfx * master);
		audio.loop = false;
		audio.play().catch(() => {});
	}, [currentDialog?.id]);

	return (
		<>
			<div className="notify">
				{notifications.map((n) => (
					<div
						key={n.id}
						className="notification"
						data-notif-type={n.type}
						style={{
							animation: n.dismissing
								? "popoff .7s cubic-bezier(.62,.25,1,-0.73)"
								: undefined,
						}}
						onClick={() => dismissNotification(n.id)}
					>
						{n.message}
					</div>
				))}
			</div>
			<div
				className="dialog-screen"
				data-show={currentDialog && !currentDialog.dismissing ? "true" : "false"}
			/>
			<div
				className="dialog-box"
				data-show={currentDialog && !currentDialog.dismissing ? "true" : "false"}
				style={{
					animation: currentDialog?.dismissing
						? "dialogout 1s cubic-bezier(.5,0,1,.5)"
						: undefined,
				}}
			>
				{currentDialog && (
					<>
						<div className="texts">
							<h3>{currentDialog.title}</h3>
							{currentDialog.body && <p>{currentDialog.body}</p>}
						</div>
						<div className="buttons">
							{currentDialog.buttons.map((btn, i) => (
								<button
									key={i}
									onClick={btn.onClick}
									disabled={btn.disabled}
								>
									{btn.label}
								</button>
							))}
						</div>
					</>
				)}
			</div>
		</>
	);
}
