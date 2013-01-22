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

/*global window, document, console */

/**
 * Freewill.js handles our multitouch input controls allowing for easy addition
 * of Joysticks and Buttons to the DOM.
 */

var Freewill = function (params) {
	'use strict';
	var Freewill, controls;

	/* We require a container when initailizing Freewill. Ironic. */
	if (typeof params.container === 'undefined') {
		console.log('Missing required parameter: container');
	} else {
		Freewill = this;

		/* Initialize our controls arrays. */
		controls = this.controls = [];
		this.container = params.container;
		this.container.style.position = 'fixed';
		this.container.style.left = '0px'; this.container.style.right = '0px';
		this.container.style.top = '0px'; this.container.style.bottom = '0px';
		this.container.style.border = '0px'; this.container.style.margin = '0px'; this.container.style.padding = '0px';
		this.container.style.overflow = 'hidden';
		this.container.style.zIndex = '999';

		/* The global 'touchstart' listener for the container. Will cycle through all of our
		 * controls to find the appropriate owner.
		 */
		this.container.addEventListener('touchstart', function (e) {
			var touches, touch, point, control, m, n;

			touches = e.changedTouches;
			for (n = 0; n < touches.length; n = n + 1) {
				touch = touches[n];
				point = [touch.clientX, touch.clientY];
				for (m = 0; m < controls.length; m = m + 1) {
					control = controls[m];
					if (Freewill.contains(control.trigger, point) === true) {
						control.identifier = touch.identifier;
						control._onTouchStart(touch, point);
					}
				}
			}
		}, false);

		/* The global 'touchmove' listener for the container. Will cycle through all of our
		 * controls to find the appropriate owner.
		 */
		this.container.addEventListener('touchmove', function (e) {
			var touches, touch, point, control, m, n;

			touches = e.changedTouches;
			for (n = 0; n < touches.length; n = n + 1) {
				touch = touches[n];
				point = [touch.clientX, touch.clientY];
				for (m = 0; m < controls.length; m = m + 1) {
					control = controls[m];
					if (touch.identifier === control.identifier) {
						control._onTouchMove(touch, point);
					}
				}
			}
		}, false);

		/* The global 'touchend' listener for the container. Will cycle through all of our
		 * controls to find the appropriate owner.
		 */
		this.container.addEventListener('touchend', function (e) {
			var touches, touch, point, control, m, n;

			touches = e.changedTouches;
			for (n = 0; n < touches.length; n = n + 1) {
				touch = touches[n];
				point = [touch.clientX, touch.clientY];
				for (m = 0; m < controls.length; m = m + 1) {
					control = controls[m];
					if (touch.identifier === control.identifier) {
						control._onTouchEnd(touch, point);
						control.identifier = -1;
					}
				}
			}
		}, false);
	}
};

/**
 * REQUIRED params
 * imageBase	- String: Path to image resource for joystick base.
 * imagePad		- String: Path to image resource for joystick pad.
 * fixed		- boolean: true if the joystick is stationary, false if the repositions to the touch point.
 * 
 * OPTIONAL params
 * pos			- []: Position on <canvas> to place this joystick. Default is [0, 0].
 * trigger		- []: Bounding box where touch points will trigger this joystick. Default area of joystick.
 * opacLow		- number: Minimum opacity of this control (0.0 - 1.0). Default 1.0.
 * opacHigh		- number: Maximum opacity of this control (0.0 - 1.0). Default 1.0.
 **/
Freewill.prototype.addJoystick = function (params) {
	'use strict';
	var _this, joystick, base, pad;

	/* Ensure that our required parameters are present. */
	if (typeof params.imageBase === 'undefined') {
		console.log('Missing required parameter: imageBase');
	} else if (typeof params.imagePad === 'undefined') {
		console.log('Missing required parameter: imagePad');
	} else if (typeof params.fixed === 'undefined') {
		console.log('Missing required parameter: fixed');
	} else {
		_this = this;
		joystick = document.createElement('canvas');
		joystick.className = 'freewill joystick';

		base = document.createElement('img');
		base.onload = function () {
			joystick.width = base.width;
			joystick.height = base.height;
			joystick.style.position = 'absolute';
			joystick.style.width = base.width;
			joystick.style.height = base.height;

			pad = document.createElement('img');
			pad.onload = function () {
				joystick.fixed = params.fixed;
				joystick.identifier = -1;
				joystick.velocity = [0.0, 0.0];
				joystick.direction = 0;
				joystick.context = joystick.getContext('2d');
				joystick.context.drawImage(base, 0.0, 0.0);
				joystick.context.drawImage(pad, (base.width - pad.width) / 2.0, (base.height - pad.height) / 2.0);

				/* Set the Joystick's position. */
				params.pos = typeof params.pos !== 'undefined' ? params.pos : [0.0, 0.0];
				joystick.style.left	= params.pos[0] + 'px';
				joystick.style.top	= params.pos[1] + 'px';

				/* Set the Joystick's trigger rectangle. */
				params.trigger = typeof params.trigger !== 'undefined' ? params.trigger : [params.pos[0], params.pos[1], base.width, base.height];
				joystick.trigger = params.trigger;

				/* Set the low and high opacity limits for the Joystick. */
				params.opacLow	= typeof params.opacLow !== 'undefined' ? params.opacLow : 1.0;
				params.opacHigh	= typeof params.opacHigh !== 'undefined' ? params.opacHigh : 1.0;
				joystick.opacLow		= params.opacLow;
				joystick.opacHigh		= params.opacHigh;
				joystick.style.opacity	= joystick.opacLow;

				/* Default behaviour when a touchstart event occurs for a Joystick. */
				joystick._onTouchStart = function (touch, point) {
					/* Start fading in the control. */
					this.style.opacity = this.opacHigh;

					/* If this Joystick is free-floating, reposition it to this touch point's coordinates. */
					if (this.fixed === false) {
						this.style.left	= (point[0] - base.width / 2.0) + 'px';
						this.style.top	= (point[1] - base.height / 2.0) + 'px';
						this.x = point[0];
						this.y = point[1];

						/* Draw the control. */
						this.context.clearRect(0.0, 0.0, this.width, this.height);
						this.context.drawImage(base, 0.0, 0.0);
						this.context.drawImage(pad, (base.width - pad.width) / 2.0, (base.height - pad.height) / 2.0);
					} else {
						this.x = parseFloat(this.style.left.replace('px', '')) + base.width / 2.0;
						this.y = parseFloat(this.style.top.replace('px', '')) + base.height / 2.0;

						/* Draw the control based on movement from center. */
						this._onTouchMove(touch, point);
					}



					/* If there is a user-defined onTouchStart function, invoke it now. */
					if (this.onTouchStart) {
						this.onTouchStart(touch, point);
					}
				};

				/* Default behaviour when a touchmove event occurs for a Joystick. */
				joystick._onTouchMove = function (touch, point) {
					/* We will use these variables to calculate where the touch is in relation to the Joystick base. */
					var dx, dy, r, _r;

					/* The delta X and delta Y values between the touch point and Joystick base. */
					dx = point[0] - this.x;
					dy = point[1] - this.y;

					/* The absolute radius (distance) between the Joystick base and the touch point. */
					r = Math.sqrt(dx * dx + dy * dy);

					/* Our Joystick pad's position will not be allowed to exceed 40.0 pixels from the center of the Joystick base. */
					_r = Math.min(r, 40.0);

					/* Recalculate the delta X based on the shortened radius. */
					dx = dx * _r / r;
					if (isNaN(dx) === true) {
						dx = 0.0;
					}

					/* Recalculate the delta Y based on the shortened radius. */
					dy = dy * _r / r;
					if (isNaN(dy) === true) {
						dy = 0.0;
					}

					/* We keep track of a velocity for this Joystick (i.e. how far away from the center is the Joystick pad.) */
					this.velocity = [dx, dy];

					/**
					 * Each Joystick is 8-directional. The direction is an integer corresponding to a compass direction:
					 * 0: West, 1: NorthWest, 2: North, 3: NorthEast, 4: East, 5: SouthEast, 6: South, 7: SouthWest
					 * The formula below leverages the dy and dx values calculated to find which region the touch point inhabits,
					 * in relation to the Joystick.
					 */
					this.direction = Math.floor(4 + (-Math.atan2(dy, dx) + Math.PI / 8) * 4 / Math.PI) % 8;

					/* Draw the control. */
					this.context.clearRect(0.0, 0.0, this.width, this.height);
					this.context.drawImage(base, 0.0, 0.0);
					this.context.drawImage(pad, dx + (base.width - pad.width) / 2.0, dy + (base.height - pad.height) / 2.0);

					/* If there is user-defined onTouchMove function, invoke it now. */
					if (this.onTouchMove) {
						this.onTouchMove(touch, point);
					}
				};

				/* Default behaviour when a touchend event occurs for a Joystick. */
				joystick._onTouchEnd = function (touch, point) {
					/* Reset the velocity of this Joystick to zeros. */
					this.velocity = [0.0, 0.0];

					/* Draw the control. */
					this.context.clearRect(0.0, 0.0, this.width, this.height);
					this.context.drawImage(base, 0.0, 0.0);
					this.context.drawImage(pad, (base.width - pad.width) / 2.0, (base.height - pad.height) / 2.0);

					/* If there is a user-defined onTouchEnd function, invoke it now. */
					if (this.onTouchEnd) {
						this.onTouchEnd(touch, point);
					}

					/* Start fading out the control. */
					this.style.opacity = this.opacLow;
				};

				/* Store our control. */
				_this.controls.push(joystick);
				_this.container.appendChild(joystick);
			};
			pad.src = params.imagePad;
		};
		base.src = params.imageBase;

		return joystick;
	}
};

/**
 * REQUIRED params
 * image		- String: Path to image resource for the button.
 * pos			- []: Position on <canvas> to place this button. Default is [0, 0].
 * 
 * OPTIONAL params
 * trigger		- []: Bounding box where touch points will trigger this button. Default area of button.
 * opacLow		- number: Minimum opacity of this control (0.0 - 1.0). Default 1.0.
 * opacHigh		- number: Maximum opacity of this control (0.0 - 1.0). Default 1.0.
 **/
Freewill.prototype.addButton = function (params) {
	'use strict';
	var _this, image, button;

	/* Ensure that our required parameters are present. */
	if (typeof params.image === 'undefined') {
		console.log('Missing required parameter: image');
	} else if (typeof params.pos === 'undefined') {
		console.log('Missing required parameter: pos');
	} else {
		_this = this;
		button = document.createElement('canvas');
		button.className = 'freewill button';

		image = document.createElement('img');
		image.onload = function () {
			button.width = image.width;
			button.height = image.height;
			button.style.position = 'absolute';
			button.style.width = image.width + 'px';
			button.style.height = image.height + 'px';
			button.getContext('2d').drawImage(image, 0, 0);
			button.identifier = -1;

			/* Set the Button's position. */
			params.pos = typeof params.pos !== 'undefined' ? params.pos : [0.0, 0.0];
			button.style.left	= params.pos[0] + 'px';
			button.style.top	= params.pos[1] + 'px';

			/* Set the Button's trigger rectangle. */
			params.trigger = typeof params.trigger !== 'undefined' ? params.trigger : [params.pos[0], params.pos[1], image.width, image.height];
			button.trigger = params.trigger;

			/* Set the low and high opacity limits for the Button. */
			params.opacLow	= typeof params.opacLow !== 'undefined' ? params.opacLow : 1.0;
			params.opacHigh = typeof params.opacHigh !== 'undefined' ? params.opacHigh : 1.0;
			button.opacLow			= params.opacLow;
			button.opacHigh			= params.opacHigh;
			button.style.opacity	= button.opacLow;

			/* Default behaviour when a touchstart event occurs for a Button. */
			button._onTouchStart = function (touch, point) {
				/* Start fading in the button. */
				this.style.opacity = this.opacHigh;

				/* If there is a user-defined onTouchStart function, invoke it now. */
				if (this.onTouchStart) {
					this.onTouchStart(touch, point);
				}
			};

			/* Default behaviour when a touchmove event occurs for a Button. */
			button._onTouchMove = function (touch, point) {
				/* If there is a user-defined onTouchMove function, invoke it now. */
				if (this.onTouchMove) {
					this.onTouchMove(touch, point);
				}
			};

			/* Default behaviour when a touchend event occurs for a Button. */
			button._onTouchEnd = function (touch, point) {
				/* If there is a user-defined onTouchEnd function, invoke it now. */
				if (this.onTouchEnd) {
					this.onTouchEnd(touch, point);
				}

				/* Start fading out our button. */
				this.style.opacity = this.opacLow;
			};

			/* Store our control. */
			_this.controls.push(button);
			_this.container.appendChild(button);
		};
		image.src = params.image;

		return button;
	}
};

/* Check whether a point exists within an area. */
Freewill.prototype.contains = function (area, point) {
	if (point[0] < area[0]) { return false; }
	if (point[0] > area[0] + area[2]) { return false; }
	if (point[1] < area[1]) { return false; }
	if (point[1] > area[1] + area[3]) { return false; }
	return true;
};