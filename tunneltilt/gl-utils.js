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

var gl;

/**
 *  Sets up out WebGL context. Also has a convenient mechanism for determining if a
 *  WebGL call fails.
 */
function initGL(canvas) {
    var debug = true; // Useful flag for debugging WebGL calls
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var realGL;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            realGL = canvas.getContext(names[ii], { antialias:true } );
        } catch (e) {}
        if (realGL) {
            break;
        }
    }
    if (!realGL)
        alert("Failed to create WebGL context");
    if (debug) {
        var glDebug = {};
        glDebug.gl = realGL;
        for (var m in realGL) {
            var method = eval("realGL." + m);
            if (typeof(method) == 'function') {
                glDebug[m] = function() {
                    var result = arguments.callee.realFunc.apply(this.gl, arguments);
                    var error = this.gl.getError();
                    if (error != 0) {
                        console.debug(arguments.callee.realFunc);
                        debugger;
                    }
                    return result;
                }
                glDebug[m].realFunc = method;
            } else {
                glDebug[m] = realGL[m];
            }
        }
        gl = glDebug;
    } else {
        gl = realGL;
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

/**
 *  Tells the browser to schedule a repaint of the window for the next animation frame.
 */
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback, element) {
            window.setTimeout(callback, 1000/60);
        };
})();

/**
 *  Creates a Vertex Array Object (VBO).
 */
function createArrayBuffer(data, itemSize)
{
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
}

/**
 *  Binds to an existing VBO and sets up the associated vertex attribute.
 */
function setVertexAttribs(shader, buffers)
{
    var count = Math.min(shader.attributes.length, buffers.length);
    for (var i=0; i<count; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.vertexAttribPointer(shader.attributes[i], buffers[i].itemSize, gl.FLOAT, false, 0, 0);
    }
}

/**
 *  Loads a shader program from a script id and type.
 */
function getShader(gl, id) {
    var script = document.getElementById("shaders").contentWindow.document.getElementById(id);
    if(!script) {
        return null;
    }
    var str = "";
    var k = script.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (script.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (script.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.debug(gl.getShaderInfoLog(shader));
        alert("Failed to compile shader");
        return null;
    }
    return shader;
}

/**
 *  Loads a shader program from the specified vertex and fragment shader source, as well as,
 *  a list of attributes and uniforms.
 */
function loadShader(vs_source, fs_source, attributes, uniforms) {
    var shader = gl.createProgram();
    var vs = getShader(gl, vs_source);
    var fs = getShader(gl, fs_source);
    gl.attachShader(shader, vs);
    gl.attachShader(shader, fs);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        console.debug("Program Log: " + gl.getProgramInfoLog(shader));
        alert("Could not initialize shaders");
    }

    gl.useProgram(shader);
    shader.attributes = [];
    shader.uniform = [];
    for(var attrNum = 0; attrNum < attributes.length; attrNum++)
        shader.attributes.push(gl.getAttribLocation(shader, attributes[attrNum]));
    for(var uniformNum = 0; uniformNum < uniforms.length; uniformNum++) {
        var uniform = uniforms[uniformNum];
        shader.uniform[uniform] = gl.getUniformLocation(shader, uniform);
    }
    return shader;
}

/**
 *  Enables a shader's associated vertex attribute locations.
 */
function enableAttributes(shader) {
    for(var i=0; i<shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.enableVertexAttribArray(shader.attributes[i]);
    }
}

/**
 *  Disables a shader's associated vertex attribute locations.
 */
function disableAttributes(shader) {
    for(var i=0; i<shader.attributes.length; i++) {
        if (shader.attributes[i] >= 0)
            gl.disableVertexAttribArray(shader.attributes[i]);
    }
}

/**
 *  Loads a WebGL texture given an accessible filename.
 */
Texture = function(filename) {
    var texId = gl.createTexture();

    function handleLoaded(img) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.texId = texId;
    loader.loadImage(filename, handleLoaded);
};

/**
 *  Binds the texture with the associated texture id.
 */
Texture.prototype = {
    bind: function() {
        gl.bindTexture(gl.TEXTURE_2D, this.texId);
    }
};

