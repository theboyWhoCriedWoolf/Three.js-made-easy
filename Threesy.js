// ------------------------------------------------------ [ DETECTOR ] ------------------------------------------------------ \\

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = ( function() 
{
	return {

		canvas: !! window.CanvasRenderingContext2D,
		webgl: ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
		workers: !! window.Worker,
		fileapi: window.File && window.FileReader && window.FileList && window.Blob,
	
		getWebGLErrorMessage: function () {
	
			var element = document.createElement( 'div' );
			element.id = 'webgl-error-message';
			element.style.fontFamily = 'monospace';
			element.style.fontSize = '13px';
			element.style.fontWeight = 'normal';
			element.style.textAlign = 'center';
			element.style.background = '#fff';
			element.style.color = '#000';
			element.style.padding = '1.5em';
			element.style.width = '400px';
			element.style.margin = '5em auto 0';
	
			if ( ! this.webgl ) {
	
				element.innerHTML = window.WebGLRenderingContext ? [
					'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
					'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
				].join( '\n' ) : [
					'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
					'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
				].join( '\n' );
	
			}
	
			return element;
	
		},
	
		addGetWebGLMessage: function ( parameters ) {
	
			var parent, id, element;
	
			parameters = parameters || {};
	
			parent = parameters.parent !== undefined ? parameters.parent : document.body;
			id = parameters.id !== undefined ? parameters.id : 'oldie';
	
			element = Detector.getWebGLErrorMessage();
			element.id = id;
	
			parent.appendChild( element );
		}
	
	};
}());


// ------------------------------------------------------ [ THREASY ] ------------------------------------------------------ \\

var Threesy = ( function() 
{
	// class
		var _self				= {};
	
	// STATIC PROPS [
		
		// defaulr setup 
		var DEFAULT_WIDTH 		= ( window.innerWidth )? window.innerWidth : 550;
		var DEFAULT_HEIGHT 		= ( window.innerHeight )? window.innerHeight : 400
		
		// default camera properties
		var DEFAULT_ASPECT 		= DEFAULT_WIDTH / DEFAULT_HEIGHT;
		var DEFAULT_NEAR 		= 1;
		var DEFAULT_FAR 		= 10000;	
		var VIEW_ANGLE			= 45;
		var CAM_ZDEPTH			= 1000;
		var defaultLightRef		= "defaultLight";
		
	// ]
	
		var _sceneElements		= [];
		var _sceneLights		= [];
		
		// mouse  position properties
		var _projector 			= new THREE.Projector();
		var _positionVector;
		var _ray;
		var _intersectingObjects;
		var _totalLights		= 0;
		var _maxLights			= 4;
		var _divContainer;
		var _tempMicroCache		= null;
		
		// public properties
		_self.camera			= null;
		_self.scene				= null;
		_self.renderer			= null;
		_self.defaultLightRef	= "defaultLight"
		_self.viewWidth			= null;
		_self.viewHeight		= null;
		_self.webgl				= Detector.webgl;
		
		/**
		 * init
		 * @param divContainer		(Object)  			- DOM element
		 * @param width				(Number/int)  		- optional width of the viewport 
		 * @param height			(Number/int)  		- optional height of the viewport
		 */
		_self.init = function( divContainer, width, height )
		{
			if( divContainer === undefined ) // cant instantiate without container
			{
				 console.log("**** [ ERROR : Init Properties Undefined ] ****" );
				 return;
			}
			_divContainer = divContainer;
			
			_self.viewWidth 	= width;									// set THREE.js scene dimensions
			_self.viewHeight	= height;
			
			prepareScene();													// set dimension props
			prepareDimensions();											// prepare scene dimensions
			
			_self.renderer.setSize( _self.viewWidth, _self.viewHeight ); 	// set renderer dimensions
			_divContainer.appendChild( _self.renderer.domElement );
			
			console.log("***** [ Threasy.js Initiated ] *****")
		}
		
		// [ SET SCENE PROPERTIES 
		
		/**
		 * add camera, must be set before initiated otherwise renderer will not be set
		 * @param renderer			(Object)  		- THREE.js renderer
		 * @param camera			(Object)  		- THREE.js camera
		 * @param light				(Object)  		- THREE.js light
		 */
		 _self.setSceneProperties = function( renderer, camera, light )
		{
			if( _self.renderer ) return;	// return if renderer already exists, must set before init
			if(  renderer !== undefined ) 	_self.renderer 		= renderer;
			if(  camera !== undefined ) 	_self.camera		= camera;
		}
	
	// ]
		
		// [ ADD / REMOVE

// CAMERA

		/**
		 * add camera
		 * @param newCam			(Object)  		- new camera to add to scene
		 */
		 _self.addCamera = function( newCam ) 
		{ 
			if( _self.camera !== null )
			{
				 _self.removeFromScene( _self.camera );
				_self.camera = null;
			} 
			_self.camera = newCam; 
			_self.addToScene( _self.camera, undefined ); // add to scene
		}

// LIGHTS

		// add light
		
		/**
		 * add light
		 * @param light		(Object)  		- THREE.js light 
		 * @param ref		(String/int)  	- THREE.js light reference
		 * @param removeAll	(BOOL)  		- if to remove all previous lights
		 */
		 _self.addLight = function( light, removeAll, ref )
		{
			if( ref === undefined ) { ref = "light"+_totalLights++ };	// if not defined default light ref
			if( removeAll ) { removeAllLights(); _totalLights = 0; }	// remove all, set totalLights to 0
			
			// if exists overwrite, if not create and set
			if( _sceneLights[ ref ] !== undefined )
			{
				_self.removeFromScene( _sceneLights[ ref ] );
				_sceneLights[ ref ] = null;
				_totalLights--;
			} 
			
			light.ref = ref; // append the reference to the light p
			_sceneLights[ ref ] = light;
			_self.addToScene( light, undefined ); // add to scene
			_totalLights++;
		}
		
		/**
		 * return an array containing all lights
		 * added to the scene
		 * @return (Array)  - Three.js light object 
		 */
		_self.lights = function()
		{
			var lightsArray = [];
			for( var light in _sceneLights ) 
			{
				lightsArray.push( _sceneLights[ light ] );
			}
			return lightsArray;
		}
		
		/**
		 * remove light by id
		 * @param light			(Object)  	  - light 
		 * @param id		    (String/int)  - light id
		 * @param removeAll		(Boolean)	  - Remove All Lights
		 */
		 _self.removeLight = function( light, id, removeAll )
		{
			if( removeAll ) 
			{
				removeAllLights();
				return;
			}
			
			var lightRef = ( id === undefined && light.ref ) ? light.ref : id;
			for( var lightID in _sceneLights ) 
			{
				if( lightID === lightRef )
				{
					_self.removeFromScene( _sceneLights[ lightID ] );
					delete _sceneLights[ lightID ];
					lightID = null;
				}
			}	
		}
		
		 /**
		 * get total lights in the scene
		 * @return (Number) - Number of lights added to the scene
		 */
		 _self.totalLights = function() { return _totalLights; }
		
		 /**
		 * get light by id
		 * @param id	(String/int)  - THREE.js light 
		 * @return (Object) 		  - Three.js light object 
		 */
		 _self.getLight = function( id ) { if( _sceneLights[ id ] ) return _sceneLights[ id ]; }
		 
		/**
		 * trace out lights in scene
		 */
		 _self.logLights = function() 
		{ 
			for( var light in _sceneLights ) 
			{ 
				console.log("*** [ Light ID ::  " + light + " ] ***" ) 
			}; 
		}
		
		/*
		 * set max lights
		 */
		 _self.maxLights = function( value ) { _maxLights = value; }


// SCENE

		/**
		 * Add an object to the scene
		 * @param element	(Object)  		- THREE.js mesh / light / object
		 * @param objRef 	(String/int)  	- Reference for the passed object
		 */
		 _self.addToScene = function( element, objRef )
		{
			if( _self.scene ) _self.scene.add( element );
			if( objRef === undefined )  return; 
			_sceneElements[ objRef ] = element; // if object ref, log object and store in elements array
		}
		/**
		 * REMOVE an object from the scene
		 * @param element	(Object)  - THREE.js mesh / light / object
		 */
		 _self.removeFromScene = function( element )
		{
			if( _self.scene ) _self.scene.remove( element );
			element = null;
		}
		/**
		 * REMOVE an element from the scene by using its registered id when added to the scene
		 * @param id	(String)  - Reference of object
		 */
		 _self.removeFromSceneByID = function( id )
		{
			for( var element in _sceneElements ) 
			{
				if( element === id )			// remoev scene elements that have been logged
				{
					_self.removeFromScene( _sceneElements[ element ] );
					delete _sceneElements[ element ];
					element = null;
				}
			}	
		}
		/**
		 * trace elements in scene that have been logged
		 */
		 _self.logScene = function()
		{
			for( var element in _sceneElements ) 
			{ 
				console.log("*** [ Object ID ::  " + element + " ] ***" ) 
			}; 
		}
	
	// ] 
		
	// [ OBJECT DETECTION
		
		/**
		 * Detect object that is within the coordinates passed
		 * @param xPos			(Number) 					 - X position of the mouse
		 * @param yPos 			(Number)  	 				 - Y position of the mouse
		 * @return ( object ) return intersecting objects to mouse choordinates, otherwise undefined
		 */
		 _self.getObjectInBounds = function( xPos, yPos )
		{
			_self.camera.updateMatrixWorld(); // update matrices to new camera position
			_positionVector = new THREE.Vector3 ( ( xPos / window.innerWidth )*2-1, -( yPos / window.innerHeight )*2+1, 0.5 );
		    _projector.unprojectVector( _positionVector, _self.camera );
		    
		    _ray = new THREE.Ray( _self.camera.position, _positionVector.subSelf( _self.camera.position ).normalize() );
		    _intersectingObjects = _ray.intersectObjects( _self.scene.children );
		    if( _intersectingObjects.length > 0 )
		    {
		        // console.log('Mouse coordinates:' + '\nx = ' + Math.round(_intersectingObjects[0].point.x) + '\ny = ' + Math.round(_intersectingObjects[0].point.y) + '\nz = ' + Math.round(_intersectingObjects[0].point.z));
		   		return _intersectingObjects[ 0 ];
		    }
		    return undefined;
		}
		
	// ]
	
	
	/**
	 * Slice a THREE.js texture, position the texture using the parameters set
	 * @param texture			(Object) 					 - THREE.js Texture
	 * @param offsetX 			(Number)  	 				 - cimage x position offset
	 * @param offsetY 			(Number )  					 - image y position offset
	 * @param sliceWidth 		(Number)  	 				 - width of slice
	 * @param sliceHeight 		(Number)  	 				 - height of slice
	 * @param clone		 		(Boolean)  	 				 - clone texture if true
	 * @param cacheID	 		(String|undefined|null) 	 - cacheID if needed in order to cache the texture using microcache
	 */
	 _self.sliceTexture = function( texture, offsetX, offsetY, sliceWidth, sliceHeight, clone, cacheID )
	{
		var imageWidth		= texture.image.width;							// get the width
		var imageHeight		= texture.image.height;							// get the height
		
		if( clone )			texture = texture.clone();						// clone the texture
		if( _self.renderer._microCache && cacheID )	texture = _self.renderer._microCache.set( cacheID, texture ) // add the texture to the cache
		
																  
		texture.repeat.x = ( sliceWidth / imageWidth );						// repeat Width ratio [ section width / total image width ]
		texture.repeat.y = ( sliceHeight / imageHeight );					// repeat Height ratio [ section height / total image height ]
		texture.offset.x = ( Math.abs( offsetX ) / imageWidth );			// offset X ration [ offset position / total image height ]
		texture.offset.y = ( Math.abs( offsetY )/ imageHeight );			// offset Y ration [ offset position / total image height ]
		texture.needsUpdate = true;
		
		return texture;
	}
	
		/*
		 * clear the renderer
		 */
		 _self.clearRenderer = function(){ _self.renderer.clear(); };
		 
		/*
		 * add microcache
		 */
		 _self.addMicroCache = function( micro )
		 { 
		 	if( _self.renderer ) _self.renderer._microCache = micro; 
		 	else _tempMicroCache = micro;
		 }
	
	
	// [ RENDER
		 _self.render = function() 
		 { 
		 	if( !_self.renderer ) return; 
		 	_self.renderer.render( _self.scene, _self.camera ); 
		 }
	// ]	
		
		// ----------------------------------------- [ PRIVATE METHODS ] ----------------------------------------- \\
		
		/*
		 * prepare scene 
		 */
		function prepareScene()
		{
			if( _self.scene === null ) 		_self.scene = new THREE.Scene();	
			if( _self.renderer === null ) 	_self.renderer =  defaultRenderer();
			if( _totalLights < 1 ) 			_self.addLight( defaultLight(), false, _self.defaultLightRef );
			if( _tempMicroCache != null )
			{
				_self.renderer._microCache = _tempMicroCache; // set micro cache making sure the renderer is available
				_tempMicroCache = null;
			}	
			if( _self.camera === null ) 	
			{
				_self.addCamera( defaultCamera() );	
				_self.camera.position.z = CAM_ZDEPTH;		
			}
		}
		// setup dimentions
		function prepareDimensions()
		{
			_self.viewWidth	  = ( _self.viewWidth === null )  ? DEFAULT_WIDTH   : _self.viewWidth;
			_self.viewHeight  = ( _self.viewHeight === null ) ? DEFAULT_HEIGHT  : _self.viewHeight;
		}
		
	//  [ LIGHTS
		
		// remove all lights
		function removeAllLights()
		{
			for( var light in _sceneLights )
			{
				_self.removeFromScene(  _sceneLights[ light ] );
				delete _sceneLights[ light ];
				light = null;
			}
			_sceneLights = [];
		}
	
	// ]
	
	// dispose
	_self.dispose = function()
	{
		removeAllLights();
		_self.removeFromScene( _self.camera );
		for( var element in _sceneElements ) 
		{ 
			 removeFromScene( _sceneElements[ element ] ); 
		}; 
		
		_self.clearRenderer();
		 
		_self.camera			= null;
		_self.scene				= null;
		_self.renderer			= null;
		_self.viewWidth			= null;
		_self.viewHeight		= null;
		_sceneElements			= [];
		_sceneLights			= [];
		_totalLights			= 0;
	}
	
	
	// ------------------------------------------------------ [ DEFAULTS ] ------------------------------------------------------ \\
	
	    /*
		 * default renderer values - 
		 * 
		    canvas — A Canvas where the renderer draws its output.
			precision — shader precision. Can be "highp", "mediump" or "lowp".
			alpha — Boolean, default is true.
			premultipliedAlpha — Boolean, default is true.
			antialias — Boolean, default is false.
			stencil — Boolean, default is true.
			preserveDrawingBuffer — Boolean, default is false.
			clearColor — Integer, default is 0x000000.
			clearAlpha — Float, default is 0.
			maxLights — Integer, default is 4.
		 */
		// return default renderer
		function defaultRenderer() 
		{ 
			if( _self.webgl ) return new THREE.WebGLRenderer( { antialias : false, precision : "mediump", maxLights: _maxLights } ); 
			return new THREE.CanvasRenderer();  
		}	
		// get default light
		function defaultLight() { return new THREE.AmbientLight( 0xFFFFFF ); }
		// default camera
		function defaultCamera()
		{
			return new THREE.PerspectiveCamera
			(
				VIEW_ANGLE,
				DEFAULT_ASPECT,
				DEFAULT_NEAR,
				DEFAULT_FAR
			);
		}
	// RETURN CLASS OBJECT
	return _self;
	
}());
