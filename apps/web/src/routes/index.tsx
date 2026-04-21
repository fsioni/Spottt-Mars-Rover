import { execute } from "@spottt/core/engine";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { Scene } from "@/components/scene/scene";
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
		<div className="relative h-full w-full">
			<div className="absolute inset-0">
				{scenarioResult?.ok ? <Scene scenario={scenarioResult.value} /> : null}
			</div>
			<div className="pointer-events-none absolute inset-0 p-4">
				<div className="pointer-events-auto w-full max-w-md">
					<TerminalInput
						executionTrace={executionTrace}
						scenarioResult={scenarioResult}
					/>
				</div>
			</div>
		</div>
	);
}
