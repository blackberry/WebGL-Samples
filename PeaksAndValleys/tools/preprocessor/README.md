The images in this folder were created by Erik Oros (Twitter: @WaterlooErik)
and can be used in accordance with the Apache License version 2.0 outlined in
License.md contained within this folder.



This tool is intended to convert an image into vertex, texture coordinate, and
normal arrays.

In order to use this tool, you must have Node.js installed, and the following
packages must also be installed to the node_modules sub-folder of the
preprocessor folder:
*   fs
*   png-js
*   sylvester

This can be done by executing the following commands from the preprocessor
folder:
    npm install fs
    npm install png-js
    npm install sylvester

The tool is executed with the following command:
node dowork.js

Parameters are read from config.json; example:

    {
    	"file":	"input.png",
    	"d_x": 1024,
    	"d_z": 1024,
    	"s_xz":	3,
    	"s_y": 80,
    	"s_t":	1,
    	"av_n":	5
    }

This indicates to use input.png (file) as the source file, and its dimensions
are 1024 (d_x) by 1024 (d_z) pixels. We want to scale the dimensions of the
generated terrain by 3 (s_xz) and our heights will range from 0 to 80 (s_y).
In this case, whatever texture is applied will be streched 1 (s_t) time over
the entire dimensions of the landscape. Generally, you may want to increase
this to 8 or 16 (depending on the size of your texture) to wrap a lower
resolution texture multiple times within the area. Finally, we will perform
some smoothing on the heights, specifically the height of a vertex will be
averaged with the heights of all neighbouring vertices 5 (av_n) pixels in each
direction; Heightmaps that already have smoothing can reduce this to 0 to 2
while rougher images may require larger values.

The resulting JSON object will resemble:

    {
    	"width": d_x,
    	"height": d_z,
    	"tileSize": s_xz,
    	"vertices": [],
    	"coords": [],
    	"normals": []
    }

This object is written to terrain.json, which is created in a folder two
levels up, in a subfolder called json. Specifically, this is the json
subfolder of the root PeaksAndValleys folder.