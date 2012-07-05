/*global window, document, console, Float32Array, Uint16Array, vec3 */

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

/**
 * This function is intended to simplify the generation of a skybox. Here, we use a:
 * - Vertex buffer.
 * - Index buffer.
 * - Texture buffer.
 */

function GLSkybox(gl) {
	"use strict";
	var vertices = [],
		uvCoords = [],
		indices = [];
	try {
		/* Vertices will always be the same. Coordinates range from -1.0 to 1.0 and create a cube. */
		vertices = [
			-1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0,  1.0, -1.0,   -1.0,  1.0, -1.0, /* Front */
		     1.0, -1.0,  1.0,  -1.0, -1.0,  1.0,  -1.0,  1.0,  1.0,    1.0,  1.0,  1.0, /* Back */
			-1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0,  1.0,  1.0,   -1.0,  1.0,  1.0, /* Top */
			-1.0, -1.0,  1.0,   1.0, -1.0,  1.0,   1.0, -1.0, -1.0,   -1.0, -1.0, -1.0, /* Bottom */
			-1.0, -1.0,  1.0,  -1.0, -1.0, -1.0,  -1.0,  1.0, -1.0,   -1.0,  1.0,  1.0, /* Left */
			 1.0, -1.0, -1.0,   1.0, -1.0,  1.0,   1.0,  1.0,  1.0,    1.0,  1.0, -1.0  /* Right */
		];
		/* Indices will always be the same to account for a TRIANGLE_LIST. */
		indices = [
			0, 1, 2, 0, 2, 3, /* Front */
			4, 5, 6, 4, 6, 7, /* Back */
			8, 9, 10, 8, 10, 11, /* Top */
			12, 13, 14, 12, 14, 15, /* Bottom */
			16, 17, 18, 16, 18, 19, /* Left */
			20, 21, 22, 20, 22, 23  /* Right */
		];
		
		/**
		 * Texture coordinates depend on the layout of the texture sections within the image. The defined
		 * layout expects a texture along the lines of:
		 *
		 * EM TO EM EM
		 * LE FR RI BA
		 * EM BO EM EM
		 * EM EM EM EM
		 *
		 * Where: BO = Bottom, TO = Top, EM = Empty, LE = Left, FR = Front, RI = Right, and BA = Back
		 * - These refer to the faces of the cube that we generate. A more common (but larger image) layout is:
		 */
		uvCoords = [
			0.25, 0.50,   0.50, 0.50,   0.50, 0.75,   0.25, 0.75, /* Front */
			0.75, 0.50,   1.00, 0.50,   1.00, 0.75,   0.75, 0.75, /* Back */
			0.25, 0.75,   0.50, 0.75,   0.50, 1.00,   0.25, 1.00, /* Top */
			0.25, 0.25,   0.50, 0.25,   0.50, 0.50,   0.25, 0.50, /* Bottom */
			0.00, 0.50,   0.25, 0.50,   0.25, 0.75,   0.00, 0.75, /* Left */
			0.50, 0.50,   0.75, 0.50,   0.75, 0.75,   0.50, 0.75  /* Right */
		];

		/* Bind the vertex buffer. */
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 24;

		/* Bind the index buffer. */
		this.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.iBuffer.itemSize = 1;
		this.iBuffer.numItems = 36;

		/* Bind the texture buffer. */
		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 24;

		/* Set default position at origin. */
		this.position = vec3.create([0.0, 0.0, 0.0]);
		this.rotation = vec3.create([0.0, 0.0, 0.0]);
	} catch (err) {
		console.log("GLSkybox: " + err);
	}
}