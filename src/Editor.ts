import { HitNode } from "./engine/Raycast";
import * as Map from "./Map";
import { utils } from "./utils/utils";

type EditMode = "MOVE" | "ADD" | "REMOVE";

let activeBlock: Map.CellType = Map.CellType.Empty;

export let editMode: EditMode = "MOVE";

export function SetActiveBlock(type: Map.CellType) {
	activeBlock = type;
}

export function GetActiveBlock() {
	return activeBlock;
}

export function SetEditMode(mode: EditMode) {
	editMode = mode;
}

export function DoActionOnSelectedBlock(hit: HitNode) {
	if (hit.node) {
		if (editMode === "REMOVE") {
			let mapPos = Map.ToMapCoords(
				utils.addVectors(
					hit.node.GetWorldCoordinates(),
					[-0.5, 0.0, -0.5]
				)
			);
			if (!hit.node.name.startsWith("cpt-toad")) hit.node.Remove();
			Map.SetCell(mapPos, Map.CellType.Empty);
		}
		if (editMode === "ADD") {
			// Move the point away from the current node to make sure
			// that any rounding does not make it fall within its bounds.
			let newNodePosition = utils.addVectors(
				hit.position,
				utils.multiplyVectorScalar(hit.ray.dir, -0.15)
			);
			let pos = Map.ToMapCoords(newNodePosition);
			let cell = Map.GetCell(pos);
			if (cell && cell.type === Map.CellType.Empty) {
				Map.SetCell(pos, activeBlock);
			}
		}
	} else {
		let mapPos = Map.ToMapCoords(hit.position);
		if (editMode === "ADD") {
			let cell = Map.GetCell(mapPos);
			if (cell && cell.type === Map.CellType.Empty) {
				Map.SetCell(mapPos, activeBlock);
			}
		}
	}
}

export var selectedBlockCoord = [0, 0, 0];

export function MoveSelectionForward() {
	selectedBlockCoord[2] += 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
export function MoveSelectionBackward() {
	selectedBlockCoord[2] -= 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
export function MoveSelectionLeft() {
	selectedBlockCoord[0] -= 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
export function MoveSelectionRight() {
	selectedBlockCoord[0] += 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
export function MoveSelectionUp() {
	selectedBlockCoord[1] += 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
export function MoveSelectionDown() {
	selectedBlockCoord[1] -= 1;
	selectedBlockCoord = Map.ClampMapCoordinates(selectedBlockCoord);
}
