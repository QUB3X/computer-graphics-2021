#version 300 es

in vec3 a_Position;
in vec3 a_Normal;
in vec2 a_UVCoord;

out vec2 uvCoord;
out vec3 fsNormal;
out vec3 fsPosition;

uniform mat4 matrix;
uniform mat4 nMatrix;     //matrix to transform normals
uniform mat4 pMatrix;     //matrix to compute the position in world space

void main() {
	fsNormal = mat3(nMatrix) * a_Normal;
	fsPosition = (pMatrix * vec4(a_Position, 1.0)).xyz;
	uvCoord = a_UVCoord;
	gl_Position = matrix * vec4(a_Position, 1.0);
}
