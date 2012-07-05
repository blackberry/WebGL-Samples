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
 * This shader colours our skybox and simply applies a texture with no additional effects.
 */

precision mediump float;	// We will use medium precision floats.

varying vec2 vTextureCoord;	// The texture coordinates at this vertex.

uniform sampler2D txSky;	// The sky texture we are applying.

void main(void) {
	/* Apply the texture. */
	gl_FragColor = texture2D(txSky, vec2(vTextureCoord.s, vTextureCoord.t));
}