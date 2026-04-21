import type { Orientation } from "@spottt/core/types";

/**
 * Local forward is -Z (chassis + arrow cone baked to point -Z).
 * rotation.y maps spec orientation to world direction:
 *   N=-Z (0), E=+X (-π/2), S=+Z (π), W=-X (π/2).
 * Cf. docs/decisions.md §4.1 for the rover.y → -scene.z mapping.
 */
export const ORIENTATION_ROTATION_Y: Record<Orientation, number> = {
	N: 0,
	E: -Math.PI / 2,
	S: Math.PI,
	W: Math.PI / 2,
};
