import type { ParseError } from "@spottt/core/errors";
import { parseScenario } from "@spottt/core/parser";
import type { Result, Scenario } from "@spottt/core/types";
import { useSearch } from "@tanstack/react-router";
import { z } from "zod";

export const scenarioSearchSchema = z.object({
	scenario: z.string().optional(),
});

export const useScenario = (): Result<Scenario, ParseError[]> | null => {
	const { scenario } = useSearch({ from: "/" });
	if (!scenario) {
		return null;
	}
	return parseScenario(scenario);
};
