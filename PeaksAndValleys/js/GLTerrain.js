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

/*global console, assets, gl, Float32Array, Uint16Array, mat3, mat4, Worker, Utils */

/**
 * GLTerrain.js provides the intial setup for our terrain, as well as rendering functionality.
 */

var GLTerrain = function (gl) {
	'use strict';
	var _this;

	try {
		_this = this;

		/* Initialise our shader. */
		this.initShader();

		/* Initialize our vertex buffer. */
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.DYNAMIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 0;

		/* Initialize our normal buffer. */
		this.nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.DYNAMIC_DRAW);
		this.nBuffer.itemSize = 3;
		this.nBuffer.numItems = 0;

		/* Initialize our index buffer. */
		this.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.DYNAMIC_DRAW);
		this.iBuffer.itemSize = 1;
		this.iBuffer.numItems = 0;

		/* Initialize our terrain variables. */
		this.mMatrix = mat4.create();
		this.mvMatrix = mat4.create();
		this.nMatrix = mat3.create();

		/* Initialize our worker. */
		this.worker = new Worker('./js/GLTerrainWorker.js');
		this.worker.addEventListener('message', function (e) {
			var params;

			params = e.data;
			if (params.cmd === 'update') {
				/* Whenever we receive an update, set our vertex, normal, and index buffers to the new values. */

				gl.bindBuffer(gl.ARRAY_BUFFER, _this.vBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, params.vertices, gl.DYNAMIC_DRAW);
				_this.vBuffer.itemSize = 3;
				_this.vBuffer.numItems = params.vertices.length / _this.vBuffer.itemSize;

				gl.bindBuffer(gl.ARRAY_BUFFER, _this.nBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, params.normals, gl.DYNAMIC_DRAW);
				_this.nBuffer.itemSize = 3;
				_this.nBuffer.numItems = params.normals.length / _this.nBuffer.itemSize;

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _this.iBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, params.indices, gl.DYNAMIC_DRAW);
				_this.iBuffer.itemSize = 1;
				_this.iBuffer.numItems = params.indices.length;
			}
			this.working = false;
		}, false);

		/* Initialize our worker. */
		this.worker.working = true;
		this.worker.postMessage({
			'cmd': 'init',
			'width': assets.json.terrain.width,
			'height': assets.json.terrain.height,
			'tileSize': assets.json.terrain.tileSize,
			'vertices': assets.json.terrain.vertices,
			'normals': assets.json.terrain.normals,
			'offset': 60.0
		});
	} catch (err) {
		console.log(err.message);
	}
};

GLTerrain.prototype.initShader = function () {
	'use strict';
	var shader, fragment, vertex;

	/* Create our shader and retrieve the predefined programs. */
	shader = gl.createProgram();
	fragment = assets.getShader(gl, './shaders/GLTerrainF.c', gl.FRAGMENT_SHADER);
	vertex = assets.getShader(gl, './shaders/GLTerrainV.c', gl.VERTEX_SHADER);

	/* Attach our shaders. */
	gl.attachShader(shader, fragment);
	gl.attachShader(shader, vertex);
	gl.linkProgram(shader);
	gl.useProgram(shader);

	/* Retrieve the location of the aVertexPosition variable. */
	shader.vertexPositionAttribute = gl.getAttribLocation(shader, 'aVertexPosition');
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);

	/* Retrieve the location of the aVertexNormal variable. */
	shader.vertexNormalAttribute = gl.getAttribLocation(shader, 'aVertexNormal');
	gl.enableVertexAttribArray(shader.vertexNormalAttribute);

	/* Retrieve our uniform locations. */
	shader.pMatrixUniform = gl.getUniformLocation(shader, 'uPMatrix');
	shader.mvMatrixUniform = gl.getUniformLocation(shader, 'uMVMatrix');
	shader.lightingDirectionUniform = gl.getUniformLocation(shader, 'uLightingDirection');
	this.shader = shader;
};

GLTerrain.prototype.update = function (px, pz) {
	'use strict';

	/* Only request an update if we're not already working. */
	if (this.worker.working === false) {
		this.worker.working = true;
		this.worker.postMessage({
			'cmd': 'update',
			'px': -px,
			'pz': -pz
		});
	}

	/* Return the most recent height. */
	return this.getY(-px, -pz);
};

GLTerrain.prototype.getY = function (px, pz) {
	'use strict';
	var v, w, h, s, x, z, rx, rz, y, yx, yz;

	/* Store our vertices, width, hight, and tileSize for easier access. */
	v = assets.json.terrain.vertices;
	w = assets.json.terrain.width;
	h = assets.json.terrain.height;
	s = assets.json.terrain.tileSize;

	/* Calculate the 'row' and 'column' that our camera is currently in. */
	x = Math.floor(px / s);
	z = Math.floor(pz / s);

	/* Calculate how far into the 'row' and 'column' we are. */
	rx = (px / s) - x;
	rz = (pz / s) - z;

	/* The geometry looks different if we're on an even row vs. an odd row. */
	if (z % 2 === 0) {
		/* Each (row, column) is a square, made of two triangles. Find which triangle we're in. */
		if (rx + rz < 1.0) {
			/* Calculate our base height and horizontally/vertically neighbouring heights. */
			y  = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x,		0.0, w))];
			yx = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			yz = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x,		0.0, w))];
		} else {
			/* Calculate our base height and horizontally/vertically neighbouring heights. */
			y  = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			yx = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x,		0.0, w))];
			yz = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			rx = 1.0 - rx;
			rz = 1.0 - rz;
		}
	} else {
		/* Each (row, column) is a square, made of two triangles. Find which triangle we're in. */
		if (rx < rz) {
			/* Calculate our base height and horizontally/vertically neighbouring heights. */
			y  = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x,		0.0, w))];
			yx = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			yz = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x,		0.0, w))];
			rz = 1.0 - rz;
		} else {
			/* Calculate our base height and horizontally/vertically neighbouring heights. */
			y  = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			yx = v[Math.floor(Utils.clamp(z,		0.0, h) * w + Utils.clamp(x,		0.0, w))];
			yz = v[Math.floor(Utils.clamp(z + 1.0,	0.0, h) * w + Utils.clamp(x + 1.0,	0.0, w))];
			rx = 1.0 - rx;
		}
	}

	/* Calculate our required height by using our base height, and a portion of the neighbouring heights
	 * depending on how far into the 'row' and 'column' we are.
	 */
	y = y + (yx - y) * rx + (yz - y) * rz;
	return y;
};

GLTerrain.prototype.render = function (pMatrix, vMatrix) {
	'use strict';

	/* Reset our model matrix, rotate our model, and position our model. */
	mat4.identity(this.mMatrix);

	/* Set our shader and geometry. */
	gl.useProgram(this.shader);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
	gl.vertexAttribPointer(this.shader.vertexPositionAttribute, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
	gl.vertexAttribPointer(this.shader.vertexNormalAttribute, this.nBuffer.itemSize, gl.FLOAT, false, 0, 0);

	/* We will be rendering from our index buffer. */
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);

	/* Set our projection matrix. */
	gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);

	/* Set our model-view matrix. */
	mat4.multiply(vMatrix, this.mMatrix, this.mvMatrix);
	gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, this.mvMatrix);

	/* Render our terrain. */
	gl.drawElements(gl.TRIANGLE_STRIP, this.iBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};