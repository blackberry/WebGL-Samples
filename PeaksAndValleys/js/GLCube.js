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
 * This function is intended to simplify the generation of cubes. Here, we use a:
 * - Vertex buffer.
 * - Index buffer.
 * - Colour buffer.
 */

function GLCube(gl, width, height, depth) {
	"use strict";
	var w = width / 2.0,
		h = height / 2.0,
		d = depth / 2.0,
		vertices = null,
		colors = null,
		indices = null;
	try {
		/* Generate vertices around the point (0, 0, 0) based on the dimensions. */
		vertices = [
			-w, -h, -d,   w, -h, -d,   w,  h, -d,   -w,  h, -d, /* Front */
		     w, -h,  d,  -w, -h,  d,  -w,  h,  d,    w,  h,  d, /* Back */
			-w,  h, -d,   w,  h, -d,   w,  h,  d,   -w,  h,  d, /* Top */
			-w, -h,  d,   w, -h,  d,   w, -h, -d,   -w, -h, -d, /* Bottom */
			-w, -h,  d,  -w, -h, -d,  -w,  h, -d,   -w,  h,  d, /* Left */
			 w, -h, -d,   w, -h,  d,   w,  h,  d,    w,  h, -d  /* Right */
		];
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 24;

		/* Generate an index buffer for the cube. This will be the same regardless of the cube. */
		indices = [
			0, 1, 2, 0, 2, 3, /* Front */
			4, 5, 6, 4, 6, 7, /* Back */
			8, 9, 10, 8, 10, 11, /* Top */
			12, 13, 14, 12, 14, 15, /* Bottom */
			16, 17, 18, 16, 18, 19, /* Left */
			20, 21, 22, 20, 22, 23  /* Right */
		];
		this.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.iBuffer.itemSize = 1;
		this.iBuffer.numItems = 36;

		/**
		 * How do we want to colour the cube?
		 *
		 * In this case, GLCube is pretty much GLSun. It is specifically coded to be a yellow cube. The colour
		 * scheme could be modified to make this a more generic implementation.
		 */
		colors = [
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0, /* Front */
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0, /* Back */
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0, /* Top */
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0, /* Bottom */
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0, /* Left */
			0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0,    0.8, 1.0, 0.1, 1.0  /* Right */
		];
		this.cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		this.cBuffer.itemSize = 4;
		this.cBuffer.numItems = 24;

		/* Default position is at the origin. */
		this.position = vec3.create([0.0, 0.0, 0.0]);
		this.rotation = vec3.create([0.0, 0.0, 0.0]);
	} catch (err) {
		console.log("GLCube: " + err);
	}
}