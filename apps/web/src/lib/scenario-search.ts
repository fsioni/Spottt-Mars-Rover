import type { ParseError } from "@spottt/core/errors";
import { parseScenario } from "@spottt/core/parser";
import type { Result, Scenario } from "@spottt/core/types";
import { useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

export const scenarioSearchSchema = z.object({
	scenario: z.string().optional(),
});

export const useScenario = (): Result<Scenario, ParseError[]> | null => {
	const { scenario } = useSearch({ from: "/" });
	return useMemo(() => (scenario ? parseScenario(scenario) : null), [scenario]);
};
