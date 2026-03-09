import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene04 extends AbstructScene {

    static meta = {
        title: 'Earth - wireframe',
        description: 'Earthに限らずShader芸をざっくりまとめて自動スライド形式にして表示とか？',
        message: ['横にスライドでも十分面白そう。写真いらんよな'],
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

        // this.setAngle(100);

        let _ldr = new THREE.TextureLoader();
        _ldr.load('/assets/img/earth_specular_2048.png', (texture) => {

            let _sgeo = new THREE.SphereGeometry(200, 32, 16)
            let _smat = new THREE.ShaderMaterial({
                uniforms: {
                    earthTexture: { value: texture }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D earthTexture;
                    varying vec2 vUv;
                    void main() {
                        // 1. テクスチャのサンプリング
                        float mask = texture2D(earthTexture, vUv).r;

                        // 境界線の太さを設定（ピクセル単位で調整可能）
                        float lineWidth = 3.0;

                        // 2. 境界の勾配（変化量）を取得
                        // fwidth は隣接ピクセルとの差分を絶対値で返す
                        float edge = fwidth(mask);

                        // 3. 境界線部分の係数を計算
                        // maskが0.5（境界）の地点で1.0になり、そこから離れるとすぐ0.0になる
                        // 0.01 などの小さな値で割ることで、線の鋭さを調整できます
                        float line = smoothstep(edge * lineWidth, 0.0, abs(mask - 0.5));

                        // 4. 線の色を指定（例：鮮やかな水色）
                        vec3 lineColor = vec3(0.0, 0.8, 1.0);
                        lineColor = vec3(.0, .0, .0);

                        // 5. 出力
                        // lineFactor を alpha に使うことで、線以外を透明にできます
                        // ※WebGL側で transparent: true の設定が必要です
                        gl_FragColor = vec4(lineColor, line);

                        // もし透明化せず、黒背景に線だけにしたい場合はこちら
                        // gl_FragColor = vec4(lineColor * line, 1.0);

                        //  地表だけうっすら塗るなど
                        gl_FragColor += vec4(vec3(0.0), (1.0 - mask) * 0.025);

                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
            let _smesh = new THREE.Mesh(_sgeo, _smat)
            this.scene.add(_smesh)

            let _smat2 = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.25,
                wireframe: true,
            })
            let _smesh2 = new THREE.Mesh(_sgeo, _smat2)
            // _smesh.add(_smesh2)

        });

    }

    update() {
        super.update()

        if (this.scene) {
            this.scene.rotation.y += 0.002
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