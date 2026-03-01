import * as THREE from 'three';

export default class AbstructScene {
    constructor(_props) {
        this.props = _props;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, _props.size.width / _props.size.height, 0.1, 1000);
        this.focus = new THREE.Vector3(0, 0, 0);
        this.renderer = _props.renderer;
        this.renderTarget = new THREE.WebGLRenderTarget(
            _props.size.width * _props.size.pixelRatio,
            _props.size.height * _props.size.pixelRatio,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                depthBuffer: true,
                stencilBuffer: true,
            }
        );

        this.setAngle(35);
    }

    update() {
        this.camera.lookAt(this.focus);
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }

    resize() {
        this.renderTarget.setSize(this.props.size.width * this.props.size.pixelRatio, this.props.size.height * this.props.size.pixelRatio);
        this.camera.aspect = this.props.size.width / this.props.size.height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.renderTarget.dispose();
    }

    setAngle(_angle) {
        if (this.camera.aspect) {
            this.focalLengthToFOV(_angle);
            this.camera.position.set(0, 0, ~~this.pixelEqualMagnification());
            this.camera.lookAt(this.focus);
            this.camera.near = this.camera.position.z - 1000;
            this.camera.near = this.camera.near < 0.1 ? 0.1 : this.camera.near;
            this.camera.far = this.camera.position.z + 1000;
            this.camera.updateProjectionMatrix();
        }
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
        const _dist = ((this.props.size.height) * 0.5) / Math.tan((this.camera.fov * 0.5) * Math.PI / 180);
        return _dist;
    }

    /**
     * 3D空間上のオブジェクトの位置を2Dスクリーン座標に変換して返す
     * @param {*} _mesh 
     * @returns {x, y}
     */
    getWorldToScreen2D(_mesh) {
        const vector = new THREE.Vector3();
        const widthHalf = 0.5 * this.props.size.width;
        const heightHalf = 0.5 * this.props.size.height;
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
}