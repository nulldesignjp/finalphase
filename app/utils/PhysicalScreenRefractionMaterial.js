import * as THREE from 'three';

const PhysicalScreenRefractionMaterial = {
    uniforms: {
        tDiffuse: { value: null }, // 背景のRenderTargetテクスチャ
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

        // 物理ベースのパラメータ
        uIor: { value: 1.5 }, // 基本の屈折率（ガラスは約1.5、アクリルは約1.49）
        uThickness: { value: 0.2 }, // オブジェクトの擬似的な厚み（歪みのスケール）
        uChromaticAberration: { value: 0.08 }, // 色収差の強さ（RGBの屈折率の差）
        uNoiseStrength: { value: 0.02 }, // すりガラスのようなノイズの強さ
        uTime: { value: 0 }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec4 vScreenPos;

        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            // 法線をワールド座標系に変換
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            
            // スクリーンスペース座標の計算
            vScreenPos = projectionMatrix * viewMatrix * worldPosition;
            gl_Position = vScreenPos;
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uIor;
        uniform float uThickness;
        uniform float uChromaticAberration;
        uniform float uNoiseStrength;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec4 vScreenPos;

        // 疑似乱数生成関数
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            // スクリーンのベースUV (0.0 ~ 1.0)
            vec2 uv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
            float aspect = uResolution.x / uResolution.y;

            // カメラから頂点へのベクトル（視線）
            vec3 viewDir = normalize(vWorldPosition - cameraPosition);
            vec3 normal = normalize(vWorldNormal);

            // RGBごとの屈折率（IOR）をずらして光の分散を表現
            // 現実のプリズムと同様に波長によって曲がり方を変える
            float iorR = uIor - uChromaticAberration;
            float iorG = uIor;
            float iorB = uIor + uChromaticAberration;

            // 3D空間での屈折ベクトルを計算 (refract関数)
            vec3 refR = refract(viewDir, normal, 1.0 / iorR);
            vec3 refG = refract(viewDir, normal, 1.0 / iorG);
            vec3 refB = refract(viewDir, normal, 1.0 / iorB);

            // ノイズ（すりガラス効果）
            vec2 noise = vec2(
                random(uv + uTime) - 0.5,
                random(uv + vec2(1.0, uTime)) - 0.5
            ) * uNoiseStrength;

            // 3Dの屈折ベクトル(XY成分)を、2Dの画面上のUVのズレに変換
            // uThicknessを掛けて「厚み」を擬似的に表現
            vec2 offsetR = refR.xy * uThickness + noise;
            vec2 offsetG = refG.xy * uThickness + noise;
            vec2 offsetB = refB.xy * uThickness + noise;

            // 画面のアスペクト比補正（横長画面で歪みが横に伸びないようにする）
            offsetR.x /= aspect;
            offsetG.x /= aspect;
            offsetB.x /= aspect;

            // テクスチャをサンプリング
            float r = texture2D(tDiffuse, uv + offsetR).r;
            float g = texture2D(tDiffuse, uv + offsetG).g;
            float b = texture2D(tDiffuse, uv + offsetB).b;

            // フレネル反射（輪郭が白く光るガラス特有の現象）
            // 視線と法線が垂直に近い（輪郭）ほど強く反射する
            float fresnel = 1.0 - max(dot(-viewDir, normal), 0.0);
            float rim = pow(fresnel, 4.0) * 0.2; // 輪郭の白さを調整

            gl_FragColor = vec4(r + rim, g + rim, b + rim, 1.0);

        }
    `
};

export { PhysicalScreenRefractionMaterial };