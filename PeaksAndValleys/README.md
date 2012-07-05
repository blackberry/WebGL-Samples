<h2>Background</h2>
<p>
This sample's primary intent is to provide a number of WebGL concepts working in one place. This
is not intended to be a market-ready application for end consumers. While it can be fun to run
around the countryside, this is primarily a WebGL learning resource. Some key concepts include:
<ul>
<li>Rendering objects in solid colours.</li>
<li>Rendering objects with textures applied.</li>
<li>Blending texures and colours on a single object.</li>
<li>Ambient and directional lighting.</li>
<li>Skybox generation.</li>
<li>Unoptimized* terrain generation.</li>
<li>Touch controls.</li>
</ul>
* "Unoptimized" can apply to the majority of the code here.
</p>
<h2>Known Issues</h2>
<p>
<ul>
<li>Frame rate can drop when a lot is viewed in the distance. The primary source of this appears to be the texture blending. Optimization of blending will need to be explored.</li>
<li>There are some rendering artifacts of triangles in the distance.</li>
<li>The virtual joystick controls can sometimes get "stuck". Tapping the screen to force a touchend event to be triggered can clear this. Investigation of the exact cause and a fix will need to be explored.</li>
</ul>
</p>
<h2>Extras</h2>
<h3>FITC-DM-EO.pdf</h3>
<p>
Is a presentation given at FITC 2012 in Toronto where the PeaksAndValleys application was discussed.
These slides have been included for reference as they add a little colour to the code contained herein.
This file is by no means required in order for the application to run.
</p>
<h2>Thank You!</h2>
<p>
Immense thanks to the following people. They might not know how much they helped me, but I appreciate it none the less.
<br /><br />
The fantastic people behind the lessons (and those that inspired the lessons) at <b>Learning WebGL</b>:
<br />
<a href="http://www.learningwebgl.com">http://www.learningwebgl.com</a>
<br /><br />
<b>Brandon Jones</b> (toji):
<br />
<a href="https://github.com/toji/gl-matrix">https://github.com/toji/gl-matrix</a>
<br /><br />
<b>Jerome Etienne</b> (jetienne):
<br />
<a href="https://github.com/jeromeetienne/virtualjoystick.js">https://github.com/jeromeetienne/virtualjoystick.js</a>
<br /><br />
<b>Chandler Prall</b>:
<br />
<a href="http://chandler.prallfamily.com/2011/06/blending-webgl-textures">http://chandler.prallfamily.com/2011/06/blending-webgl-textures</a>
<br /><br />
<b>Andrea Giammarch</b>:
<br />
<a href="http://webreflection.blogspot.ca/2010/09/fragment-and-vertex-shaders-my-way-to.html">http://webreflection.blogspot.ca/2010/09/fragment-and-vertex-shaders-my-way-to.html</a>
<br /><br />
<b>Paul Irish</b> for writing the blog, and <b>Erik Moller</b> for sharing the technique:
<br />
<a href="http://paulirish.com/2011/requestanimationframe-for-smart-animating">http://paulirish.com/2011/requestanimationframe-for-smart-animating</a>
<br /><br />
<b>Ricardo Cabello</b> (mrdoob) for my initial foray with Three.js.
Though it isn't used here, my initial trials helped me understand
a number of concepts. Will definitely be revisiting this:
<br />
<a href="https://github.com/mrdoob/three.js">https://github.com/mrdoob/three.js</a>
<br /><br />
The <b>Valve Developer Community</b> for helping me create a skybox beyond MS Paint:
<br />
<a href="https://developer.valvesoftware.com/wiki/Skybox_(2D)_with_Terragen">https://developer.valvesoftware.com/wiki/Skybox_(2D)_with_Terragen</a>
</p>