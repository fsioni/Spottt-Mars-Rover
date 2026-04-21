import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Scenario } from "@spottt/core/types";

import { Rover } from "./rover";

interface SceneProps {
	scenario: Scenario;
}

export function Scene({ scenario }: SceneProps) {
	const { grid, rover } = scenario;
	const width = grid.maxX + 1;
	const height = grid.maxY + 1;
	const centerX = grid.maxX / 2;
	const centerZ = -grid.maxY / 2;

	return (
		<Canvas camera={{ position: [centerX, 8, -centerZ + 8], fov: 50 }}>
			<ambientLight intensity={0.6} />
			<directionalLight intensity={0.8} position={[10, 10, 5]} />
			<Grid
				args={[width, height]}
				cellColor="#555"
				cellSize={1}
				cellThickness={1}
				fadeDistance={50}
				fadeStrength={1}
				position={[centerX, 0, centerZ]}
				sectionColor="#888"
				sectionSize={width}
			/>
			<Rover orientation={rover.orientation} position={rover.position} />
			<OrbitControls target={[centerX, 0, centerZ]} />
		</Canvas>
	);
}
