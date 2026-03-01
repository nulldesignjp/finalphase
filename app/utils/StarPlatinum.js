import * as THREE from 'three'
import TheWorld from './TheWorld';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
// import { CopyShader } from 'three/addons/postprocessing//CopyShader.js';

export default class StarPlatinum extends TheWorld {

    constructor(props) {
        super(props);


    }

    init() {
        super.init();

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

        //  composer
        // this.composer = this.effectComposer();
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

        this.postProcess.composer = new EffectComposer(this.renderer, this.renderTarget);
        this.postProcess.composer.setSize(this.size.width, this.size.height);
        this.postProcess.composer.setPixelRatio(this.size.pixelRatio);

        this.postProcess.composer.addPass(this.postProcess.renderPass);
        this.postProcess.composer.addPass(this.postProcess.finalPass);


    }

    update() {
        this.updateKey = window.requestAnimationFrame(this.update.bind(this));

        this.deltaTime = this.clock.getDelta() * this.timeScale;
        this.time += this.deltaTime;
        this.render();
    }

    render() {
        this.camera.lookAt(this.focus);
        let len = this.postProcess.composer.passes.length;
        for (var i = 1; i < len - 1; i++) {
            if (this.postProcess.composer.passes[i].uniforms && this.postProcess.composer.passes[i].uniforms.time) {
                this.postProcess.composer.passes[i].uniforms.time.value += this.deltaTime;
            }
        }
        this.postProcess.composer.render();
    }

    resize() {
        super.resize();

        const width = this.size.width;
        const height = this.size.height;

        var len = this.postProcess.composer.passes.length;
        for (var i = 1; i < len - 1; i++) {
            if (this.postProcess.composer.passes[i].uniforms && this.postProcess.composer.passes[i].uniforms.resolution) {
                this.postProcess.composer.passes[i].uniforms.resolution.value.x = width;
                this.postProcess.composer.passes[i].uniforms.resolution.value.y = height;
            }
        }
        this.postProcess.composer.setSize(width, height);
    }

    addPath(_path) {
        var len = this.postProcess.composer.passes.length;
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
        super.dispose();
        this.renderTarget.dispose();
        this.postProcess.composer.dispose();
    }



}
