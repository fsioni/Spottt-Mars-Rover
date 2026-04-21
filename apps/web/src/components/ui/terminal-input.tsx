import type { ExecutionTrace } from "@spottt/core/engine";
import type { ParseError } from "@spottt/core/errors";
import {
	formatRoverState,
	type Result,
	type Scenario,
} from "@spottt/core/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface TerminalInputProps {
	executionTrace: ExecutionTrace | null;
	scenarioResult: Result<Scenario, ParseError[]> | null;
}

const PROMPT = "rover>";
const LINE_HEIGHT = "1.6em";
const PLACEHOLDER = "4 8\n(2, 3, E) LFRFF";

const formatError = (error: ParseError): string => {
	const linePart = error.line === undefined ? "" : ` line ${error.line}:`;
	return `[${error.kind}]${linePart} ${error.message}`;
};

const formatFinalState = (trace: ExecutionTrace): string =>
	formatRoverState(trace.final.position, trace.final.orientation, trace.lost);

export function TerminalInput({
	executionTrace,
	scenarioResult,
}: TerminalInputProps) {
	const navigate = useNavigate();
	const { scenario } = useSearch({ from: "/" });
	const [draft, setDraft] = useState<string>(scenario ?? "");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setDraft(scenario ?? "");
	}, [scenario]);

	const syncOverlayScroll = useCallback(() => {
		const textarea = textareaRef.current;
		const overlay = overlayRef.current;
		if (textarea && overlay) {
			overlay.style.transform = `translateY(${-textarea.scrollTop}px)`;
		}
	}, []);

	const run = useCallback(() => {
		const trimmed = draft.trim();
		navigate({
			to: "/",
			search: { scenario: trimmed.length > 0 ? trimmed : undefined },
		});
	}, [draft, navigate]);

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			run();
		}
	};

	const errors =
		scenarioResult && !scenarioResult.ok ? scenarioResult.error : [];
	const finalState =
		scenarioResult?.ok && executionTrace
			? formatFinalState(executionTrace)
			: null;

	const lineCount = Math.max(draft.split("\n").length, 1);

	return (
		<div className="font-mono text-sm">
			<div className="relative rounded-md border border-zinc-800 bg-zinc-950">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 overflow-hidden"
				>
					<div
						className="flex select-none flex-col pt-3 pl-3 text-emerald-500/70 will-change-transform"
						ref={overlayRef}
						style={{ lineHeight: LINE_HEIGHT }}
					>
						{Array.from({ length: lineCount }).map((_, index) => (
							<span
								className="block"
								key={`prompt-${index.toString()}`}
								style={{ height: LINE_HEIGHT }}
							>
								{PROMPT}
							</span>
						))}
					</div>
				</div>
				<textarea
					aria-label="Scenario input"
					autoCapitalize="off"
					autoComplete="off"
					autoCorrect="off"
					className="block w-full resize-y bg-transparent p-3 pl-[4.75rem] font-mono text-sm text-zinc-100 caret-emerald-400 placeholder:text-zinc-600 focus:outline-none"
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					onScroll={syncOverlayScroll}
					placeholder={PLACEHOLDER}
					ref={textareaRef}
					rows={8}
					spellCheck={false}
					style={{ lineHeight: LINE_HEIGHT }}
					value={draft}
				/>
			</div>

			<div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
				<span>Ctrl+Enter pour exécuter</span>
				<button
					className="rounded border border-emerald-900/60 px-2 py-0.5 text-emerald-400 hover:bg-emerald-950/40"
					onClick={run}
					type="button"
				>
					run
				</button>
			</div>

			{errors.length > 0 && (
				<div className="mt-3 rounded-md border border-red-900/50 bg-red-950/20 p-3">
					<div className="mb-1 text-red-400/80 text-xs uppercase tracking-wide">
						{errors.length} error{errors.length === 1 ? "" : "s"}
					</div>
					<ul className="space-y-0.5 text-red-300">
						{errors.map((error, index) => (
							<li
								key={`${error.kind}-${error.line ?? "nil"}-${index.toString()}`}
							>
								{formatError(error)}
							</li>
						))}
					</ul>
				</div>
			)}

			{finalState && (
				<div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/80 p-3">
					<div className="mb-1 text-xs text-zinc-500 uppercase tracking-wide">
						final state
					</div>
					<div
						className={
							executionTrace?.lost ? "text-red-400" : "text-emerald-400"
						}
					>
						{finalState}
					</div>
				</div>
			)}
		</div>
	);
}
