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

// Simple constant for converting between radians and degrees
var RAD2DEG = 180 / Math.PI;

/**
 * If we are running this game in a desktop browser, we will use quads instead of point sprites
 * for drawing the ball and explosion effect
 */
var playbook = navigator.userAgent.indexOf("PlayBook") > -1 ? true : false;

/**
 *  Utility function to linearly interpolate between values a and b, according
 *  to the parameter t, which varies between 0 and 1.
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 *  Particles is used to setup the point sprites used in collision explosions. Velocity and
 *  size are passed in as attributes, and time is passed to the shader program to update 
 *  the point sprite size and alpha values.
 */
Particles = function() {
    // Arrays of particle velocities and sizes.
    this.velocityData = [];
    this.sizeData = [];
    if (!playbook) {
        var positions = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0, -1, -1, 0, 1, 1, 0];
        var texCoords = [0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1];
        this.positionData = [];
        this.texCoordData = [];
    }

    // Initial time, this varies from 0 to 1.
    this.time = 0;

    // Initialize all the particle data
    for(var i=0;i<200;i++) {
        var speed = 10.0 + Math.random() * 15.0;
        var angle = Math.random() * 2 * Math.PI;
        var angle2 = Math.random() * 2 * Math.PI;
        if (playbook) {
            this.velocityData[i*3] = speed * Math.cos(angle) * Math.sin(angle2);
            this.velocityData[i*3+1] = speed * Math.sin(angle) * Math.sin(angle2);
            this.velocityData[i*3+2] = speed * Math.cos(angle2);
            this.sizeData[i] = Math.random() * 100;
        } else {
            // Append quad size (6-verts per quad)
            var tempSize = Math.random() * 100;
            var concatSize = [tempSize, tempSize, tempSize, tempSize, tempSize, tempSize];
            this.sizeData = this.sizeData.concat(concatSize);

            // Append quad velocity (6-verts per quad)
            var tempVelocity = [speed * Math.cos(angle) * Math.sin(angle2), speed * Math.sin(angle) * Math.sin(angle2), speed * Math.cos(angle2)];
            var concatVelocity = [];
            for(var j=0; j<6;j++) {
                concatVelocity = concatVelocity.concat(tempVelocity);
            }
            this.velocityData = this.velocityData.concat(concatVelocity);

            // Append position and texture coordinates (6-verts per quad)
            this.positionData = this.positionData.concat(positions);
            this.texCoordData = this.texCoordData.concat(texCoords);
        }
    }

    // Create and fill the buffers with data
    this.velocityBuffer = createArrayBuffer(this.velocityData, 3);
    this.sizeBuffer = createArrayBuffer(this.sizeData, 1);
    if (!playbook) {
        this.positionBuffer = createArrayBuffer(this.positionData, 3);
        this.texCoordBuffer = createArrayBuffer(this.texCoordData, 2);
    }
}

/**
 *  Initialize the particle shader, and set the perspective matrix, since it
 *  doesn't change.
 */
Particles.prototype.initShader = function(perspective) {
    var uniforms = ["uPMatrix", "uSampler", "uTime"];
    if (playbook) {
        var attributes = ["aVelocity", "aSize"];
        this.shader = loadShader("particle-vs", "particle-fs", attributes, uniforms);
    } else {
        var attributes = ["aPosition", "aTextureCoord", "aVelocity", "aSize"];
        this.shader = loadShader("particle-quad-vs", "particle-quad-fs", attributes, uniforms);
    }
    gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, perspective);
}

/**
 *  Draws the particles. The modelview matrix is passed in for the ball so
 *  that particles are drawn at the right location. The elapsed time is 
 *  also provided so that particle properties can be updated with the 
 *  particle shader's time uniform.
 */
Particles.prototype.draw = function (ball_matrix, elapsedTime) {
    // Start using the correct shader
    gl.useProgram(this.shader);
    enableAttributes(this.shader);

    // Use the particle texture
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.shader.uniform["uSampler"], 0);
    this.texture.bind();

    // Update the time
    this.time += elapsedTime;

    // Enable blending - blending is expensive, so only use it as needed! 
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // Disable depth testing - the particles are all effectively 2D.
    gl.disable(gl.DEPTH_TEST);

    // Send the parameters to the shader
    gl.uniform1f(this.shader.uniform["uTime"], this.time);
    if (playbook)
        setVertexAttribs(this.shader, [this.velocityBuffer, this.sizeBuffer]);
    else
        setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer, this.velocityBuffer, this.sizeBuffer]);

    // Draw the points / quads. We don't actually draw all of them at all times,
    // to give a shimmering effect as particles appear and disappear.
    if (playbook)
        gl.drawArrays(gl.POINTS, 0, this.sizeData.length - Math.abs(Math.sin(this.time*Math.PI*2)*150));
    else
        gl.drawArrays(gl.TRIANGLES, 0, this.positionBuffer.numItems - Math.floor(Math.abs(Math.sin(this.time*Math.PI*2)*150))*6);

    // Re-enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Disable blending, we don't need it anymore
    gl.disable(gl.BLEND);

    // Cleanup the enabled attributes
    disableAttributes(this.shader);
}

Particles.prototype.reset = function () {
    this.time = 0;
}

Particles.prototype.setTexture = function(tex) {
    this.texture = tex;
}

/**
 *  Quad is how the walls are drawn, each as a simple textured square.
 *  All quads share the same vertex position and texture coordinates, and
 *  the actual locations are passed down as matrices to the shader.
 */
Quad = function () {
    // Create the shared buffers for all quads
    function createBuffers() {
        var positionData = [ 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0 ];
        var textureCoordData  = [ 0, 0, 0, 1, 1, 0, 1, 1 ];
 
        Quad.positionBuffer = createArrayBuffer(positionData, 3);
        Quad.texCoordBuffer = createArrayBuffer(textureCoordData, 2);
    }

    // Create the shared buffers only on the first time.
    if (!Quad.positionBuffer) {
        createBuffers();
    }
    this.positionBuffer = Quad.positionBuffer;
    this.texCoordBuffer = Quad.texCoordBuffer;

    // Set up transformation matrix, and send it to the shader.
    this.setMatrixUniforms = function(shader, matrix, pos, angle, scale) {
        var mvMatrix = mat4.create(matrix);
        mat4.translate(mvMatrix, pos);
        mat4.rotate(mvMatrix, angle, [0, 0, 1]);
        mat4.scale(mvMatrix, [scale, scale, scale]);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };
};

/**
 *  Draw the actual quad as a triangle strip.
 */
Quad.prototype.draw = function (shaderProgram, matrix, pos, angle, scale) {
    this.setMatrixUniforms(shaderProgram, matrix, pos, angle, scale);

    setVertexAttribs(shaderProgram, [this.positionBuffer, this.texCoordBuffer]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
};

/**
 *  The cylinder class encapsulates the whole tunnel. It is composed of a
 *  number of segments, positioned along a curve calculated by getTunnelOffset.
 *  The cylinder actually doesn't move; instead, the texture coordinates change
 *  to give the illusion of movement down the tunnel.
 */
Cylinder = function (subdivs, pos, length, radius) {
    // The number of segments in total, and the number of segments
    // forced to be straight to make the closest part of the tunnel straight.
    this.numSegments = 30;
    this.straightSegments = 4;

    this.acceleration = 0.2;

    var positionData = [];
    var textureCoordData = [];

    var z = pos[2];
    var zEnd = z - length;
    var segmentLength = length / this.numSegments;

    // Calculate the position of the segment along the curved tunnel.
    this.getTunnelOffset = function(segment) {
        if (segment < this.straightSegments+1)
            return 0;
        return radius * Math.cos((segment-this.straightSegments)*2*Math.PI / (this.numSegments-this.straightSegments)) - radius;
    }

    // Generate the coordinates for the tunnel, segment by segment.
    for (var segment=0; segment < this.numSegments; segment++) {
        z = pos[2] - (segment * segmentLength);
        zEnd = z - segmentLength;
        // Each segment is subdivided into a single triangle strip.
        for (var subdiv=0; subdiv <= subdivs; subdiv++) {
            var phi = subdiv * 2 * Math.PI / subdivs;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi;
            var y = sinPhi;
            var u = subdiv / subdivs;

            positionData.push(radius * x + this.getTunnelOffset(segment+1));
            positionData.push(radius * y);
            positionData.push(zEnd);
            textureCoordData.push(u);
            textureCoordData.push((segment+1) * 3 / this.numSegments);

            positionData.push(radius * x + this.getTunnelOffset(segment));
            positionData.push(radius * y);
            positionData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(segment * 3 / this.numSegments);
        }
    }

    // Create the buffers and fill them with data.
    this.positionBuffer = createArrayBuffer(positionData, 3);
    this.texCoordBuffer = createArrayBuffer(textureCoordData, 2);

    this.pos = pos || vec3.create([0,0,0]);
    this.length = length || 10;
    this.radius = radius || 5;
    this.reset();

    // Calculate the transformation on the cylinder. In this case, it's only
    // a rotation.
    this.setMatrixUniforms = function(shader) {
        var mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
        mat4.rotate(mvMatrix, this.angle, [0, 0, 1]);

        // Store the current matrix so that we can use it as a base for other
        // transformations (e.g. walls).
        shader.mvWallMatrix = mat4.create(mvMatrix);
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };

    // Set up lighting uniforms for cylinder and walls.
    this.setupLighting = function(shaderProgram, wallProgram, particles, currentTime, gameInfo) {
        if(gameInfo.state == gameInfo.WIN1_STATE) {
            // Brighten quickly if we're about to win.
            var t = (currentTime - gameInfo.winTime) / gameInfo.TIME_TO_WIN;
            var falloff = lerp(0.002, 0.03, t);
            var ambient = lerp(0.3, 0.6, t);
            gl.uniform1f(shaderProgram.uniform["uFalloff"], falloff);
            gl.uniform1f(shaderProgram.uniform["uAmbient"], ambient);
            gl.uniform1f(shaderProgram.uniform["uNearStrength"], 0.0);
        } else {
            // Brighten slowly over the length of the cylinder.
            var t = (this.offset / 3 * this.length) / this.lastWallPos;
            var falloff = lerp(0.0001, 0.002, t);
            var ambient = lerp(0.05, 0.3, t);
            var shine = lerp(0, 10, t);
            gl.uniform1f(shaderProgram.uniform["uFalloff"], falloff);
            gl.uniform1f(shaderProgram.uniform["uAmbient"], ambient);
            if(gameInfo.state == gameInfo.EXPLODE_STATE) {
                // Fade out during the explosion.
                gl.uniform1f(shaderProgram.uniform["uNearStrength"], (0.8-particles.time)*125);
            } else {
                gl.uniform1f(shaderProgram.uniform["uNearStrength"], 100.0);
            }

            // Setup the same lighting effects for the wall shader.
            gl.useProgram(wallProgram);
            gl.uniform1f(wallProgram.uniform["uShine"], shine);
            gl.uniform1f(wallProgram.uniform["uFalloff"], falloff);
            gl.uniform1f(wallProgram.uniform["uAmbient"], ambient);
            if(gameInfo.state == gameInfo.EXPLODE_STATE) {
                gl.uniform1f(wallProgram.uniform["uNearStrength"], (0.8-particles.time)*125);
            } else {
                gl.uniform1f(wallProgram.uniform["uNearStrength"], 100.0);
            }

            // Restore the cylinder shader.
            gl.useProgram(shaderProgram);
        }
    }
}

/**
 *  Initialize the shaders for both the cylinder and the walls. We also set
 *  the sampler and perspective matrix uniforms here, since they don't change.
 */
Cylinder.prototype.initShader = function(perspective)
{
    var attributes = ["aVertexPosition", "aTextureCoord"];
    var uniforms = ["uPMatrix", "uMVMatrix", "uTextureOffset", "uSampler", "uNearStrength", "uFalloff", "uAmbient"];
    this.shader = loadShader("tunnel-vs", "tunnel-fs", attributes, uniforms);
    gl.uniform1i(this.shader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, perspective);

    uniforms.push("uShine");
    this.wallShader = loadShader("tunnel-vs", "wall-fs", attributes, uniforms);
    gl.uniform1i(this.wallShader.uniform["uSampler"], 0);
    gl.uniformMatrix4fv(this.wallShader.uniform["uPMatrix"], false, perspective);
}

/**
 *  Draw the cylinder and walls.
 */
Cylinder.prototype.draw = function(particles, currentTime, gameInfo)
{
    gl.useProgram(this.shader);

    this.setupLighting(this.shader, this.wallShader, particles, currentTime, gameInfo);

    enableAttributes(this.shader);
    
    // Setup transformation and bind buffers
    this.setMatrixUniforms(this.shader);
    setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer]);

    // Bind texture and apply texture offset for movement.
    gl.activeTexture(gl.TEXTURE0);
    this.texture.bind();
    gl.uniform1f(this.shader.uniform["uTextureOffset"], this.offset);

    // Draw the cylinder.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);

    // Disable the cylinder shader, enable the wall shader.
    disableAttributes(this.shader);
    gl.useProgram(this.wallShader);
    enableAttributes(this.wallShader);

    // Bind the wall texture.
    this.wallTexture.bind();

    // The cylinder texture is repeated, so the wall offset needs to take
    // that into account.
    var wallOffset = this.offset/3*this.length;
    mat4.translate(this.shader.mvWallMatrix, [0, 0, wallOffset]);

    // Draw each wall, calculating the correct offset to account for the 
    // curvature of the tunnel.
    for (var i=0; i<this.walls.length; i++) {
        var transformedZ = this.walls[i].pos[2] + wallOffset;
        if (transformedZ < 0 && transformedZ > -this.length) {
            var segment = -( transformedZ ) * this.numSegments / this.length;
            var transformedX = this.getTunnelOffset(segment);
            this.walls[i].draw(this.wallShader, this.shader.mvWallMatrix, transformedX, this);
        }
    }

    // Cleanup enabled attributes.
    disableAttributes(this.wallShader);
};

Cylinder.prototype.reset = function () {
    this.offset = 0;
    this.angle = 0;
    this.walls = [];

    // To ensure on empty levels there is still some distance before a win.
    this.lastWallPos = 128;

    // The cylinder texture is actually what's moving.
    this.speed = 0.01;
    this.maxSpeed = 1;
};

// Set the tunnel texture.
Cylinder.prototype.setBackground = function (tex) {
    this.texture = tex;
}

// Set the texture for the walls.
Cylinder.prototype.setWallTexture = function (tex) {
    this.wallTexture = tex;
}

// Checks to see if the cylinder has moved beyong the last wall
Cylinder.prototype.pastLastWall = function() {
    // Note: the division by 3 is because the texture repeats 3 times
    // per cylinder length.
    return this.offset / 3 * cylinder.length > cylinder.lastWallPos;
}

/**
 *  Walls are defined by two angles. They sweep from angle1 to angle2,
 *  clockwise, and are positioned at an absolute z value.
 *  The geometry is very simple, just a single quad.
 */
Wall = function(angle1, angle2, radius, z){
    this.angle1 = angle1;
    this.angle2 = angle2;
    this.scale = 2*radius;

    // Coordinates of the two end points on the tunnel.
    this.x1 = Math.cos(angle1) * radius;
    this.x2 = Math.cos(angle2) * radius;
    this.y1 = Math.sin(angle1) * radius;
    this.y2 = Math.sin(angle2) * radius;

    // The angle perpendicular to the line from (x1,y1) to (x2,y2).
    this.angle = Math.PI + Math.atan2(this.y2-this.y1,this.x2-this.x1);

    // Create normalized vector from (x1,y1) to (x2,y2)
    var dirX = this.x2 - this.x1;
    var dirY = this.y2 - this.y1;
    var dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    dirX /= dirLen;
    dirY /= dirLen;

    // Find midpoint of (x1,y1)-(x2,y2).
    var midX = (this.x1 + this.x2)/2;
    var midY = (this.y1 + this.y2)/2;

    // Set bottom left corner of quad
    this.pos = vec3.create([midX + radius * dirX, midY + radius * dirY, -z]);

    // Create quad
    this.quad = new Quad();
};

/**
 *  Sets up the wall position and then draws it.
 */
Wall.prototype.draw = function(shaderProgram, matrix, transformedX) {
    // Translate our position to account for the curvature of the tunnel.
    var newpos = [this.pos[0]+transformedX, this.pos[1], this.pos[2]];

    // Since we use the same vertex shader as the tunnel, we need to set this
    // to 0. Otherwise, our wall texture would move!
    gl.uniform1f(shaderProgram.uniform["uTextureOffset"], 0);

    // Actually draw the quad.
    this.quad.draw(shaderProgram, matrix, newpos, this.angle, this.scale);
}

/**
 *  The ball is actually made up of two point sprites, slightly offset in z.
 *  The top texture is the actual ball, while the texture behind it shows
 *  the glow effect.
 *  To give some visual effect when turning, the front texture moves slightly
 *  in the direction of movement.
 */
Ball = function (tunnelRadius) {
    // Collision thresholds
    this.zThreshold = 10;
    this.angleThreshold = 12;

    // Ball position
    this.ballZ = -30;

    // Position data for the two parts of the ball.
    if (playbook) {
        var positionData = [0, -tunnelRadius + 7, this.ballZ , 1];
        var positionData2 = [0, -tunnelRadius + 7, this.ballZ + 0.05, 1];
    } else {
        // Set up the coordinates of our quad and the texture coords that will be mapped to that quad
        var positionData = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
        var texCoordData = [0, 1, 1, 1, 0, 0, 1, 0];
        var texCoordData2 = [0, 0, 1, 0, 0, 1, 1, 1];

        // Ball glow effect
        this.ballGlow = 0;
    }

    // Create and fill buffer data.
    if (playbook) {
        this.positionBuffer = createArrayBuffer(positionData, 4);
        this.positionBuffer2 = createArrayBuffer(positionData2, 4);
    } else {
        this.positionBuffer = createArrayBuffer(positionData, 3);
        this.texCoordBuffer = createArrayBuffer(texCoordData, 2);
        this.texCoordBuffer2 = createArrayBuffer(texCoordData2, 2);
    }

    // Degrees per second rotation speed
    this.rotationSpeed = 0;

    // Max degrees per second rotation speed
    this.maxRotationSpeed = Math.PI;

    // The offset of the ball relative to the glow
    this.glowOffset = 0;

    this.setMatrixUniforms = function(shader, glow) {
        var mvMatrix = mat4.create();
        mat4.identity(mvMatrix);
        
        // When turning, move the ball towards the movement.
        if (!glow) {
            mat4.translate(mvMatrix, [-this.glowOffset, 
                                      Math.abs(this.glowOffset/2), 
                                      0]);
        }

        if (!playbook) {
            if (this.ballGlow < 0.3)
                this.ballGlow += 0.0075;
            else
                this.ballGlow = -this.ballGlow;
            mat4.translate(mvMatrix, [0, -13, this.ballZ]);
            mat4.rotate(mvMatrix, 0.1, [0, 1, 0]);
            if (glow)
                mat4.scale(mvMatrix, [5.0+Math.abs(this.ballGlow), 5.0+Math.abs(this.ballGlow), 5.0]);
            else
                mat4.scale(mvMatrix, [5.0, 5.0, 5.0]);
        }

        // Store the modelview matrix, so the explosion
        // can find the ball later.
        this.mvMatrix = mvMatrix;
        gl.uniformMatrix4fv(shader.uniform["uMVMatrix"], false, mvMatrix);
    };
};

/**
 *  Initialize the shader program for the ball, and set up its perspective
 *  transform, since it doesn't change.
 */
Ball.prototype.initShader = function(perspective) {
    if (playbook) {
        var attributes = ["aPosition"];
        var uniforms = ["uPMatrix", "uMVMatrix", "uSizeMult", "uSampler", "uAmbient", "uTransparency"];
        this.shader = loadShader("ball-vs", "ball-fs", attributes, uniforms);
    } else {
        var attributes = ["aPosition", "aTextureCoord"];
        var uniforms = ["uPMatrix", "uMVMatrix", "uSampler", "uAmbient", "uTransparency"];
        this.shader = loadShader("ball-quad-vs", "ball-quad-fs", attributes, uniforms);
    }
    gl.uniformMatrix4fv(this.shader.uniform["uPMatrix"], false, perspective);
}

/**
 *  Draw the ball.
 */
Ball.prototype.draw = function (gameInfo, currentTime) {
    // Enable shader program and attributes.
    gl.useProgram(this.shader);
    enableAttributes(this.shader);

    // Set up to use texture unit 0.
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.shader.uniform["uSampler"], 0);

    // Set up very simple ambient lighting to brighten the ball
    var ball_ambient = 0;
    if(gameInfo.state == gameInfo.WIN1_STATE) {
        // Brighten quickly since we've won.
        var t = (currentTime - gameInfo.winTime) / gameInfo.TIME_TO_WIN;
        ball_ambient = lerp(3, 50, t);
    } else {
        // Brighten slowly as we progress.
        var t = (cylinder.offset / 3 * cylinder.length) / cylinder.lastWallPos;
        ball_ambient = lerp(1.01, 3, t);
    }
    gl.uniform1f(this.shader.uniform["uAmbient"], ball_ambient);

    // Enable blending so the bottom texture will show through.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set up buffer data.
    if (playbook) {
        setVertexAttribs(this.shader, [this.positionBuffer]);
    } else {
        setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer]);
        gl.disable(gl.DEPTH_TEST);
    }

    // Draw the glow.
    if (playbook)
        gl.uniform1f(this.shader.uniform["uSizeMult"], 1.025 + 0.025 * Math.sin(currentTime/100));
    gl.uniform1f(this.shader.uniform["uTransparency"], 1.0);
    this.setMatrixUniforms(this.shader, true);
    this.glowTexture.bind();
    if (playbook)
        gl.drawArrays(gl.POINTS, 0, 1);
    else
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Draw the ball.
    gl.uniform1f(this.shader.uniform["uTransparency"], 1.0 - ball_ambient/40.0);
    if (playbook) {
        setVertexAttribs(this.shader, [this.positionBuffer2]);
        gl.uniform1f(this.shader.uniform["uSizeMult"], 1.0);
    } else {
        setVertexAttribs(this.shader, [this.positionBuffer, this.texCoordBuffer2]);
    }
    this.setMatrixUniforms(this.shader, false);
    this.texture.bind();
    if (playbook) {
        gl.drawArrays(gl.POINTS, 0, 1);
    } else {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.enable(gl.DEPTH_TEST);
    }

    // Disable blending again - it's expensive.
    gl.disable(gl.BLEND);

    disableAttributes(this.shader);
}

/**
 *  Test for collision with walls. Return true if a collision has occurred.
 *  For convenience, all of these calculations are done in degrees.
 */
Ball.prototype.didCrash = function (cylinder) {
    var pos = cylinder.offset / 3 * cylinder.length - this.ballZ;

    // Convert from cylinder angle to wall angle. This is effectively the
    // angle of the ball.
    var angle = (3*Math.PI/2-cylinder.angle) * RAD2DEG;
    angle = angle % 360;
    if (angle < 0)
        angle += 360;

    // For each wall, check for collision.
    for (var i=0; i<cylinder.walls.length; i++) {
        var w = cylinder.walls[i];

        // First check if we're close enough in z to crash into it. We allow
        // a threshold on either side.
        if (-w.pos[2] < pos+this.zThreshold && -w.pos[2] > pos-this.zThreshold) {
            // Convert both wall angles into degrees, and add a threshold
            // on either side to simulate the width of the ball.
            var angle1 = w.angle1 * RAD2DEG;
            var angle2 = w.angle2 * RAD2DEG;
            angle1 = (angle1 - this.angleThreshold) % 360;
            if (angle1 < 0)
                angle1 += 360;
            angle2 = (angle2 + this.angleThreshold) % 360;
            if (angle2 < 0)
                angle2 += 360;

            // Since the angle could wrap around, this is just a simple
            // test whether the ball angle is between angle1 and angle2.
            if ((angle1 < angle2 && angle > angle1 && angle < angle2)
                    || (angle1 > angle2 && (angle > angle1 || angle < angle2))) {
                return true;
            }
        }
    }
    return false;
}

Ball.prototype.reset = function () {
    this.angle = 0;
    this.rotationSpeed = 0;
    this.glowOffset = 0;
}

Ball.prototype.setTexture = function (tex) {
    this.texture = tex;
}

Ball.prototype.setGlow = function (tex) {
    this.glowTexture = tex;
}

