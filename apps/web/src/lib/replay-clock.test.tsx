import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	MAX_SPEED,
	MIN_SPEED,
	STEP_DURATION_MS,
	useReplayClock,
} from "./replay-clock";

describe("useReplayClock", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts paused at step 0 with default speed", () => {
		const { result } = renderHook(() => useReplayClock(5));
		expect(result.current.step).toBe(0);
		expect(result.current.isPlaying).toBe(false);
		expect(result.current.speed).toBe(1);
		expect(result.current.timeRef.current).toBe(0);
	});

	it("advances step over time when playing", () => {
		const { result } = renderHook(() => useReplayClock(5));
		act(() => result.current.play());
		expect(result.current.isPlaying).toBe(true);
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS * 2 + 100);
		});
		expect(result.current.step).toBeGreaterThanOrEqual(2);
	});

	it("pause() halts step advancement", () => {
		const { result } = renderHook(() => useReplayClock(10));
		act(() => result.current.play());
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS);
		});
		act(() => result.current.pause());
		const stepAtPause = result.current.step;
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS * 5);
		});
		expect(result.current.step).toBe(stepAtPause);
		expect(result.current.isPlaying).toBe(false);
	});

	it("setStep() clamps to [0, totalSteps - 1]", () => {
		const { result } = renderHook(() => useReplayClock(5));
		act(() => result.current.setStep(3));
		expect(result.current.step).toBe(3);
		act(() => result.current.setStep(99));
		expect(result.current.step).toBe(4);
		act(() => result.current.setStep(-2));
		expect(result.current.step).toBe(0);
	});

	it("setSpeed() clamps to [MIN_SPEED, MAX_SPEED]", () => {
		const { result } = renderHook(() => useReplayClock(5));
		act(() => result.current.setSpeed(10));
		expect(result.current.speed).toBe(MAX_SPEED);
		act(() => result.current.setSpeed(0));
		expect(result.current.speed).toBe(MIN_SPEED);
		act(() => result.current.setSpeed(2));
		expect(result.current.speed).toBe(2);
	});

	it("auto-pauses at the last step", () => {
		const { result } = renderHook(() => useReplayClock(3));
		act(() => result.current.play());
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS * 5);
		});
		expect(result.current.isPlaying).toBe(false);
		expect(result.current.step).toBe(2);
	});

	it("play() restarts from 0 when called at the end", () => {
		const { result } = renderHook(() => useReplayClock(3));
		act(() => result.current.setStep(2));
		act(() => result.current.play());
		expect(result.current.step).toBe(0);
		expect(result.current.isPlaying).toBe(true);
	});

	it("reset() returns to step 0 and pauses", () => {
		const { result } = renderHook(() => useReplayClock(5));
		act(() => result.current.setStep(3));
		act(() => result.current.play());
		act(() => result.current.reset());
		expect(result.current.step).toBe(0);
		expect(result.current.isPlaying).toBe(false);
		expect(result.current.timeRef.current).toBe(0);
	});

	it("stepForward / stepBackward navigate by 1 and pause", () => {
		const { result } = renderHook(() => useReplayClock(5));
		act(() => result.current.play());
		act(() => result.current.stepForward());
		expect(result.current.step).toBe(1);
		expect(result.current.isPlaying).toBe(false);
		act(() => result.current.stepForward());
		expect(result.current.step).toBe(2);
		act(() => result.current.stepBackward());
		expect(result.current.step).toBe(1);
	});

	it("higher speed scales the playback rate", () => {
		const { result } = renderHook(() => useReplayClock(10));
		act(() => result.current.setSpeed(2));
		act(() => result.current.play());
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS + 100);
		});
		// At 2x, ~500ms wall = ~2.5 steps
		expect(result.current.step).toBeGreaterThanOrEqual(2);
	});

	it("seek during playback resumes from the new position", () => {
		const { result } = renderHook(() => useReplayClock(10));
		act(() => result.current.play());
		act(() => result.current.setStep(5));
		expect(result.current.isPlaying).toBe(true);
		act(() => {
			vi.advanceTimersByTime(STEP_DURATION_MS + 100);
		});
		expect(result.current.step).toBeGreaterThanOrEqual(6);
	});

	it("clamps current step when totalSteps shrinks", () => {
		const { result, rerender } = renderHook(
			({ total }: { total: number }) => useReplayClock(total),
			{ initialProps: { total: 10 } }
		);
		act(() => result.current.setStep(7));
		expect(result.current.step).toBe(7);
		rerender({ total: 3 });
		expect(result.current.step).toBe(2);
	});
});
