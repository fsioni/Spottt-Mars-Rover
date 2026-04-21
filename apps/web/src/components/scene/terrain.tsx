import { Text } from "@react-three/drei";
import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

const FAR_GROUND_COLOR = "#7f3a20";
const GROUND_COLOR = "#a84a2b";
const CELL_COLOR = "#3a2718";
const ORIGIN_HIGHLIGHT_COLOR = "#ff9800";
const NORTH_COLOR = "#e53935";
const EAST_COLOR = "#43a047";
const SOUTH_COLOR = "#fb8c00";
const WEST_COLOR = "#1e88e5";

const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const BACKDROP_SIZE = 300;

interface TerrainProps {
	height: number;
	width: number;
}

export function Terrain({ height, width }: TerrainProps) {
	return (
		<group>
			<Backdrop />
			<Ground height={height} width={width} />
			<GridLayer height={height} width={width} />
			<OriginHighlight />
			<CardinalLabels height={height} width={width} />
			<OriginAxes />
		</group>
	);
}

function Backdrop() {
	return (
		<mesh position={[0, -0.03, 0]} rotation={FLAT_ROTATION}>
			<planeGeometry args={[BACKDROP_SIZE, BACKDROP_SIZE]} />
			<meshStandardMaterial color={FAR_GROUND_COLOR} roughness={1} />
		</mesh>
	);
}

function Ground({ height, width }: TerrainProps) {
	return (
		<mesh position={[width / 2, -0.01, -height / 2]} rotation={FLAT_ROTATION}>
			<planeGeometry args={[width, height]} />
			<meshStandardMaterial color={GROUND_COLOR} roughness={1} />
		</mesh>
	);
}

function GridLayer({ height, width }: TerrainProps) {
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

function CardinalLabels({ height, width }: TerrainProps) {
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
