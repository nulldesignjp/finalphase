import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene03 extends AbstructScene {

    static meta = {
        title: 'template title element 03',
        description: 'template description element 03',
        image: "/assets/img/view01.PNG",
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

        // Tweakpane用パラメータ
        this.params = {
            hemiSkyColor: '#ffffff',
            hemiGroundColor: '#d1e3ff',
            hemiIntensity: 1.0,

            dirIntensity: 1.5,
            dirColor: '#ffffff',
            dirX: 10, dirY: 20, dirZ: 10,

            color: '#878eac',
            emissive: '#0124d2',
            emissiveIntensity: 0.5,
            roughness: 1.0,
            metalness: 0.0,
            opacity: 0.8,
            transparent: true,
            wireframe: false,
            flatShading: false,
            blending: THREE.NormalBlending
        };

        // this.setupPane();

        let _ldr = new GLTFLoader()
        _ldr.load('/assets/models/fieldtest.glb', (_gltf) => {
            this.scene.add(_gltf.scene)

            _gltf.scene.scale.set(100, 100, 100)

            this.mesh = _gltf.scene


            // AmbientLightからHemisphereLightに変更（環境光のグラデーション）
            let _hemi = new THREE.HemisphereLight(this.params.hemiSkyColor, this.params.hemiGroundColor, this.params.hemiIntensity);
            this.hemiLight = _hemi;
            this.scene.add(_hemi)

            let _dir = new THREE.DirectionalLight(this.params.dirColor, this.params.dirIntensity);
            _dir.position.set(this.params.dirX, this.params.dirY, this.params.dirZ)

            // 影の有効化と設定
            _dir.castShadow = true;
            _dir.shadow.mapSize.width = 2048;
            _dir.shadow.mapSize.height = 2048;
            _dir.shadow.camera.left = -50;
            _dir.shadow.camera.right = 50;
            _dir.shadow.camera.top = 50;
            _dir.shadow.camera.bottom = -50;
            _dir.shadow.bias = -0.001;

            this.directionalLight = _dir;
            this.scene.add(_dir)

            _gltf.scene.rotation.x = 0.5

            this.mesh.traverse((_node) => {
                if (_node.isMesh) {
                    _node.castShadow = true;
                    _node.receiveShadow = true;

                    if (_node.material.name == "water") {
                        if (!this.waterMaterials) this.waterMaterials = new Set();
                        this.waterMaterials.add(_node.material);

                        _node.material.side = THREE.DoubleSide;
                        _node.material.colorSpace = THREE.SRGBColorSpace;

                        // Tweakpaneパラメータを初期適用
                        _node.material.color.set(this.params.color);
                        _node.material.emissive.set(this.params.emissive);
                        _node.material.emissiveIntensity = this.params.emissiveIntensity;
                        _node.material.roughness = this.params.roughness;
                        _node.material.metalness = this.params.metalness;
                        _node.material.opacity = this.params.opacity;
                        _node.material.transparent = this.params.transparent;
                        _node.material.wireframe = this.params.wireframe;
                        _node.material.flatShading = this.params.flatShading;
                        _node.material.blending = this.params.blending;

                        _node.material.needsUpdate = true;
                    } else {
                        // water以外のベースメッシュをクレイ風（真っ白なマット）に設定
                        _node.material.color.set('#ffffff');
                        _node.material.emissive.set('#000000');
                        _node.material.roughness = 1.0;
                        _node.material.metalness = 0.0;
                        _node.material.transparent = false;
                        _node.material.needsUpdate = true;
                    }
                }
            })


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