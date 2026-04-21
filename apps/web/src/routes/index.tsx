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
		<div className="grid h-full grid-rows-[auto_1fr]">
			<div className="container mx-auto max-w-3xl px-4 py-4">
				<TerminalInput
					executionTrace={executionTrace}
					scenarioResult={scenarioResult}
				/>
			</div>
			<div className="h-full w-full">
				{scenarioResult?.ok ? (
					<Scene
						executionTrace={executionTrace}
						scenario={scenarioResult.value}
					/>
				) : null}
			</div>
		</div>
	);
}
