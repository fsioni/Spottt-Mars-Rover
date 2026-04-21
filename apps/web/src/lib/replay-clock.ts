import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { MathUtils } from "three";

export const STEP_DURATION_MS = 400;
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 5;
const DEFAULT_SPEED = 1;

export interface ReplayClock {
	isPlaying: boolean;
	pause: () => void;
	play: () => void;
	reset: () => void;
	setSpeed: (speed: number) => void;
	setStep: (step: number) => void;
	speed: number;
	step: number;
	stepBackward: () => void;
	stepForward: () => void;
	timeRef: RefObject<number>;
	toggle: () => void;
}

/**
 * Time is measured in "steps" (1 step = 1 atomic command, STEP_DURATION_MS at speed 1).
 * `timeRef.current` is the continuous position read by Rover's useFrame for interpolation;
 * `step` (state) is the integer snapshot index, only updated when crossing a boundary
 * to keep Timeline UI cheap during playback.
 */
export function useReplayClock(totalSteps: number): ReplayClock {
	const [step, setStepState] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [speed, setSpeedState] = useState(DEFAULT_SPEED);

	const timeRef = useRef(0);
	const speedRef = useRef(DEFAULT_SPEED);
	const totalStepsRef = useRef(totalSteps);

	useEffect(() => {
		totalStepsRef.current = totalSteps;
		const maxTime = Math.max(0, totalSteps - 1);
		if (timeRef.current > maxTime) {
			timeRef.current = maxTime;
			setStepState(Math.floor(maxTime));
		}
	}, [totalSteps]);

	useEffect(() => {
		if (!isPlaying) {
			return;
		}
		let frame = 0;
		let prev = 0;
		let prevStep = Math.floor(timeRef.current);
		const tick = (now: number) => {
			if (prev !== 0) {
				const dt = now - prev;
				const maxTime = Math.max(0, totalStepsRef.current - 1);
				const next = Math.min(
					maxTime,
					timeRef.current + (dt / STEP_DURATION_MS) * speedRef.current
				);
				timeRef.current = next;
				const newStep = Math.floor(next);
				if (newStep !== prevStep) {
					prevStep = newStep;
					setStepState(newStep);
				}
				if (next >= maxTime) {
					setIsPlaying(false);
					return;
				}
			}
			prev = now;
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [isPlaying]);

	const setStep = useCallback((target: number) => {
		const maxTime = Math.max(0, totalStepsRef.current - 1);
		const clamped = MathUtils.clamp(target, 0, maxTime);
		timeRef.current = clamped;
		setStepState(Math.floor(clamped));
	}, []);

	const play = useCallback(() => {
		const maxTime = Math.max(0, totalStepsRef.current - 1);
		if (timeRef.current >= maxTime) {
			timeRef.current = 0;
			setStepState(0);
		}
		setIsPlaying(true);
	}, []);

	const pause = useCallback(() => {
		setIsPlaying(false);
	}, []);

	const toggle = useCallback(() => {
		setIsPlaying((current) => {
			if (current) {
				return false;
			}
			const maxTime = Math.max(0, totalStepsRef.current - 1);
			if (timeRef.current >= maxTime) {
				timeRef.current = 0;
				setStepState(0);
			}
			return true;
		});
	}, []);

	const stepForward = useCallback(() => {
		setIsPlaying(false);
		setStep(Math.floor(timeRef.current) + 1);
	}, [setStep]);

	const stepBackward = useCallback(() => {
		setIsPlaying(false);
		const t = timeRef.current;
		const target = t > Math.floor(t) ? Math.floor(t) : Math.floor(t) - 1;
		setStep(target);
	}, [setStep]);

	const reset = useCallback(() => {
		setIsPlaying(false);
		setStep(0);
	}, [setStep]);

	const setSpeed = useCallback((value: number) => {
		const clamped = MathUtils.clamp(value, MIN_SPEED, MAX_SPEED);
		speedRef.current = clamped;
		setSpeedState(clamped);
	}, []);

	return {
		isPlaying,
		pause,
		play,
		reset,
		setSpeed,
		setStep,
		speed,
		step,
		stepBackward,
		stepForward,
		timeRef,
		toggle,
	};
}
