import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { Player, type PlayerJSON } from "../assets/player";
import type {
	MonopolyMode,
	historyAction,
	GameTrading,
} from "../assets/types";

// ── State shape ──────────────────────────────────────────────

export interface GameState {
	clients: Map<string, Player>;
	currentTurnId: string;
	gamePhase: "lobby" | "countdown" | "playing";
	selectedMode: MonopolyMode;
	histories: historyAction[];
	currentTrade: GameTrading | boolean | undefined;
	imReady: boolean;
	messages: Array<{ from: string; message: string }>;
	// UI state previously in imperative handles
	diceRoll: { values: [number, number]; rolling: boolean } | null;
	activePropertyCard: { location: number; rolls: number } | null;
	activeChanceCard: { element: any; isChance: boolean } | null;
	moneyAnimation: number | null;
	showJailOptions: { isCard: boolean } | null;
	selectedBoardPosition: number | null;
}

const initialState: GameState = {
	clients: new Map(),
	currentTurnId: "",
	gamePhase: "lobby",
	selectedMode: {
		AllowDeals: true,
		WinningMode: "last-standing",
		Name: "Classic",
		startingCash: 1500,
		mortageAllowed: true,
		turnTimer: undefined,
	},
	histories: [],
	currentTrade: undefined,
	imReady: false,
	messages: [],
	diceRoll: null,
	activePropertyCard: null,
	activeChanceCard: null,
	moneyAnimation: null,
	showJailOptions: null,
	selectedBoardPosition: null,
};

// ── Actions ──────────────────────────────────────────────────

export type GameAction =
	| { type: "SET_INITIAL_PLAYERS"; clients: Map<string, Player>; currentTurnId: string; mode: MonopolyMode }
	| { type: "ADD_PLAYER"; player: Player }
	| { type: "UPDATE_PLAYER"; id: string; json: PlayerJSON }
	| { type: "REMOVE_PLAYER"; id: string }
	| { type: "SET_TURN"; id: string }
	| { type: "START_GAME" }
	| { type: "START_DISPLAY" }
	| { type: "SET_READY"; ready: boolean }
	| { type: "SET_MODE"; mode: MonopolyMode }
	| { type: "DICE_ROLL"; values: [number, number]; rolling: boolean }
	| { type: "DICE_FREE" }
	| { type: "SHOW_PROPERTY_CARD"; location: number; rolls: number }
	| { type: "CLEAR_PROPERTY_CARD" }
	| { type: "SHOW_CHANCE_CARD"; element: any; isChance: boolean }
	| { type: "CLEAR_CHANCE_CARD" }
	| { type: "MONEY_ANIMATION"; animationType: number }
	| { type: "CLEAR_MONEY_ANIMATION" }
	| { type: "SHOW_JAIL_OPTIONS"; isCard: boolean }
	| { type: "CLEAR_JAIL_OPTIONS" }
	| { type: "ADD_MESSAGE"; from: string; message: string }
	| { type: "ADD_HISTORY"; entry: historyAction }
	| { type: "SET_HISTORIES"; entries: historyAction[] }
	| { type: "SET_TRADE"; trade: GameTrading | boolean }
	| { type: "CLEAR_TRADE" }
	| { type: "SELECT_BOARD_POSITION"; position: number | null }
	| { type: "UPDATE_CLIENTS"; clients: Map<string, Player> };

// ── Reducer ──────────────────────────────────────────────────

function cloneClients(clients: Map<string, Player>): Map<string, Player> {
	return new Map(clients);
}

function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case "SET_INITIAL_PLAYERS":
			return {
				...state,
				clients: action.clients,
				currentTurnId: action.currentTurnId,
				selectedMode: action.mode,
			};

		case "ADD_PLAYER": {
			const next = cloneClients(state.clients);
			next.set(action.player.id, action.player);
			return { ...state, clients: next };
		}

		case "UPDATE_PLAYER": {
			const next = cloneClients(state.clients);
			const existing = next.get(action.id);
			if (existing) {
				existing.recieveJson(action.json);
				next.set(action.id, existing);
			}
			return { ...state, clients: next };
		}

		case "REMOVE_PLAYER": {
			const next = cloneClients(state.clients);
			next.delete(action.id);
			return { ...state, clients: next };
		}

		case "SET_TURN":
			return { ...state, currentTurnId: action.id };

		case "START_GAME":
			return { ...state, gamePhase: "countdown" };

		case "START_DISPLAY":
			return { ...state, gamePhase: "playing" };

		case "SET_READY":
			return { ...state, imReady: action.ready };

		case "SET_MODE":
			return { ...state, selectedMode: action.mode };

		case "DICE_ROLL":
			return {
				...state,
				diceRoll: { values: action.values, rolling: action.rolling },
			};

		case "DICE_FREE":
			return { ...state, diceRoll: null };

		case "SHOW_PROPERTY_CARD":
			return {
				...state,
				activePropertyCard: { location: action.location, rolls: action.rolls },
			};

		case "CLEAR_PROPERTY_CARD":
			return { ...state, activePropertyCard: null };

		case "SHOW_CHANCE_CARD":
			return {
				...state,
				activeChanceCard: { element: action.element, isChance: action.isChance },
			};

		case "CLEAR_CHANCE_CARD":
			return { ...state, activeChanceCard: null };

		case "MONEY_ANIMATION":
			return { ...state, moneyAnimation: action.animationType };

		case "CLEAR_MONEY_ANIMATION":
			return { ...state, moneyAnimation: null };

		case "SHOW_JAIL_OPTIONS":
			return { ...state, showJailOptions: { isCard: action.isCard } };

		case "CLEAR_JAIL_OPTIONS":
			return { ...state, showJailOptions: null };

		case "ADD_MESSAGE":
			return {
				...state,
				messages: [...state.messages, { from: action.from, message: action.message }],
			};

		case "ADD_HISTORY":
			return { ...state, histories: [...state.histories, action.entry] };

		case "SET_HISTORIES":
			return { ...state, histories: action.entries };

		case "SET_TRADE":
			return { ...state, currentTrade: action.trade };

		case "CLEAR_TRADE":
			return { ...state, currentTrade: undefined };

		case "SELECT_BOARD_POSITION":
			return { ...state, selectedBoardPosition: action.position };

		case "UPDATE_CLIENTS":
			return { ...state, clients: action.clients };

		default:
			return state;
	}
}

// ── Context ──────────────────────────────────────────────────

const GameStateContext = createContext<GameState>(initialState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function GameStateProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(gameReducer, initialState);

	return (
		<GameStateContext.Provider value={state}>
			<GameDispatchContext.Provider value={dispatch}>
				{children}
			</GameDispatchContext.Provider>
		</GameStateContext.Provider>
	);
}

export function useGameState() {
	return useContext(GameStateContext);
}

export function useGameDispatch() {
	return useContext(GameDispatchContext);
}
