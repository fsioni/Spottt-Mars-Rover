import { Html } from "@react-three/drei";
import {
	formatRoverState,
	type Orientation,
	type Position,
} from "@spottt/core/types";

const Y_OFFSET = 1.4;

const LABEL_COLOR = "#f5f5f5";
const LABEL_COLOR_LOST = "#ff3b30";
const LABEL_BG = "rgba(20, 20, 20, 0.78)";
const LABEL_BG_LOST = "rgba(60, 10, 10, 0.85)";

interface RoverLabelProps {
	lost?: boolean;
	orientation: Orientation;
	position: Position;
}

export function RoverLabel({
	lost = false,
	orientation,
	position,
}: RoverLabelProps) {
	const text = formatRoverState(position, orientation, lost);

	return (
		<Html
			center
			position={[position.x + 0.5, Y_OFFSET, -position.y - 0.5]}
			sprite
			style={{ pointerEvents: "none" }}
			zIndexRange={[100, 0]}
		>
			<div
				style={{
					backgroundColor: lost ? LABEL_BG_LOST : LABEL_BG,
					border: `1px solid ${lost ? LABEL_COLOR_LOST : "rgba(255,255,255,0.2)"}`,
					borderRadius: "4px",
					color: lost ? LABEL_COLOR_LOST : LABEL_COLOR,
					fontFamily:
						"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
					fontSize: "12px",
					fontWeight: lost ? 700 : 500,
					letterSpacing: "0.02em",
					padding: "2px 6px",
					userSelect: "none",
					whiteSpace: "nowrap",
				}}
			>
				{text}
			</div>
		</Html>
	);
}
