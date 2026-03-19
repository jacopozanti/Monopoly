export interface BoardPosition {
	position: number;
	width: number;
	height: number;
	top: string;
	left: string;
	house: { top: string; left: string; rotate: number } | null;
}

export const BOARD_POSITIONS: BoardPosition[] = [
	{ position: 0, width: 120, height: 120, top: "93.5%", left: "93.5%", house: null },
	{ position: 1, width: 75, height: 120, top: "93.5%", left: "83%", house: { top: "93.5%", left: "83%", rotate: 1 } },
	{ position: 2, width: 75, height: 120, top: "93.5%", left: "74.75%", house: null },
	{ position: 3, width: 75, height: 120, top: "93.5%", left: "66.5%", house: { top: "93.5%", left: "66.5%", rotate: 1 } },
	{ position: 4, width: 75, height: 120, top: "93.5%", left: "58.25%", house: null },
	{ position: 5, width: 75, height: 120, top: "93.5%", left: "50%", house: { top: "93.5%", left: "50%", rotate: 1 } },
	{ position: 6, width: 75, height: 120, top: "93.5%", left: "41.75%", house: { top: "93.5%", left: "41.75%", rotate: 1 } },
	{ position: 7, width: 75, height: 120, top: "93.5%", left: "33.5%", house: null },
	{ position: 8, width: 75, height: 120, top: "93.5%", left: "25.5%", house: { top: "93.5%", left: "25.5%", rotate: 1 } },
	{ position: 9, width: 75, height: 120, top: "93.5%", left: "17.25%", house: { top: "93.5%", left: "17.25%", rotate: 1 } },
	{ position: 10, width: 120, height: 120, top: "93.5%", left: "6.5%", house: null },
	{ position: 11, width: 120, height: 75, top: "83%", left: "6.5%", house: { top: "83%", left: "6.5%", rotate: 2 } },
	{ position: 12, width: 120, height: 75, top: "74.75%", left: "6.5%", house: { top: "74.75%", left: "6.5%", rotate: 2 } },
	{ position: 13, width: 120, height: 75, top: "66.5%", left: "6.5%", house: { top: "66.5%", left: "6.5%", rotate: 2 } },
	{ position: 14, width: 120, height: 75, top: "58.25%", left: "6.5%", house: { top: "58.25%", left: "6.5%", rotate: 2 } },
	{ position: 15, width: 120, height: 75, top: "50%", left: "6.5%", house: { top: "50%", left: "6.5%", rotate: 2 } },
	{ position: 16, width: 120, height: 75, top: "41.75%", left: "6.5%", house: { top: "41.75%", left: "6.5%", rotate: 2 } },
	{ position: 17, width: 120, height: 75, top: "33.5%", left: "6.5%", house: null },
	{ position: 18, width: 120, height: 75, top: "25.5%", left: "6.5%", house: { top: "25.5%", left: "6.5%", rotate: 2 } },
	{ position: 19, width: 120, height: 75, top: "17.25%", left: "6.5%", house: { top: "17.25%", left: "6.5%", rotate: 2 } },
	{ position: 20, width: 120, height: 120, top: "6.5%", left: "6.5%", house: null },
	{ position: 21, width: 75, height: 120, top: "6.5%", left: "17.25%", house: { top: "6.5%", left: "17.25%", rotate: 3 } },
	{ position: 22, width: 75, height: 120, top: "6.5%", left: "25.5%", house: null },
	{ position: 23, width: 75, height: 120, top: "6.5%", left: "33.5%", house: { top: "6.5%", left: "33.5%", rotate: 3 } },
	{ position: 24, width: 75, height: 120, top: "6.5%", left: "41.75%", house: { top: "6.5%", left: "41.75%", rotate: 3 } },
	{ position: 25, width: 75, height: 120, top: "6.5%", left: "50%", house: { top: "6.5%", left: "50%", rotate: 3 } },
	{ position: 26, width: 75, height: 120, top: "6.5%", left: "58.25%", house: { top: "6.5%", left: "58.25%", rotate: 3 } },
	{ position: 27, width: 75, height: 120, top: "6.5%", left: "66.5%", house: { top: "6.5%", left: "66.5%", rotate: 3 } },
	{ position: 28, width: 75, height: 120, top: "6.5%", left: "74.75%", house: { top: "6.5%", left: "74.75%", rotate: 3 } },
	{ position: 29, width: 75, height: 120, top: "6.5%", left: "83%", house: { top: "6.5%", left: "83%", rotate: 3 } },
	{ position: 30, width: 120, height: 120, top: "6.5%", left: "93.5%", house: null },
	{ position: 31, width: 120, height: 75, top: "17.25%", left: "93.5%", house: { top: "17.25%", left: "93.5%", rotate: 4 } },
	{ position: 32, width: 120, height: 75, top: "25.5%", left: "93.5%", house: { top: "25.5%", left: "93.5%", rotate: 4 } },
	{ position: 33, width: 120, height: 75, top: "33.5%", left: "93.5%", house: null },
	{ position: 34, width: 120, height: 75, top: "41.75%", left: "93.5%", house: { top: "41.75%", left: "93.5%", rotate: 4 } },
	{ position: 35, width: 120, height: 75, top: "50%", left: "93.5%", house: { top: "50%", left: "93.5%", rotate: 4 } },
	{ position: 36, width: 120, height: 75, top: "58.25%", left: "93.5%", house: null },
	{ position: 37, width: 120, height: 75, top: "66.5%", left: "93.5%", house: { top: "66.5%", left: "93.5%", rotate: 4 } },
	{ position: 38, width: 120, height: 75, top: "74.25%", left: "93.5%", house: null },
	{ position: 39, width: 120, height: 75, top: "83%", left: "93.5%", house: { top: "83%", left: "93.5%", rotate: 4 } },
];
