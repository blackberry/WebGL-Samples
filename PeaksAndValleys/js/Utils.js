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

/**
 * Utils.js provides a common set of functionality. 
 */

var Utils = {
	/* Ensures that val is between low and high. */
	clamp: function (val, low, high) {
		'use strict';

		while (val < low) { val += (high - low); }
		while (val >= high) {val -= (high - low); }
		return val;
	},

	/* Checks whether a rectangle contains a point. */
	contains: function (rect, point) {
		if (point[0] < rect[0]) { return false; }
		if (point[0] > rect[0] + rect[2]) { return false; }
		if (point[1] < rect[1]) { return false; }
		if (point[1] > rect[1] + rect[3]) { return false; }
		return true;
	}
};