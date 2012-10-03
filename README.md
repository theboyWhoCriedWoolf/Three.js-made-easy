Threesy - A Three.js Component to try and help simplify Three.js Development

EXAMPLE:

<pre>
<code>
// set variables
var _animationRequest;
var geometry, material, mesh;

window.onload = function()
{
	init();
	// start animating
    animate();
}

// initialise
function init()
{

	// initiate Threesy with default settings
	Threesy.init( document.getElementById("container"), window.innerWidth, window.innerHeight );
	
	// create Three.js mesh
	geometry = new THREE.CubeGeometry( 200, 200, 200 );
    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    mesh = new THREE.Mesh( geometry, material );
    
    // add mesh to Threesy
    Threesy.addToScene( mesh );
}

// animate
function animate()
{
	_animationRequest = requestAnimationFrame( animate ); 
	Threesy.render();
	
	mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
}

</code>
</pre>


For a full explanation and instructions on how to use Threesy.js please visit - http://theboywhocriedwoolf.com/three-js-made-easy/

Please contact me with regards to any comments and or improvements.

tal@theboywhocriedwoolf.com

Thanks