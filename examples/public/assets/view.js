import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import { AlvaARConnectorTHREE } from './alva_ar_three.js'
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js'


class ARCamView
{




    constructor( container, width, height, x = 0, y = 0, z = -10, scale = 1.0)
    {

        console.log("set marker");
        const queryString = window.location.search;
        console.log(queryString);
        const urlParams = new URLSearchParams(queryString);
        console.log(urlParams);

        const objectURL = urlParams.get('object');
        console.log(objectURL);

        //objectURL = 'https://raw.githubusercontent.com/AndrewAndreevich/AlvaAR/refs/heads/main/duck.glb';

        
        this.applyPose = AlvaARConnectorTHREE.Initialize( THREE );

        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setClearColor( 0, 0 );
        this.renderer.setSize( width, height );
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
        this.camera.rotation.reorder( 'YXZ' );
        this.camera.updateProjectionMatrix();

        //this.object = new THREE.Mesh( new THREE.BoxGeometry( 2, 2, 2 ), new THREE.MeshNormalMaterial( { flatShading: true } ) );
        //this.object.scale.set( scale, scale, scale );
        //this.object.position.set( x, y, z );
        //this.object.visible = false;

        this.scene = new THREE.Scene();
        this.scene.add( new THREE.AmbientLight( 0x808080 ) );
        this.scene.add( new THREE.HemisphereLight( 0x404040, 0xf0f0f0, 1 ) );
        this.scene.add( this.camera );
      //  this.scene.add( this.object );
      

        // Load the GLB model
        
		//const gltfLoader = new GLTFLoader();
		//gltfLoader.load( 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Duck/glTF-Binary/Duck.glb', _this, ( gltf,root_context ) => {
		//	root_context.root = gltf.scene;
        //    root_context.root.scale.set( scale, scale, scale );
        //    root_context.root.position.set( x, y, z );
        //    root_context.root.visible = false;
        //    root_context.scene.add( root_context.root );
		//} );

        // Load the GLTF model
        this.loadGLTFModel(objectURL, x, y, z, scale);

        container.appendChild( this.renderer.domElement );

        const render = () =>
        {
            requestAnimationFrame( render.bind( this ) );
            this.renderer.render( this.scene, this.camera );
        }

        render();
    }


    getModel() {
        console.log("set model");
        const queryString = window.location.search;
        console.log(queryString);
        const urlParams = new URLSearchParams(queryString);
        console.log(urlParams);

        const object = urlParams.get('object');
        return object;
    }



    updateCameraPose( pose )
    {
        this.applyPose( pose, this.camera.quaternion, this.camera.position );

        //this.object.visible = true;
        if( this.root!=null)
        {
            this.root.visible = true;
        }
        
    }

    lostCamera()
    {
        //this.object.visible = false;
        if( this.root!=null)
        {
            this.root.visible = false;
        }
    }
    
    loadGLTFModel(modelPath, x, y, z, scale) {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene; // Loaded model's scene
                model.position.set(x, y, z);
                model.scale.set(scale, scale, scale);

                // Optional: Traverse the model to manipulate individual meshes
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Add the model to the scene
                this.scene.add(model);
                this.root = model;
                this.root.visible = false;
            },
            undefined,
            (error) => {
                console.error('An error occurred while loading the GLTF model:', error);
            }
        );
    }
}

class ARCamIMUView
{
    constructor( container, width, height )
    {
        this.applyPose = AlvaARConnectorTHREE.Initialize( THREE );

        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setClearColor( 0, 0 );
        this.renderer.setSize( width, height );
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 1000 );

        this.raycaster = new THREE.Raycaster();

        this.ground = new THREE.Mesh(
            new THREE.CircleGeometry( 1000, 64 ),
            new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                transparent: true,
                depthTest: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            } )
        );

        this.ground.rotation.x = Math.PI / 2; // 90 deg
        this.ground.position.y = -10;

        this.scene = new THREE.Scene();
        this.scene.add( new THREE.AmbientLight( 0x808080 ) );
        this.scene.add( new THREE.HemisphereLight( 0x404040, 0xf0f0f0, 1 ) );
        this.scene.add( this.ground );
        this.scene.add( this.camera );

        container.appendChild( this.renderer.domElement );

        const render = () =>
        {
            requestAnimationFrame( render.bind( this ) );

            this.renderer.render( this.scene, this.camera );
        }

        render();
    }

    updateCameraPose( pose )
    {
        this.applyPose( pose, this.camera.quaternion, this.camera.position );

        this.ground.position.x = this.camera.position.x;
        this.ground.position.z = this.camera.position.z;

        this.scene.children.forEach( obj => obj.visible = true );
    }

    lostCamera()
    {
        this.scene.children.forEach( obj => obj.visible = false );
    }

    addObjectAt( x, y, scale = 1.0 )
    {
        const el = this.renderer.domElement;

        const coord = new THREE.Vector2( (x / el.offsetWidth) * 2 - 1, -(y / el.offsetHeight) * 2 + 1 );

        this.raycaster.setFromCamera( coord, this.camera );

        const intersections = this.raycaster.intersectObjects( [this.ground] );

        if( intersections.length > 0 )
        {
            const point = intersections[0].point;

            const object = new THREE.Mesh(
                new THREE.IcosahedronGeometry( 1, 0 ),
                new THREE.MeshNormalMaterial( { flatShading: true } )
            );

            object.scale.set( scale, scale, scale );
            object.position.set( point.x, point.y, point.z );
            object.custom = true;

            this.scene.add( object );
        }
    }

    reset()
    {
        this.scene.children.filter( o => o.custom ).forEach( o => this.scene.remove( o ) );
    }
}

class ARSimpleView
{
    constructor( container, width, height, mapView = null )
    {
        this.applyPose = AlvaARConnectorTHREE.Initialize( THREE );

        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setClearColor( 0, 0 );
        this.renderer.setSize( width, height );
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
        this.camera.rotation.reorder( 'YXZ' );
        this.camera.updateProjectionMatrix();

        this.scene = new THREE.Scene();
        this.scene.add( new THREE.AmbientLight( 0x808080 ) );
        this.scene.add( new THREE.HemisphereLight( 0x404040, 0xf0f0f0, 1 ) );
        this.scene.add( this.camera );

        this.body = document.body;

        container.appendChild( this.renderer.domElement );

        if( mapView )
        {
            this.mapView = mapView;
            this.mapView.camHelper = new THREE.CameraHelper( this.camera );
            this.mapView.scene.add( this.mapView.camHelper );
        }
    }

    updateCameraPose( pose )
    {
        this.applyPose( pose, this.camera.quaternion, this.camera.position );

        this.renderer.render( this.scene, this.camera );

        this.body.classList.add( "tracking" );
    }

    lostCamera()
    {
        this.body.classList.remove( "tracking" );
    }

    createObjectWithPose( pose, scale = 1.0 )
    {
        const plane = new THREE.Mesh( new THREE.PlaneGeometry( scale, scale ), new THREE.MeshBasicMaterial( {
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.1
        } ) );

        scale *= 0.25;

        const cube = new THREE.Mesh( new THREE.BoxGeometry( scale, scale, scale ), new THREE.MeshNormalMaterial( { flatShading: true } ) );
        cube.position.z = scale * 0.5;

        plane.add( cube );
        plane.custom = true;

        this.applyPose( pose, plane.quaternion, plane.position );
        this.scene.add( plane );

        if( this.mapView )
        {
            this.mapView.scene.add( plane.clone() );
        }
    }

    reset()
    {
        this.scene.children.filter( o => o.custom ).forEach( o => this.scene.remove( o ) );

        if( this.mapView )
        {
            this.mapView.scene.children.filter( o => o.custom ).forEach( o => this.mapView.scene.remove( o ) );
        }
    }
}

class ARSimpleMap
{
    constructor( container, width, height )
    {
        this.renderer = new THREE.WebGLRenderer( { antialias: false } );
        this.renderer.setClearColor( new THREE.Color( 'rgb(255, 255, 255)' ) );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( width, height, false );
        this.renderer.domElement.style.width = width + 'px';
        this.renderer.domElement.style.height = height + 'px';

        this.camera = new THREE.PerspectiveCamera( 50, width / height, 0.01, 1000 );
        this.camera.position.set( -1, 2, 2 );

        this.controls = new OrbitControls( this.camera, this.renderer.domElement, );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 1000;

        this.gridHelper = new THREE.GridHelper( 150, 100 );
        this.gridHelper.position.y = -1;

        this.axisHelper = new THREE.AxesHelper( 0.25 );

        this.camHelper = null;

        this.scene = new THREE.Scene();
        this.scene.add( new THREE.AmbientLight( 0xefefef ) );
        this.scene.add( new THREE.HemisphereLight( 0x404040, 0xf0f0f0, 1 ) );
        this.scene.add( this.gridHelper );
        this.scene.add( this.axisHelper );

        container.appendChild( this.renderer.domElement );

        const render = () =>
        {
            this.controls.update();
            this.renderer.render( this.scene, this.camera );

            requestAnimationFrame( render );
        }

        render();
    }
}

export { ARCamView, ARCamIMUView, ARSimpleView, ARSimpleMap }