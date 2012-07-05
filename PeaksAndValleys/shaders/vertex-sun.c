/*
* Copyright (c) 2012 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

attribute vec3 aVertexPosition;	// The vertex position that is passed in.
attribute vec4 aVertexColor;	// The vertex colour that is passed in.

uniform mat4 uMVMatrix;			// The model-view matrix.
uniform mat4 uPMatrix;			// The projection matrix.

varying vec4 vColor;			// A variable to hold the texture coordinates; to be passsed to the fragment shader.

void main(void) {
	/* Combine our matrices to generate a position in screen-space. */
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

	/* Store our colour variable for use by our fragment shader. */
	vColor = aVertexColor;
}