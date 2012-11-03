/*
- Copyright (c) 2012 Research In Motion Limited.
-
- Licensed under the Apache License, Version 2.0 (the "License");
- you may not use this file except in compliance with the License.
- You may obtain a copy of the License at
-
- http://www.apache.org/licenses/LICENSE-2.0
-
- Unless required by applicable law or agreed to in writing, software
- distributed under the License is distributed on an "AS IS" BASIS,
- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
- See the License for the specific language governing permissions and
- limitations under the License.
*/

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec3 vPosition;
varying vec3 vWeighting;

void main(void) {
	/* The position of this vertex is based on the Projection Matrix and Model-View Matrix. */
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vPosition = aVertexPosition;

	/* Calculate the light weighting. We do this by:
	 * - Taking the DOT PRODUCT of the vertex normal and the light direction (0, -1, 1)
	 * - At the very least, we will use a value of 0.0
	 * - Setting an ambient (minimum) light (0.2, 0.2, 0.2), and adding the remaining light (0.6, 0.6, 0.6) multiplied by the weighting calculated.
	 * The maximum brightness in this case is (0.8, 0.8, 0.8) to prevent colours from becoming too bright.
	 */
	float weighting = max(dot(aVertexNormal, vec3(0.0, -1.0, 1.0)), 0.0);
	vWeighting = vec3(0.2, 0.2, 0.2) + vec3(0.6, 0.6, 0.6) * weighting;
}