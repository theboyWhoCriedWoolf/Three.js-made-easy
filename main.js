var _animationRequest;
var geometry, material, mesh;



window.onload = function()
{
	init();
	// start animating
    animate();
}


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


function animate()
{
	_animationRequest = requestAnimationFrame( animate ); 
	Threesy.render();
	
	mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
}
