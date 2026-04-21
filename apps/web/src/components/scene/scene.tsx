import { Canvas } from "@react-three/fiber";
import type { ExecutionTrace } from "@spottt/core/engine";
import type { Scenario } from "@spottt/core/types";
import { type RefObject, useState } from "react";

import { CameraController, type CameraMode } from "./camera-controller";
import { CameraModeToggle } from "./camera-mode-toggle";
import { Decor } from "./decor";
import { GhostTrail } from "./ghost-trail";
import { Rover } from "./rover";
import { RoverLabel } from "./rover-label";
import { Terrain } from "./terrain";

const SKY_COLOR = "#d48b6a";
const FOG_NEAR_OFFSET = 8;
const FOG_FAR_OFFSET = 60;

interface SceneProps {
	scenario: Scenario;
	step?: number;
	timeRef?: RefObject<number>;
	trace?: ExecutionTrace | null;
}

export function Scene({ scenario, step, timeRef, trace = null }: SceneProps) {
	const { grid, rover: initialRover } = scenario;
	const width = grid.maxX + 1;
	const height = grid.maxY + 1;

	const effectiveStep = step ?? (trace ? trace.snapshots.length - 1 : 0);
	const snapshotRover = trace?.snapshots[effectiveStep]?.rover ?? initialRover;
	const lost = trace?.lostAt !== undefined && effectiveStep >= trace.lostAt;
	const activeRover =
		lost && trace?.lostPosition
			? { ...snapshotRover, position: trace.lostPosition }
			: snapshotRover;
	const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
	const gridSpan = Math.max(width, height);
	const fogNear = gridSpan + FOG_NEAR_OFFSET;
	const fogFar = gridSpan + FOG_FAR_OFFSET;

	return (
		<div className="relative h-full w-full">
			<Canvas camera={{ position: [width + 4, 11, 5], fov: 45 }}>
				<color args={[SKY_COLOR]} attach="background" />
				<fog args={[SKY_COLOR, fogNear, fogFar]} attach="fog" />
				<ambientLight color="#c49a7a" intensity={0.45} />
				<directionalLight
					color="#ffd9b0"
					intensity={1.1}
					position={[10, 14, 6]}
				/>
				<hemisphereLight args={["#f4b88a", "#7a3419", 0.35]} />
				<Terrain height={height} width={width} />
				<Decor gridHeight={height} gridWidth={width} />
				{trace && timeRef ? (
					<GhostTrail
						currentStep={effectiveStep}
						timeRef={timeRef}
						trace={trace}
					/>
				) : null}
				{trace && timeRef ? (
					<Rover step={effectiveStep} timeRef={timeRef} trace={trace} />
				) : null}
				<RoverLabel
					lost={lost}
					orientation={activeRover.orientation}
					position={activeRover.position}
				/>
				<CameraController grid={grid} mode={cameraMode} rover={activeRover} />
			</Canvas>
			<CameraModeToggle mode={cameraMode} onChange={setCameraMode} />
		</div>
	);
}
