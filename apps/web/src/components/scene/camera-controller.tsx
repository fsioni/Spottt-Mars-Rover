import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { GridSize, Rover } from "@spottt/core/types";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";

import { ORIENTATION_ROTATION_Y } from "./rover";

export type CameraMode = "orbit" | "follow" | "fpv";

interface CameraControllerProps {
	grid: GridSize;
	mode: CameraMode;
	rover: Rover;
}

const SMOOTHING_TAU_SECONDS = 0.2;
const FOLLOW_DISTANCE = 4;
const FOLLOW_HEIGHT = 2.6;
const FPV_HEIGHT = 0.55;
const FOLLOW_LOOKAT_Y = 0.3;

const reusableTarget = new Vector3();
const reusableLookAt = new Vector3();

export function CameraController({ grid, mode, rover }: CameraControllerProps) {
	const camera = useThree((state) => state.camera);
	const yawRef = useRef(ORIENTATION_ROTATION_Y[rover.orientation]);
	const initializedRef = useRef(false);
	const orbitTarget = useMemo<[number, number, number]>(
		() => [grid.maxX / 2, 0, -grid.maxY / 2],
		[grid.maxX, grid.maxY]
	);

	useFrame((_, deltaSeconds) => {
		if (mode === "orbit") {
			initializedRef.current = false;
			return;
		}

		const targetYaw = ORIENTATION_ROTATION_Y[rover.orientation];
		const alpha =
			deltaSeconds > 0
				? 1 - Math.exp(-deltaSeconds / SMOOTHING_TAU_SECONDS)
				: 1;

		if (!initializedRef.current) {
			yawRef.current = targetYaw;
			initializedRef.current = true;
		}

		let delta = targetYaw - yawRef.current;
		while (delta > Math.PI) {
			delta -= 2 * Math.PI;
		}
		while (delta < -Math.PI) {
			delta += 2 * Math.PI;
		}
		yawRef.current += delta * alpha;

		const roverWorldX = rover.position.x;
		const roverWorldZ = -rover.position.y;
		const yaw = yawRef.current;
		const forwardX = -Math.sin(yaw);
		const forwardZ = -Math.cos(yaw);

		if (mode === "follow") {
			reusableTarget.set(
				roverWorldX - forwardX * FOLLOW_DISTANCE,
				FOLLOW_HEIGHT,
				roverWorldZ - forwardZ * FOLLOW_DISTANCE
			);
			camera.position.lerp(reusableTarget, alpha);
			reusableLookAt.set(roverWorldX, FOLLOW_LOOKAT_Y, roverWorldZ);
			camera.lookAt(reusableLookAt);
			return;
		}

		reusableTarget.set(roverWorldX, FPV_HEIGHT, roverWorldZ);
		camera.position.lerp(reusableTarget, alpha);
		reusableLookAt.set(
			camera.position.x + forwardX,
			camera.position.y,
			camera.position.z + forwardZ
		);
		camera.lookAt(reusableLookAt);
	});

	if (mode !== "orbit") {
		return null;
	}

	return <OrbitControls enableDamping makeDefault target={orbitTarget} />;
}
