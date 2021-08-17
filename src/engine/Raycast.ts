import { DrawLine, LineColor } from "./debug/Lines";
import { utils } from "../utils/utils";
import {
	cameraMatrix,
	GetSceneRenderNodes,
	gl,
	projectionMatrix,
} from "./Core";
import { Camera } from "../Camera";
import { RenderNode, State } from "./SceneGraph";
import * as Engine from "./Core";
import { ToMapCoords } from "../Map";

interface Ray {
	origin: number[];
	dir: number[];
	invDir: number[];
	sign: number[];
}
interface HitNode {
	node: RenderNode<State>;
	position: number[];
}

export function Hit(x: number, y: number, camera: Camera) {
	let ray = GetRay(x, y, camera);

	let planePoint = IntersectPlane(ray);

	let hitNodes: HitNode[] = GetSceneRenderNodes()
		.map((node) => {
			// DEBUG: Draw bounding boxes
			// let b = node.bounds;
			// let minNx = b[0].slice();
			// minNx[0] += 1;
			// let minNy = b[0].slice();
			// minNy[1] += 1;
			// let minNz = b[0].slice();
			// minNz[2] += 1;
			// let maxNx = b[1].slice();
			// maxNx[0] -= 1;
			// let maxNy = b[1].slice();
			// maxNy[1] -= 1;
			// let maxNz = b[1].slice();
			// maxNz[2] -= 1;
			// DrawLine(b[0], minNx, LineColor.RED);
			// DrawLine(b[0], minNy, LineColor.RED);
			// DrawLine(b[0], minNz, LineColor.RED);
			// DrawLine(b[1], maxNx, LineColor.RED);
			// DrawLine(b[1], maxNy, LineColor.RED);
			// DrawLine(b[1], maxNz, LineColor.RED);

			let hit = IntersectNode(node, ray);

			return hit ? ({ node: node, position: hit } as HitNode) : null;
		})
		.filter((t) => t)
		.sort(
			(a: HitNode, b: HitNode) =>
				utils.Distance(a.position, ray.origin) -
				utils.Distance(b.position, ray.origin)
		);

	return hitNodes.length > 0
		? hitNodes[0]
		: ({ node: null, position: planePoint } as HitNode);
}

function GetRay(x: number, y: number, camera: Camera) {
	const normX = (2 * x) / gl.canvas.width - 1;
	const normY = 1 - (2 * y) / gl.canvas.height;

	//We need to go through the transformation pipeline in the inverse order so we invert the matrices
	const invProj = utils.invertMatrix(projectionMatrix);
	const invView = cameraMatrix;

	//Find the point (un)projected on the near plane, from clip space coords to eye coords
	//z = -1 makes it so the point is on the near plane
	//w = 1 is for the homogeneous coordinates in clip space
	const pointEyeCoords = utils.multiplyMatrixVector(invProj, [
		normX,
		normY,
		-1,
		1,
	]);

	//This finds the direction of the ray in eye space
	//Formally, to calculate the direction you would do dir = point - eyePos but since we are in eye space eyePos = [0,0,0]
	//w = 0 is because this is not a point anymore but is considered as a direction
	var rayEyeCoords = [
		pointEyeCoords[0],
		pointEyeCoords[1],
		pointEyeCoords[2],
		0,
	];

	//We find the direction expressed in world coordinates by multipling with the inverse of the view matrix
	const rayDir = utils.normalize(
		utils.multiplyMatrixVector(invView, rayEyeCoords)
	);

	var rayStartPoint = Engine.GetCameraPosition();

	const invDir = [1 / rayDir[0], 1 / rayDir[1], 1 / rayDir[2]];
	const sign = [
		invDir[0] < 0 ? 1 : 0,
		invDir[1] < 0 ? 1 : 0,
		invDir[2] < 0 ? 1 : 0,
	];

	const ray: Ray = {
		origin: rayStartPoint,
		dir: rayDir,
		invDir: invDir,
		sign: sign,
	};

	// DEBUG: Draw the ray we're casting
	// DrawLine(
	// 	rayStartPoint,
	// 	utils.addVectors(
	// 		rayStartPoint,
	// 		utils.multiplyVectorScalar(rayDir, 100)
	// 	),
	// 	LineColor.PURPLE
	// );

	return ray;
}

// For in-depth explaination, refer to https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection
function IntersectNode(node: RenderNode<State>, ray: Ray) {
	let tmin, tmax, tymin, tymax, tzmin, tzmax;

	tmin = (node.bounds[ray.sign[0]][0] - ray.origin[0]) * ray.invDir[0];
	tmax = (node.bounds[1 - ray.sign[0]][0] - ray.origin[0]) * ray.invDir[0];

	tymin = (node.bounds[ray.sign[1]][1] - ray.origin[1]) * ray.invDir[1];
	tymax = (node.bounds[1 - ray.sign[1]][1] - ray.origin[1]) * ray.invDir[1];

	if (tmin > tymax || tymin > tmax) return null;
	if (tymin > tmin) tmin = tymin;
	if (tymax < tmax) tmax = tymax;

	tzmin = (node.bounds[ray.sign[2]][2] - ray.origin[2]) * ray.invDir[2];
	tzmax = (node.bounds[1 - ray.sign[2]][2] - ray.origin[2]) * ray.invDir[2];

	if (tmin > tzmax || tzmin > tmax) return null;
	if (tzmin > tmin) tmin = tzmin;
	if (tzmax < tmax) tmax = tzmax;

	let minPoint = utils.addVectors(
		ray.origin,
		utils.multiplyVectorScalar(ray.dir, tmin)
	);
	// What's for?
	// let maxPoint = utils.addVectors(
	// 	ray.origin,
	// 	utils.multiplyVectorScalar(ray.dir, tmax)
	// );
	// return { min: minPoint, max: maxPoint };

	return minPoint;
}

// Base Plane is defined by a normal vector in the origin
const basePlaneNorm = [0, 1, 0];

// Ray: P = P0 + tV where t is the distance between
// the ray.origin and the intersected point

function IntersectPlane(ray: Ray) {
	let t =
		-utils.dot(ray.origin, basePlaneNorm) /
		utils.dot(ray.dir, basePlaneNorm);
	return utils.addVectors(ray.origin, utils.multiplyVectorScalar(ray.dir, t));
}
