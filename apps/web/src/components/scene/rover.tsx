import { useFrame } from "@react-three/fiber";
import type { ExecutionTrace } from "@spottt/core/engine";
import { type RefObject, useMemo, useRef } from "react";
import { type Group, MathUtils, Quaternion, Vector3 } from "three";

import { ORIENTATION_ROTATION_Y } from "./orientation";

const Y_AXIS = new Vector3(0, 1, 0);

const CHASSIS_COLOR = "#2196f3";
const CHASSIS_COLOR_LOST = "#ff6b9d";
const ARROW_COLOR = "#ffd54f";
const ARROW_COLOR_LOST = "#ffd6e3";
const WHEEL_COLOR = "#212121";

interface RoverProps {
	step: number;
	timeRef: RefObject<number>;
	trace: ExecutionTrace;
}

export function Rover({ step, timeRef, trace }: RoverProps) {
	const groupRef = useRef<Group>(null);
	const { snapshots } = trace;

	const positions = useMemo(
		() =>
			snapshots.map(
				(snapshot) =>
					new Vector3(
						snapshot.rover.position.x + 0.5,
						0,
						-snapshot.rover.position.y - 0.5
					)
			),
		[snapshots]
	);

	const quaternions = useMemo(
		() =>
			snapshots.map((snapshot) => {
				const q = new Quaternion();
				q.setFromAxisAngle(
					Y_AXIS,
					ORIENTATION_ROTATION_Y[snapshot.rover.orientation]
				);
				return q;
			}),
		[snapshots]
	);

	useFrame(() => {
		const group = groupRef.current;
		if (!group) {
			return;
		}
		const lastIndex = snapshots.length - 1;
		if (lastIndex < 0) {
			return;
		}
		const t = timeRef.current;
		const fromIndex = MathUtils.clamp(Math.floor(t), 0, lastIndex);
		const toIndex = Math.min(lastIndex, fromIndex + 1);
		const frac =
			toIndex === fromIndex ? 0 : MathUtils.clamp(t - fromIndex, 0, 1);
		group.position.lerpVectors(positions[fromIndex], positions[toIndex], frac);
		group.quaternion.slerpQuaternions(
			quaternions[fromIndex],
			quaternions[toIndex],
			frac
		);
	});

	const isLost =
		trace.lost && trace.lostAt !== undefined && step >= trace.lostAt;
	const chassisColor = isLost ? CHASSIS_COLOR_LOST : CHASSIS_COLOR;
	const arrowColor = isLost ? ARROW_COLOR_LOST : ARROW_COLOR;

	const initial = positions[0];

	return (
		<group position={[initial.x, initial.y, initial.z]} ref={groupRef}>
			<mesh position={[0, 0.32, 0]}>
				<boxGeometry args={[0.6, 0.35, 0.7]} />
				<meshStandardMaterial color={chassisColor} />
			</mesh>
			<mesh position={[0, 0.32, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
				<coneGeometry args={[0.16, 0.35, 20]} />
				<meshStandardMaterial color={arrowColor} />
			</mesh>
			<Wheel position={[-0.35, 0.15, -0.25]} />
			<Wheel position={[0.35, 0.15, -0.25]} />
			<Wheel position={[-0.35, 0.15, 0.25]} />
			<Wheel position={[0.35, 0.15, 0.25]} />
		</group>
	);
}

interface WheelProps {
	position: [number, number, number];
}

function Wheel({ position }: WheelProps) {
	return (
		<mesh position={position} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
			<meshStandardMaterial color={WHEEL_COLOR} />
		</mesh>
	);
}
