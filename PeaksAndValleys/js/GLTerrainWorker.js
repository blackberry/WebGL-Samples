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

/*global self, assets, Float32Array, Uint16Array */

/**
 * GLTerrainWorker.js is a Web Worker that generates new vertex, normal, and index data
 * once per second. By moving these calculations off the main application thread, we can
 * minimize the impact on FPS while obtaininer regular updates.
 */

/* Placeholder variables. */
self.vertices = [];
self.normals = [];
self.offset = 0.0;
self.tileSize = 0.0;
self.width = 0.0;
self.height = 0.0;

/* Initialize our event listener for messages. */
self.addEventListener('message', function (e) {
	'use strict';
	var params;

	/* Take separate actions based on the issued command. */
	params = e.data;
	if (params.cmd === 'update') {
		self.update(params);
	} else if (params.cmd === 'init') {
		self.init(params);
	}
}, false);

/* This is a redefinition of the clamp function in Utils, however Web Workers do 
 * not have access to the external JavaScript files that way so we must place this
 * definition here as well.
 */
self.clamp = function (val, low, high) {
	'use strict';

	/* Ensures that val is between low and high. */
	while (val < low) { val += (high - low); }
	while (val >= high) {val -= (high - low); }
	return val;
};

/* Called once before any work is done. Stores variables we will be using regularly. */
self.init = function (params) {
	'use strict';

	/* Store our variables. */
	self.width = params.width;
	self.height = params.height;
	self.tileSize = params.tileSize;
	self.vertices = params.vertices;
	self.normals = params.normals;
	self.offset = params.offset;
	self.tiles = self.offset * 2.0 + 1.0;

	/* Announce completion. */
	self.postMessage({
		'cmd': 'init',
		'message': 'complete'
	});
};

/* Called every frame, when available, with an internal limit of once per second. */
self.update = function (params) {
	'use strict';
	var vertices, normals, indices, dx, dz, mx, mz, x, z, nx, nz, i;

	/* Start with fresh vertex, normal, and index buffers. */
	vertices = [];
	normals = [];
	indices = [];

	/* Calculate our row and column. */
	dx = Math.floor(params.px / self.tileSize);
	dz = Math.floor(params.pz / self.tileSize);

	/* Our row counter for indices. */
	mz = 0.0;
	for (z = dz - self.offset; z <= dz + self.offset; z = z + 1.0) {
		/* Ensure that the row is between zero and the heightmap height. */
		nz = self.clamp(z, 0.0, self.height);

		/* Our column counter for indices. */
		mx = 0.0;
		for (x = dx - self.offset; x <= dx + self.offset; x = x + 1.0) {
			/* Ensure that the column is between zero and the heightmap width. */
			nx = self.clamp(x, 0.0, self.width);

			/* Calculate the index of the vertex height we're looking for. */
			i = Math.floor(nz * self.width + nx);

			/* Store the scaled X and Z values, and the returned height (Y) value. */
			vertices.push(x * self.tileSize);
			vertices.push(self.vertices[i]);
			vertices.push(z * self.tileSize);

			/* Height values are stored as just 1 value, normals have 3 components, so we multiply the
			 * existing index by 3 to get the corresponding normal index.
			 */
			i = Math.floor(i * 3);

			/* Store our X, Y, and Z normal components. */
			normals.push(self.normals[i]);
			normals.push(self.normals[i + 1]);
			normals.push(self.normals[i + 2]);

			/* We only calculate values for the index buffer until the second-last row;
			 * since we're adding vertices for two rows at a time.
			 */
			if (z < dz + self.offset) {
				/* To keep the TRIANGLE_STRIP intact, we need to alternate left-to-right and
				 * right-to-left when creating our indices. We do this by checking whether our
				 * row is odd or even.
				 */
				if (z % 2 === 0) {
					/* Add the current row and the row below it. */
					indices.push(Math.floor(mz * self.tiles + mx));
					indices.push(Math.floor((mz + 1) * self.tiles + mx));
				} else {
					/* Add the current row and the row below it. */
					indices.push(Math.floor(mz * self.tiles + (self.tiles - mx - 1.0)));
					indices.push(Math.floor((mz + 1) * self.tiles + (self.tiles - mx - 1.0)));
				}
			}
			/* Increase our index buffer's column. */
			mx = mx + 1.0;
		}
		/* Increase our index buffer's row. */
		mz = mz + 1.0;
	}

	/* Once everything's ready, wait 1 second before returning the results to slow down the process.
	 * We simply don't need to provide new data ASAP, thus giving the processing a bit of a break.
	 */
	setTimeout(function () {
		self.postMessage({
			'cmd': 'update',
			'message': 'complete',
			'vertices': new Float32Array(vertices),
			'normals': new Float32Array(normals),
			'indices': new Uint16Array(indices)
		});
	}, 3000);
};