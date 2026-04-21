import { makeError, type ParseError } from "./errors";
import {
	type Command,
	err,
	type GridSize,
	isCommand,
	isInsideGrid,
	isOrientation,
	type Orientation,
	ok,
	type Result,
	type Rover,
	type Scenario,
} from "./types";

const GRID_HEADER_RE = /^\s*(\d+)\s+(\d+)\s*$/;
const ROVER_LINE_RE =
	/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([A-Za-z])\s*\)\s*([A-Za-z]*)\s*$/;
const LINE_SPLIT_RE = /\r?\n/;

interface LogicalLine {
	content: string;
	lineNumber: number;
}

const collectLogicalLines = (input: string): LogicalLine[] => {
	const lines: LogicalLine[] = [];
	const rawLines = input.split(LINE_SPLIT_RE);
	for (let i = 0; i < rawLines.length; i++) {
		const raw = rawLines[i] ?? "";
		const trimmed = raw.trim();
		if (trimmed.length > 0) {
			lines.push({ content: trimmed, lineNumber: i + 1 });
		}
	}
	return lines;
};

const parseGridHeader = (line: LogicalLine): Result<GridSize, ParseError> => {
	const match = GRID_HEADER_RE.exec(line.content);
	if (!match) {
		return err(
			makeError(
				"InvalidGridHeader",
				`Grid header must be two positive integers separated by whitespace, got: "${line.content}"`,
				line.lineNumber
			)
		);
	}
	const [, rawMaxX = "", rawMaxY = ""] = match;
	const maxX = Number.parseInt(rawMaxX, 10);
	const maxY = Number.parseInt(rawMaxY, 10);
	if (!(Number.isFinite(maxX) && Number.isFinite(maxY))) {
		return err(
			makeError(
				"InvalidGridHeader",
				`Grid header must be numeric, got: "${line.content}"`,
				line.lineNumber
			)
		);
	}
	return ok({ maxX, maxY });
};

const parseRoverLine = (
	line: LogicalLine,
	grid: GridSize | null
): Result<Rover, ParseError[]> => {
	const match = ROVER_LINE_RE.exec(line.content);
	if (!match) {
		return err([
			makeError(
				"InvalidRoverLine",
				`Rover line must look like "(x, y, O) COMMANDS", got: "${line.content}"`,
				line.lineNumber
			),
		]);
	}

	const [, rawX = "", rawY = "", rawOrientation = "", rawCommands = ""] = match;
	const errors: ParseError[] = [];

	const x = Number.parseInt(rawX, 10);
	const y = Number.parseInt(rawY, 10);

	const orientationLetter = rawOrientation.toUpperCase();
	let orientation: Orientation | null = null;
	if (isOrientation(orientationLetter)) {
		orientation = orientationLetter;
	} else {
		errors.push(
			makeError(
				"InvalidOrientation",
				`Orientation must be one of N, E, S, W, got: "${rawOrientation}"`,
				line.lineNumber
			)
		);
	}

	const commands: Command[] = [];
	for (const ch of rawCommands.toUpperCase()) {
		if (isCommand(ch)) {
			commands.push(ch);
		} else {
			errors.push(
				makeError(
					"InvalidCommandChar",
					`Command must be one of L, R, F, got: "${ch}"`,
					line.lineNumber
				)
			);
		}
	}

	if (grid !== null && !isInsideGrid({ x, y }, grid)) {
		errors.push(
			makeError(
				"OutOfBoundsInitial",
				`Rover initial position (${x}, ${y}) is outside the grid 0..${grid.maxX} x 0..${grid.maxY}`,
				line.lineNumber
			)
		);
	}

	if (errors.length > 0 || orientation === null) {
		return err(errors);
	}

	return ok({
		position: { x, y },
		orientation,
		commands,
	});
};

export const parseScenario = (
	input: string
): Result<Scenario, ParseError[]> => {
	const logicalLines = collectLogicalLines(input);

	if (logicalLines.length === 0) {
		return err([makeError("EmptyInput", "Input is empty")]);
	}

	const errors: ParseError[] = [];
	const [headerLine, ...roverLines] = logicalLines;

	let grid: GridSize | null = null;
	if (headerLine !== undefined) {
		const headerResult = parseGridHeader(headerLine);
		if (headerResult.ok) {
			grid = headerResult.value;
		} else {
			errors.push(headerResult.error);
		}
	}

	if (roverLines.length > 1) {
		errors.push(
			makeError(
				"DuplicateRoverCount",
				`Expected exactly one rover, got ${roverLines.length}`,
				roverLines[1]?.lineNumber
			)
		);
	}

	const rovers: Rover[] = [];
	for (const line of roverLines) {
		const roverResult = parseRoverLine(line, grid);
		if (roverResult.ok) {
			rovers.push(roverResult.value);
		} else {
			errors.push(...roverResult.error);
		}
	}

	const [rover] = rovers;

	if (errors.length > 0 || grid === null || rover === undefined) {
		if (errors.length === 0) {
			errors.push(
				makeError("InvalidRoverLine", "Scenario must contain exactly one rover")
			);
		}
		return err(errors);
	}

	return ok({ grid, rover });
};
