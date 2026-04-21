import {
	type Command,
	type GridSize,
	isInsideGrid,
	type Orientation,
	type Position,
	type Rover,
	type Scenario,
} from "./types";

export interface Snapshot {
	command: Command | null;
	rover: Rover;
	step: number;
}

export interface ExecutionTrace {
	final: Rover;
	lost: boolean;
	lostAt?: number;
	lostPosition?: Position;
	snapshots: Snapshot[];
}

const LEFT_OF: Record<Orientation, Orientation> = {
	N: "W",
	W: "S",
	S: "E",
	E: "N",
};

const RIGHT_OF: Record<Orientation, Orientation> = {
	N: "E",
	E: "S",
	S: "W",
	W: "N",
};

const FORWARD_DELTA: Record<Orientation, Position> = {
	N: { x: 0, y: 1 },
	E: { x: 1, y: 0 },
	S: { x: 0, y: -1 },
	W: { x: -1, y: 0 },
};

export const step = (
	rover: Rover,
	cmd: Command,
	grid: GridSize
): { lost: boolean; rover: Rover } => {
	if (cmd === "L") {
		return {
			lost: false,
			rover: { ...rover, orientation: LEFT_OF[rover.orientation] },
		};
	}
	if (cmd === "R") {
		return {
			lost: false,
			rover: { ...rover, orientation: RIGHT_OF[rover.orientation] },
		};
	}
	const delta = FORWARD_DELTA[rover.orientation];
	const next: Position = {
		x: rover.position.x + delta.x,
		y: rover.position.y + delta.y,
	};
	if (!isInsideGrid(next, grid)) {
		return { lost: true, rover };
	}
	return { lost: false, rover: { ...rover, position: next } };
};

export const execute = (scenario: Scenario): ExecutionTrace => {
	const { grid, rover: initial } = scenario;
	const snapshots: Snapshot[] = [{ step: 0, rover: initial, command: null }];

	let current = initial;
	for (const [index, cmd] of initial.commands.entries()) {
		const result = step(current, cmd, grid);
		const nextStep = index + 1;
		if (result.lost) {
			const delta = FORWARD_DELTA[current.orientation];
			const lostPosition: Position = {
				x: current.position.x + delta.x,
				y: current.position.y + delta.y,
			};
			snapshots.push({ step: nextStep, rover: current, command: cmd });
			return {
				snapshots,
				final: current,
				lost: true,
				lostAt: nextStep,
				lostPosition,
			};
		}
		current = result.rover;
		snapshots.push({ step: nextStep, rover: current, command: cmd });
	}

	return { snapshots, final: current, lost: false };
};
