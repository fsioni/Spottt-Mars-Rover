import type { ExecutionTrace } from "@spottt/core/engine";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { MAX_SPEED, MIN_SPEED, type ReplayClock } from "@/lib/replay-clock";

interface TimelineProps {
	clock: ReplayClock;
	trace: ExecutionTrace;
}

const SPEED_STEP = 0.1;

const formatSpeed = (speed: number): string =>
	speed >= 1 ? `${speed.toFixed(1)}x` : `${speed.toFixed(2)}x`;

export function Timeline({ clock, trace }: TimelineProps) {
	const lastIndex = Math.max(0, trace.snapshots.length - 1);
	const currentCommand = trace.snapshots[clock.step]?.command ?? "—";
	const isLostStep = trace.lost && clock.step === trace.lostAt;

	return (
		<div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-3 font-mono text-sm">
			<div className="mb-3 flex items-center gap-2">
				<IconButton
					ariaLabel="Previous step"
					disabled={clock.step === 0}
					onClick={clock.stepBackward}
				>
					<StepBack className="h-4 w-4" />
				</IconButton>
				<IconButton
					ariaLabel={clock.isPlaying ? "Pause" : "Play"}
					onClick={clock.toggle}
					tone="primary"
				>
					{clock.isPlaying ? (
						<Pause className="h-4 w-4" />
					) : (
						<Play className="h-4 w-4" />
					)}
				</IconButton>
				<IconButton
					ariaLabel="Next step"
					disabled={clock.step >= lastIndex}
					onClick={clock.stepForward}
				>
					<StepForward className="h-4 w-4" />
				</IconButton>
				<IconButton ariaLabel="Reset" onClick={clock.reset}>
					<RotateCcw className="h-4 w-4" />
				</IconButton>

				<div className="ml-3 flex items-baseline gap-2 text-xs">
					<span className="text-zinc-500">step</span>
					<span className="text-zinc-200 tabular-nums">
						{clock.step}/{lastIndex}
					</span>
					<span className="text-zinc-500">cmd</span>
					<span
						className={
							isLostStep
								? "text-red-400 tabular-nums"
								: "text-emerald-400 tabular-nums"
						}
					>
						{currentCommand}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<input
					aria-label="Timeline scrubber"
					className="h-1 flex-1 cursor-pointer accent-emerald-500"
					max={lastIndex}
					min={0}
					onChange={(event) =>
						clock.setStep(Number.parseInt(event.target.value, 10))
					}
					step={1}
					type="range"
					value={clock.step}
				/>

				<div className="flex items-center gap-2 text-xs text-zinc-400">
					<span>speed</span>
					<input
						aria-label="Playback speed"
						className="h-1 w-28 cursor-pointer accent-emerald-500"
						max={MAX_SPEED}
						min={MIN_SPEED}
						onChange={(event) =>
							clock.setSpeed(Number.parseFloat(event.target.value))
						}
						step={SPEED_STEP}
						type="range"
						value={clock.speed}
					/>
					<span className="w-10 text-right text-emerald-400 tabular-nums">
						{formatSpeed(clock.speed)}
					</span>
				</div>
			</div>
		</div>
	);
}

interface IconButtonProps
	extends Omit<ComponentProps<"button">, "type" | "aria-label"> {
	ariaLabel: string;
	children: ReactNode;
	tone?: "default" | "primary";
}

const TONE_CLASSES: Record<NonNullable<IconButtonProps["tone"]>, string> = {
	default:
		"border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40",
	primary:
		"border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60",
};

function IconButton({
	ariaLabel,
	children,
	className,
	tone = "default",
	...rest
}: IconButtonProps) {
	return (
		<button
			aria-label={ariaLabel}
			className={`rounded border p-1.5 ${TONE_CLASSES[tone]} ${className ?? ""}`}
			type="button"
			{...rest}
		>
			{children}
		</button>
	);
}
