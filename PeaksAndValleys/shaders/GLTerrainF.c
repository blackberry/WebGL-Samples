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

precision mediump float;

varying vec3 vPosition;
varying vec3 vWeighting;

void main(void) {
	/* Define the colours we will be blending. */
	vec4 diffuseSand = vec4(0.8, 1.0, 0.0, 1.0);
	vec4 diffuseGrass = vec4(0.0, 0.8, 0.2, 1.0);
	vec4 diffuseRock = vec4(0.5, 0.5, 0.5, 1.0);
	vec4 diffuseSnow = vec4(0.9, 0.9, 0.9, 1.0);
	vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

	/* This mixing assumes a heightmap with heights that will range from 0.0 to 80.0 */
	color = mix(diffuseSand,  color, min(abs(15.0 - vPosition.y) / 20.0, 1.0)); // Sand will be most intense at a height of 15.0 units and will fade to nothing, 20 units up/down.
	color = mix(diffuseGrass, color, min(abs(30.0 - vPosition.y) / 30.0, 1.0)); // Sand will be most intense at a height of 30.0 units and will fade to nothing, 30 units up/down.
	color = mix(diffuseRock,  color, min(abs(50.0 - vPosition.y) / 20.0, 1.0)); // Sand will be most intense at a height of 50.0 units and will fade to nothing, 20 units up/down.
	color = mix(diffuseSnow,  color, min(abs(65.0 - vPosition.y) / 20.0, 1.0)); // Sand will be most intense at a height of 65.0 units and will fade to nothing, 20 units up/down.

	/* Set this fragment to the calculated colour and adjust based on lighting. */
	gl_FragColor = vec4(color.rgb * vWeighting, color.a);
}