import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
	type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────

export interface Notification {
	id: string;
	message: string;
	type: "info" | "warn" | "error";
	duration: number;
	dismissing: boolean;
	after?: () => void;
	sfx: boolean;
}

export interface DialogButton {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}

export interface Dialog {
	id: string;
	title: string;
	body: string;
	buttons: DialogButton[];
	soundtrack?: "winning" | "loosing";
	dismissing: boolean;
}

interface NotificationContextValue {
	notifications: Notification[];
	currentDialog: Dialog | null;
	showNotification: (
		message: string,
		type?: "info" | "warn" | "error",
		duration?: number,
		after?: () => void,
		sfx?: boolean
	) => void;
	showDialog: (dialog: {
		title: string;
		body: string;
		buttons: DialogButton[];
		soundtrack?: "winning" | "loosing";
	}) => void;
	dismissNotification: (id: string) => void;
	dismissDialog: () => void;
}

// ── Context ──────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
	notifications: [],
	currentDialog: null,
	showNotification: () => {},
	showDialog: () => {},
	dismissNotification: () => {},
	dismissDialog: () => {},
});

let notifIdCounter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [currentDialog, setCurrentDialog] = useState<Dialog | null>(null);
	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const dismissNotification = useCallback((id: string) => {
		// First mark as dismissing (triggers CSS exit animation)
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, dismissing: true } : n))
		);
		// Then remove after animation completes
		setTimeout(() => {
			setNotifications((prev) => {
				const notif = prev.find((n) => n.id === id);
				if (notif?.after) notif.after();
				return prev.filter((n) => n.id !== id);
			});
		}, 700);
	}, []);

	const showNotification = useCallback(
		(
			message: string,
			type: "info" | "warn" | "error" = "info",
			duration: number = 2,
			after?: () => void,
			sfx: boolean = true
		) => {
			const id = `notif-${++notifIdCounter}`;
			const notif: Notification = {
				id,
				message,
				type,
				duration,
				dismissing: false,
				after,
				sfx,
			};
			setNotifications((prev) => [...prev, notif]);

			// Auto-dismiss after duration
			const timer = setTimeout(() => {
				dismissNotification(id);
				timersRef.current.delete(id);
			}, duration * 1000);
			timersRef.current.set(id, timer);
		},
		[dismissNotification]
	);

	const dismissDialog = useCallback(() => {
		setCurrentDialog((prev) => (prev ? { ...prev, dismissing: true } : null));
		setTimeout(() => {
			setCurrentDialog(null);
		}, 1000);
	}, []);

	const showDialog = useCallback(
		(dialog: {
			title: string;
			body: string;
			buttons: DialogButton[];
			soundtrack?: "winning" | "loosing";
		}) => {
			const id = `dialog-${++notifIdCounter}`;
			setCurrentDialog({
				id,
				...dialog,
				dismissing: false,
			});
		},
		[]
	);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				currentDialog,
				showNotification,
				showDialog,
				dismissNotification,
				dismissDialog,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	return useContext(NotificationContext);
}
