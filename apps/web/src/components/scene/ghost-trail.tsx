import type { ExecutionTrace } from "@spottt/core/engine";

import { ORIENTATION_ROTATION_Y } from "./orientation";

const TRAIL_COLOR = "#ffd54f";
const CHEVRON_COLOR = "#ff9800";
const DEFAULT_LIFESPAN = 12;
const MIN_OPACITY = 0.1;
const TRAIL_Y = 0.01;
const PLANE_SIZE = 0.9;
const CHEVRON_SIZE: [number, number] = [0.55, 0.18];

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
	const visibleSnapshots = trace.snapshots.slice(0, currentStep + 1);

	return (
		<group>
			{visibleSnapshots.map((snapshot) => {
				const age = currentStep - snapshot.step;
				const opacity = Math.max(MIN_OPACITY, 1 - age / lifespan);
				const yaw = ORIENTATION_ROTATION_Y[snapshot.rover.orientation];
				return (
					<group
						key={snapshot.step}
						position={[
							snapshot.rover.position.x,
							TRAIL_Y,
							-snapshot.rover.position.y,
						]}
						rotation={[0, yaw, 0]}
					>
						<mesh rotation={[-Math.PI / 2, 0, 0]}>
							<planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
							<meshBasicMaterial
								color={TRAIL_COLOR}
								depthWrite={false}
								opacity={opacity * 0.6}
								transparent
							/>
						</mesh>
						<mesh position={[0, 0.001, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
							<planeGeometry args={CHEVRON_SIZE} />
							<meshBasicMaterial
								color={CHEVRON_COLOR}
								depthWrite={false}
								opacity={opacity}
								transparent
							/>
						</mesh>
					</group>
				);
			})}
		</group>
	);
}
