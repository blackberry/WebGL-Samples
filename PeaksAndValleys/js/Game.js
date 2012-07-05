/*global window, document, console, clearTimeout, mat4, mat3, vec3, Float32Array, Uint8Array, Utils, GLCamera, GLSkybox, GLTerrain, GLCube, Image, VirtualJoystick, dat */

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
 * A lot of WebGL functionality in this file has been based on the lessons available at:
 * http://www.learningwebgl.com
 *
 * It is a great step-by-step resource for a number of WebGL concepts and implementations.
 * If you are unfamiliar with WebGL, I would highly recommend those lessons as your primary
 * introduction to WebGL. Once you complete a handful of those tutorials, much of the code
 * below will be more familiar.
 */

/**
 * The following polyfill is based on Erik Möller's implementation discussed here:
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating
 * 
 * This polyfill allows us to use one call to window.requestAnimationFrame without having to
 * check for specific browser support each time.
 */
(function () {
    "use strict";

	var lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'],
		x = 0;

    for (x = 0; x < vendors.length && !window.requestAnimationFrame; x = x + 1) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime(),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
	}

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
	}
}());


/**
 * Our main Game function. This function is essentially the "entry point" into our WebGL application.
 */
function Game() {
	"use strict";

	/*Private variables. */

	var gl				= null,		// Provides primary functionality for WebGL calls.
		pMatrix			= null,		// Projection matrix that holds our "lens" configuration.
		vMatrix			= null,		// View matrix that holds our "camera" transformations.
		mMatrix			= null,		// Model matrix that holds our "object" tranformations.
		mvMatrix		= null,		// Model-View matrix that combines the model and view matrices into consolidated transformations.
		vMatrixStack	= [],		// Used to prevent the transformations on one object from affecting the entire world.
		camera			= [],		// Holds information about our camera (position, rotation, and additional parameters defined.)
		shaders			= [],		// An array of the shaders we will be using.
		shaderProgram	= null,		// Will be set to the shader we currently need for specific operations.
		geometry		= [],		// An array of models/geometries to be rendered on screen.
		textures		= [],		// An array of textures that we will define to be applied to various models.
		joystick		= null;		// The virtual joysticks that will be displayed when the user touches the screen.

	/* Private functions. */

	/**
	 * This function goes through the process of creating our main WebGL object and initializing our display.
	 * The primary departure here from the Learning WebGL tutorials is that we are creating two separate
	 * model and view matrices. We combine these when necessary, but keep track of them individually. This
	 * is required to ensure that view transformations (i.e. where our camera is looking) do not affect the
	 * lighting on our models.
	 */
	function initWebGL() {
		var canvas = null;
		try {
			/* Main WebGL object. */
			canvas = document.querySelector("#glCanvas");
			gl = canvas.getContext("experimental-webgl");
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST);

			/* Projection matrix defining our perspective. */
			pMatrix = mat4.create();
			mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 8000.0, pMatrix);

			/* Model-view related matrices. */
			vMatrix = mat4.create();
			mMatrix = mat4.create();
			mvMatrix = mat4.create();

			/* Camera. */
			camera.position = vec3.create([0.0, -6000.0, 0.0]);
			camera.position.fixed = false;
			camera.rotation = vec3.create([0.0, 0.0, 0.0]);
			camera.rotation.fixed = false;
			camera.freeFloat = false;
		} catch (err) {
			console.log("initWebGL: " + err);
		}
	}

	/**
	 * This function instantiates the models/geometries we will be using. The majority of work for each model is done
	 * with the respective constructor functions.
	 *
	 * Note that the camera position is inverted. The reason for this is discussed in detail in the Learning WebGL lessons,
	 * but in short:
	 * 
	 * Our "camera" doesn't actually move. It is always at (0, 0, 0), It is the "world" that we move. So, if we want the camera to
	 * be 10 units above the ground, we must move the ground 10 units down.
	 */
	function initGeometry() {
		var y = 0.0;
		try {
			/* The skybox. */
			geometry.skybox = new GLSkybox(gl);

			/* The terrain. */
			geometry.terrain = new GLTerrain(gl, 5000.0, 5000.0, 150, 150);

			/* Update camera and skybox positions. */
			y = geometry.terrain.getY(camera.position[0], camera.position[2]);
			camera.position[1] = -y - 15.0;
			geometry.skybox.position[1] = -camera.position[1];

			/* The sun. */
			geometry.sun = new GLCube(gl, 100.0, 100.0, 100.0);
		} catch (err) {
			console.log("initBuffers: " + err);
		}
	}

	/**
	 * This function defines the various shaders we will be using. We have a different shader for each of the following:
	 * - Terrain: Uses textures for colouring, and vertex normals to help calculate light weightings.
	 * - Skybox:  Uses textures for colouring.
	 * - Sun:     Uses direct colours for its vertices.
	 *
	 * Many WebGL samples will store the fragment and vertex shaders in the main HTML page as <script> elements.
	 * This can become messy with many shaders, and also isn't very representative of what those shaders contain.
	 * Instead, we will create separate .c files for our shaders and use an XMLHttpRequest object to load those
	 * shaders as we need them. Full credit for this approach goes to Andrea Giammarch:
	 * http://webreflection.blogspot.ca/2010/09/fragment-and-vertex-shaders-my-way-to.html
	 *
	 * TODO: Refactor the code so that each geometry/model object takes care of its own shaders. In this case,
	 *       there is no need to have these separated. However if shaders were being reused across geometries, it would then
	 *       be more efficient to avoid duplication with the current approach. Tradeoffs to each approach.
	 */
	function initShaders() {
		var fragmentShader = null,
			vertexShader = null;
		try {
			/* Our terrain shader. */
			fragmentShader = Utils.getShader(gl, "./shaders/fragment.c", gl.FRAGMENT_SHADER);
			vertexShader = Utils.getShader(gl, "./shaders/vertex.c", gl.VERTEX_SHADER);

			/* Attach our terrain-specific shaders that we just retrieved. */
			shaders[0] = gl.createProgram();
			gl.attachShader(shaders[0], fragmentShader);
			gl.attachShader(shaders[0], vertexShader);
			gl.linkProgram(shaders[0]);
			gl.useProgram(shaders[0]);

			/* We want to store the position for each vertex. */
			shaders[0].vertexPositionAttribute = gl.getAttribLocation(shaders[0], "aVertexPosition");
			gl.enableVertexAttribArray(shaders[0].vertexPositionAttribute);

			/* We want to store the normal for each vertex. */
			shaders[0].vertexNormalAttribute = gl.getAttribLocation(shaders[0], "aVertexNormal");
			gl.enableVertexAttribArray(shaders[0].vertexNormalAttribute);

			/* We want to store the texture coordinates for each vertex. */
			shaders[0].textureCoordAttribute = gl.getAttribLocation(shaders[0], "aTextureCoord");
			gl.enableVertexAttribArray(shaders[0].textureCoordAttribute);

			/* Here we define the shader properties that we can set in JavaScript, which will be passed directly to our fragment and vertex shaders. */
			shaders[0].pMatrixUniform = gl.getUniformLocation(shaders[0], "uPMatrix");						// Projection matrix.
			shaders[0].mvMatrixUniform = gl.getUniformLocation(shaders[0], "uMVMatrix");					// Model-view matrix.
			shaders[0].nMatrixUniform = gl.getUniformLocation(shaders[0], "uNMatrix");						// Normal matrix.
			shaders[0].texture0 = gl.getUniformLocation(shaders[0], "texture0");							// texture0 = Sand.
			shaders[0].texture1 = gl.getUniformLocation(shaders[0], "texture1");							// texture1 = Grass.
			shaders[0].texture2 = gl.getUniformLocation(shaders[0], "texture2");							// texture2 = Rock.
			shaders[0].texture3 = gl.getUniformLocation(shaders[0], "texture3");							// texture3 = Snow.
			shaders[0].ambientColorUniform = gl.getUniformLocation(shaders[0], "uAmbientColor");			// Our ambient lighting colour (i.e. base lighting.)
			shaders[0].lightingDirectionUniform = gl.getUniformLocation(shaders[0], "uLightingDirection");	// The direction of the light coming from the sun.
			shaders[0].directionalColorUniform = gl.getUniformLocation(shaders[0], "uDirectionalColor");	// The colour of the light coming from the sun.

			/* This defines the function that combines our matrices prior to rendering. */
			shaders[0].setMatrixUniforms = function () {
				var normalMatrix = null;
				try {
					/* Create our model-view matrix. */
					mat4.multiply(vMatrix, mMatrix, mvMatrix);

					/* Set our projection and model-view matrices; to be accessed by the shaders. */
					gl.uniformMatrix4fv(shaders[0].pMatrixUniform, false, pMatrix);
					gl.uniformMatrix4fv(shaders[0].mvMatrixUniform, false, mvMatrix);

					/* Populate the normal matrix. */
					normalMatrix = mat3.create();
					mat4.toInverseMat3(mMatrix, normalMatrix);
					mat3.transpose(normalMatrix);

					/* Set our normal matrix; to be accessed by teh shaders. */
					gl.uniformMatrix3fv(shaders[0].nMatrixUniform, false, normalMatrix);
				} catch (err) {
					console.log("setMatrixUniforms[0]: " + err);
				}
			};

			/* Our skybox shader. */
			fragmentShader = Utils.getShader(gl, "./shaders/fragment-skybox.c", gl.FRAGMENT_SHADER);
			vertexShader = Utils.getShader(gl, "./shaders/vertex-skybox.c", gl.VERTEX_SHADER);

			/* Attach our skybox-specific shaders that we just retrieved. */
			shaders[1] = gl.createProgram();
			gl.attachShader(shaders[1], vertexShader);
			gl.attachShader(shaders[1], fragmentShader);
			gl.linkProgram(shaders[1]);
			gl.useProgram(shaders[1]);

			/* We want to store the position for each vertex. */
			shaders[1].vertexPositionAttribute = gl.getAttribLocation(shaders[1], "aVertexPosition");
			gl.enableVertexAttribArray(shaders[1].vertexPositionAttribute);

			/* We want to store the texture coordinates for each vertex. */
			shaders[1].textureCoordAttribute = gl.getAttribLocation(shaders[1], "aTextureCoord");
			gl.enableVertexAttribArray(shaders[1].textureCoordAttribute);

			/* Here we define the shader properties that we can set in JavaScript, which will be passed directly to our fragment and vertex shaders. */
			shaders[1].pMatrixUniform = gl.getUniformLocation(shaders[1], "uPMatrix");		// Projection matrix.
			shaders[1].mvMatrixUniform = gl.getUniformLocation(shaders[1], "uMVMatrix");	// Model-view matrix.
			shaders[1].samplerUniform = gl.getUniformLocation(shaders[1], "uSampler");		// The texture being sampled.

			/* This defines the function that combines our matrices prior to rendering. */
			shaders[1].setMatrixUniforms = function () {
				try {
					/* Create our model-view matrix. */
					mat4.multiply(vMatrix, mMatrix, mvMatrix);

					/* Set our projection and model-view matrices; to be accessed by the shaders. */
					gl.uniformMatrix4fv(shaders[1].pMatrixUniform, false, pMatrix);
					gl.uniformMatrix4fv(shaders[1].mvMatrixUniform, false, mvMatrix);
				} catch (err) {
					console.log("setMatrixUniforms[1]: " + err);
				}
			};

			/* Colour sun shader. */
			fragmentShader = Utils.getShader(gl, "./shaders/fragment-sun.c", gl.FRAGMENT_SHADER);
			vertexShader = Utils.getShader(gl, "./shaders/vertex-sun.c", gl.VERTEX_SHADER);

			/* Attach our sun-specific shaders that we just retrieved. */
			shaders[2] = gl.createProgram();
			gl.attachShader(shaders[2], vertexShader);
			gl.attachShader(shaders[2], fragmentShader);
			gl.linkProgram(shaders[2]);
			gl.useProgram(shaders[2]);

			/* We want to store the position for each vertex. */
			shaders[2].vertexPositionAttribute = gl.getAttribLocation(shaders[2], "aVertexPosition");
			gl.enableVertexAttribArray(shaders[2].vertexPositionAttribute);

			/* We want to store the direct colour for each vertex. */
			shaders[2].vertexColorAttribute = gl.getAttribLocation(shaders[2], "aVertexColor");
			gl.enableVertexAttribArray(shaders[2].vertexColorAttribute);

			/* Here we define the shader properties that we can set in JavaScript, which will be passed directly to our fragment and vertex shaders. */
			shaders[2].pMatrixUniform = gl.getUniformLocation(shaders[2], "uPMatrix");		// Projection matrix.
			shaders[2].mvMatrixUniform = gl.getUniformLocation(shaders[2], "uMVMatrix");	// Model-view matrix.

			/* This defines the function that combines our matrices prior to rendering. */
			shaders[2].setMatrixUniforms = function () {
				try {
					/* Create our model-view matrix. */
					mat4.multiply(vMatrix, mMatrix, mvMatrix);

					/* Set our projection and model-view matrices; to be accessed by the shaders. */
					gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
					gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
				} catch (err) {
					console.log("setMatrixUniforms[2]: " + err);
				}
			};
		} catch (err) {
			console.log("initShaders: " + err);
		}
	}

	/**
	 * This function defines the configuration settings we apply to each texture once it is loaded.
	 */
	function handleLoadedTexture(texture) {
		try {
			/* Associate this texture with the actions we are about to perform. */
			gl.bindTexture(gl.TEXTURE_2D, texture);

			/* Unpack the colour values in reverse order. */
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

			/* Assign the image date do this texture object. */
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

			/* Set the magnify and minimize filters. */
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			/* Clean up after ourselves and unassociate this texture. */
			gl.bindTexture(gl.TEXTURE_2D, null);
		} catch (err) {
			console.log("handleLoadedTexture: " + err);
		}
	}

	/**
	 * This function loads in all of the textures we will be using.
	 */
	function initTexture() {
		var pixel = null;
		try {
			/* Skybox texture. */
			textures.skybox = gl.createTexture();

			/* Default colour until texture is loaded. */
			gl.bindTexture(gl.TEXTURE_2D, textures.skybox);
			pixel = new Uint8Array([0, 0, 200, 255]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			/* Load our image. */
			textures.skybox.image = new Image();
			textures.skybox.image.onload = function () {
				try {
					handleLoadedTexture(textures.skybox);
				} catch (err) {
					console.log("skybox.onload: " + err);
				}
			};
			textures.skybox.image.src = "tx/skybox2.png";

			/* Terrain texture0: Sand. */
			textures.sand = gl.createTexture();

			/* Default colour until texture is loaded. */
			gl.bindTexture(gl.TEXTURE_2D, textures.sand);
			pixel = new Uint8Array([0, 200, 0, 255]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			/* Load our image. */
			textures.sand.image = new Image();
			textures.sand.image.onload = function () {
				try {
					handleLoadedTexture(textures.sand);
				} catch (err) {
					console.log("sand.onload: " + err);
				}
			};
			textures.sand.image.src = "tx/dirt.png";

			/* Terrain texture1: Grass. */
			textures.grass = gl.createTexture();

			/* Default colour until texture is loaded. */
			gl.bindTexture(gl.TEXTURE_2D, textures.grass);
			pixel = new Uint8Array([0, 200, 0, 255]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			/* Load our image. */
			textures.grass.image = new Image();
			textures.grass.image.onload = function () {
				try {
					handleLoadedTexture(textures.grass);
				} catch (err) {
					console.log("grass.onload: " + err);
				}
			};
			textures.grass.image.src = "tx/grass.png";

			/* Terrain texture2: Rock. */
			textures.rock = gl.createTexture();

			/* Default colour until texture is loaded. */
			gl.bindTexture(gl.TEXTURE_2D, textures.rock);
			pixel = new Uint8Array([0, 200, 0, 255]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			/* Load our image. */
			textures.rock.image = new Image();
			textures.rock.image.onload = function () {
				try {
					handleLoadedTexture(textures.rock);
				} catch (err) {
					console.log("rock.onload: " + err);
				}
			};
			textures.rock.image.src = "tx/rock.png";

			/* Terrain texture3: Snow. */
			textures.snow = gl.createTexture();

			/* Default colour until texture is loaded. */
			gl.bindTexture(gl.TEXTURE_2D, textures.snow);
			pixel = new Uint8Array([0, 200, 0, 255]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			/* Load our image. */
			textures.snow.image = new Image();
			textures.snow.image.onload = function () {
				try {
					handleLoadedTexture(textures.snow);
				} catch (err) {
					console.log("snow.onload: " + err);
				}
			};
			textures.snow.image.src = "tx/snow.png";
		} catch (err) {
			console.log("initTexture: " + err);
		}
	}

	/**
	 * This function will specify a lighting direction. 
	 */
	function calculateLighting() {
		var lightingDirection = [0.0, -1.0, 1.0],
			time = null,
			adjustedLD = null;
		try {
			/**
			 * This portion of code will make the sun travel in an orbit based on the current clock (though much faster than
			 * a normal sun would travel. Given the current skybox though, the sun would set in front of the horizon (since
			 * the horizon is "painted on" the skybox.) For this reason I disabled the sun's traveling, but left this in
			 * just as something to play with.
			 */
			/*
			time = Utils.degToRad((new Date()).getTime() / 100);
			lightingDirection[1] = Math.sin(time) * 2500.0;
			lightingDirection[2] = Math.cos(time) * 3000.0;
			vec3.normalize(lightingDirection);
			*/

			/* Update the sun's position based on the lighting direction. */
			geometry.sun.position[1] = -lightingDirection[1] * 2000.0 + 1000.0;
			geometry.sun.position[2] = -lightingDirection[2] * 3000.0;

			/* Spin the sun. Otherwise it looks exactly like a cube. */
			vec3.add(geometry.sun.rotation, [0.50, 0.00, 0.50], geometry.sun.rotation);

			/* Ambient light. */
			gl.uniform3f(shaders[0].ambientColorUniform, 0.2, 0.2, 0.2);

			/* Lighting direction. */
			adjustedLD = vec3.create();
			vec3.normalize(lightingDirection, adjustedLD);
			vec3.scale(adjustedLD, -1);
			gl.uniform3fv(shaders[0].lightingDirectionUniform, adjustedLD);

			/* Directional lighting color. */
			gl.uniform3f(shaders[0].directionalColorUniform, 0.6, 0.6, 0.6);
		} catch (err) {
			console.log("initLighting: " + err);
		}
	}

	/**
	 * This function is reserved for device-specific configuration. Currently all we are doing is
	 * creating our joystick controls.
	 */
	function initDevice() {
		try {
			/* Create the joystick. */
			joystick = new VirtualJoystick();
		} catch (err) {
			console.log("initDevice: " + err);
		}
	}

	/**
	 * This function handles pushing a view matrix onto our stack.
	 */
	function vPushMatrix() {
		var copy = mat4.create();
		mat4.set(vMatrix, copy);
		vMatrixStack.push(copy);
	}

	/**
	 * This function handles popping a view matrix off of our stack.
	 */
	function vPopMatrix() {
		vMatrix = vMatrixStack.pop();
	}

	/**
	 * This function performs all of our drawing. Most objects being drawn are done in a simlar fashion,
	 * though some models may have slight differences (i.e. skybox disables DEPTH_TEST, terrain is a
	 * TRIANGLE_STRIP, sun is a TRIANGLE_LIST, etc.)
	 */
	function render() {
		try {
			/* Initialize scene. */
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			/* Reset model-view to identity. */
			mat4.identity(vMatrix);

			/* Position and rotate camera. */
			mat4.rotate(vMatrix, camera.rotation[0], [1, 0, 0]);
			mat4.rotate(vMatrix, camera.rotation[1], [0, 1, 0]);
			mat4.rotate(vMatrix, camera.rotation[2], [0, 0, 1]);
			mat4.translate(vMatrix, camera.position);

			/* Push the view matrix for our skybox. */
			vPushMatrix();
			mat4.identity(mMatrix);
			gl.disable(gl.DEPTH_TEST);

			/* Set position and rotation of skybox. */
			mat4.translate(mMatrix, geometry.skybox.position);
			mat4.rotate(mMatrix, geometry.skybox.rotation[0], [1, 0, 0]);
			mat4.rotate(mMatrix, geometry.skybox.rotation[1], [0, 1, 0]);
			mat4.rotate(mMatrix, geometry.skybox.rotation[2], [0, 0, 1]);

			/* Choose skybox shader. */
			shaderProgram = shaders[1];
			gl.useProgram(shaderProgram);

			/* Bind the skybox vertex buffer. */
			gl.bindBuffer(gl.ARRAY_BUFFER, geometry.skybox.vBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, geometry.skybox.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

			/* Bind the skybox texture buffer. */
			gl.bindBuffer(gl.ARRAY_BUFFER, geometry.skybox.tBuffer);
			gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, geometry.skybox.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

			/* Activate the skybox texture. */
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textures.skybox);
			gl.uniform1i(shaderProgram.samplerUniform, 0);

			/* Draw our skybox! */
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.skybox.iBuffer);
			shaderProgram.setMatrixUniforms();
			gl.drawElements(gl.TRIANGLES, geometry.skybox.iBuffer.numItems, gl.UNSIGNED_SHORT, 0);

			/* Pop the view matrix for our skybox. */
			gl.enable(gl.DEPTH_TEST);
			vPopMatrix();

			/* Push the view matrix for our terrain. */
			vPushMatrix();
			mat4.identity(mMatrix);

			/* Set position and rotation of terrain. */
			mat4.translate(mMatrix, geometry.terrain.position);
			mat4.rotate(mMatrix, geometry.terrain.rotation[0], [1, 0, 0]);
			mat4.rotate(mMatrix, geometry.terrain.rotation[1], [0, 1, 0]);
			mat4.rotate(mMatrix, geometry.terrain.rotation[2], [0, 0, 1]);

			/* Choose terrain shader. */
			shaderProgram = shaders[0];
			gl.useProgram(shaderProgram);

			/* Calculate terrain lighting. */
			calculateLighting();

			/* Bind the terrain vertex buffer. */
			gl.bindBuffer(gl.ARRAY_BUFFER, geometry.terrain.vBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, geometry.terrain.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

			/* Bind the terrain normal buffer. */
			gl.bindBuffer(gl.ARRAY_BUFFER, geometry.terrain.nBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, geometry.terrain.nBuffer.itemSize, gl.FLOAT, false, 0, 0);

			/* Bind the terrain texture buffer. */
			gl.bindBuffer(gl.ARRAY_BUFFER, geometry.terrain.tBuffer);
			gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, geometry.terrain.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

			/* Activate terrain textures. */
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textures.sand);
			gl.uniform1i(shaderProgram.texture0, 0);

			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, textures.grass);
			gl.uniform1i(shaderProgram.texture1, 1);

			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, textures.rock);
			gl.uniform1i(shaderProgram.texture2, 2);

			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, textures.snow);
			gl.uniform1i(shaderProgram.texture3, 3);

			/* Draw our terrain! */
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.terrain.iBuffer);
			shaderProgram.setMatrixUniforms();
			gl.drawElements(gl.TRIANGLE_STRIP, geometry.terrain.iBuffer.numItems, gl.UNSIGNED_SHORT, 0);

			/* Pop the view matrix for our terrain. */
			vPopMatrix();

			/**
			 * Sun rendering currently disabled as our skybox has a sun painted on it.
			 * Rendering the sun makes it look out of place (more out of place than a floating,
			 * spinning cube already looks.) Uncomment the below segments to see the suncube
			 * yourself.
			 */
			// /* Push the view matrix for our sun. */
			// vPushMatrix();
			// mat4.identity(mMatrix);

			// /* Set the position and rotation of our sun. */
			// mat4.translate(mMatrix, geometry.sun.position);
			// mat4.rotate(mMatrix, geometry.sun.rotation[0], [1, 0, 0]);
			// mat4.rotate(mMatrix, geometry.sun.rotation[1], [0, 1, 0]);
			// mat4.rotate(mMatrix, geometry.sun.rotation[2], [0, 0, 1]);

			// /* Choose sun shader. */
			// shaderProgram = shaders[2];
			// gl.useProgram(shaderProgram);

			// /* Bind sun vertex buffer. */
			// gl.bindBuffer(gl.ARRAY_BUFFER, geometry.sun.vBuffer);
			// gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, geometry.sun.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

			// /* Bind sun colour buffer. */
			// gl.bindBuffer(gl.ARRAY_BUFFER, geometry.sun.cBuffer);
			// gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, geometry.sun.cBuffer.itemSize, gl.FLOAT, false, 0, 0);

			// /* Draw our sun! */
			// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.sun.iBuffer);
			// shaderProgram.setMatrixUniforms();
			// gl.drawElements(gl.TRIANGLES, geometry.sun.iBuffer.numItems, gl.UNSIGNED_SHORT, 0);

			// /* Pop the view matrix for our sun. */
			// vPopMatrix();
		} catch (err) {
			console.log("render: " + err);
		}
	}

	/** 
	 * This function gets called every frame and performs necessary calculation updates.
	 *
	 * TODO: Offload to a separate thread in order to improve performance.
	 */
	function update() {
		var x = 0.0, // Stores various x-values.
			y = 0.0, // Stores various y-values.
			c = 0.0, // Stores various cos-values.
			s = 0.0, // Stores various sin-values.
			b = 0.0; // Stores various border limits.
		try {
			/* Call this first to keep our updates happening as close to 60FPS as possible. */
			window.window.requestAnimationFrame(update);

			/* Camera rotation. */
			x = joystick.deltaY(1);
			y = joystick.deltaX(1);
			if (camera.rotation.fixed === false && (x !== 0 || y !== 0)) {
				/* If we're allowed to move the camera, and there has been rotation. */
				camera.rotation[0] += Utils.degToRad(joystick.deltaY(1) * 0.04);
				camera.rotation[1] += Utils.degToRad(joystick.deltaX(1) * 0.04);
			}

			/* Camera position. */
			x = joystick.deltaX(0);
			y = joystick.deltaY(0);
			if (camera.position.fixed === false && (x !== 0 || y !== 0)) {
				/* If we're allowed to move the camera, and there has been movement. */
				c = Math.cos(camera.rotation[1]);
				s = Math.sin(camera.rotation[1]);

				/*Update the x-position of the camera as long as we're within the boundaries. */
				camera.position[0] -= 0.025 * (x * c - y * s);
				b = geometry.terrain.width / 2.0 - 1.0;
				if (camera.position[0] < -b) {
					camera.position[0] = -b;
				} else if (camera.position[0] > b) {
					camera.position[0] = b;
				}

				/* Update the z-position of the camera as long as we're within the boundaries. */
				camera.position[2] -= 0.025 * (x * s + y * c);
				b = geometry.terrain.depth / 2.0 - 1.0;
				if (camera.position[2] < -b) {
					camera.position[2] = -b;
				} else if (camera.position[2] > b) {
					camera.position[2] = b;
				}

				/* If the camera doesn't freefloat. */
				if (camera.freeFloat === false) {
					/* Calculate the y-position on the terrain based on the new x and z positions. */
					y = geometry.terrain.getY(camera.position[0], camera.position[2]);
					camera.position[1] = -y - 15.0;
					geometry.skybox.position[1] = -camera.position[1];
				}

				/* Move the skybox with the camera. */
				geometry.skybox.position[0] = -camera.position[0];
				geometry.skybox.position[2] = -camera.position[2];
			}

			/* Redraw everything. */
			render();
		} catch (err) {
			console.log("update: " + err);
		}
	}

	/* Call our initialize functions in sequence and then start updating. */
	initWebGL();
	initGeometry();
	initShaders();
	initTexture();
	initDevice();
	update();
}