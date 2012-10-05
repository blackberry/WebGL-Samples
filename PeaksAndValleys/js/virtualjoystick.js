/*global window, document, console */

/**
 * This JavaScript code was obtained from:
 * https://github.com/jeromeetienne/virtualjoystick.js
 *
 * And is used under the MIT license described here:
 * https://github.com/jeromeetienne/virtualjoystick.js/blob/master/MIT-LICENSE.txt
 * 
 *     Copyright (c) 2011 Jerome Etienne, http://jetienne.com

 *     Permission is hereby granted, free of charge, to any person obtaining
 *     a copy of this software and associated documentation files (the
 *     "Software"), to deal in the Software without restriction, including
 *     without limitation the rights to use, copy, modify, merge, publish,
 *     distribute, sublicense, and/or sell copies of the Software, and to
 *     permit persons to whom the Software is furnished to do so, subject to
 *     the following conditions:
 *
 *     The above copyright notice and this permission notice shall be
 *     included in all copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *     LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *     OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *     WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * This code has been modified from the original in order to provide support for two distinct joysticks,
 * each targeted to be controlled from opposite sides of the screen. A crosshair has also been implemented
 * into this library.
 *
 * Additional modifications have been made to formatting, commenting, and debugging, and unused code was removed.
 */

var VirtualJoystick	= function () {
	"use strict";
	var touchPoint = null,			// Represents a single touch point.
		colours = ["blue", "red"],	// The colours of of our joysticks for easier distinction.
		i = 0,						// An index counter.
		cross = null,				// The crosshairs we will render.
		__bind = null;
	try {
		this.touchPoints = [[], []];	// We will have two touch points.
		this.links = [0, 0, 0];			// This helps us keep track of which touch point coincides with 

		/* Associate these controls with our WebGL <div>. */
		this._container = document.querySelector("#easle");

		/* Build each touch point control. */
		for (i = 0; i < this.touchPoints.length; i = i + 1) {
			touchPoint = this.touchPoints[i];

			/* The base of the joystick. */
			touchPoint._baseEl = this._buildJoystickBase(colours[i]);
			touchPoint._baseEl.style.position = "absolute";
			touchPoint._baseEl.style.display = "none";
			this._container.appendChild(touchPoint._baseEl);

			/* The moving control of the joystick. */
			touchPoint._stickEl = this._buildJoystickStick(colours[i]);
			touchPoint._stickEl.style.position = "absolute";
			touchPoint._stickEl.style.display = "none";
			this._container.appendChild(touchPoint._stickEl);

			/* Initialize touch point parameters. */
			touchPoint._pressed = false;
			touchPoint._baseX = 0;
			touchPoint._baseY = 0;
			touchPoint._stickX = 0;
			touchPoint._stickY = 0;
		}

		/* Build the crosshairs and display them. Dimensions are hardcoded for a PlayBook display. */
		cross = this._buildCrossHairs("cyan");
		cross.style.position = "absolute";
		cross.style.display = "";
		cross.style.left = (window.innerWidth / 2.0 - 16.0) + "px";
		cross.style.top = ((window.innerHeight - 88.0) / 2.0 - 16.0) + "px";
		this._container.appendChild(cross);

		__bind = function (fn, me) {
			return function () {
				return fn.apply(me, arguments);
			};
		};

		/* Bind our various events to be handled. */
		this._$onTouchStart = __bind(this._onTouchStart, this);
		this._$onTouchEnd = __bind(this._onTouchEnd, this);
		this._$onTouchMove = __bind(this._onTouchMove, this);
		this._container.addEventListener('touchstart', this._$onTouchStart, false);
		this._container.addEventListener('touchend', this._$onTouchEnd, false);
		this._container.addEventListener('touchmove', this._$onTouchMove, false);
		this._$onMouseDown = __bind(this._onMouseDown, this);
		this._$onMouseUp = __bind(this._onMouseUp, this);
		this._$onMouseMove = __bind(this._onMouseMove, this);
		this._container.addEventListener('mousedown', this._$onMouseDown, false);
		this._container.addEventListener('mouseup', this._$onMouseUp, false);
		this._container.addEventListener('mousemove', this._$onMouseMove, false);
	} catch (err) {
		console.log("VirtualJoystick: " + err);
	}
};

VirtualJoystick.prototype.destroy = function () {
	"use strict";
	var touchPoint = null,
		i = 0;
	try {
		for (i = 0; i < this.touchPoints.length; i = i + 1) {
			touchPoint = this.touchPoints[i];
			this._container.removeChild(touchPoint._baseEl);
			this._container.removeChild(touchPoint._stickEl);
		}

		this._container.removeEventListener('touchstart', this._$onTouchStart, false);
		this._container.removeEventListener('touchend', this._$onTouchEnd, false);
		this._container.removeEventListener('touchmove', this._$onTouchMove, false);
		this._container.removeEventListener('mouseup', this._$onMouseUp, false);
		this._container.removeEventListener('mousedown', this._$onMouseDown, false);
		this._container.removeEventListener('mousemove', this._$onMouseMove, false);
	} catch (err) {
		console.log("VirtualJoystick.destroy: " + err);
	}
};

/**
 * This function will return the amount that the joysticks have moved horizontally.
 */
VirtualJoystick.prototype.deltaX = function (i) {
	"use strict";
	var touchPoint = this.touchPoints[i];
	return touchPoint._stickX - touchPoint._baseX;
};

/**
 * This function will return the amount that the joysticks have moved vertically.
 */
VirtualJoystick.prototype.deltaY = function (i) {
	"use strict";
	var touchPoint = this.touchPoints[i];
	return touchPoint._stickY - touchPoint._baseY;
};

/**
 * This function handles the onDown (mouse or touch) event.
 */
VirtualJoystick.prototype._onDown = function (link, x, y) {
	"use strict";
	/* Retrieve the link for this touch point. */
	var touchPoint = this.touchPoints[this.links[link]];
	try {
		/* Start displaying this joystick at the touch point. */
		touchPoint._pressed = true;
		touchPoint._baseX = x;
		touchPoint._baseY = y;
		touchPoint._stickX = x;
		touchPoint._stickY = y;

		touchPoint._stickEl.style.display = "";
		touchPoint._stickEl.style.left = (x - touchPoint._stickEl.width / 2) + "px";
		touchPoint._stickEl.style.top = (y - touchPoint._stickEl.height / 2) + "px";

		touchPoint._baseEl.style.display = "";
		touchPoint._baseEl.style.left = (x - touchPoint._baseEl.width / 2) + "px";
		touchPoint._baseEl.style.top = (y - touchPoint._baseEl.height / 2) + "px";
	} catch (err) {
		console.log("VirtualJoystick.onDown: " + err);
	}
};

/**
 * This function handles the onMove (mouse or touch) event.
 */
VirtualJoystick.prototype._onMove = function (link, x, y) {
	"use strict";
	/* Retrieve the link for this touch point. */
	var touchPoint = this.touchPoints[this.links[link]];
	try {
		/* Move the joystick along with the touch movement. */
		if (touchPoint._pressed === true) {
			touchPoint._stickX = x;
			touchPoint._stickY = y;
			touchPoint._stickEl.style.left = (x - touchPoint._stickEl.width / 2) + "px";
			touchPoint._stickEl.style.top = (y - touchPoint._stickEl.height / 2) + "px";
		}
	} catch (err) {
		console.log("VirtualJoystick.onMove: " + err);
	}
};

/**
 * This function handles the onUp (mouse or touch) event.
 */
VirtualJoystick.prototype._onUp = function (link) {
	"use strict";
	/* Retrieve the link for this touch point. */
	var touchPoint = this.touchPoints[this.links[link]];
	try {
		/* Stop rendering this touch point. */
		touchPoint._pressed = false;
		touchPoint._stickEl.style.display = "none";
		touchPoint._baseEl.style.display = "none";

		touchPoint._baseX = touchPoint._baseY = 0;
		touchPoint._stickX = touchPoint._stickY = 0;
	} catch (err) {
		console.log("VirtualJoystick.onUp: " + err);
	}
};

/**
 * When touch events are triggered, we are provided the touch point index. i.e. the first touch will have index 0, etc.
 * But we do not know whether the first/second touch is on the left or right side of the screen. 
 *
 * We need to keep track of which touch point refers to which joystick.
 *
 * In order to synchronize a joystick with a touch point, we use: this.links[i]
 * - i (0 or 1) refers to the i'th touch point to occur on the screen.
 * - this.links[] refers to the left (0) and right (1) joysticks.
 *
 * This can be confusing, so an example: links[1] = 0;
 * - This means that the second touch point on the screen (i = 1) corresponds to joystick 0 (the left joystick.)
 *
 * This way, when we're given the index of a touch point, we can leverage the link object to associate the required joystick.
 */

VirtualJoystick.prototype._onMouseDown = function (event) {
	"use strict";

	/* Only respond to touch events inside of our WebGL canvas. */
	if (event.clientY > window.innerWidth / 2.0) {
		return;
	}

	/* If the touch event occurs on the left side of the screen... */
	if (event.clientX < window.innerWidth / 2.0) {
		/* ...initialize links[0] to reference this.touchPoints[0]. */
		this.links[0] = 0;
	} else {
		/* ...otherwise links[0] references this.touchPoints[1]. */
		this.links[0] = 1;
	}
	return this._onDown(0, event.clientX, event.clientY);
};

VirtualJoystick.prototype._onMouseMove = function (event) {
	"use strict";
	/* Mouse will only ever have one touch point: 0 */
	return this._onMove(0, event.clientX, event.clientY);
};

VirtualJoystick.prototype._onMouseUp = function (event) {
	"use strict";
	/* Mouse will only ever have one touch point: 0 */
	return this._onUp(0);
};

/* A new touch point is created (i.e. user places finger on the screen.) */
VirtualJoystick.prototype._onTouchStart = function (event) {
	"use strict";
	var i = 0;
	try {
		/* Check that we're within our WebGL control. */
		if (event.clientY > window.innerWidth / 2.0) {
			return;
		}

		/* Prevent any usual events from triggering here, we want to handle touches. */
		event.preventDefault();

		/* Only accept up to 2 touches at a time. */
		if (event.touches.length > this.touchPoints.length) {
			return;
		}

		/* Link this touch point to the corresponding left or right joystick. */
		if (event.changedTouches[0].clientX < window.innerWidth / 2.0) {
			this.links[event.changedTouches[0].identifier] = 0;
		} else {
			this.links[event.changedTouches[0].identifier] = 1;
		}

		/* Process the changes for all of our changed touches. */
		for (i = 0; i < event.changedTouches.length; i = i + 1) {
			this._onDown(event.changedTouches[i].identifier, event.changedTouches[i].pageX, event.changedTouches[i].pageY);
		}
		return true;
	} catch (err) {
		console.log("VirtualJoystick.onTouchStart: " + err);
	}
};

/* An existing touch point has moved. */
VirtualJoystick.prototype._onTouchMove = function (event) {
	"use strict";
	var i = 0;
	try {
		/* Prevent any usual events from triggering here, we want to handle touches. */
		event.preventDefault();

		/* Only accept up to 2 touches at a time. */
		if (event.touches.length > this.touchPoints.length) {
			return;
		}

		/* Process the changes for all of our changed touches. */
		for (i = 0; i < event.changedTouches.length; i = i + 1) {
			this._onMove(event.changedTouches[i].identifier, event.changedTouches[i].pageX, event.changedTouches[i].pageY);
		}
		return true;
	} catch (err) {
		console.log("VirtualJoystick.onMove: " + err);
	}
};

VirtualJoystick.prototype._onTouchEnd = function (event) {
	"use strict";
	var i = 0;
	try {
		/* Prevent any usual events from triggering here, we want to handle touches. */
		event.preventDefault();

		/* Only accept up to 2 touches at a time. */
		if (event.touches.length > this.touchPoints.length) {
			return;
		}

		/* Process the changes for all of our changed touches. */
		for (i = 0; i < event.changedTouches.length; i = i + 1) {
			this._onUp(event.changedTouches[i].identifier);
		}
		return true;
	} catch (err) {
		console.log("VirtualJoystick.onTouchEnd: " + err);
	}
};

//////////////////////////////////////////////////////////////////////////////////
//		build default stickEl and baseEl				//
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype._buildJoystickBase = function (colour) {
	"use strict";
	var canvas = null,
		ctx = null;
	try {
		canvas = document.createElement('canvas');
		canvas.width = 126;
		canvas.height = 126;

		ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.lineWidth = 6;
		ctx.arc(canvas.width / 2, canvas.width / 2, 40, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "cyan";
		ctx.lineWidth = 2;
		ctx.arc(canvas.width / 2, canvas.width / 2, 60, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.stroke();
	} catch (err) {
		console.log("VirtualJoystick.buildJoystickBase: " + err);
	}
	return canvas;
};

VirtualJoystick.prototype._buildJoystickStick = function (colour) {
	"use strict";
	var canvas = null,
		ctx = null;
	try {
		canvas = document.createElement('canvas');
		canvas.width = 86;
		canvas.height = 86;

		ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.lineWidth = 6;
		ctx.arc(canvas.width / 2, canvas.width / 2, 40, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.stroke();
	} catch (err) {
		console.log("VirtualJoystick.buildJoystickStick: " + err);
	}
	return canvas;
};

VirtualJoystick.prototype._buildCrossHairs = function (colour) {
	"use strict";
	var canvas = null,
		ctx = null;
	try {
		canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 32;

		ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.strokeStyle = colour;
		ctx.lineWidth = 2;
		ctx.moveTo(canvas.width / 2.0, 0.0);
		ctx.lineTo(canvas.width / 2.0, canvas.height);
		ctx.moveTo(0.0, canvas.height / 2.0);
		ctx.lineTo(canvas.width, canvas.height / 2.0);
		ctx.closePath();
		ctx.stroke();
	} catch (err) {
		console.log("VirtualJoystick.buildJoystickStick: " + err);
	}
	return canvas;
};