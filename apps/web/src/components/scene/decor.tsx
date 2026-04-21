import { useMemo } from "react";
import { Color } from "three";

const ROCK_BASE_COLOR = "#7a3218";
const DUNE_COLOR = "#8a3e22";

const ROCK_COUNT = 90;
const ROCK_CANDIDATE_MULTIPLIER = 3;
const DUNE_COUNT = 14;
const DUNE_CANDIDATE_MULTIPLIER = 4;

type RockShape = "dodeca" | "icosa" | "octa";
const ROCK_SHAPES: readonly RockShape[] = ["dodeca", "icosa", "octa"];

interface DecorProps {
	gridHeight: number;
	gridWidth: number;
}

export function Decor({ gridHeight, gridWidth }: DecorProps) {
	return (
		<>
			<Rocks gridHeight={gridHeight} gridWidth={gridWidth} />
			<Dunes gridHeight={gridHeight} gridWidth={gridWidth} />
		</>
	);
}

interface RockInstance {
	id: number;
	rotX: number;
	rotY: number;
	rotZ: number;
	shape: RockShape;
	size: number;
	tint: Color;
	x: number;
	z: number;
}

function Rocks({ gridHeight, gridWidth }: DecorProps) {
	const rocks = useMemo<RockInstance[]>(() => {
		const cx = gridWidth / 2;
		const cz = -gridHeight / 2;
		const base = new Color(ROCK_BASE_COLOR);
		const items: RockInstance[] = [];
		const maxCandidates = ROCK_COUNT * ROCK_CANDIDATE_MULTIPLIER;
		for (let i = 0; i < maxCandidates && items.length < ROCK_COUNT; i++) {
			const angle = hash(i, 1.27) * Math.PI * 2;
			const radius = 9 + hash(i, 3.71) * 32;
			const x = cx + Math.cos(angle) * radius;
			const z = cz + Math.sin(angle) * radius;
			if (isOnGrid(x, z, gridWidth, gridHeight, 0.8)) {
				continue;
			}
			const colorFactor = 0.75 + hash(i, 13.47) * 0.4;
			items.push({
				id: i,
				rotX: hash(i, 7.93) * Math.PI * 2,
				rotY: hash(i, 11.19) * Math.PI * 2,
				rotZ: hash(i, 19.31) * Math.PI * 2,
				shape: ROCK_SHAPES[Math.floor(hash(i, 17.83) * ROCK_SHAPES.length)],
				size: 0.25 + hash(i, 5.13) * 1.3,
				tint: base.clone().multiplyScalar(colorFactor),
				x,
				z,
			});
		}
		return items;
	}, [gridWidth, gridHeight]);

	return (
		<>
			{rocks.map((rock) => (
				<mesh
					key={`rock-${rock.id}`}
					position={[rock.x, rock.size * 0.35, rock.z]}
					rotation={[rock.rotX, rock.rotY, rock.rotZ]}
				>
					{rock.shape === "dodeca" && (
						<dodecahedronGeometry args={[rock.size]} />
					)}
					{rock.shape === "icosa" && <icosahedronGeometry args={[rock.size]} />}
					{rock.shape === "octa" && <octahedronGeometry args={[rock.size]} />}
					<meshStandardMaterial
						color={rock.tint}
						flatShading
						roughness={0.95}
					/>
				</mesh>
			))}
		</>
	);
}

interface DuneInstance {
	id: number;
	rotY: number;
	scaleX: number;
	scaleY: number;
	scaleZ: number;
	x: number;
	z: number;
}

function Dunes({ gridHeight, gridWidth }: DecorProps) {
	const dunes = useMemo<DuneInstance[]>(() => {
		const cx = gridWidth / 2;
		const cz = -gridHeight / 2;
		const items: DuneInstance[] = [];
		const maxCandidates = DUNE_COUNT * DUNE_CANDIDATE_MULTIPLIER;
		for (let i = 0; i < maxCandidates && items.length < DUNE_COUNT; i++) {
			const angle = hash(i, 2.31) * Math.PI * 2;
			const radius = 30 + hash(i, 4.77) * 25;
			const x = cx + Math.cos(angle) * radius;
			const z = cz + Math.sin(angle) * radius;
			if (isOnGrid(x, z, gridWidth, gridHeight, 2)) {
				continue;
			}
			items.push({
				id: i,
				rotY: hash(i, 6.19) * Math.PI * 2,
				scaleX: 6 + hash(i, 8.41) * 10,
				scaleY: 0.6 + hash(i, 10.07) * 1.4,
				scaleZ: 4 + hash(i, 12.53) * 8,
				x,
				z,
			});
		}
		return items;
	}, [gridWidth, gridHeight]);

	return (
		<>
			{dunes.map((dune) => (
				<mesh
					key={`dune-${dune.id}`}
					position={[dune.x, -0.2, dune.z]}
					rotation={[0, dune.rotY, 0]}
					scale={[dune.scaleX, dune.scaleY, dune.scaleZ]}
				>
					<sphereGeometry args={[1, 12, 8]} />
					<meshStandardMaterial color={DUNE_COLOR} flatShading roughness={1} />
				</mesh>
			))}
		</>
	);
}

function hash(seed: number, multiplier: number): number {
	const s = Math.sin(seed * multiplier + multiplier) * 10_000;
	return s - Math.floor(s);
}

function isOnGrid(
	x: number,
	z: number,
	gridWidth: number,
	gridHeight: number,
	margin: number
): boolean {
	return (
		x >= -margin &&
		x <= gridWidth + margin &&
		z >= -gridHeight - margin &&
		z <= margin
	);
}
