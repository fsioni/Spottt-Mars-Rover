import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { scenarioSearchSchema, useScenario } from "./scenario-search";

const OK_PREFIX_RE = /^ok:/;
const ERR_PREFIX_RE = /^err:/;

function Probe() {
	const result = useScenario();
	if (result === null) {
		return <output data-testid="probe">null</output>;
	}
	if (result.ok) {
		return (
			<output data-testid="probe">ok:{JSON.stringify(result.value)}</output>
		);
	}
	return (
		<output data-testid="probe">
			err:{result.error.map((parseError) => parseError.kind).join(",")}
		</output>
	);
}

function renderAt(path: string) {
	const rootRoute = createRootRoute();
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: Probe,
		validateSearch: scenarioSearchSchema,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	return render(<RouterProvider router={router} />);
}

describe("useScenario", () => {
	afterEach(() => {
		cleanup();
	});

	it("returns null when scenario search param is absent", async () => {
		renderAt("/");
		const probe = await screen.findByTestId("probe");
		expect(probe.textContent).toBe("null");
	});

	it("returns a parsed Scenario when the search param is valid", async () => {
		const scenario = ["4 8", "(2, 3, E) LFRFF"].join("\n");
		renderAt(`/?scenario=${encodeURIComponent(scenario)}`);
		const probe = await screen.findByTestId("probe");
		expect(probe.textContent).toMatch(OK_PREFIX_RE);
		expect(probe.textContent).toContain('"grid":{"maxX":4,"maxY":8}');
		expect(probe.textContent).toContain('"orientation":"E"');
		expect(probe.textContent).toContain('"commands":["L","F","R","F","F"]');
	});

	it("returns categorised errors when the search param is invalid", async () => {
		const scenario = ["4 8", "(2, 3, Z) LFXFF"].join("\n");
		renderAt(`/?scenario=${encodeURIComponent(scenario)}`);
		const probe = await screen.findByTestId("probe");
		expect(probe.textContent).toMatch(ERR_PREFIX_RE);
		expect(probe.textContent).toContain("InvalidOrientation");
		expect(probe.textContent).toContain("InvalidCommandChar");
	});
});
