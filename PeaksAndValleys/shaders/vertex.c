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

attribute vec3 aVertexPosition;		// The vertex position that is passed in.
attribute vec3 aVertexNormal;		// The vertex normal that is passed in.
attribute vec2 aTextureCoord;		// The vertex texture coordinates that are passed in.

uniform mat4 uMVMatrix;				// The model-view matrix.
uniform mat4 uPMatrix;				// The projection matrix.
uniform mat3 uNMatrix;				// The normal matrix.

uniform vec3 uAmbientColor;			// Our ambient colour.

uniform vec3 uLightingDirection;	// The lighting direction.
uniform vec3 uDirectionalColor;		// The colour of our directional lighting.

varying vec3 vPosition;				// A variable to hold the vertex position; to be passed to the fragment shader.
varying vec3 vLightWeighting;		// A variable to hold the light weighting; to be passed to the fragment shader.
varying vec2 vTextureCoord;			// A variable to hold the texture coordinates; to be passed to the fragment shader.

void main(void) {
	/* Combine our matrices to generate a position in screen-space. */
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

	/* Store our position and texture variables for use by our frament shader. */
	vPosition = aVertexPosition;
	vTextureCoord = aTextureCoord;

	/* Calculate and store the vertex light weighting based on the lighting direction and normals. */
	vec3 transformedNormal = uNMatrix * aVertexNormal;
	float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
	vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
}