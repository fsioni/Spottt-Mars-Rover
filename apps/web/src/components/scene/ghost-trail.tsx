import { useFrame } from "@react-three/fiber";
import type { ExecutionTrace, Snapshot } from "@spottt/core/engine";
import type { Position } from "@spottt/core/types";
import { useRef } from "react";
import type { Group } from "three";

const TRAIL_COLOR = "#ffd54f";
const EMISSIVE_COLOR = "#ff9800";
const DEFAULT_LIFESPAN = 12;
const MIN_OPACITY = 0.15;
const CUBE_SIZE = 0.3;
const HOVER_Y = 0.55;
const HOVER_AMPLITUDE = 0.08;
const YAW_SPEED = 0.9;
const PITCH_SPEED = 0.45;
const BOB_SPEED = 2;
const PHASE_PER_INDEX = 0.7;

interface GhostTrailProps {
	currentStep: number;
	lifespan?: number;
	trace: ExecutionTrace;
}

export function GhostTrail({
	currentStep,
	lifespan = DEFAULT_LIFESPAN,
	trace,
}: GhostTrailProps) {
	const groupRef = useRef<Group>(null);
	const elapsed = useRef(0);

	useFrame((_, delta) => {
		if (!groupRef.current) {
			return;
		}
		elapsed.current += delta;
		const t = elapsed.current;
		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const phase = i * PHASE_PER_INDEX;
			child.rotation.y = t * YAW_SPEED + phase;
			child.rotation.x = t * PITCH_SPEED + phase * 0.5;
			child.position.y =
				HOVER_Y + Math.sin(t * BOB_SPEED + phase) * HOVER_AMPLITUDE;
		}
	});

	const current = trace.snapshots[currentStep];
	const cubes = dedupeByCell(
		trace.snapshots.slice(0, currentStep + 1),
		current?.rover.position
	);

	return (
		<group ref={groupRef}>
			{cubes.map((snapshot) => {
				const age = currentStep - snapshot.step;
				const opacity = Math.max(MIN_OPACITY, 1 - age / lifespan);
				return (
					<mesh
						key={`${snapshot.rover.position.x},${snapshot.rover.position.y}`}
						position={[
							snapshot.rover.position.x + 0.5,
							HOVER_Y,
							-snapshot.rover.position.y - 0.5,
						]}
					>
						<boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
						<meshStandardMaterial
							color={TRAIL_COLOR}
							emissive={EMISSIVE_COLOR}
							emissiveIntensity={0.5 * opacity}
							opacity={opacity}
							transparent
						/>
					</mesh>
				);
			})}
		</group>
	);
}

function cellKey(position: Position): string {
	return `${position.x},${position.y}`;
}

function dedupeByCell(snapshots: Snapshot[], exclude?: Position): Snapshot[] {
	const byCell = new Map<string, Snapshot>();
	for (const snapshot of snapshots) {
		byCell.set(cellKey(snapshot.rover.position), snapshot);
	}
	if (exclude) {
		byCell.delete(cellKey(exclude));
	}
	return Array.from(byCell.values());
}
