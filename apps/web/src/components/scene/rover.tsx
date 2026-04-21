import type { Orientation, Position } from "@spottt/core/types";
import { useMemo } from "react";
import { ConeGeometry } from "three";

/**
 * Orientation → rotation Y (radians) for a cone whose tip has been baked to +Z.
 * N = -Z, E = +X, S = +Z, W = -X in scene space (cf. docs/decisions.md §4.1).
 */
const ORIENTATION_ROTATION_Y: Record<Orientation, number> = {
	N: Math.PI,
	E: Math.PI / 2,
	S: 0,
	W: -Math.PI / 2,
};

interface RoverProps {
	orientation: Orientation;
	position: Position;
}

export function Rover({ orientation, position }: RoverProps) {
	const coneGeometry = useMemo(() => {
		const geom = new ConeGeometry(0.3, 0.8, 16);
		geom.rotateX(Math.PI / 2);
		return geom;
	}, []);

	return (
		<mesh
			geometry={coneGeometry}
			position={[position.x, 0.4, -position.y]}
			rotation={[0, ORIENTATION_ROTATION_Y[orientation], 0]}
		>
			<meshStandardMaterial color="#e07a5f" />
		</mesh>
	);
}
