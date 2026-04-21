import { describe, expect, it } from "vitest";
import type { ParseError } from "./errors";
import { parseScenario } from "./parser";

const expectErr = (result: ReturnType<typeof parseScenario>): ParseError[] => {
	if (result.ok) {
		throw new Error("Expected parse to fail, got Ok");
	}
	return result.error;
};

describe("parseScenario - valid inputs", () => {
	it("parses a minimal scenario with one rover", () => {
		const input = "4 8\n(2, 3, E) LFRFF";
		const result = parseScenario(input);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.value.grid).toEqual({ maxX: 4, maxY: 8 });
		expect(result.value.rover).toEqual({
			position: { x: 2, y: 3 },
			orientation: "E",
			commands: ["L", "F", "R", "F", "F"],
		});
	});

	it("accepts the four orientations", () => {
		for (const orientation of ["N", "E", "S", "W"] as const) {
			const result = parseScenario(`5 5\n(1, 1, ${orientation}) F`);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.rover.orientation).toBe(orientation);
			}
		}
	});

	it("tolerates extra whitespace and tight parentheses", () => {
		const input = "  4 8  \n   (2,3,E)    LFR   ";
		const result = parseScenario(input);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.rover.position).toEqual({ x: 2, y: 3 });
		expect(result.value.rover.commands).toEqual(["L", "F", "R"]);
	});

	it("accepts a rover with no commands", () => {
		const result = parseScenario("3 3\n(1, 2, N)");
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.rover.commands).toEqual([]);
	});

	it("ignores blank lines between valid lines", () => {
		const result = parseScenario("\n4 8\n\n(0, 0, N) F\n");
		expect(result.ok).toBe(true);
	});
});

describe("parseScenario - error categories", () => {
	it("returns EmptyInput for empty string", () => {
		const errors = expectErr(parseScenario(""));
		expect(errors).toHaveLength(1);
		expect(errors[0]?.kind).toBe("EmptyInput");
	});

	it("returns EmptyInput for whitespace-only input", () => {
		const errors = expectErr(parseScenario("   \n\t\n  "));
		expect(errors[0]?.kind).toBe("EmptyInput");
	});

	it("returns InvalidGridHeader when first line is not two positive integers", () => {
		const errors = expectErr(parseScenario("abc\n(0, 0, N) F"));
		expect(errors.some((e) => e.kind === "InvalidGridHeader")).toBe(true);
	});

	it("returns InvalidGridHeader for negative grid size", () => {
		const errors = expectErr(parseScenario("-1 5\n(0, 0, N) F"));
		expect(errors.some((e) => e.kind === "InvalidGridHeader")).toBe(true);
	});

	it("returns InvalidGridHeader when only one number on header line", () => {
		const errors = expectErr(parseScenario("4\n(0, 0, N) F"));
		expect(errors.some((e) => e.kind === "InvalidGridHeader")).toBe(true);
	});

	it("returns InvalidRoverLine for an unparseable rover line", () => {
		const errors = expectErr(parseScenario("4 8\nnot-a-rover"));
		expect(errors.some((e) => e.kind === "InvalidRoverLine")).toBe(true);
	});

	it("returns InvalidRoverLine when the tuple is incomplete", () => {
		const errors = expectErr(parseScenario("4 8\n(1, 2) F"));
		expect(errors.some((e) => e.kind === "InvalidRoverLine")).toBe(true);
	});

	it("returns InvalidOrientation when the orientation letter is unknown", () => {
		const errors = expectErr(parseScenario("4 8\n(1, 2, X) F"));
		expect(errors.some((e) => e.kind === "InvalidOrientation")).toBe(true);
	});

	it("returns InvalidCommandChar when commands contain an unknown letter", () => {
		const errors = expectErr(parseScenario("4 8\n(1, 2, N) LFXR"));
		expect(errors.some((e) => e.kind === "InvalidCommandChar")).toBe(true);
	});

	it("returns OutOfBoundsInitial when the rover starts outside the grid", () => {
		const errors = expectErr(parseScenario("4 8\n(10, 10, N) F"));
		expect(errors.some((e) => e.kind === "OutOfBoundsInitial")).toBe(true);
	});

	it("returns OutOfBoundsInitial for negative coordinates", () => {
		const errors = expectErr(parseScenario("4 8\n(-1, 0, N) F"));
		expect(errors.some((e) => e.kind === "OutOfBoundsInitial")).toBe(true);
	});

	it("returns DuplicateRoverCount when two or more rovers are provided", () => {
		const errors = expectErr(
			parseScenario("4 8\n(2, 3, E) LFRFF\n(0, 2, N) FFLFRFF")
		);
		expect(errors.some((e) => e.kind === "DuplicateRoverCount")).toBe(true);
	});

	it("accumulates multiple errors when they coexist", () => {
		const errors = expectErr(parseScenario("4 8\n(1, 2, X) LFZ"));
		const kinds = errors.map((e) => e.kind);
		expect(kinds).toContain("InvalidOrientation");
		expect(kinds).toContain("InvalidCommandChar");
	});
});

describe("parseScenario - consignes.md reference examples", () => {
	it("parses example 1 rover 1 initial state", () => {
		const result = parseScenario("4 8\n(2, 3, E) LFRFF");
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.grid).toEqual({ maxX: 4, maxY: 8 });
		expect(result.value.rover).toEqual({
			position: { x: 2, y: 3 },
			orientation: "E",
			commands: ["L", "F", "R", "F", "F"],
		});
	});

	it("parses example 1 rover 2 initial state", () => {
		const result = parseScenario("4 8\n(0, 2, N) FFLFRFF");
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.rover).toEqual({
			position: { x: 0, y: 2 },
			orientation: "N",
			commands: ["F", "F", "L", "F", "R", "F", "F"],
		});
	});

	it("parses example 2 rover 1 initial state", () => {
		const result = parseScenario("4 8\n(2, 3, N) FLLFR");
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.rover).toEqual({
			position: { x: 2, y: 3 },
			orientation: "N",
			commands: ["F", "L", "L", "F", "R"],
		});
	});

	it("parses example 2 rover 2 initial state", () => {
		const result = parseScenario("4 8\n(1, 0, S) FFRLF");
		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.value.rover).toEqual({
			position: { x: 1, y: 0 },
			orientation: "S",
			commands: ["F", "F", "R", "L", "F"],
		});
	});

	it("rejects the full two-rover example 1 with DuplicateRoverCount", () => {
		const errors = expectErr(
			parseScenario("4 8\n(2, 3, E) LFRFF\n(0, 2, N) FFLFRFF")
		);
		expect(errors.some((e) => e.kind === "DuplicateRoverCount")).toBe(true);
	});

	it("rejects the full two-rover example 2 with DuplicateRoverCount", () => {
		const errors = expectErr(
			parseScenario("4 8\n(2, 3, N) FLLFR\n(1, 0, S) FFRLF")
		);
		expect(errors.some((e) => e.kind === "DuplicateRoverCount")).toBe(true);
	});
});
