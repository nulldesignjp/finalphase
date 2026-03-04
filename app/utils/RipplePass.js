import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export default class RipplePass extends Pass {
    constructor(width, height) {
        super();

        // 1. GPGPU用のPing-Pongバッファ（Float型にしてマイナス値や微細な波を保持）
        const options = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType,
            depthBuffer: false,
            stencilBuffer: false
        };
        this.rtA = new THREE.WebGLRenderTarget(width, height, options);
        this.rtB = new THREE.WebGLRenderTarget(width, height, options);

        // 2. 波動方程式用マテリアル（R=現在, G=1フレーム前の高さ）
        this.simMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tWave: { value: null },
                uTexelSize: { value: new THREE.Vector2(1 / width, 1 / height) },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uMouseDelta: { value: 0.0 }, // マウスが動いた距離（描画の強さに影響）
                uDamping: { value: 0.985 },  // 波の粘性・減衰
                uRadius: { value: 0.015 },   // 波の発生源の広さ
                uStrength: { value: 2.0 },   // 波の強さ
                uMouseEnable: { value: 1.0 } // 反復処理時のマウス入力を制御
            },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tWave;
                uniform vec2 uTexelSize;
                uniform vec2 uMouse;
                uniform float uMouseDelta;
                uniform float uDamping;
                uniform float uRadius;
                uniform float uStrength;
                uniform float uMouseEnable; // 初期反復のみマウス入力を有効化するフラグ
                varying vec2 vUv;

                void main() {
                    vec4 wave = texture2D(tWave, vUv);
                    float currentVal = wave.r;
                    float previous = wave.g;

                    // 上下左右のピクセルから波をサンプリング
                    float n = texture2D(tWave, vUv + vec2(0.0, uTexelSize.y)).r;
                    float s = texture2D(tWave, vUv - vec2(0.0, uTexelSize.y)).r;
                    float e = texture2D(tWave, vUv + vec2(uTexelSize.x, 0.0)).r;
                    float w = texture2D(tWave, vUv - vec2(uTexelSize.x, 0.0)).r;

                    // 波動方程式: (周囲の平均 * 2) - 過去の状態
                    float newHeight = (n + s + e + w) * 0.5 - previous;
                    newHeight *= uDamping; // 粘性による減衰

                    // マウス座標近辺に力を加える（滑らかな減衰で波紋の重なりを綺麗にする）
                    float dist = distance(vUv, uMouse);
                    float drop = smoothstep(uRadius, 0.0, dist);
                    newHeight += drop * uMouseDelta * uStrength * uMouseEnable;

                    // 波が重なりすぎて値が爆発し、法線が破綻するのを防ぐためのクランプ
                    newHeight = clamp(newHeight, -3.0, 3.0);

                    // Rに現在の状態、Gに前回を保持
                    gl_FragColor = vec4(newHeight, currentVal, 0.0, 1.0);
                }
            `
        });

        // 3. 描画用マテリアル（ComposerのreadBufferと合成し、光沢と歪みを適用）
        this.renderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tWave: { value: null },
                uTexelSize: { value: new THREE.Vector2(1 / width, 1 / height) },
                uDistortion: { value: 0.4 },
                uHighlight: { value: 1.0 }, // スペキュラの強さ
                uRgbShift: { value: 0.02 }, // 色収差の強さ
                uLightDir: { value: new THREE.Vector3(1.0, 1.0, 1.0).normalize() } // 仮想光源の方向
            },
            vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
            fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform sampler2D tWave;
            uniform vec2 uTexelSize;
            uniform float uDistortion;
            uniform float uHighlight;
            uniform float uRgbShift;
            uniform vec3 uLightDir;
            varying vec2 vUv;

            void main() {
                // 波の高さを取得し、法線の傾き（勾配）を計算
                float h = texture2D(tWave, vUv).r;
                float hx = texture2D(tWave, vUv + vec2(uTexelSize.x, 0.0)).r;
                float hy = texture2D(tWave, vUv + vec2(0.0, uTexelSize.y)).r;
                
                vec2 gradient = vec2(hx - h, hy - h);
                
                // 接線ベクトルから3D空間の法線ベクトルを生成
                // クロス積でのアンダーフローや極端な法線を防ぐため、解析的なアプローチに修正
                // Z要素(0.02)により、波紋の重なり時にも法線が暴れず綺麗なハイライトになります
                vec3 normal3d = normalize(vec3(-gradient.x, -gradient.y, 0.02));
                
                // 2Dの歪み用オフセット
                vec2 distortionOffset = gradient;

                // 1. 各チャンネルのサンプリング座標（法線ベースの空間歪み ＋ 色収差）
                vec2 uvR = vUv + distortionOffset * (uDistortion + uRgbShift);
                vec2 uvG = vUv + distortionOffset * uDistortion;
                vec2 uvB = vUv + distortionOffset * (uDistortion - uRgbShift);

                // 2. チャンネルごとに別々の座標からテクスチャをサンプリング（背景の屈折・色収差）
                float r = texture2D(tDiffuse, uvR).r;
                float g = texture2D(tDiffuse, uvG).g;
                float b = texture2D(tDiffuse, uvB).b;
                vec4 color = vec4(r, g, b, 1.0);

                // 3. スペキュラハイライト（光の反射）の計算
                // 視線方向（Z軸負の向きから画面を見ているとする）
                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                
                // ハーフベクトル（光源と視線の間）
                vec3 halfVector = normalize(uLightDir + viewDir);
                
                // 法線とハーフベクトルの内積でハイライトの強さを求める (Blinn-Phong)
                float spec = max(dot(normal3d, halfVector), 0.0);
                spec = pow(spec, 64.0); // 輝きの鋭さ

                // 水面のハイライト（白色）を重ねる
                color.rgb += vec3(1.0) * spec * uHighlight * min(length(distortionOffset) * 500.0, 1.0); // 波が平らな部分は光らないように調整

                gl_FragColor = color;
            }
        `
        });
        // 共通の描画用Quad
        this.fsQuad = new FullScreenQuad(this.simMaterial);

        // シミュレーションの処理回数（速度に直結）
        this.iterations = 2;
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 1. マウス変位の減衰
        this.simMaterial.uniforms.uMouseDelta.value *= 0.5;

        // 解像度やシミュレーション回数で波のスピードを調整
        for (let i = 0; i < this.iterations; i++) {
            // 初回のみマウスの入力を反映し、それ以降は波の伝播だけを行う
            this.simMaterial.uniforms.uMouseEnable.value = (i === 0) ? 1.0 : 0.0;

            // 2. 波のシミュレーション（rtA と rtB のスワップ）
            const temp = this.rtA;
            this.rtA = this.rtB;
            this.rtB = temp;

            this.simMaterial.uniforms.tWave.value = this.rtB.texture;
            this.fsQuad.material = this.simMaterial;

            renderer.setRenderTarget(this.rtA);
            this.fsQuad.render(renderer);
        }

        // --- STEP 2: 最終画面への描画 ---
        this.fsQuad.material = this.renderMaterial;
        this.renderMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this.renderMaterial.uniforms.tWave.value = this.rtA.texture; // 最新の波

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
        }
        this.fsQuad.render(renderer);
    }

    // マウス入力の更新用インターフェース
    updateMouse(x, y, delta) {
        this.simMaterial.uniforms.uMouse.value.set(x, y);
        this.simMaterial.uniforms.uMouseDelta.value = delta;
    }
}