import { Button } from "@my-better-t-app/ui/components/button";

import type { CameraMode } from "./camera-controller";

const CAMERA_MODES: ReadonlyArray<{ label: string; value: CameraMode }> = [
	{ label: "Orbit", value: "orbit" },
	{ label: "Follow", value: "follow" },
	{ label: "FPV", value: "fpv" },
];

interface CameraModeToggleProps {
	mode: CameraMode;
	onChange: (mode: CameraMode) => void;
}

export function CameraModeToggle({ mode, onChange }: CameraModeToggleProps) {
	return (
		<div
			aria-label="Mode caméra"
			className="absolute top-3 right-3 flex gap-1 rounded-md border border-border bg-background/80 p-1 shadow-sm backdrop-blur"
			role="toolbar"
		>
			{CAMERA_MODES.map((option) => (
				<Button
					aria-pressed={mode === option.value}
					key={option.value}
					onClick={() => onChange(option.value)}
					size="sm"
					type="button"
					variant={mode === option.value ? "secondary" : "ghost"}
				>
					{option.label}
				</Button>
			))}
		</div>
	);
}
