import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene06 extends AbstructScene {

    static meta = {
        title: 'orbe object',
        description: 'scene06.js',
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


        let _ldr = new THREE.TextureLoader().load('/assets/img/IMG_1399.JPG', _texture => {
            let _geoms = new THREE.PlaneGeometry(100, 100, 32, 32);
            let _mats = new THREE.MeshBasicMaterial({ map: _texture });

            // 2. 反射用マッピングに設定（重要！）
            _texture.mapping = THREE.EquirectangularReflectionMapping;

            // 発色を良くするために色空間を調整（任意）
            _texture.colorSpace = THREE.SRGBColorSpace;

            _geoms = new THREE.SphereGeometry(50, 32, 32);

            _mats = new THREE.MeshPhysicalMaterial({
                // color: 0xf0f8ff,
                transmission: 1.0,      // 透過
                thickness: 2.0,         // 厚み（少し増やすと屈折が強調されます）
                roughness: 0.0,         // 0にすると完全にクリアなガラスになります
                metalness: 0.0,
                ior: 1.5,               // ガラスの屈折率は1.5が標準的（1.33は水です）
                clearcoat: 1.0,         // 表面のツヤ出し
                clearcoatRoughness: 0,
                envMap: _texture,
                envMapIntensity: 4.0,   // 通常画像（LDR）の場合は、少し高め(2.0〜)にすると光ります
                envMapRotation: new THREE.Euler(0, Math.PI, 0), // 反射の向きを調整したい場合
                transparent: true,
                // opacity: 0.8,
                // depthWrite: false,
                side: THREE.FrontSide,  // ガラスの場合、DoubleSideよりFrontSideの方が屈折が綺麗に出る場合が多いです
            });

            // _mats.attenuationColor = new THREE.Color(0x00aaff); // 奥に沈む色（水色や紫など）
            // _mats.attenuationDistance = 50.0; // 値が小さいほど色が濃く出ます

            _mats.iridescence = 0.85; // 虹色の強さ
            _mats.iridescenceIOR = 1.33; // 虹色の屈折率
            _mats.iridescenceThicknessRange = [100, 400]; // 虹色の層の厚み

            // 3. シーンの背景に設定
            //  いまいちパッとしーひん


            for (var i = 0; i < 8; i++) {

                let _mesh = new THREE.Mesh(_geoms, _mats);
                this.scene.add(_mesh);
                this.objList.push(_mesh);

            }

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
            let _dirLight = new THREE.DirectionalLight(0xffffff, 0.2);
            _dirLight.position.set(5, 10, 7.5);
            this.scene.add(_dirLight);

            // //  _geomsの座標を sphereGeometryuの頂点に合わせる
            // let _sphereGeoms = new THREE.SphereGeometry(50, 32, 32);
            // for(let i=0; i<_geoms.attributes.position.count; i++){
            //     let _pos = new THREE.Vector3().fromBufferAttribute(_geoms.attributes.position, i);
            //     let _uv = new THREE.Vector2().fromBufferAttribute(_geoms.attributes.uv, i);
            //     let _spherePos = new THREE.Vector3().fromBufferAttribute(_sphereGeoms.attributes.position, i);
            //     _pos.copy(_spherePos);
            //     _geoms.attributes.position.setXYZ(i, _pos.x, _pos.y, _pos.z);
            // }
            // _geoms.attributes.position.needsUpdate = true;
        });



    }

    update() {
        super.update()

        let len = this.objList.length;
        this.objList.forEach((_obj, i) => {

            let _rad = i * Math.PI / 4;
            _obj.position.x = Math.cos(Date.now() * 0.001 + _rad) * 150
            _obj.position.z = Math.sin(Date.now() * 0.001 + _rad) * 150
            _obj.position.y = Math.sin(_rad * 2.0 + Date.now() * 0.001) * 50




            _obj.rotation.y += 0.01
            _obj.material.envMapRotation.y += 0.005;
        })

    }

    dispose() {
        if (super.dispose) {
            super.dispose();
        }
    }
}