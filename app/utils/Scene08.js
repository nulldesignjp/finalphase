import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';


export default class Scene08 extends AbstructScene {

    static meta = {
        title: 'Cast Shadow',
        description: 'scene08.js',
        image: "",
        url: 'https://nulldeisn.jp',
        tags: ['template-A', 'template-B', 'template-C'],
        transition: {
            type: 0, // crossfade
            duration: 0.5,
            threshold: 0.6
        }
    }

    constructor(_props) {
        super(_props)

        //  blank scene


        this.objList = []


        let _renderer = _props.renderer;
        _renderer.shadowMap.enabled = true;
        _renderer.shadowMap.type = THREE.PCFSoftShadowMap;


        //  amb
        this.scene.add( new THREE.AmbientLight( 0xFFFFFF, 0.99 ) )


        //  dir
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(50, 100, 50);
        light.castShadow = true;
        // light.lookAt( new THREE.Vector3() )
        // this.scene.add(light);





        let _shadowScale = 2;
        const light2 = new THREE.SpotLight(0xffffff);
        light2.position.set(150, 150, -150);
        light2.castShadow = true;
        this.scene.add(light2);

        this.helper = new THREE.SpotLightHelper( light2 ) 
        this.scene.add( this.helper )

        light2.shadow.mapSize.width = 1024 * _shadowScale;
        light2.shadow.mapSize.height = 1024 * _shadowScale;

        light2.angle = Math.PI / 6
        light2.castShadow = true;
        light2.shadow.mapSize.width = 1024;
        light2.shadow.mapSize.height = 1024;
        light2.shadow.camera.near = 1;
        light2.shadow.camera.far = 1000;
        light2.shadow.camera.fov = 30;
        light2.decay = 0.1;
        light2.penumbra = 0.85;


        this.light = light2;


        light.shadow.mapSize.width = 1024 * _shadowScale;;
        light.shadow.mapSize.height = 1024 * _shadowScale;;

        light.shadow.camera.left = -500;
        light.shadow.camera.right = 500;
        light.shadow.camera.top = 500;
        light.shadow.camera.bottom = -500;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 500;









        let _geom = new THREE.PlaneGeometry(1000, 1000)

        _geom.rotateX( - Math.PI * 0.5 );
        const plane = new THREE.Mesh(
          _geom,
          new THREE.MeshStandardMaterial({ color: 0xfffFFF })
        );
        plane.receiveShadow = true;
        this.scene.add( plane );

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(100,100,100),
          new THREE.MeshStandardMaterial({ color: 0xF0F0F0 })
        );
        cube.castShadow = true;
        this.scene.add( cube );

        plane.position.y = -100;
        cube.position.y = -50;

        this.objList.push(plane)
        this.objList.push(cube)



    }

    update() {
        super.update()

        if( this.light )
        {
            let _radius = 400;
            let _time = Date.now() * 0.00025;
            this.light.position.x = Math.cos( _time ) * _radius;
            this.light.position.y = Math.sin( _time ) * _radius;
            this.helper.update()

        }

        let len = this.objList.length;
        this.objList.forEach((_obj, i) => {
            _obj.rotation.y += 0.001
        })

    }

    dispose() {
        if (super.dispose) {
            super.dispose();
        }

    }
}