import { execute } from "@spottt/core/engine";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { TerminalInput } from "@/components/ui/terminal-input";
import { scenarioSearchSchema, useScenario } from "@/lib/scenario-search";

export const Route = createFileRoute("/")({
	component: HomeComponent,
	validateSearch: scenarioSearchSchema,
});

function HomeComponent() {
	const scenarioResult = useScenario();
	const executionTrace = useMemo(
		() => (scenarioResult?.ok ? execute(scenarioResult.value) : null),
		[scenarioResult]
	);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-4">
			<TerminalInput
				executionTrace={executionTrace}
				scenarioResult={scenarioResult}
			/>
		</div>
	);
}
