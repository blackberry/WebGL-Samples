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

/*global console, require */

var fs = require('fs'),
	PNG = require('png-js'),
	sylvester = require('sylvester'),
	Matrix = sylvester.Matrix,
	Vector = sylvester.Vector;

function dec5(value) {
	'use strict';
	return Math.round(value * 100000) / 100000;
}

function dowork(config, data) {
	'use strict';
	var d_x, d_z, s_xz, s_y, s_t, av_n, json, x, z, h, b, m, n, rm, rn, su, sv, u, v, v1, v2;

	/* Our parameters. */
	d_x = config.d_x;
	d_z = config.d_z;
	s_xz = config.s_xz;
	s_y = config.s_y;
	s_t = config.s_t;
	av_n = config.av_n;

	/* Our JSON object. */
	json = {
		width: d_x,
		height: d_z,
		tileSize: s_xz,
		vertices: [],
		coords: [],
		normals: []
	};

	/* Smooth vertices and textures. */
	su = 1.0 / (d_x / s_t);
	sv = 1.0 / (d_z / s_t);
	v = 0.0;
	for (z = 0.0; z < d_z; z = z + 1.0) {
		u = 0.0;
		for (x = 0.0; x < d_x; x = x + 1.0) {
			/* Smooth vertices. */
			h = 0.0;
			b = 0.0;
			for (n = z - av_n; n <= z + av_n; n = n + 1.0) {
				rn = n;
				if (rn < 0.0) {
					rn = rn + d_z;
				} else if (rn >= d_z) {
					rn = rn - d_z;
				}
				for (m = x - av_n; m <= x + av_n; m = m + 1.0) {
					rm = m;
					if (rm < 0.0) {
						rm = rm + d_x;
					} else if (rm >= d_x) {
						rm = rm - d_x;
					}

					h = h + data[Math.floor((rn * d_x + rm) * 4.0 + 1.0)];
					b = b + 1.0;
				}
			}
			h = ((h / b) / 255.0) * s_y;

			/* Store vertices. */
			json.vertices.push(dec5(h));

			/* Store textures. */
			json.coords.push(dec5(u));
			json.coords.push(dec5(v));

			/* Increment textures. */
			u = u + su;
			if (u >= 1.0) {
				u = u - 1.0;
			}
		}
		/* Increment textures. */
		v = v + sv;
		if (v >= 1.0) {
			v = v - 1.0;
		}
	}

	/* Normals. */
	n = Vector.create([0, 0, 0]);
	for (z = 0.0; z < d_z; z = z + 1.0) {
		for (x = 0.0; x < d_x; x = x + 1.0) {
			/* Horizontal vector. */
			u = json.vertices[Math.floor((z * d_x + Math.max(0.0,		x - 1.0)) + 1.0)];
			v = json.vertices[Math.floor((z * d_x + Math.min(d_x - 1.0, x + 1.0)) + 1.0)];
			v1 = Vector.create([s_xz * 2.0, v - u, 0.0]);

			u = json.vertices[Math.floor((Math.max(0.0,			z - 1.0) * d_x + x) + 1.0)];
			v = json.vertices[Math.floor((Math.min(d_z - 1.0,	z + 1.0) * d_x + x) + 1.0)];
			v2 = Vector.create([0.0, v - u, s_xz * 2.0]);

			/* Create normal. */
			n = v1.cross(v2);
			m = Math.sqrt((n.e(1) * n.e(1)) + (n.e(2) * n.e(2)) + (n.e(3) * n.e(3)));
			n = Vector.create([n.e(1) / m, n.e(2) / m, n.e(3) / m]);
			json.normals.push(dec5(n.e(1)), dec5(n.e(2)), dec5(n.e(3)));
		}
	}

	/* Write this to a file. */
	fs.writeFile('../../json/terrain.json', JSON.stringify(json), function (err) {
		if (err) { return console.log(err); }
		console.log('Complete.');
	});
}

fs.readFile('config.json', 'utf8', function (err, data) {
	'use strict';
	var config;

	if (err) { return console.log(err); }

	config = JSON.parse(data);
	PNG.decode(config.file, function (pixels) {
		dowork(config, pixels);
	});
});