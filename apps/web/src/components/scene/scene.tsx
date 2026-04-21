import { Button } from "@my-better-t-app/ui/components/button";
import { Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ExecutionTrace } from "@spottt/core/engine";
import type { Scenario } from "@spottt/core/types";
import { type RefObject, useMemo, useState } from "react";
import { BufferGeometry, Color, Float32BufferAttribute } from "three";

import { CameraController, type CameraMode } from "./camera-controller";
import { GhostTrail } from "./ghost-trail";
import { Rover } from "./rover";
import { RoverLabel } from "./rover-label";

const SKY_COLOR = "#d48b6a";
const FAR_GROUND_COLOR = "#7f3a20";
const GROUND_COLOR = "#a84a2b";
const ROCK_BASE_COLOR = "#7a3218";
const DUNE_COLOR = "#8a3e22";
const CELL_COLOR = "#3a2718";
const ORIGIN_HIGHLIGHT_COLOR = "#ff9800";
const NORTH_COLOR = "#e53935";
const EAST_COLOR = "#43a047";
const SOUTH_COLOR = "#fb8c00";
const WEST_COLOR = "#1e88e5";

const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

const ROCK_COUNT = 90;
const ROCK_CANDIDATE_MULTIPLIER = 3;
const DUNE_COUNT = 14;

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
	const fogNear = gridSpan + 8;
	const fogFar = gridSpan + 60;

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
				<Backdrop />
				<Ground height={height} width={width} />
				<GridLayer height={height} width={width} />
				<OriginHighlight />
				<CardinalLabels height={height} width={width} />
				<OriginAxes />
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
				<Rocks gridHeight={height} gridWidth={width} />
				<Dunes gridHeight={height} gridWidth={width} />
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
			<meshStandardMaterial color={GROUND_COLOR} roughness={1} />
		</mesh>
	);
}

function Backdrop() {
	return (
		<mesh position={[0, -0.03, 0]} rotation={FLAT_ROTATION}>
			<planeGeometry args={[300, 300]} />
			<meshStandardMaterial color={FAR_GROUND_COLOR} roughness={1} />
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

function hash(seed: number, multiplier: number): number {
	const s = Math.sin(seed * multiplier + multiplier) * 10_000;
	return s - Math.floor(s);
}

function isOnGrid(
	x: number,
	z: number,
	gridWidth: number,
	gridHeight: number,
	margin: number
): boolean {
	return (
		x >= -margin &&
		x <= gridWidth + margin &&
		z >= -gridHeight - margin &&
		z <= margin
	);
}

type RockShape = "dodeca" | "icosa" | "octa";

interface RockInstance {
	id: number;
	rotX: number;
	rotY: number;
	rotZ: number;
	shape: RockShape;
	size: number;
	tint: Color;
	x: number;
	z: number;
}

interface GridSizeProps {
	gridHeight: number;
	gridWidth: number;
}

const ROCK_SHAPES: readonly RockShape[] = ["dodeca", "icosa", "octa"];

function Rocks({ gridWidth, gridHeight }: GridSizeProps) {
	const rocks = useMemo<RockInstance[]>(() => {
		const cx = gridWidth / 2;
		const cz = -gridHeight / 2;
		const base = new Color(ROCK_BASE_COLOR);
		const items: RockInstance[] = [];
		const maxCandidates = ROCK_COUNT * ROCK_CANDIDATE_MULTIPLIER;
		for (let i = 0; i < maxCandidates && items.length < ROCK_COUNT; i++) {
			const angle = hash(i, 1.27) * Math.PI * 2;
			const radius = 9 + hash(i, 3.71) * 32;
			const x = cx + Math.cos(angle) * radius;
			const z = cz + Math.sin(angle) * radius;
			if (isOnGrid(x, z, gridWidth, gridHeight, 0.8)) {
				continue;
			}
			const colorFactor = 0.75 + hash(i, 13.47) * 0.4;
			items.push({
				id: i,
				rotX: hash(i, 7.93) * Math.PI * 2,
				rotY: hash(i, 11.19) * Math.PI * 2,
				rotZ: hash(i, 19.31) * Math.PI * 2,
				shape: ROCK_SHAPES[Math.floor(hash(i, 17.83) * ROCK_SHAPES.length)],
				size: 0.25 + hash(i, 5.13) * 1.3,
				tint: base.clone().multiplyScalar(colorFactor),
				x,
				z,
			});
		}
		return items;
	}, [gridWidth, gridHeight]);

	return (
		<>
			{rocks.map((rock) => (
				<mesh
					key={`rock-${rock.id}`}
					position={[rock.x, rock.size * 0.35, rock.z]}
					rotation={[rock.rotX, rock.rotY, rock.rotZ]}
				>
					{rock.shape === "dodeca" && (
						<dodecahedronGeometry args={[rock.size]} />
					)}
					{rock.shape === "icosa" && <icosahedronGeometry args={[rock.size]} />}
					{rock.shape === "octa" && <octahedronGeometry args={[rock.size]} />}
					<meshStandardMaterial
						color={rock.tint}
						flatShading
						roughness={0.95}
					/>
				</mesh>
			))}
		</>
	);
}

interface DuneInstance {
	id: number;
	rotY: number;
	scaleX: number;
	scaleY: number;
	scaleZ: number;
	x: number;
	z: number;
}

function Dunes({ gridWidth, gridHeight }: GridSizeProps) {
	const dunes = useMemo<DuneInstance[]>(() => {
		const cx = gridWidth / 2;
		const cz = -gridHeight / 2;
		const items: DuneInstance[] = [];
		const maxCandidates = DUNE_COUNT * 4;
		for (let i = 0; i < maxCandidates && items.length < DUNE_COUNT; i++) {
			const angle = hash(i, 2.31) * Math.PI * 2;
			const radius = 30 + hash(i, 4.77) * 25;
			const x = cx + Math.cos(angle) * radius;
			const z = cz + Math.sin(angle) * radius;
			if (isOnGrid(x, z, gridWidth, gridHeight, 2)) {
				continue;
			}
			items.push({
				id: i,
				rotY: hash(i, 6.19) * Math.PI * 2,
				scaleX: 6 + hash(i, 8.41) * 10,
				scaleY: 0.6 + hash(i, 10.07) * 1.4,
				scaleZ: 4 + hash(i, 12.53) * 8,
				x,
				z,
			});
		}
		return items;
	}, [gridWidth, gridHeight]);

	return (
		<>
			{dunes.map((dune) => (
				<mesh
					key={`dune-${dune.id}`}
					position={[dune.x, -0.2, dune.z]}
					rotation={[0, dune.rotY, 0]}
					scale={[dune.scaleX, dune.scaleY, dune.scaleZ]}
				>
					<sphereGeometry args={[1, 12, 8]} />
					<meshStandardMaterial color={DUNE_COLOR} flatShading roughness={1} />
				</mesh>
			))}
		</>
	);
}
