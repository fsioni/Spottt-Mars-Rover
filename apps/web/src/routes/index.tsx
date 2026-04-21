import { createFileRoute } from "@tanstack/react-router";

import { scenarioSearchSchema, useScenario } from "@/lib/scenario-search";

export const Route = createFileRoute("/")({
	component: HomeComponent,
	validateSearch: scenarioSearchSchema,
});

function HomeComponent() {
	const scenarioResult = useScenario();

	let status = "no scenario";
	if (scenarioResult?.ok) {
		status = "scenario ok";
	} else if (scenarioResult) {
		status = `scenario invalid (${scenarioResult.error.length} error${
			scenarioResult.error.length === 1 ? "" : "s"
		})`;
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2 font-mono text-sm">
			{status}
		</div>
	);
}
