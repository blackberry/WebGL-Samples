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
attribute vec2 aVertexCoords;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec2 vCoords;

void main(void) {
	/* The position of this vertex is based on the Projection Matrix and Model-View Matrix. */
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vCoords = aVertexCoords;
}