import { execute } from "@spottt/core/engine";
import type { ParseError } from "@spottt/core/errors";
import { parseScenario } from "@spottt/core/parser";
import type { Result, Scenario } from "@spottt/core/types";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { scenarioSearchSchema } from "@/lib/scenario-search";

import { TerminalInput } from "./terminal-input";

interface HarnessProps {
	executionTrace: ReturnType<typeof execute> | null;
	scenarioResult: Result<Scenario, ParseError[]> | null;
}

function renderAt(path: string, props: HarnessProps) {
	const rootRoute = createRootRoute();
	const indexRoute = createRoute({
		component: () => <TerminalInput {...props} />,
		getParentRoute: () => rootRoute,
		path: "/",
		validateSearch: scenarioSearchSchema,
	});
	const router = createRouter({
		history: createMemoryHistory({ initialEntries: [path] }),
		routeTree: rootRoute.addChildren([indexRoute]),
	});
	render(<RouterProvider router={router} />);
	return { router };
}

const VALID_SCENARIO = ["4 8", "(2, 3, E) LFRFF"].join("\n");
const INVALID_ORIENTATION_RE = /\[InvalidOrientation\]/;
const INVALID_COMMAND_RE = /\[InvalidCommandChar\]/;
const LOST_STATE_RE = /\(0,0,S\) LOST/;
const FINAL_STATE_RE = /\(\d+,\d+,[NESW]\)/;

describe("TerminalInput", () => {
	afterEach(() => {
		cleanup();
	});

	it("initialises the textarea from the scenario search param", async () => {
		renderAt(`/?scenario=${encodeURIComponent(VALID_SCENARIO)}`, {
			executionTrace: null,
			scenarioResult: null,
		});
		const textarea = (await screen.findByLabelText(
			"Scenario input"
		)) as HTMLTextAreaElement;
		expect(textarea.value).toBe(VALID_SCENARIO);
	});

	it("pushes the draft into the URL on Ctrl+Enter", async () => {
		const { router } = renderAt("/", {
			executionTrace: null,
			scenarioResult: null,
		});
		const textarea = (await screen.findByLabelText(
			"Scenario input"
		)) as HTMLTextAreaElement;

		fireEvent.change(textarea, { target: { value: VALID_SCENARIO } });
		fireEvent.keyDown(textarea, { ctrlKey: true, key: "Enter" });

		await waitFor(() => {
			expect(router.state.location.search).toEqual({
				scenario: VALID_SCENARIO,
			});
		});
	});

	it("does not run on plain Enter (default newline preserved)", async () => {
		const { router } = renderAt("/", {
			executionTrace: null,
			scenarioResult: null,
		});
		const textarea = (await screen.findByLabelText(
			"Scenario input"
		)) as HTMLTextAreaElement;

		fireEvent.change(textarea, { target: { value: "4 8" } });
		const event = new KeyboardEvent("keydown", {
			bubbles: true,
			cancelable: true,
			key: "Enter",
		});
		textarea.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(router.state.location.search).toEqual({});
	});

	it("renders categorised errors from scenarioResult", async () => {
		const parsed = parseScenario(["4 8", "(2, 3, Z) LFXFF"].join("\n"));
		renderAt("/", { executionTrace: null, scenarioResult: parsed });
		await screen.findByText(INVALID_ORIENTATION_RE);
		await screen.findByText(INVALID_COMMAND_RE);
	});

	it("renders the final state with LOST when the trace is lost", async () => {
		const parsed = parseScenario(["2 2", "(0, 0, S) F"].join("\n"));
		if (!parsed.ok) {
			throw new Error("fixture scenario should parse");
		}
		const trace = execute(parsed.value);
		expect(trace.lost).toBe(true);
		renderAt("/", { executionTrace: trace, scenarioResult: parsed });
		await screen.findByText(LOST_STATE_RE);
	});

	it("renders the final state without LOST when the rover survives", async () => {
		const parsed = parseScenario(VALID_SCENARIO);
		if (!parsed.ok) {
			throw new Error("fixture scenario should parse");
		}
		const trace = execute(parsed.value);
		renderAt("/", { executionTrace: trace, scenarioResult: parsed });
		const finalState = await screen.findByText(FINAL_STATE_RE);
		expect(finalState.textContent).not.toContain("LOST");
	});
});
