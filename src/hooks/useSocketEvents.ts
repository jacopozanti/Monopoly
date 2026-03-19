import { useEffect, useRef } from "react";
import type { Socket } from "../assets/sockets";

/**
 * Registers socket event handlers that always see the latest values
 * (avoids stale closure problem with useState + useEffect([], [])).
 *
 * Handlers are stored in a ref and the actual socket listener delegates
 * to the ref, so the handler identity can change between renders without
 * re-registering listeners.
 */
export function useSocketEvents(
	socket: Socket | null,
	handlers: Record<string, (args: any) => void>
) {
	const handlersRef = useRef(handlers);

	// Always keep the ref pointing to the latest handlers
	handlersRef.current = handlers;

	useEffect(() => {
		if (!socket) return;

		const registeredEvents: string[] = [];

		for (const event of Object.keys(handlers)) {
			socket.on(event, (args: any) => {
				handlersRef.current[event]?.(args);
			});
			registeredEvents.push(event);
		}

		// Cleanup: remove handlers on unmount
		return () => {
			for (const event of registeredEvents) {
				socket.events.delete(event);
			}
		};
		// Only re-register when the socket instance changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket]);
}
