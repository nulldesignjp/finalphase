import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import RipplePass from './RipplePass.js';
import { Pane } from 'tweakpane';

import gsap from 'gsap';

export default class KVEngine extends THREE.EventDispatcher {
    constructor(_props) {
        super();
        this.props = _props;

        this.updateKey;
        this.resizeKey;
        this.eventList = [];

        this.time = 0;
        this.deltaTime = 0;
        this.timeScale = 1;

        //  execute
        this.init();
        this.addEvents()
        this.update();
        this.resize();
        this.props.canvas?.classList.add('activate');
    }

    init() {

        return new Promise((_resolve) => {

            this.size = {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio
            }

            this.clock = new THREE.Clock();

            this.scene = new THREE.Scene();
            // this.camera = new THREE.PerspectiveCamera(45, this.size.width / this.size.height, 0.1, 1000);
            this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
            this.focus = new THREE.Vector3(0, 0, 0);

            // this.focalLengthToFOV(35);
            // this.camera.position.set(0, 0, ~~this.pixelEqualMagnification());
            // this.camera.lookAt(this.focus);
            // this.camera.far = 3000;
            // this.camera.updateProjectionMatrix();
            this.camera.position.set(0, 0, 100);

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.props.canvas,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setPixelRatio(this.size.pixelRatio);
            this.renderer.setSize(this.size.width, this.size.height);
            this.renderer.setClearColor(this.props.backgroundColor || 0xF0F0F0, 1);

            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            // this.renderer.toneMappingExposure = 1;

            this.renderTarget = new THREE.WebGLRenderTarget(
                this.size.width * this.size.pixelRatio,
                this.size.height * this.size.pixelRatio,
                {
                    magFilter: THREE.NearestFilter,
                    minFilter: THREE.LinearFilter,
                    wrapS: THREE.ClampToEdgeWrapping,
                    wrapT: THREE.ClampToEdgeWrapping
                }
            );

            this.postProcess = {}
            this.postProcess.renderPass = new RenderPass(this.scene, this.camera)
            this.postProcess.finalPass = new ShaderPass({
                vertexShader: `varying vec2 vUv;
            void main()
            {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
                fragmentShader: `varying vec2 vUv;
            uniform sampler2D tDiffuse;
            void main()
            {
                vec4 color = texture2D(tDiffuse, vUv);
                gl_FragColor = color;
            }`,
                uniforms:
                {
                    tDiffuse: { value: null }
                }
            })
            //  or
            // var _copySahder = new ShaderPass( CopyShader );
            // _copySahder.renderToScreen = true;
            // this.composer.addPass( _copySahder );

            this.postProcess.composer = new EffectComposer(this.renderer);
            this.postProcess.composer.setSize(this.size.width, this.size.height);
            this.postProcess.composer.setPixelRatio(this.size.pixelRatio);

            this.postProcess.composer.addPass(this.postProcess.renderPass);
            // this.postProcess.composer.addPass(this.postProcess.finalPass);

            // finalPassの代わりに、RipplePassを追加
            let _s = 0.1; // 解像度を下げると波が速く、粘度が低く見える
            this.ripplePass = new RipplePass(this.size.width * this.size.pixelRatio * _s, this.size.height * this.size.pixelRatio * _s);
            this.ripplePass.renderToScreen = true;
            this.postProcess.composer.addPass(this.ripplePass);

            // Tweakpaneのセットアップ
            // this.pane = new Pane({ title: 'RipplePass Settings' });
            // const folder = this.pane.addFolder({ title: 'Ripple Parameters' });
            // folder.addBinding(this.ripplePass.simMaterial.uniforms.uDamping, 'value', { min: 0.9, max: 0.999, step: 0.001, label: 'Damping' });
            // folder.addBinding(this.ripplePass.simMaterial.uniforms.uRadius, 'value', { min: 0.001, max: 0.1, step: 0.001, label: 'Radius' });
            // folder.addBinding(this.ripplePass.simMaterial.uniforms.uStrength, 'value', { min: 0.1, max: 10.0, step: 0.1, label: 'Strength' });
            // folder.addBinding(this.ripplePass.renderMaterial.uniforms.uDistortion, 'value', { min: 0.0, max: 2.0, step: 0.01, label: 'Distortion' });
            // folder.addBinding(this.ripplePass.renderMaterial.uniforms.uHighlight, 'value', { min: 0.0, max: 5.0, step: 0.01, label: 'Highlight' });
            // folder.addBinding(this.ripplePass.renderMaterial.uniforms.uRgbShift, 'value', { min: 0.0, max: 0.5, step: 0.001, label: 'RGB Shift' });
            // folder.addBinding(this.ripplePass.renderMaterial.uniforms.div, 'value', { min: 1.0, max: 2048.0, step: 1.0, label: 'Div' });

            //  customize
            this.ripplePass.simMaterial.uniforms.uDamping.value = 0.96;
            this.ripplePass.simMaterial.uniforms.uRadius.value = 0.04;
            this.ripplePass.simMaterial.uniforms.uStrength.value = 5.0;
            this.ripplePass.renderMaterial.uniforms.uDistortion.value = 1.0;
            this.ripplePass.renderMaterial.uniforms.uHighlight.value = 1.0;
            this.ripplePass.renderMaterial.uniforms.uRgbShift.value = 0.5;
            this.ripplePass.renderMaterial.uniforms.div.value = 1024.0;

            // マウスイベントの更新ロジック
            this.lastMouse = new THREE.Vector2();
            window.addEventListener('mousemove', (_e) => {
                const nx = _e.clientX / window.innerWidth;
                const ny = 1.0 - _e.clientY / window.innerHeight;

                // マウスの移動量（波の発生力）を計算
                const delta = Math.min(Math.hypot(nx - this.lastMouse.x, ny - this.lastMouse.y), 0.1);

                this.ripplePass.updateMouse(nx, ny, delta);
                this.lastMouse.set(nx, ny);
            });
            window.addEventListener('click', (_e) => {
                const nx = _e.clientX / window.innerWidth;
                const ny = 1.0 - _e.clientY / window.innerHeight;

                // マウスの移動量（波の発生力）を計算
                const delta = 0.1;

                this.ripplePass.updateMouse(nx, ny, delta);
                this.lastMouse.set(nx, ny);
            });

            setInterval(() => {

                const _eclientX = Math.floor(Math.random() * window.innerWidth);
                const _eclientY = Math.floor(Math.random() * window.innerHeight);
                const nx = _eclientX / window.innerWidth;
                const ny = 1.0 - _eclientY / window.innerHeight;

                // マウスの移動量（波の発生力）を計算
                const delta = 0.1;

                this.ripplePass.updateMouse(nx, ny, delta);
                this.lastMouse.set(nx, ny);

            }, 3000)

            _resolve();
        });

    }

    addEvent(_target, _key, _value, _opt = {}) {

        this.eventList.push({
            target: _target,
            key: _key,
            value: _value,
            opt: _opt
        });

        _target.addEventListener(_key, _value, _opt);

    }

    addEvents() {

        this.addEvent(window, 'resize', this.resize.bind(this));

    }

    removeEvents() {
        this.eventList.forEach((_event) => {
            _event.target.removeEventListener(_event.key, _event.value, _event.opt);
        });
        this.eventList = [];
    }

    update() {
        this.updateKey = window.requestAnimationFrame(this.update.bind(this));

        this.deltaTime = this.clock.getDelta() * this.timeScale;
        this.time += this.deltaTime;

        // カスタムイベントの発火
        this.dispatchEvent({ type: 'update', delta: this.deltaTime, time: this.time });

        this.render();
    }

    render() {

        this.camera.lookAt(this.focus);

        this.dispatchEvent({ type: 'beforeRender', delta: this.deltaTime, time: this.time });
        this.beforeRender();

        const _composer = this.postProcess.composer;
        const len = _composer.passes.length;
        for (let i = 1; i < len - 1; i++) {
            if (_composer.passes[i].uniforms && _composer.passes[i].uniforms.time) {
                _composer.passes[i].uniforms.time.value += this.deltaTime;
            }
        }

        this.dispatchEvent({ type: 'afterRender', delta: this.deltaTime, time: this.time });
        this.afterRender();
    }

    beforeRender() {
        // --- 屈折表現のための2パスレンダリング ---
        // Pass 1: 屈折オブジェクトを非表示にして、背景をレンダーターゲットに描画
        this.renderer.setRenderTarget(this.renderTarget);
        // this.renderer.clear(); // 必要なら
        this.renderer.render(this.scene, this.camera);

    }

    afterRender() {
        // Pass 2: 屈折オブジェクトを再表示して、ポストプロセスを適用した最終シーンを画面に描画
        // renderer.render と composer.render が両方実行されると、画面が重なり合ってブルブル震える原因になるため composer.render のみに統一
        this.renderer.setRenderTarget(null);

        // this.renderer.render(this.scene, this.camera);
        this.postProcess.composer.render();
    }

    /**
     * カメラの焦点距離からFOVを算出してセット
     * セットする数値は一眼レフのレンズ換算で設定
     * @param {*} _focalLength 
     * @returns 
     */
    focalLengthToFOV(_focalLength = 35) {
        const _h = this.camera.filmGauge; //  (36mm * 24mm (フルサイズ) の対角線の長さを算出)
        const _v = _h * 2 / 3;
        const _diagonalLine = Math.sqrt(_h * _h + _v * _v);
        this.camera.fov = 180.0 / Math.PI * Math.atan(_diagonalLine / (_focalLength * 2.0)) * 2.0;
        this.camera.updateProjectionMatrix();
        return this.camera.fov;
    }

    /**
     * FOVの値からピクセル等倍になる距離を返す（カメラから被写体までの距離）
     * @returns カメラから見たときに1ピクセルが1ミリメートルになる距離
     */
    pixelEqualMagnification() {
        const _dist = ((this.size.height) * 0.5) / Math.tan((this.camera.fov * 0.5) * Math.PI / 180);
        return _dist;
    }

    /**
     * 3D空間上のオブジェクトの位置を2Dスクリーン座標に変換して返す
     * @param {*} _mesh 
     * @returns {x, y}
     */
    getWorldToScreen2D(_mesh) {
        const vector = new THREE.Vector3();
        const widthHalf = 0.5 * this.size.width;
        const heightHalf = 0.5 * this.size.height;
        _mesh.updateMatrixWorld();
        vector.setFromMatrixPosition(_mesh.matrixWorld);
        vector.project(this.camera);
        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;

        const _dir0 = new THREE.Vector3().subVectors(this.focus, this.camera.position);
        const _dir1 = new THREE.Vector3().subVectors(_mesh.position, this.camera.position);
        const _d = _dir0.dot(_dir1);
        if (_d <= 0) {
            vector.x = -9999;
            vector.y = -9999;
        }

        return {
            x: vector.x,
            y: vector.y
        };
    }

    resize() {

        // オブジェクトごと上書きするのではなくプロパティを更新することで、
        // 参照で受け取っている各Scene側にも最新の値が伝播するようにする
        this.size.width = window.innerWidth;
        this.size.height = window.innerHeight;
        this.size.pixelRatio = window.devicePixelRatio;

        if (this.camera.aspect) {
            this.camera.aspect = this.size.width / this.size.height;
        } else {
            this.camera.left = - this.size.width * 0.5;
            this.camera.right = this.size.width * 0.5;
            this.camera.bottom = - this.size.height * 0.5;
            this.camera.top = this.size.height * 0.5;
        }
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.size.width, this.size.height);
        this.renderer.setPixelRatio(this.size.pixelRatio);

        // 屈折用レンダーターゲットのサイズも更新
        this.renderTarget.setSize(this.size.width * this.size.pixelRatio, this.size.height * this.size.pixelRatio);

        if (this.ripplePass) {
            let _s = 0.1;
            this.ripplePass.resize(this.size.width * this.size.pixelRatio * _s, this.size.height * this.size.pixelRatio * _s);
        }

        const len = this.postProcess.composer.passes.length;
        for (let i = 0; i < len; i++) {
            if (this.postProcess.composer.passes[i].uniforms && this.postProcess.composer.passes[i].uniforms.resolution) {
                this.postProcess.composer.passes[i].uniforms.resolution.value.x = this.size.width;
                this.postProcess.composer.passes[i].uniforms.resolution.value.y = this.size.height;
            }
        }
        this.postProcess.composer.setSize(this.size.width, this.size.height);
        this.postProcess.composer.setPixelRatio(this.size.pixelRatio);

        // カスタムイベントの発火（リサイズ完了通知）
        this.dispatchEvent({ type: 'resize', width: this.size.width, height: this.size.height, pixelRatio: this.size.pixelRatio });
    }

    add(_object3d) {
        this.scene.add(_object3d);
    }

    remove(_object3d) {
        this.scene.remove(_object3d);
    }

    addPath(_path) {
        const len = this.postProcess.composer.passes.length;
        this.postProcess.composer.passes.splice(len - 1, 0, _path);
    }

    removePath(_path) {
        let len = this.postProcess.composer.passes.length;
        while (len) {
            len--;
            if (_path === this.postProcess.composer.passes[len]) {
                this.postProcess.composer.passes.splice(len, 1);
                break;
            }
        }
    }
    addShader(_path) { this.addPath(_path); }
    removeShader(_path) { this.removePath(_path); }

    dispose() {
        this.removeEvents();
        if (this.updateKey) {
            window.cancelAnimationFrame(this.updateKey);
        }

        if (this.pane) {
            this.pane.dispose();
        }

        // シーン内のオブジェクトを再帰的に解放
        if (this.scene) {
            this.scene.traverse((obj) => {
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(material => {
                            this.disposeMaterial(material);
                        });
                    } else {
                        this.disposeMaterial(obj.material);
                    }
                }
            });
        }

        if (this.postProcess.composer) this.postProcess.composer.dispose();
        if (this.renderTarget) this.renderTarget.dispose();
        if (this.renderer) this.renderer.dispose();

        // シーンなどの参照を切る
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    disposeMaterial(material) {
        material.dispose();
        // テクスチャがあれば解放
        Object.keys(material).forEach(prop => {
            if (!material[prop]) return;
            if (material[prop].isTexture) {
                material[prop].dispose();
            }
        });
    }
}