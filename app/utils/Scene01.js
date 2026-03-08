import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Scene01 extends AbstructScene {

    static meta = {
        title: 'template title element 01',
        description: 'template description element 01',
        image: "/assets/img/brokenBuild.PNG",
        url: 'https://nulldeisn.jp',
        tags: ['template-A', 'template-B', 'template-C'],
        transition: {
            type: 0,
            duration: 0.5,
            threshold: 0.5
        }
    }

    constructor(_props) {
        super(_props)

        let _ldr = new GLTFLoader()
        _ldr.load('/assets/models/maze00.glb', (_gltf) => {
            this.scene.add(_gltf.scene)

            _gltf.scene.scale.set(50, 50, 50)

            this.mesh = _gltf.scene

            let _hemi = new THREE.HemisphereLight(0xFFFFFF, 0xCCCCCC, 1.0);
            this.hemiLight = _hemi;
            this.scene.add(_hemi)

            let _dir = new THREE.DirectionalLight(0xFFFFFF, 1.0);
            _dir.position.set(10, 20, 10)

            this.directionalLight = _dir;
            this.scene.add(_dir)
        })
    }

    update() {
        super.update()

        if (this.mesh) {
            this.mesh.rotation.x += 0.002
            this.mesh.rotation.y += 0.002
        }

    }
}