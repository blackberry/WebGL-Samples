# Background

>   This sample's primary intent is to provide a number of WebGL concepts
>   working in one place. This is not intended to be a market-ready application
>   for end consumers. While it can be fun to run around the countryside, this
>   is primarily a WebGL learning resource.
>   
>   If you have any feedback or find any issues, please feel free to report
>   them in the Issues section, or contact me directly via Twitter:
>   @WaterlooErik

## Key Features

### Image As A Heightmap

>   Previously, PeaksAndValleys generated a static 150x150 vertex landscape
>   with randomized heights. The result was a random map on each run, but in a
>   fixed region.
>   
>   The most current version processes an image to obtain height data, and
>   corresponding normal and texture data. To minimize on-device processing
>   requirements during startup, the *preprocessor* tool was created to convert
>   a supplied image to the required data as a JSON string.
>   
>   For more information on leveraging this tool, please refer to README.md in
>   the tools/preprocessor folder.

### Endless Terrain via Web Workers

>   This release of PeaksAndValleys continuosly renders an area of 60 vertices
>   in all directions around the camera's current position. The end result does
>   produce terrain 'popping' into view; something that will be addressed down
>   the road.
>   
>   To achieve this, Web Workers were used to process the existing data and
>   create new vertex and normal arrays on the fly. Once ready, these arrays
>   are passed back to the primary application thread and the corresponding
>   buffers are updated with the new data.
>
>   When near the borders of the terrain / image, the Web Worker wraps around
>   to retrieve information from the opposite end of the data to ensure the
>   user can technically keep walking forever.
>
>   Future versions will focus around only loading those vertices that are
>   within our field of view, allowing for more data to be processed in
>   shorter amounts of time.

### Colour Shaders

>   The default fragment shader for the terrain will use the height of each
>   vertex being rendered and colour it accordingly with sand, grass, rock, and
>   snow (lowest to highest.)

### Ambient And Directional Lighting

>   Currently, there is a static sun in the sky producing light in the
>   direction (0, -1, 1). The normal of each vertex is then used in conjunction
>   with this lighting direction to generate shadows across the landscape.

### Texture Shaders / Seamless Skybox

>   The skybox is simply a 2x2x2 box that continually moves with the camera.
>   By rendering the skybox *first* with gl.disable(gl.DEPTH_TEST) then turning
>   depth-testing back on with gl.enable(gl.DEPTH_TEST) and rendering the
>   terrain, even though the skybox is directly infront of the camera,
>   everything else still gets rendered "on top" of the skybox. The end result
>   is that regardless of how far away the terrain is, the skybox is always
>   rendered behind it.
>
>   The texture for the skybox was created using Terragen, and is a basic,
>   seamless texture designed to look appropriate when textured onto a cube.

### Multitouch Controls

>   In the initial version of PeaksAndValleys, Jerome Etienne's
>   *virtualjoystick.js* was used as a basis for camera movement and rotation.
>   Since then, I had created a ControlsOverlay.js for use with a Cocos2d-HTML5
>   sample and have adapted that into *Freewill.js* for this release of
>   PeaksAndValleys. A sample implementation can be found here: https://github.com/oros/Freewill.js
>   
>   These new controls allow for multiple Joysticks and Buttons to be placed
>   onscreen with the goal of simplicity and are not specific to WebGL applications.

### HTML5 Audio *(TODO)*

>   Once license appropriate samples are produced, this sample will be
>   augmented to include background music and sound effects. Currently this
>   must be done with HTML5 audio, however once *Web Audio API* is supported,
>   it will be implemented in favour of <audio> elements.

### Social Integration *(TODO)*

>   Currently, there is very minimal integration with BlackBerry Messenger in
>   that the application will register with BBM when the action is chosen from
>   the dropdown menu.
>   
>   Future plans include: take a screenshot and set as BBM profile picture,
>   chat integration, and invite to download.
>
>   In addition to BlackBerry Messenger, if the Scoreloop SDK becomes available
>   for BlackBerry 10 WebWorks applications, that will also be looked at for
>   integration into this sample.

### Monetization *(TODO)*

>   The BlackBerry platform has a number of payment services to help developers
>   monetize their application, however as of November 2nd, support has not yet
>   been added for these to WebWorks for BlackBerry 10.

### Multiplayer *(TODO)*

>   This is not currently implemented, but integration of Socket.io and a
>   backend Node.js server are definitely on my mind.

### Cut Scenes *(TODO)*

>   They are a very common component in many games and a sample implementation
>   will be included in the future.

# Tested With

>   *   BlackBerry 10 WebWorks SDK 1.0.2.9
>   *   BlackBerry Dev Alpha B, 10.0.9.388

# Known Issues

>   *   Noticing pretty heavy performance issues when I include the following in *styles.css* for *canvas.joystick* and *canvas.button*.
>       
>           -webkit-transition: opacity 200ms cubic-bezier(0.075, 0.820, 0.165, 1.000);
>           
>       Continuing to investigate, but if anyone has thoughts, I'm happy to hear them. Still experiencing a slight stutter every few moments (memory release?)
>   *   After selection from the swipedown menu, you must use the right-most red button to re-invoke the swipedown menu.
>   *   BlackBerry Messenger registers, but no additional functionality is implemented yet.
>   *   Audio was taken out for licensing reasons, looking to have some problem-free tracks soon.

# Thank You!

>   Immense thanks to the following people. They might not know how much they
>   helped me, but I appreciate it none the less.
>   *   The fantastic people behind the lessons (and those that inspired the lessons) at [Learning WebGL](http://www.learningwebgl.com)
>   *   [Brandon Jones (toji)](https://github.com/toji/gl-matrix)
>   *   [Jerome Etienne (jetienne)](https://github.com/jeromeetienne/virtualjoystick.js)
>   *   [Chandler Prall](http://chandler.prallfamily.com/2011/06/blending-webgl-textures)
>   *   [Andrea Giammarch](http://webreflection.blogspot.ca/2010/09/fragment-and-vertex-shaders-my-way-to.html)
>   *   [Paul Irish and Erik Moller](http://paulirish.com/2011/requestanimationframe-for-smart-animating)
>   *   [Ricardo Cabello (mrdoob)](https://github.com/mrdoob/three.js)
>   *   The [Valve Developer Community](https://developer.valvesoftware.com/wiki/Skybox)