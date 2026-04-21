import { useFrame } from "@react-three/fiber";
import type { ExecutionTrace, Snapshot } from "@spottt/core/engine";
import type { Position } from "@spottt/core/types";
import { type RefObject, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";

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
	timeRef: RefObject<number>;
	trace: ExecutionTrace;
}

export function GhostTrail({
	currentStep,
	lifespan = DEFAULT_LIFESPAN,
	timeRef,
	trace,
}: GhostTrailProps) {
	const groupRef = useRef<Group>(null);
	const elapsed = useRef(0);

	const current = trace.snapshots[currentStep];
	const isLastSnapshot = currentStep >= trace.snapshots.length - 1;
	const currentCellKey =
		current && !isLastSnapshot ? cellKey(current.rover.position) : null;
	const cubes = dedupeByCell(trace.snapshots.slice(0, currentStep + 1));

	useFrame((_, delta) => {
		if (!groupRef.current) {
			return;
		}
		elapsed.current += delta;
		const t = elapsed.current;
		const tNow = timeRef.current;
		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const child = children[i] as Mesh;
			const phase = i * PHASE_PER_INDEX;
			child.rotation.y = t * YAW_SPEED + phase;
			child.rotation.x = t * PITCH_SPEED + phase * 0.5;
			child.position.y =
				HOVER_Y + Math.sin(t * BOB_SPEED + phase) * HOVER_AMPLITUDE;

			const snapshotStep = child.userData.snapshotStep as number;
			const isCurrent = child.userData.isCurrent as boolean;
			const age = Math.max(0, tNow - snapshotStep);
			let opacity = Math.max(MIN_OPACITY, 1 - age / lifespan);
			if (isCurrent) {
				opacity *= Math.min(1, Math.max(0, tNow - snapshotStep));
			}
			const material = child.material as MeshStandardMaterial;
			material.opacity = opacity;
			material.emissiveIntensity = 0.5 * opacity;
		}
	});

	return (
		<group ref={groupRef}>
			{cubes.map((snapshot) => {
				const key = cellKey(snapshot.rover.position);
				const isCurrent = key === currentCellKey;
				return (
					<mesh
						key={key}
						position={[
							snapshot.rover.position.x + 0.5,
							HOVER_Y,
							-snapshot.rover.position.y - 0.5,
						]}
						userData={{ snapshotStep: snapshot.step, isCurrent }}
					>
						<boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
						<meshStandardMaterial
							color={TRAIL_COLOR}
							emissive={EMISSIVE_COLOR}
							emissiveIntensity={0}
							opacity={0}
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

function dedupeByCell(snapshots: Snapshot[]): Snapshot[] {
	const byCell = new Map<string, Snapshot>();
	for (const snapshot of snapshots) {
		byCell.set(cellKey(snapshot.rover.position), snapshot);
	}
	return Array.from(byCell.values());
}
