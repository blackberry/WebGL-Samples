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
 * This function is intended to simplify the generation of a terrain. Here, we use a:
 * - Vertex buffer.
 * - Index buffer.
 * - Texture buffer.
 * - Normal buffer.
 */

var GLTerrain = function (gl, width, depth, cols, rows) {
	"use strict";
	try {
		/* Store values. */
		this.width = width;
		this.depth = depth;
		this.cols = cols;
		this.rows = rows;

		/* Vertex mapping. */
		this.initVertices();

		/* Index mapping. */
		this.initIndices();

		/* Texture mapping. */
		this.initTextureCoords();

		/* Normal mapping. */
		this.initNormals();

		/* Vertex buffer. */
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = (cols + 1) * (rows + 1);

		/* Index buffer. */
		this.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
		this.iBuffer.itemSize = 1;
		this.iBuffer.numItems = (cols + 1) * rows * 2;

		/* Texture buffer. */
		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvCoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = this.vBuffer.numItems;

		/* Normal buffer. */
		this.nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
		this.nBuffer.itemSize = 3;
		this.nBuffer.numItems = (cols + 1) * (rows + 1);

		/* Store position and rotation. */
		this.position = vec3.create([0.0, 0.0, 0.0]);
		this.rotation = vec3.create([0.0, 0.0, 0.0]);
	} catch (err) {
		console.log("GLTerrain: " + err);
	}
};

/* Generate vertex mapping. */
GLTerrain.prototype.initVertices = function () {
	"use strict";
	var c = 0,							// Column counter.
		r = 0,							// Row counter.
		x = 0.0,						// X coordinate of a point.
		y = 0.0,						// Y coordinate of a point.
		z = 0.0,						// Z coordinate of a point.
		sx = this.width / this.cols,	// Distance between vertices along the x-axis.
		sz = this.depth / this.rows,	// Distance between vertices along the z-axis.
		w = this.width / 2.0,			// Half the total width; used to center our terrain around the origin.
		d = this.depth / 2.0,			// Half the total depth; used to center our terrain around the origin.
		n = 0,							// Number of X; counter.
		i = 0,							// Cycle index; counter.
		v2 = [];						// Vertex height container.
	try {
		/* Start with no vertices. */
		this.vertices = [];

		/**
		 * Generate vertex grid. To begin, we will simply create an Rows x Columns grid. All
		 * heights default to: 0.0
		 */
		for (r = 0; r <= this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				x = c * sx - w;
				y = 0.0;
				z = r * sz - d;
				this.vertices.push(x, y, z);
			}
		}

		/**
		 * Next we want to stagger the terrain somewhat to generate peaks and valleys. To do so,
		 * we pick a random column and row. We then generate a box around that point and elevate
		 * all of the vertices within that box the same, random amount.
		 *
		 * Iterate n times.
		 */
		for (n = 0; n < 10000; n = n + 1) {
			c = Math.floor(Math.random() * (this.cols + 1));					// Our 'center' column.
			x = Math.max(0, c - Math.floor(Math.random() * 15.0) - 1);			// Minimum column in our box, when traversing left from the center.
			sx = Math.min(this.cols, c + Math.floor(Math.random() * 15.0) + 1); // Maximum column in our box, when traversing right from the center.

			r = Math.floor(Math.random() * (this.rows + 1));					// Our 'center' row.
			z = Math.max(0, r - Math.floor(Math.random() * 10.0) - 1);			// Minimum row in our box, when traversing down from the center.
			sz = Math.min(this.rows, r + Math.floor(Math.random() * 10.0) + 1); // Minimum row in our box, when traversing up from the center.

			y = Math.random() * 25.0;	// Pick a random offset between [0.0 and 25.0) to raise the vertices within our bounding box.

			/* Traverse through the vertices in our bounding box and increase their height. */
			for (r = z; r <= sz; r = r + 1) {
				for (c = x; c <= sx; c = c + 1) {
					i = (r * (this.cols + 1) + c) * 3 + 1;		// Find the correct y-value of the vertex we want to modify.
					this.vertices[i] = this.vertices[i] + y;	// Increment the height.
				}
			}
		}

		/**
		 * Because we've generated so many boxes, the terrain can be somewhat uneven. Next we'll
		 * traverse over every vertex and average its height with its neighbouring tiles.
		 * - The four corner vertices will only be averaged with 3 neighbours each.
		 * - Any vertex that is on a column edge or row edge will only be averaged with 5 neighbours.
		 * - All other vertices will be averaged with their full 8 neighbours.
		 * 
		 * We will also monitor for the lowest point in our grid and store it in this.lowest for later use.
		 * We do the same for the highest point.
		 */
		this.lowest = this.vertices[1];		// Initiailze the lowest point as our first vertex.
		this.highest = this.vertices[1];	// Initialize the highest point as our first vertex.
		
		/* Traverse through our grid. */
		for (r = 0; r <= this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				/* Reset height and count for this grouping of neighbours. */
				y = 0.0;
				n = 0;

				/* Visit all neighbours. */
				for (sz = Math.max(r - 1, 0); sz <= Math.min(r + 1, this.rows); sz = sz + 1) {
					for (sx = Math.max(c - 1, 0); sx <= Math.min(c + 1, this.cols); sx = sx + 1) {
						i = (sz * (this.cols + 1) + sx) * 3 + 1;	// Retrive the y-value index of our current vertex.
						y = y + this.vertices[i];					// Add the height of this vertex to our running total.
						n = n + 1;									// Increment our neighbour count.
					}
				}

				/* Calculate the average height for this neighbour grouping. */
				y = y / n;

				/* Keep track of lowest and highest points. */
				if (y < this.lowest) {
					this.lowest = y;
				} else if (y > this.highest) {
					this.highest = y;
				}

				/** 
				 * Store the adjusted height of this vertex. Note that we do not override our current grid.
				 * This prevents modified values from being re-used in subsequent calculations. Without this,
				 * our grid would naturally slope as we move away from the first point.
				 */
				v2.push(y);
			}
		}

		/**
		 * We kept track of the minimum height, and we will now lower all of our vertices so that the lowest
		 * height occurs at 0.0. This just helps keep our numbers more reasonable with a base height that
		 * makes sense.
		 */
		for (r = 0; r <= this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				i = (r * (this.cols + 1) + c) * 3 + 1;
				this.vertices[i] = v2.shift() - this.lowest;
			}
		}
		this.highest = this.highest - this.lowest;	// Lower our highest point.
		this.lowest = 0.0;							// Our lowest point is now 0.0.
	} catch (err) {
		console.log("GLTerrain.initVertices: " + err);
	}
};

/**
 * This function generates the indices that will correlate with our vertex grid. Our vertex grid looks like so:
 *
 *	24	23	22	21	20
 *
 *	19	18	17	16	15
 *
 *	14	13	12	11	10
 *
 *	 9	 8	 7	 6	 5
 *
 *	 4	 3	 2	 1	 0
 *
 * Note: this is a 4x4 grid, but we're generating much more than this.
 *
 * By using a TRIANGLE_STRIP, we want to minimize the number of indices we need to make. To accomplish this,
 * we generate the TRIANGLE_STRIP in as much of a sequential order as we can. We start by moving left-to-right with
 * our first three index values defined as:
 * 0 5 1
 * This creates a triangle between vertices 0, 5, and 1. We then move to vertex:
 * 6
 * This creates a triangle between vertices 5, 1, and 6. We then move to vertex:
 * 2
 * This creates a triangle between vertices 1, 6, and 2. We continue this process until:
 * 8 4 9
 * Where we hit the end of the row. We then repeat vertex 9 and start moving right-to-left:
 * 9 14 8
 * And so on. The resulting flow looks like this:
 *
 *	24	23	22	21	20
 *	| \ | \ | \ | \ |
 * .19	18	17	16	15
 *  | / | / | / | / |
 *	14	13	12	11	10.
 *	| \ | \ | \ | \ |
 * .9	8	7	6	5
 *  | / | / | / | / |
 *  4	3	2	1	0


 *
 * With the sequence being:
 * 0 5 1 6 2 7 3 8 4 9 9 14 8 13 7 12 6 11 5 10 10 15 11 16 12 17 13 18 14 19 19 24 18 23 17 22 16 21 15 20
 *
 * This way, our TRIANGLE_STRIP lets us define a 4x4 grid with only 40 indices. If we
 * were to use a TRIANLGE_LIST, we would have needed 3 indices per triangle. 32 triangles X 3 indices = 96 indices.
 * At this size, the gain isn't that drastic. But when considering a 150x150 grid, it really adds up.
 */
GLTerrain.prototype.initIndices = function () {
	"use strict";
	var c = 0,	// The column we are on.
		r = 0,	// The row we are on.
		i = 0;	// The vertex index.
	try {
		/* We start with no indices. */
		this.indices = [];

		/* Cycle through all of our grid points. */
		for (r = 0; r < this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				if (r % 2 === 0) {
					/* If we're on an even row, we need to traverse left-to-right. */
					i = r * (this.cols + 1) + c;
				} else {
					/* If we're on an odd row, we need to traverse right-to-left. */
					i = r * (this.cols + 1) + (this.cols - c);
				}
				/** 
				 * We add 2 indices at a time. Our current vertex, and the vertex directly "above" it.
				 * In our comments above, this would correlate to: 0 5 and 1 6 and 2 7, etc.
				 *
				 * This is also why we traverse columns "<=" this.cols, but rows "<" this.rows.
				 * - Our top-most row is actually generated when we're traversing the row beneath it.
				 */
				this.indices.push(i, i + this.cols + 1);
			}
		}
	} catch (err) {
		console.log("GLTerrain.initIndices: " + err);
	}
};

/* Texture coordinates. Altered to support repeat on PlayBook. */
GLTerrain.prototype.initTextureCoords = function () {
	"use strict";
	var c = 0,		// The vertex column.
		r = 0,		// The vertex row.
		n = 0.5,	// A value of 0.5 means we apply 50% of the texture to a tile. So the texture is stretched over 4 tiles at 0.5. At 0.1, it would be stretched over 10 tiles. At 1.0 it would be stretched over 1 tile.
		s = 0.0,	// The x-axis texture coordinate.
		t = 0.0;	// The z-axis texture coordinate.
	try {
		/* Start with no texture coordinates. */
		this.uvCoords = [];

		/* Cycle through all of our vertices. */
		for (r = 0; r <= this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				/* Push our current texture coordinate. */
				this.uvCoords.push(s, t);
				
				/* Modify the x-axis texture coordinates for the next vertex. */
				s = s + n;
				if (s > 1.0) {
					s = s - 1.0; // Keep the coordinate between 0.0 and 1.0.
				}
			}
			/* Modify the z-axis texture coordinate for the next set of vertices. */
			t = t + n;
			if (t > 1.0) {
				t = t - 1.0; // Keep the coordinate between 0.0 and 1.0.
			}
		}
	} catch (err) {
		console.log("GLTerrain.initTextureCoords: " + err);
	}
};

/**
 * Vertex normals are used to calculate the lighting on specific vertices. A normal describes
 * which way the vertex is "facing". You can think of the normal as a line that is perpendicular to a plane.
 *
 * So, a normal contains an X, Y, and Z component.
 *
 * So, a normal of (0, 1, 0) means that the vertex is facing straight up along the y-axis.
 * In this case, that normal would reflect 100% of a light source that were shining straight down.
 *
 * A normal of (0, 0, 1) would mean that the vertex if facing straight down the z-axis.
 * In this case, that normal would reflect 0% of a light source that were shining straight down.
 *
 * Think of it as if the sun were directly above you.
 * - If you hold your arms straight out beside your body, that is the x-axis.
 * - Directly in front of you, and behind you is the z-axis.
 * - And straight up/down is the y-axis.
 *
 * If the sun were shining down from directly above you, and you held a piece of paper.
 * - If it was flat- normal = (0, 1, 0)- then it would reflect all the light.
 * - If you rotated the piece of paper 90 degrees (so it is standing on its edge), the face of the paper would reflect none of the light.
 *
 * For our calculations, we have a TRIANGLE STRIP that creates right-angled triangles.
 *													___
 *  |\		Half the time, due to the nature of 	\  |
 *  |1\	   TRIANGLE_STRIPs, our triangle will look	 \2|
 *  |__\	like (1) and half the time like (2)		  \|
 *																_
 * So we set our base point to be where the right-angle ( |_ or  | ) occurs.
 * We then draw two lines; one to each point. One along the x-axis and one along the z-axis.
 * These two lines create a plane, and we can use awesome math (specifically cross products),
 * to calculate the normal (perpendicular vector) to the two lines of our plane.
 *
 * We throw in some logic to check whether our triangle looks like (1) or (2) when
 * calculating the lines of our plane.
 */
GLTerrain.prototype.initNormals = function () {
	"use strict";
	var c = 0,				// The vertex column we're on.
		r = 0,				// The vertex row we're on.
		i = 0,				// An index value that refers to our vertex.
		n = vec3.create(),	// Our reusable normal vector.
		v1 = null,			// The x-axis line/vector.
		v2 = null;			// The z-axis line/vector.
	try {
		/* We start with no normals. */
		this.normals = [];

		/* Cycle through all of our vertices. */
		for (r = 0; r <= this.rows; r = r + 1) {
			for (c = 0; c <= this.cols; c = c + 1) {
				/* Base position for this vertex. */
				i = r * (this.cols + 1) + c;

				/* X-axis vector. Store in: n */
				v1 = Math.max(r * (this.cols + 1), i - 1) * 3;
				v2 = Math.min(r * (this.cols + 1) + this.cols, i + 1) * 3;
				v1 = vec3.create([this.vertices[v1], this.vertices[v1 + 1], this.vertices[v1 + 2]]);
				v2 = vec3.create([this.vertices[v2], this.vertices[v2 + 1], this.vertices[v2 + 2]]);
				vec3.subtract(v1, v2, n);

				/* Z-axis vector. Store in: v1 */
				v1 = Math.max(i - (this.cols + 1), c) * 3;
				v2 = Math.min(i + (this.cols + 1), this.rows * (this.cols + 1) + c) * 3;
				v1 = vec3.create([this.vertices[v1], this.vertices[v1 + 1], this.vertices[v1 + 2]]);
				v2 = vec3.create([this.vertices[v2], this.vertices[v2 + 1], this.vertices[v2 + 2]]);
				vec3.subtract(v2, v1, v1);

				/* Cross n and v1 to get normal. Store in: n */
				vec3.cross(n, v1, n);
				vec3.normalize(n, n);

				/* Store this normal. */
				this.normals.push(n[0], n[1], n[2]);
			}
		}
	} catch (err) {
		console.log("GLTerrain.initNormals: " + err);
	}
};

/**
 * Triangle vertices are defined in the following order (4x4 example):
 * 
 * 24 23 22 21 20
 * 19 18 17 16 15
 * 14 13 12 11 10
 *  9  8  7  6  5
 *  4  3  2  1  0
 *
 * We define a few variables now:
 *   i tells us which column the object is in.
 *   j tells us which row the object is in.
 *     These two together let us use the formula below (y = ...) to pick a vertex.
 *   x and z tells us how close [0.0 to 1.0) we are to being in the next row and column; respectively.
 *     The percentage of the current tile we have traveled.
 *
 * The corresponding index buffer would be:
 *
 * Array Index  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39
 * Vertex Row0  0 5 1 6 2 7 3 8 4 9
 *        Row1                       9 14  8 13  7 12  6 11  5 10
 *        Row2                                                    10 15 11 16 12 17 13 18 14 19
 *        Row3                                                                                  19 24 18 23 17 22 16 21 15 20
 *
 * (Formatted to show duplication of vertices when changing rows; also to highlight odd and even rows.)
 * 
 * This creates a 5x5 triangle strip that looks as follows:
 *
 * 				Finish
 *      		v
 *      |\|\|\|\|
 *      |/|/|/|/|
 *      |\|\|\|\|
 *      |/|/|/|/|
 *              ^
 *              Start
 *
 * This results in rows that have an alternating triangle pattern. Therefore
 * below, we need to pick the correct three vertices based on:
 * 1) Are we on an odd / or even row \ (i.e. which day does the divider slant); and
 * 2) Are we to the left or right of the divider.
 *
 * TODO: There must be some way to optimize this.
 */
GLTerrain.prototype.getY = function (x, z) {
	"use strict";
	var y = 0.0,	// The height of our base vertex.
		c = 0.0,	// The height of our x-axis neighbour.
		s = 0.0,	// The height of our z-axis neighbour.
		v = 0.0,	// Will store this.cols to minimize access calls.
		i = 0,		// The vertex column we are in.
		j = 0;		// The vertex row we are in.
	try {
		v = this.cols;

		/* Translate our world X and Z coordinates to an equivalent position in our vertex grid. */
		x = (-x + (this.width / 2.0)) / this.width * v;
		z = (-z + (this.depth / 2.0)) / this.depth * this.rows;

		/* If we are outside of the boundaries for our vertex grid, return a height of 0.0. */
		if (x < 0.0 || z < 0.0 || x > v || z > this.rows) {
			return 0.0;
		} else {
			/**
			 * Round our position down to the neareast whole column/row value.
			 * 
			 * Example:
			 * - We are at column 30.42
			 * - We are at row 10.87
			 */
			i = Math.floor(x);	// Our base column.						Example: 30.
			j = Math.floor(z);	// Our base row.						Example: 10.
			x = x - i;			// How "far into" the column are we?	Example: 0.42 or 42%.
			z = z - j;			// How "far into" the row are we?		Example: 0.87 or 87%.

			/* This checks whether we are on an odd or even column because our triangles look different based on that. */
			if (j % 2 === 0) {
				/* Next we check whether we are on the left or right side of the divider and we calculate our y-axis index. */
				if (x + z < 1.0) {
					y = (j * (v + 1) + i) * 3 + 1;
					c = (j * (v + 1) + (i + 1)) * 3 + 1;
					s = ((j + 1) * (v + 1) + i) * 3 + 1;
				} else {
					x = 1.0 - x;
					z = 1.0 - z;
					y = ((j + 1) * (v + 1) + (i + 1)) * 3 + 1;
					c = ((j + 1) * (v + 1) + i) * 3 + 1;
					s = (j * (v + 1) + (i + 1)) * 3 + 1;
				}
			} else {
				/* Next we check whether we are on the left or right side of the divider and we calculate our y-axis index. */
				z = 1.0 - z;
				if (x + z < 1.0) {
					y = ((j + 1) * (v + 1) + i) * 3 + 1;
					c = ((j + 1) * (v + 1) + (i + 1)) * 3 + 1;
					s = (j * (v + 1) + i) * 3 + 1;
				} else {
					x = 1.0 - x;
					z = 1.0 - z;
					y = (j * (v + 1) + (i + 1)) * 3 + 1;
					c = (j * (v + 1) + i) * 3 + 1;
					s = ((j + 1) * (v + 1) + (i + 1)) * 3 + 1;
				}
			}
			y = this.vertices[y];	// Get the y-value for our base vertex.
			c = this.vertices[c];	// Get the y-value for our neighbouring x-axis vertex.
			s = this.vertices[s];	// Get the y-value for our neighbouring z-axis vertex.
			y = y + (s - y) * z + (c - y) * x;	// Based on how "far into" the triangle we are, adjust our base vertex height based on the slope (rate of incline/decline) towards our neighbours.
			return y;
		}
	} catch (err) {
		console.log("GLTerrain.getY: " + err);
	}
	return 0.0; // If something went wrong, return a height of 0.0.
};