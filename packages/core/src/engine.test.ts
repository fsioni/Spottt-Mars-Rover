import { describe, expect, it } from "vitest";
import { execute, step } from "./engine";
import type { Command, GridSize, Rover, Scenario } from "./types";

const GRID_4_8: GridSize = { maxX: 4, maxY: 8 };

const makeRover = (
	x: number,
	y: number,
	orientation: Rover["orientation"],
	commands: Command[] = []
): Rover => ({
	position: { x, y },
	orientation,
	commands,
});

const makeScenario = (rover: Rover, grid: GridSize = GRID_4_8): Scenario => ({
	grid,
	rover,
});

describe("step - rotation", () => {
	it("rotates L from N to W", () => {
		const result = step(makeRover(2, 2, "N"), "L", GRID_4_8);
		expect(result.rover.orientation).toBe("W");
		expect(result.rover.position).toEqual({ x: 2, y: 2 });
		expect(result.lost).toBe(false);
	});

	it("rotates L through the full cycle N -> W -> S -> E -> N", () => {
		let rover = makeRover(2, 2, "N");
		const order: Rover["orientation"][] = ["W", "S", "E", "N"];
		for (const expected of order) {
			rover = step(rover, "L", GRID_4_8).rover;
			expect(rover.orientation).toBe(expected);
		}
	});

	it("rotates R through the full cycle N -> E -> S -> W -> N", () => {
		let rover = makeRover(2, 2, "N");
		const order: Rover["orientation"][] = ["E", "S", "W", "N"];
		for (const expected of order) {
			rover = step(rover, "R", GRID_4_8).rover;
			expect(rover.orientation).toBe(expected);
		}
	});
});

describe("step - forward movement", () => {
	it("moves north by increasing y", () => {
		const result = step(makeRover(1, 1, "N"), "F", GRID_4_8);
		expect(result.rover.position).toEqual({ x: 1, y: 2 });
		expect(result.rover.orientation).toBe("N");
		expect(result.lost).toBe(false);
	});

	it("moves east by increasing x", () => {
		const result = step(makeRover(1, 1, "E"), "F", GRID_4_8);
		expect(result.rover.position).toEqual({ x: 2, y: 1 });
		expect(result.lost).toBe(false);
	});

	it("moves south by decreasing y", () => {
		const result = step(makeRover(1, 1, "S"), "F", GRID_4_8);
		expect(result.rover.position).toEqual({ x: 1, y: 0 });
		expect(result.lost).toBe(false);
	});

	it("moves west by decreasing x", () => {
		const result = step(makeRover(1, 1, "W"), "F", GRID_4_8);
		expect(result.rover.position).toEqual({ x: 0, y: 1 });
		expect(result.lost).toBe(false);
	});

	it("marks LOST when moving north off the grid", () => {
		const result = step(makeRover(2, 8, "N"), "F", GRID_4_8);
		expect(result.lost).toBe(true);
		expect(result.rover.position).toEqual({ x: 2, y: 8 });
		expect(result.rover.orientation).toBe("N");
	});

	it("marks LOST when moving south off the grid", () => {
		const result = step(makeRover(2, 0, "S"), "F", GRID_4_8);
		expect(result.lost).toBe(true);
		expect(result.rover.position).toEqual({ x: 2, y: 0 });
	});

	it("marks LOST when moving east off the grid", () => {
		const result = step(makeRover(4, 2, "E"), "F", GRID_4_8);
		expect(result.lost).toBe(true);
		expect(result.rover.position).toEqual({ x: 4, y: 2 });
	});

	it("marks LOST when moving west off the grid", () => {
		const result = step(makeRover(0, 2, "W"), "F", GRID_4_8);
		expect(result.lost).toBe(true);
		expect(result.rover.position).toEqual({ x: 0, y: 2 });
	});
});

describe("execute - PDF acceptance examples", () => {
	it("(2,3,E) LFRFF on 4x8 -> (4,4,E)", () => {
		const trace = execute(
			makeScenario(makeRover(2, 3, "E", ["L", "F", "R", "F", "F"]))
		);
		expect(trace.final).toEqual({
			position: { x: 4, y: 4 },
			orientation: "E",
			commands: ["L", "F", "R", "F", "F"],
		});
		expect(trace.lost).toBe(false);
		expect(trace.lostAt).toBeUndefined();
	});

	it("(0,2,N) FFLFRFF on 4x8 -> (0,4,W) LOST", () => {
		const trace = execute(
			makeScenario(makeRover(0, 2, "N", ["F", "F", "L", "F", "R", "F", "F"]))
		);
		expect(trace.final.position).toEqual({ x: 0, y: 4 });
		expect(trace.final.orientation).toBe("W");
		expect(trace.lost).toBe(true);
		expect(trace.lostAt).toBe(4);
	});

	it("(2,3,N) FLLFR on 4x8 -> (2,3,W)", () => {
		const trace = execute(
			makeScenario(makeRover(2, 3, "N", ["F", "L", "L", "F", "R"]))
		);
		expect(trace.final.position).toEqual({ x: 2, y: 3 });
		expect(trace.final.orientation).toBe("W");
		expect(trace.lost).toBe(false);
		expect(trace.lostAt).toBeUndefined();
	});

	it("(1,0,S) FFRLF on 4x8 -> (1,0,S) LOST", () => {
		const trace = execute(
			makeScenario(makeRover(1, 0, "S", ["F", "F", "R", "L", "F"]))
		);
		expect(trace.final.position).toEqual({ x: 1, y: 0 });
		expect(trace.final.orientation).toBe("S");
		expect(trace.lost).toBe(true);
		expect(trace.lostAt).toBe(1);
	});
});

describe("execute - snapshots", () => {
	it("emits an initial snapshot at step 0 with command=null", () => {
		const rover = makeRover(1, 2, "N", []);
		const trace = execute(makeScenario(rover));
		expect(trace.snapshots).toHaveLength(1);
		expect(trace.snapshots[0]).toEqual({
			step: 0,
			rover,
			command: null,
		});
	});

	it("emits one snapshot per applied command in order", () => {
		const trace = execute(
			makeScenario(makeRover(2, 3, "E", ["L", "F", "R", "F", "F"]))
		);
		expect(trace.snapshots).toHaveLength(6);
		expect(trace.snapshots.map((s) => s.step)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(trace.snapshots.map((s) => s.command)).toEqual([
			null,
			"L",
			"F",
			"R",
			"F",
			"F",
		]);
		expect(trace.snapshots[5]?.rover.position).toEqual({ x: 4, y: 4 });
		expect(trace.snapshots[5]?.rover.orientation).toBe("E");
	});

	it("stops emitting snapshots once LOST and ignores remaining commands", () => {
		const trace = execute(
			makeScenario(makeRover(0, 2, "N", ["F", "F", "L", "F", "R", "F", "F"]))
		);
		expect(trace.snapshots).toHaveLength(4);
		expect(trace.snapshots.map((s) => s.step)).toEqual([0, 1, 2, 3]);
		expect(trace.snapshots[3]?.rover.position).toEqual({ x: 0, y: 4 });
		expect(trace.snapshots[3]?.rover.orientation).toBe("W");
		expect(trace.lostAt).toBe(4);
	});

	it("final equals the rover of the last snapshot", () => {
		const trace = execute(
			makeScenario(makeRover(2, 3, "N", ["F", "L", "L", "F", "R"]))
		);
		const last = trace.snapshots.at(-1);
		expect(last).toBeDefined();
		expect(trace.final).toEqual(last?.rover);
	});
});

describe("execute - edge cases", () => {
	it("handles a rover with no commands (rotation-free, no-op)", () => {
		const rover = makeRover(3, 3, "S", []);
		const trace = execute(makeScenario(rover));
		expect(trace.final).toEqual(rover);
		expect(trace.snapshots).toHaveLength(1);
		expect(trace.lost).toBe(false);
	});

	it("handles rotation-only commands without moving", () => {
		const trace = execute(makeScenario(makeRover(2, 2, "N", ["L", "L"])));
		expect(trace.final.position).toEqual({ x: 2, y: 2 });
		expect(trace.final.orientation).toBe("S");
		expect(trace.lost).toBe(false);
	});

	it("handles a 1x1 grid (maxX=0, maxY=0) where any F is LOST", () => {
		const grid: GridSize = { maxX: 0, maxY: 0 };
		const trace = execute(makeScenario(makeRover(0, 0, "N", ["F"]), grid));
		expect(trace.lost).toBe(true);
		expect(trace.final.position).toEqual({ x: 0, y: 0 });
		expect(trace.lostAt).toBe(1);
	});

	it("allows rotations on a 1x1 grid", () => {
		const grid: GridSize = { maxX: 0, maxY: 0 };
		const trace = execute(
			makeScenario(makeRover(0, 0, "N", ["L", "R", "L"]), grid)
		);
		expect(trace.lost).toBe(false);
		expect(trace.final.position).toEqual({ x: 0, y: 0 });
		expect(trace.final.orientation).toBe("W");
	});

	it("allows a rover on the grid's edge to rotate and come back", () => {
		const trace = execute(makeScenario(makeRover(4, 8, "N", ["R", "R", "F"])));
		expect(trace.lost).toBe(false);
		expect(trace.final.position).toEqual({ x: 4, y: 7 });
		expect(trace.final.orientation).toBe("S");
	});
});

describe("execute - purity", () => {
	it("does not mutate the input rover", () => {
		const rover = makeRover(2, 3, "E", ["L", "F", "R", "F", "F"]);
		const snapshot = JSON.parse(JSON.stringify(rover));
		execute(makeScenario(rover));
		expect(rover).toEqual(snapshot);
	});
});
