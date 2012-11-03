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

/*global window, document, console, img, XMLHttpRequest */

/**
 * AssetManager.js provides a mechanism to ensure specific resources are loaded before
 * our application starts running. We also use it to retrieve Shader files during runtime.
 */

var AssetManager = function () {
	'use strict';

	/* A list of tags that we need to process before we fire our PreloadComplete event. */
	this.required = [
		'json.terrain',
		'html.bbm',
		'html.about',
		'html.license'
	];

	/* Preparing a placeholder for the terrain JSON. */
	this.json = {
		'terrain': null
	};

	/* Start with the first element. */
	this.preload(this.required[0]);
};

AssetManager.prototype.preload = function (id) {
	'use strict';
	var _this, event, xhr;

	/* If nothing is left to load, fire our PreloadComplete event. */
	if (this.required.length === 0) {
		delete this.required;
		event = document.createEvent('Event');
		event.initEvent('PreloadComplete', false, false);
		document.dispatchEvent(event);
	} else {
		if (id === 'json.terrain') {
			/* If we're loading json.terrain... */
			_this = this;
			xhr = new XMLHttpRequest();
			xhr.open('GET', './json/terrain.json', true);
			xhr.onreadystatechange = function () {
				if (this.readyState === 4) {
					_this.json.terrain = JSON.parse(this.response);
					_this.required.shift();
					_this.preload(_this.required[0]);
				}
			};
			xhr.send();
		} else if (id === 'html.bbm') {
			/* If we're loading html.bbm... */
			_this = this;
			xhr = new XMLHttpRequest();
			xhr.open('GET', './html/bbm.html', true);
			xhr.onreadystatechange = function () {
				if (this.readyState === 4) {
					document.querySelector('#bbm').innerHTML = this.response;

					_this.required.shift();
					_this.preload(_this.required[0]);
				}
			};
			xhr.send();
		} else if (id === 'html.about') {
			/* If we're loading html.about... */
			_this = this;
			xhr = new XMLHttpRequest();
			xhr.open('GET', './html/about.html', true);
			xhr.onreadystatechange = function () {
				if (this.readyState === 4) {
					document.querySelector('#about').innerHTML = this.response;

					_this.required.shift();
					_this.preload(_this.required[0]);
				}
			};
			xhr.send();
		} else if (id === 'html.license') {
			/* If we're loading html.license... */
			_this = this;
			xhr = new XMLHttpRequest();
			xhr.open('GET', './html/license.html', true);
			xhr.onreadystatechange = function () {
				if (this.readyState === 4) {
					document.querySelector('#license').innerHTML = this.response;

					_this.required.shift();
					_this.preload(_this.required[0]);
				}
			};
			xhr.send();
		}
	}
};

/* Retreives a shader during runtime. */
AssetManager.prototype.getShader = function (gl, path, type) {
	'use strict';
	var xhr, shader;

	try {
		xhr = new XMLHttpRequest();
		xhr.open("GET", path, false);
		xhr.send();

		shader = gl.createShader(type);
		gl.shaderSource(shader, xhr.responseText);
		gl.compileShader(shader);

		return shader;
	} catch (err) {
		console.log("utils.getShader: " + err.message);
	}
	return null;
};