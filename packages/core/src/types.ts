export const ORIENTATIONS = ["N", "E", "S", "W"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const COMMANDS = ["L", "R", "F"] as const;
export type Command = (typeof COMMANDS)[number];

export interface Position {
	x: number;
	y: number;
}

export interface GridSize {
	maxX: number;
	maxY: number;
}

export interface Rover {
	commands: Command[];
	orientation: Orientation;
	position: Position;
}

export interface Scenario {
	grid: GridSize;
	rover: Rover;
}

export interface Ok<T> {
	ok: true;
	value: T;
}
export interface Err<E> {
	error: E;
	ok: false;
}
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOrientation = (input: string): input is Orientation =>
	(ORIENTATIONS as readonly string[]).includes(input);

export const isCommand = (input: string): input is Command =>
	(COMMANDS as readonly string[]).includes(input);

export const isInsideGrid = (position: Position, grid: GridSize): boolean =>
	position.x >= 0 &&
	position.y >= 0 &&
	position.x <= grid.maxX &&
	position.y <= grid.maxY;
