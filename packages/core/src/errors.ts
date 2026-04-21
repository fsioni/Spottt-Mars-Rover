export type ParseErrorKind =
	| "EmptyInput"
	| "InvalidGridHeader"
	| "InvalidRoverLine"
	| "InvalidOrientation"
	| "InvalidCommandChar"
	| "OutOfBoundsInitial"
	| "DuplicateRoverCount";

export interface ParseError {
	kind: ParseErrorKind;
	line?: number;
	message: string;
}

export const makeError = (
	kind: ParseErrorKind,
	message: string,
	line?: number
): ParseError => ({ kind, message, line });
