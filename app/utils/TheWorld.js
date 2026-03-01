import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class TheWorld {

    constructor(props) {
        const defaults = {
            backgroundColor: 0x181818,
            isOrthographic: false,
            isOrbitControls: false
        }
        this.props = { ...defaults, ...props };

        this.updateKey = undefined;
        this.resizeKey = undefined;
        this.eventList = undefined;
        this.time = undefined;
        this.deltaTime = undefined;
        this.timeScale = undefined;

        this.clock = undefined;
        this.size = undefined;
        this.scene = undefined;
        this.camera = undefined;
        this.renderer = undefined;

        this.init();
        this.generate();
        this.addEvents()
        this.update();

    }

    /**
     * 初期化. シーン、カメラ、レンダラーの生成
     * @returns {void}
     */
    init() {
        this.eventList = [];
        this.time = 0.0;
        this.deltaTime = 0.0;
        this.timeScale = 1.0;
        this.clock = new THREE.Clock();


        this.size =
        {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        }

        this.scene = new THREE.Scene();
        // this.camera = new THREE.OrthographicCamera(-this.size.width / 2, this.size.width / 2, this.size.height / 2, -this.size.height / 2, 0.1, 1000);
        //this.camera = new THREE.PerspectiveCamera( 45, this.size.width / this.size.height, 0.1, 1000 );
        this.camera = this.props.isOrthographic ?
            new THREE.OrthographicCamera(-this.size.width / 2, this.size.width / 2, this.size.height / 2, -this.size.height / 2, 0.1, 3000) :
            new THREE.PerspectiveCamera(45, this.size.width / this.size.height, 0.1, 1000);
        this.focus = new THREE.Vector3();

        // iOS18 / iPhone16Pro fix
        let context = null;
        let canvas = this.props.canvas;

        try {
            if (!canvas) {
                canvas = document.createElement('canvas');
            }

            const contextAttributes = {
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                depth: true,
                stencil: true,
                powerPreference: 'high-performance'
            };

            context = canvas.getContext('webgl2', contextAttributes) || canvas.getContext('webgl', contextAttributes);

            if (context) {
                // Patch getShaderPrecisionFormat
                if (context.getShaderPrecisionFormat) {
                    const originalGetShaderPrecisionFormat = context.getShaderPrecisionFormat.bind(context);
                    context.getShaderPrecisionFormat = function (shaderType, precisionType) {
                        const result = originalGetShaderPrecisionFormat(shaderType, precisionType);
                        if (result === null) {
                            // Return reasonable highp defaults
                            return { rangeMin: 127, rangeMax: 127, precision: 23 };
                        }
                        return result;
                    };
                }

                // Patch getContextAttributes
                // iOS18 WebGLContext might return null immediately after creation
                if (context.getContextAttributes) {
                    const originalGetContextAttributes = context.getContextAttributes.bind(context);
                    context.getContextAttributes = function () {
                        const attributes = originalGetContextAttributes();
                        if (attributes === null) {
                            return contextAttributes;
                        }
                        return attributes;
                    }
                }
            }
        } catch (e) {
            console.warn('WebGL context path failed', e);
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: context,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.size.width, this.size.height);
        this.renderer.setPixelRatio(this.size.pixelRatio);
        this.renderer.setClearColor(this.props.backgroundColor, 1.0)

        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(this.focus);

    }

    /**
     * 初期生成。コントロールやカメラの位置などを設定。特に不要であれば削除
     */
    generate() {

        if (this.props.isOrbitControls) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.2;
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.enabled = true;
            this.controls.target = this.focus;
        }

        if (!this.props.isOrthographic) {
            this.focalLengthToFOV(50);
            this.camera.position.z = ~~this.pixelEqualMagnification();
            this.camera.far = 3000; //  適当
            this.camera.updateProjectionMatrix();
        } else {
            this.camera.position.z = 100;
        }

    }

    /**
     * 常時描画
     */
    update() {
        this.updateKey = window.requestAnimationFrame(this.update.bind(this));

        this.deltaTime = this.clock.getDelta() * this.timeScale;
        this.time += this.deltaTime;

        this.controls?.update();
        this.render();
    }

    /**
     * 描画。単体でも実行可能
     */
    render() {
        this.camera.lookAt(this.focus);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * レンダリング結果をBase64エンコードした文字列で取得
     * @returns {String} dataURL
     */
    capture() {
        this.renderer.render(this.scene, this.camera);
        var dataURL = this.renderer.domElement.toDataURL();
        return dataURL;
    }

    /**
     * SceneにObject3Dを追加
     * @param {*} _object3d 
     */
    add(_object3d) {
        this.scene.add(_object3d);
    }

    /**
     * SceneからObject3Dを削除
     * @param {*} _object3d 
     */
    remove(_object3d) {
        if (_object3d.parent) {
            _object3d.parent.remove(_object3d);
        } else {
            this.scene.remove(_object3d);
        }

    }

    /**
     * リサイズ登録。
     * this.eventListに登録される。
     * 即時関数でも後述のremoveEvents()で解除可能。古い仕組み。
     */
    addEvents() {
        let _evt0 = {
            target: window,
            key: 'resize',
            value: (e) => {
                this.resize();
            },
            options: {}
        }
        _evt0.target.addEventListener(_evt0.key, _evt0.value, _evt0.options)
        this.eventList.push(_evt0);
    }

    /**
     * 登録されたイベントを全て解除
     */
    removeEvents() {
        let len = this.eventList.length;
        while (len) {
            len--
            let _evt = this.eventList.pop()
            _evt.target.removeEventListener(_evt.key, _evt.value, _evt.options)

        }
        this.eventList = [];
    }

    /**
     * カメラの焦点距離からFOVを算出してセット
     * セットする数値は一眼レフのレンズ換算で設定
     * @param {*} _focalLength 
     * @returns 
     */
    focalLengthToFOV(_focalLength = 35) {
        var _h = this.camera.filmGauge; //  (36mm * 24mm (フルサイズ) の対角線の長さを算出)
        var _v = _h * 2 / 3;
        var _diagonalLine = Math.sqrt(_h * _h + _v * _v);
        this.camera.fov = 180.0 / Math.PI * Math.atan(_diagonalLine / (_focalLength * 2.0)) * 2.0;
        this.camera.updateProjectionMatrix();
        return this.camera.fov;
    }

    /**
     * FOVの値からピクセル等倍になる距離を返す（カメラから被写体までの距離）
     * @returns カメラから見たときに1ピクセルが1ミリメートルになる距離
     */
    pixelEqualMagnification() {
        var _dist = ((this.size.height) * 0.5) / Math.tan((this.camera.fov * 0.5) * Math.PI / 180);
        return _dist;
    }

    /**
     * 3D空間上のオブジェクトの位置を2Dスクリーン座標に変換して返す
     * @param {*} _mesh 
     * @returns {x, y}
     */
    getWorldToScreen2D(_mesh) {
        var vector = new THREE.Vector3();
        var widthHalf = 0.5 * this.size.width;
        var heightHalf = 0.5 * this.size.height;
        _mesh.updateMatrixWorld();
        vector.setFromMatrixPosition(_mesh.matrixWorld);
        vector.project(this.camera);
        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;

        var _dir0 = new THREE.Vector3().subVectors(this.focus, this.camera.position);
        var _dir1 = new THREE.Vector3().subVectors(_mesh.position, this.camera.position);
        var _d = _dir0.dot(_dir1);
        if (_d <= 0) {
            vector.x = -9999;
            vector.y = -9999;
        }

        return {
            x: vector.x,
            y: vector.y
        };
    }

    /**
     * ウィンドウリサイズ時の処理
     * 全体のサイズ管理とカメラの画角、レンダラーあたりを処理
     */
    resize(width = window.innerWidth, height = window.innerHeight) {
        this.size.width = width;
        this.size.height = height;
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
    }

    /**
     * 後片付け
     */
    dispose() {
        window.cancelAnimationFrame(this.updateKey);
        window.clearInterval(this.resizeKey);
        this.removeEvents();
        this.eventList = null;

        this.scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.scene.clear();

        this.renderer.dispose()

    }

}
