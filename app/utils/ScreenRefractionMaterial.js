import * as THREE from 'three';

const ScreenRefractionMaterial = {
    uniforms: {
        tDiffuse: { value: null },
        uRefractionStrength: { value: 0.2 },
        uChromaticAberration: { value: 0.05 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        // [追加] ノイズ（すりガラス効果）の強さ
        uNoiseStrength: { value: 0.03 } 
    },
    vertexShader: `
        varying vec3 vViewNormal;
        varying vec4 vScreenPos;
        varying vec3 vViewPosition;

        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vec4 mvPosition = viewMatrix * worldPosition;
            vViewNormal = normalize(normalMatrix * normal);
            vViewPosition = -mvPosition.xyz;
            vScreenPos = projectionMatrix * mvPosition;
            gl_Position = vScreenPos;
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uRefractionStrength;
        uniform float uChromaticAberration;
        uniform vec2 uResolution;
        uniform float uNoiseStrength; // [追加]

        varying vec3 vViewNormal;
        varying vec4 vScreenPos;
        varying vec3 vViewPosition;

        // [追加] 疑似乱数を生成する関数（2D座標から0.0〜1.0の値を返す）
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 uv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
            float aspect = uResolution.x / uResolution.y;

            // [追加] ピクセルごとにランダムなオフセット（ノイズ）を計算
            // -0.5して中央を基準に散らすようにします
            vec2 noiseOffset = vec2(
                random(uv) - 0.5,
                random(uv + vec2(1.0, 0.0)) - 0.5 // XとYで違う乱数にするため少しズラす
            ) * uNoiseStrength;
            
            // ノイズのX方向もアスペクト比で補正
            noiseOffset.x /= aspect;

            // 法線による歪みにノイズの歪みを足し合わせる
            vec2 distortion = vViewNormal.xy * uRefractionStrength + noiseOffset;
            distortion.x /= aspect;

            // プリズム効果（色収差）
            vec2 uvR = uv + distortion * (1.0 + uChromaticAberration);
            vec2 uvG = uv + distortion;
            vec2 uvB = uv + distortion * (1.0 - uChromaticAberration);

            // 背景テクスチャからRGBそれぞれサンプリング
            float r = texture2D(tDiffuse, uvR).r;
            float g = texture2D(tDiffuse, uvG).g;
            float b = texture2D(tDiffuse, uvB).b;

            // フレネル効果（輪郭の反射）
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(viewDir, vViewNormal), 0.0);
            float rim = pow(fresnel, 3.0) * 0.15;

            gl_FragColor = vec4(r + rim, g + rim, b + rim, 1.0);
        }
    `
};

export { ScreenRefractionMaterial };