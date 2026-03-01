import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene02 extends AbstructScene {

    static meta = {
        title: 'template title element',
        description: 'template description element',
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

        this.setAngle(100);

        let _ldr = new GLTFLoader()
        _ldr.load('/assets/models/hex.glb', (_gltf) => {
            this.scene.add(_gltf.scene)

            _gltf.scene.scale.set(100, 100, 100)

            this.mesh = _gltf.scene.children[0]

            _gltf.scene.rotation.x = Math.PI * 0.25


            // AmbientLightからHemisphereLightに変更（環境光のグラデーション）
            let _hemi = new THREE.HemisphereLight(0xFFFFFF, 0xCCCCCC, 1.0);
            this.hemiLight = _hemi;
            this.scene.add(_hemi)

            let _ambient = new THREE.AmbientLight(0xFFFFFF, 1.0);
            this.ambientLight = _ambient;
            this.scene.add(_ambient)





        })



    }

    update() {
        super.update()

        if (this.mesh) {
            this.mesh.rotation.y += 0.002
        }

    }

    dispose() {
        if (this.pane) {
            this.pane.dispose();
        }
        if (this.paneContainer && this.paneContainer.parentNode) {
            this.paneContainer.parentNode.removeChild(this.paneContainer);
        }
        if (super.dispose) {
            super.dispose();
        }
    }
}