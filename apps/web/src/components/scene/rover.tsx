import type { Orientation, Position } from "@spottt/core/types";

import { ORIENTATION_ROTATION_Y } from "./orientation";

const CHASSIS_COLOR = "#2196f3";
const CHASSIS_COLOR_LOST = "#ff6b9d";
const ARROW_COLOR = "#ffd54f";
const ARROW_COLOR_LOST = "#ffd6e3";
const WHEEL_COLOR = "#212121";

interface RoverProps {
	lost?: boolean;
	orientation: Orientation;
	position: Position;
}

export function Rover({ lost = false, orientation, position }: RoverProps) {
	const chassisColor = lost ? CHASSIS_COLOR_LOST : CHASSIS_COLOR;
	const arrowColor = lost ? ARROW_COLOR_LOST : ARROW_COLOR;

	return (
		<group
			position={[position.x, 0, -position.y]}
			rotation={[0, ORIENTATION_ROTATION_Y[orientation], 0]}
		>
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
