# Tunnel Tilt

Project Files:

* index.html   - contains the main tunneltilt game state, render loop, and menus
* shaders.html - contains the source code for the shaders used in tunneltilt
* gl-utils.js  - contains various WebGL helper functions
* events.js    - contains mouse / touch and accelerometer handlers for tunneltilt
* geometry.js  - contains the geometry and respective logic for tunneltilt
* sound.js     - contains code for playing sounds in WebWorks
* loader.js    - contains XMLHttpRequest logic for asset load notification
* config.xml   - a WebWorks configuration file for tunneltilt
* data         - a folder that contains the images, sound, and levels for tunneltilt
* gl-matrix    - a folder that contains gl-matrix-min.js a high performance matrix
               and vector math JavaScript libary: http://github.com/toji/gl-matrix

## WebWorks Extension Files:

blackberry.custom.accelerometer

* a folder that contains a WebWorks extension that provides JavaScript accelerometer helper functions

blackberry.custom.audio

* a folder that contains a WebWorks extension that provides JavaScript audio helper functions

## Music:

Rocket - Kevin MacLeod (incompetech.com)

ISRC: US-UAN-11-00568

Licensed under Creative Commons "Attribution 3.0"

http://creativecommons.org/licenses/by/3.0/

## Building for WebWorks (on Windows):

1. Install the WebWorks Tablet OS SDK: https://bdsc.webapps.blackberry.com/html5/documentation/ww_getting_started/installing_configuring_webworks_sdk_1866967_11.html

2. Move blackberry.custom.accelerometer and blackberry.custom.audio to the ext
   folder under your WebWorks SDK installation.

3. Zip up the remaining contents of the tunneltilt project to tunneltilt.zip

4. Copy the zip file to the bbwp folder under your WebWorks SDK installation.

5. Open up a command prompt and navigate to the bbwp folder.

6. Run: bbwp.exe tunneltilt.zip -o .

7. Run: 

````
    blackberry-tablet-sdk\bin\blackberry-deploy.bat -installApp -password <PlayBookPassword> -device <PlayBookIP> -package tunneltilt.bar
````

## Building for WebWorks (on Mac OS X):

1. Install the WebWorks Tablet OS SDK: https://bdsc.webapps.blackberry.com/html5/documentation/ww_getting_started/installing_configuring_webworks_sdk_1866967_11.html

2. Move blackberry.custom.accelerometer and blackberry.custom.audio to the ext
   folder under your WebWorks SDK installation.

3. Zip up the remaining contents of the tunneltilt project to tunneltilt.zip

4. Copy the zip file to the bbwp folder under your WebWorks SDK installation.

5. Open up a terminal and navigate to the bbwp folder.

6. Run: ./bbwp tunneltilt.zip -o .

7. Run: 

````
    ./blackberry-tablet-sdk\bin\blackberry-deploy -installApp -password <PlayBookPassword> -device <PlayBookIP> -package tunneltilt.bar
````
