/*global window, document, console, XMLHttpRequest */

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
 * This variable was used to create helper functions that didn't have any other home.
 */
var Utils = {
	/**
	 * Converts degrees to radians.
	 */
	degToRad: function (degrees) {
		"use strict";
		return (degrees % 360) * Math.PI / 180;
	},

	/**
	 * This function retrieves the fragment and vertex shaders that we place in our .c files and returns
	 * something usable. This avoids a lot of clutter in our index.html file, where traditionally
	 * the approach has been to insert <script> elements that hold our shaders. Many thanks to
	 * Andrea Giammarch writing about this approach:
	 * http://webreflection.blogspot.ca/2010/09/fragment-and-vertex-shaders-my-way-to.html
	 */
	getShader: function (gl, shader, shaderType) {
		"use strict";
		var xhr = null;
		try {
			xhr = new XMLHttpRequest();
			xhr.open("GET", shader, false);
			xhr.send();

			shader = gl.createShader(shaderType);
			gl.shaderSource(shader, xhr.responseText);
			gl.compileShader(shader);
		} catch (err) {
			console.log("utils.getShader: " + err);
		}
		return shader;
	}
};