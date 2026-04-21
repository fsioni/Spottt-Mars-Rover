import { Button } from "@my-better-t-app/ui/components/button";
import { Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ExecutionTrace } from "@spottt/core/engine";
import type { Scenario } from "@spottt/core/types";
import { useMemo, useState } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

import { CameraController, type CameraMode } from "./camera-controller";
import { GhostTrail } from "./ghost-trail";
import { Rover } from "./rover";
import { RoverLabel } from "./rover-label";

const GROUND_COLOR = "#b07a4e";
const CELL_COLOR = "#3a2718";
const ORIGIN_HIGHLIGHT_COLOR = "#ff9800";
const NORTH_COLOR = "#e53935";
const EAST_COLOR = "#43a047";
const SOUTH_COLOR = "#fb8c00";
const WEST_COLOR = "#1e88e5";

const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

interface SceneProps {
	currentStep?: number;
	scenario: Scenario;
	trace?: ExecutionTrace | null;
}

export function Scene({ currentStep, scenario, trace = null }: SceneProps) {
	const { grid, rover: initialRover } = scenario;
	const width = grid.maxX;
	const height = grid.maxY;

	const effectiveStep = currentStep ?? (trace ? trace.snapshots.length - 1 : 0);
	const activeRover = trace?.snapshots[effectiveStep]?.rover ?? initialRover;
	const lost = trace?.lostAt !== undefined && effectiveStep >= trace.lostAt;
	const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");

	return (
		<div className="relative h-full w-full">
			<Canvas camera={{ position: [width + 4, 11, 5], fov: 45 }}>
				<ambientLight intensity={0.55} />
				<directionalLight intensity={1} position={[10, 14, 6]} />
				<Ground height={height} width={width} />
				<GridLayer height={height} width={width} />
				<OriginHighlight />
				<CardinalLabels height={height} width={width} />
				<OriginAxes />
				{trace ? (
					<GhostTrail currentStep={effectiveStep} trace={trace} />
				) : null}
				<Rover
					lost={lost}
					orientation={activeRover.orientation}
					position={activeRover.position}
				/>
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

interface CameraModeToggleProps {
	mode: CameraMode;
	onChange: (mode: CameraMode) => void;
}

function CameraModeToggle({ mode, onChange }: CameraModeToggleProps) {
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

const CAMERA_MODES: ReadonlyArray<{ label: string; value: CameraMode }> = [
	{ label: "Orbit", value: "orbit" },
	{ label: "Follow", value: "follow" },
	{ label: "FPV", value: "fpv" },
];

interface SizeProps {
	height: number;
	width: number;
}

function Ground({ height, width }: SizeProps) {
	return (
		<mesh position={[width / 2, -0.01, -height / 2]} rotation={FLAT_ROTATION}>
			<planeGeometry args={[width, height]} />
			<meshStandardMaterial color={GROUND_COLOR} />
		</mesh>
	);
}

function GridLayer({ height, width }: SizeProps) {
	const geometry = useMemo(() => {
		const verts: number[] = [];
		for (let x = 0; x <= width; x++) {
			verts.push(x, 0.001, 0, x, 0.001, -height);
		}
		for (let z = 0; z <= height; z++) {
			verts.push(0, 0.001, -z, width, 0.001, -z);
		}
		const geom = new BufferGeometry();
		geom.setAttribute("position", new Float32BufferAttribute(verts, 3));
		return geom;
	}, [width, height]);

	return (
		<lineSegments geometry={geometry}>
			<lineBasicMaterial color={CELL_COLOR} />
		</lineSegments>
	);
}

function OriginHighlight() {
	return (
		<group>
			<mesh position={[0, 0.06, 0]}>
				<sphereGeometry args={[0.12, 16, 12]} />
				<meshStandardMaterial color={ORIGIN_HIGHLIGHT_COLOR} />
			</mesh>
			<Text
				color={ORIGIN_HIGHLIGHT_COLOR}
				fontSize={0.22}
				position={[-0.35, 0.02, 0.35]}
				rotation={FLAT_ROTATION}
			>
				(0,0)
			</Text>
		</group>
	);
}

function CardinalLabels({ height, width }: SizeProps) {
	return (
		<group>
			<Text
				color={NORTH_COLOR}
				fontSize={0.45}
				position={[width / 2, 0.02, -height - 0.6]}
				rotation={FLAT_ROTATION}
			>
				N
			</Text>
			<Text
				color={SOUTH_COLOR}
				fontSize={0.45}
				position={[width / 2, 0.02, 0.6]}
				rotation={FLAT_ROTATION}
			>
				S
			</Text>
			<Text
				color={EAST_COLOR}
				fontSize={0.45}
				position={[width + 0.6, 0.02, -height / 2]}
				rotation={FLAT_ROTATION}
			>
				E
			</Text>
			<Text
				color={WEST_COLOR}
				fontSize={0.45}
				position={[-0.6, 0.02, -height / 2]}
				rotation={FLAT_ROTATION}
			>
				W
			</Text>
		</group>
	);
}

function OriginAxes() {
	return (
		<group>
			<mesh position={[0.5, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
				<cylinderGeometry args={[0.03, 0.03, 1, 12]} />
				<meshStandardMaterial color={EAST_COLOR} />
			</mesh>
			<mesh position={[1.05, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
				<coneGeometry args={[0.08, 0.15, 12]} />
				<meshStandardMaterial color={EAST_COLOR} />
			</mesh>
			<mesh position={[0, 0.02, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.03, 0.03, 1, 12]} />
				<meshStandardMaterial color={NORTH_COLOR} />
			</mesh>
			<mesh position={[0, 0.02, -1.05]} rotation={[-Math.PI / 2, 0, 0]}>
				<coneGeometry args={[0.08, 0.15, 12]} />
				<meshStandardMaterial color={NORTH_COLOR} />
			</mesh>
		</group>
	);
}
