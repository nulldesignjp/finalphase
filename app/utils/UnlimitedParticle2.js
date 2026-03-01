import * as THREE from 'three';

export default class UnlimitedParticle2 {

    static particleVertexShader = `#include <common>
uniform float time;
uniform float dofRange;
uniform float baseSize;

attribute float randomSeed;

varying float vDofFactor;
varying float vBlurAmount;

void main()
{
    vec3 pos = position;
    pos.z += sin(time + randomSeed * 3.1516*2.0)*16.0;
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_Position = projectionMatrix * mvPosition;

    // ワールド空間でのパーティクル位置
    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    
    // カメラ位置とパーティクル位置の差分から距離を計算
    float distance = length(cameraPosition - worldPosition.xyz);
    
    // カメラの原点からの距離を基準距離として使用
    float cameraDistance = length(cameraPosition);
    
    // 焦点からの距離を計算
    float focusDistance = abs(distance - cameraDistance);
    
    // DOF係数: 焦点範囲内(±dofRange)で1.0、範囲外で0.0に近づく
    vDofFactor = 1.0 - smoothstep(0.0, dofRange, focusDistance);
    
    // ボケ量: 焦点から離れるほど大きくなる
    vBlurAmount = smoothstep(0.0, dofRange, focusDistance);
     
    // サイズ計算: cameraDistanceの位置でbaseSizeになるように設定
    float basePointSize = (cameraDistance * baseSize) / distance;
    
    // ボケによるサイズ増加（焦点外は最大16倍まで大きくなる）
    gl_PointSize = basePointSize * (1.0 + vBlurAmount * 64.0);
    }`

    static particleFragmentShader = `uniform float time;

uniform vec3 planeColor;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying float vDofFactor;
varying float vBlurAmount;

void main()
{
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    float dist = length(circCoord);
    
    float opacity = step( dist, 1.0 ) * 0.1;    //  min opacity
    float _middleOpacity = smoothstep(1.0, 0.99, dist) * 0.2;    // maiddle opacity/
    float maxOpacity = 1.0;
    
    // 玉ボケ効果: ボケ量に応じてドーナツ型のリングを作成
    if (vBlurAmount > 0.1) {
        // リングの内側と外側の半径
        float outerRadius = 1.0;

        // リングの太さ
        float ringThickness = 1.0 / (2.0 * vBlurAmount * 64.0 + 1.0);

        // エッジ
        float edge = smoothstep(1.0, 0.99, dist);
    // edge *= smoothstep(0.9, 0.98, dist) * 0.8 + 0.2;
    // edge *= smoothstep(0.0, 1.0, dist);
    // edge += smoothstep(0.9, 0.98, dist);

    // リング形状を作成
    _middleOpacity = edge;

    // ボケ量に応じてリングを明るくする
    _middleOpacity *= mix(0.0, 1.0, vBlurAmount);


}

opacity = mix(opacity, _middleOpacity, vBlurAmount);

// DOF係数を透明度に適用
opacity *= vDofFactor;

gl_FragColor = vec4(planeColor, opacity);

// FOG
#ifdef USE_FOG
#ifdef USE_LOGDEPTHBUF_EXT
            float depth = gl_FragDepthEXT / gl_FragCoord.w;
#else
            float depth = gl_FragCoord.z / gl_FragCoord.w;
#endif
        float fogFactor = smoothstep(fogNear, fogFar, depth);
gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif
    }`

    constructor(_world, _width) {
        this.world = _world;

        this.WIDTH = _width;
        this.PARTICLES = this.WIDTH * this.WIDTH;

        this.timer = 0.0;
        this.init();

    }

    init() {
        this.particleUniforms = {
            time: { value: 0 },
            dofRange: { value: 300.0 },
            baseSize: { value: 2.0 },

            'planeColor': { type: "c", value: new THREE.Color(Math.random() * 0.1 + 0.1, Math.random() * 0.3 + 0.3, Math.random() * 0.3 + 0.6) },
            'fogColor': { type: "c", value: this.world.scene.fog.color },
            'fogNear': { type: "f", value: this.world.scene.fog.near },
            'fogFar': { type: "f", value: this.world.scene.fog.far },
        }

        // ジオメトリのセットアップ
        var _geometry = new THREE.BufferGeometry();

        // リファレンス（インスタンス属性）
        var reference = new Float32Array(this.PARTICLES * 2);
        var positions = new Float32Array(this.PARTICLES * 3)
        var randomSeed = new Float32Array(this.PARTICLES)
        var _idx = 0;
        for (var i = 0; i < this.WIDTH; i++) {
            for (var j = 0; j < this.WIDTH; j++) {
                reference[_idx++] = i / (this.WIDTH - 1);
                reference[_idx++] = j / (this.WIDTH - 1);

                let _i = i * this.WIDTH + j;
                positions[_i * 3 + 0] = i - this.WIDTH / 2;
                positions[_i * 3 + 1] = j - this.WIDTH / 2;
                positions[_i * 3 + 2] = 0;

                positions[_i * 3 + 0] *= 5.0;
                positions[_i * 3 + 1] *= 5.0;

                positions[_i * 3 + 2] =
                    Math.cos((i - this.WIDTH / 2) / this.WIDTH * Math.PI * 4) * 64.0 +
                    Math.sin((j - this.WIDTH / 2) / this.WIDTH * Math.PI * 4) * 64.0;

                positions[_i * 3 + 2] += (Math.random() - 0.5) * 64


                randomSeed[_i] = Math.random();

            }
        }
        _geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2));
        _geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // パーティクルの位置
        _geometry.setAttribute('randomSeed', new THREE.BufferAttribute(randomSeed, 1));

        var _material = new THREE.ShaderMaterial({
            uniforms: this.particleUniforms,
            vertexShader: UnlimitedParticle2.particleVertexShader,
            fragmentShader: UnlimitedParticle2.particleFragmentShader,
            transparent: true,
            fog: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });

        this.particles = new THREE.Points(_geometry, _material);
        this.world.add(this.particles);

        this.particles.rotation.y = Math.PI / 4
    }

    update(_stepTime = 0.016) {
        this.timer += _stepTime;
        this.particleUniforms.time.value = this.timer;
    }


    dispose() {
        if (this.gpuCompute) {

            if (this.particles) {
                this.world.remove(this.particles);
                if (this.particles.geometry) this.particles.geometry.dispose();
                if (this.particles.material) this.particles.material.dispose();
                this.particles = null;
            }
        }
    }
}