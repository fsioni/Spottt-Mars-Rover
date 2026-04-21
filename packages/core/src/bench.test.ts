import { describe, expect, it } from "vitest";
import { execute } from "./engine";
import { COMMANDS, type Command, type Scenario } from "./types";

const SEED = 12_648_430;
const COMMAND_COUNT = 10_000;
const ITERATIONS = 25;
const WARMUP_ITERATIONS = 3;
const MEDIAN_THRESHOLD_MS = 50;
const LCG_MULTIPLIER = 1_664_525;
const LCG_INCREMENT = 1_013_904_223;
const LCG_MODULUS = 4_294_967_296;
const GRID = { maxX: 1000, maxY: 1000 } as const;

const createRng = (seed: number): (() => number) => {
	let state = seed % LCG_MODULUS;
	return () => {
		state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
		return state / LCG_MODULUS;
	};
};

const pickCommand = (rng: () => number): Command => {
	const index = Math.floor(rng() * COMMANDS.length);
	const cmd = COMMANDS[index];
	if (cmd === undefined) {
		throw new Error("unreachable: RNG produced out-of-range index");
	}
	return cmd;
};

const buildScenario = (): Scenario => {
	const rng = createRng(SEED);
	const commands: Command[] = [];
	for (let index = 0; index < COMMAND_COUNT; index++) {
		commands.push(pickCommand(rng));
	}
	return {
		grid: { ...GRID },
		rover: {
			position: { x: 500, y: 500 },
			orientation: "N",
			commands,
		},
	};
};

const percentile = (sorted: number[], p: number): number => {
	if (sorted.length === 0) {
		throw new Error("percentile: empty samples");
	}
	const rawIndex = Math.floor(sorted.length * p);
	const clamped = Math.min(rawIndex, sorted.length - 1);
	const value = sorted[clamped];
	if (value === undefined) {
		throw new Error("percentile: unreachable undefined");
	}
	return value;
};

const median = (sorted: number[]): number => {
	if (sorted.length === 0) {
		throw new Error("median: empty samples");
	}
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		const lower = sorted[mid - 1];
		const upper = sorted[mid];
		if (lower === undefined || upper === undefined) {
			throw new Error("median: unreachable undefined");
		}
		return (lower + upper) / 2;
	}
	const value = sorted[mid];
	if (value === undefined) {
		throw new Error("median: unreachable undefined");
	}
	return value;
};

describe("engine performance", () => {
	it(`executes ${COMMAND_COUNT} commands with median under ${MEDIAN_THRESHOLD_MS}ms`, () => {
		const scenario = buildScenario();

		for (let i = 0; i < WARMUP_ITERATIONS; i++) {
			execute(scenario);
		}

		const samples: number[] = [];
		for (let i = 0; i < ITERATIONS; i++) {
			const start = performance.now();
			const trace = execute(scenario);
			samples.push(performance.now() - start);
			expect(trace.snapshots.length).toBeGreaterThan(0);
		}

		samples.sort((a, b) => a - b);
		const medianMs = median(samples);
		const minMs = percentile(samples, 0);
		const maxMs = percentile(samples, 1);
		const p95Ms = percentile(samples, 0.95);

		const stats = [
			`iterations=${ITERATIONS}`,
			`median=${medianMs.toFixed(3)}ms`,
			`p95=${p95Ms.toFixed(3)}ms`,
			`min=${minMs.toFixed(3)}ms`,
			`max=${maxMs.toFixed(3)}ms`,
		].join(" | ");
		console.info(`engine bench | ${stats}`);

		expect(
			medianMs,
			`median exceeded ${MEDIAN_THRESHOLD_MS}ms — ${stats}`
		).toBeLessThan(MEDIAN_THRESHOLD_MS);
	});
});
