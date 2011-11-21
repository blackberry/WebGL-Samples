/*
* Copyright (c) 2011 Research In Motion Limited.
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

// Defaults to mouse / touch unless we are running in WebWorks which supports accelerometer events
var useMouse = true;

// Keep track of mouse / touch state
var mouseDown = false;
var mouseStart = 0;
var mouseX = 0;

// When the user presses the left mouse button or puts a finger down we need to keep track of the 
// current rotation speed
var currentRotationSpeed = 0;

// Input related constants
var MOUSE_SENSITIVITY = 0.008;
var ACCELEROMETER_SENSITIVITY = 8.0;
var DECELERATION = 2;
var BALLGLOW_OFFSET_FACTOR = 0.075;

/**
 *  Mouse down handler (used when accelerometer events are not supported)
 */
function handleMouseDown(event) {
    currentRotationSpeed = ball.rotationSpeed; 
    mouseDown = true;
    mouseStart = event.clientX;
    mouseX = event.clientX;
}

/**
 *  Mouse up handler (used when accelerometer events are not supported)
 */
function handleMouseUp(event) {
    mouseStart = 0;
    mouseX = 0;
    mouseDown = false;
}

/**
 *  Mouse move handler (used when accelerometer events are not supported)
 */
function handleMouseMove(event) {
    if (mouseDown)
        mouseX = event.clientX;
    event.preventDefault();
}

/**
 *  If we're running in the WebWorks platform setup accelerometer events.
 */
function setupAccelerometerIfAvailable() {
    var browser = navigator.userAgent;
    // Are we running in a PlayBook browser?
    if (browser.indexOf("PlayBook") > -1) {
        // Are we running in WebWorks
        if (typeof blackberry != 'undefined') {
            useMouse = false;
            blackberry.custom.accelerometer.startAccelerometer();
        }
    }
}

/**
 *  Setup our event handler. In WebWorks this should default to an accelerometer 
 *  handler and on other platforms a mouse / touch handler.
 */
function setupEventHandler() {
    setupAccelerometerIfAvailable();

    // If we don't support accelerometer events, setup our mouse / touch handlers
    if (useMouse) {
        var canvas = document.getElementById('canvas');
        canvas.onmousedown   = handleMouseDown;
        document.onmouseup   = handleMouseUp;
        document.onmousemove = handleMouseMove;
    }
}

/**
 *  Resets the event handler variables.
 */
function resetEventHandler() {
    currentRotationSpeed = 0;

    if (useMouse) {
        mouseX = 0;
        mouseStart = 0;
    }
}

/**
 *  Function that handles the appropriate input events (mouse/touch or accelerometer)
 */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 *  Handles mouse / touch and accelerometer events. To be more specific, these events are used
 *  to modify the balls rotational velocity in the cylinder and in turn the offset of the ball
 *  from its glow.
 */
function handleInput(elapsedTime) {
    if (useMouse) {
        if (mouseDown) {
            ball.rotationSpeed = clamp(currentRotationSpeed + MOUSE_SENSITIVITY * (mouseStart - mouseX),
                                       -ball.maxRotationSpeed, ball.maxRotationSpeed);
        } else {
            if (ball.rotationSpeed > 0)
                ball.rotationSpeed = Math.max(0, ball.rotationSpeed - DECELERATION * elapsedTime);
            else if (ball.rotationSpeed < 0)
                ball.rotationSpeed = Math.min(0, ball.rotationSpeed + DECELERATION * elapsedTime);
        }
    } else {
        ball.rotationSpeed = clamp(ACCELEROMETER_SENSITIVITY * blackberry.custom.accelerometer.getAccelX(),
                                   -ball.maxRotationSpeed, ball.maxRotationSpeed);
    }

    cylinder.angle += ball.rotationSpeed * elapsedTime;
    ball.glowOffset = BALLGLOW_OFFSET_FACTOR * ball.rotationSpeed;
}

