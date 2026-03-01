import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

export default class UnlimitedParticle {

    static computeShaderPosition = `#define delta 1.0 / 60.0
void main(){
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec4 tmpVel = texture2D( textureVelocity, uv );
    vec3 vel = tmpVel.xyz;

    pos += vel * delta;

    gl_FragColor = vec4( pos, 1.0 );
    }`

    static computeShaderVelocity = `
#include <common>

uniform float time;
uniform float timeScale;

// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 snoiseVec3( vec3 x ){

  float s  = snoise(vec3( x ));
  float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
  float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
  return vec3( s , s1 , s2 );

}

vec3 curlNoise( vec3 p ){
  
  const float e = 0.1;
  vec3 dx = vec3( e   , 0.0 , 0.0 );
  vec3 dy = vec3( 0.0 , e   , 0.0 );
  vec3 dz = vec3( 0.0 , 0.0 , e   );

  // Optimization: Use Forward Difference instead of Central Difference
  // Reduces snoise calls from 6 * 3 = 18 to 4 * 3 = 12
  
  vec3 p_0 = snoiseVec3( p );
  vec3 p_x1 = snoiseVec3( p + dx );
  vec3 p_y1 = snoiseVec3( p + dy );
  vec3 p_z1 = snoiseVec3( p + dz );

  float x = p_y1.z - p_0.z - p_z1.y + p_0.y;
  float y = p_z1.x - p_0.x - p_x1.z + p_0.z;
  float z = p_x1.y - p_0.y - p_y1.x + p_0.x;

  const float divisor = 1.0 / e;
  return normalize( vec3( x , y , z ) * divisor );

}


void main(){
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec4 tmpVel = texture2D( textureVelocity, uv );
    vec3 vel = tmpVel.xyz;
    
    // Retrieve per-particle speed variation from alpha channel
    float pSeed = tmpVel.w;
    
    // Add per-particle time offset and scale variation for diverse movement
    float timeOffset = pSeed * 5.0; // Very subtle phase difference
    float scaleVariation = 0.95 + pSeed * 0.10; // 0.95x to 1.05x (minimal)
    
    // Use defines for random offset per instance
    vec3 noisePos = tmpPos.xyz * 0.0025 * scaleVariation + vec3(randomX, randomY, randomZ) * 0.5 + (time + timeOffset) * 0.1;
    vec3 cn = curlNoise( noisePos );
    
    // Apply force with very subtle variation (0.90x to 1.10x)
    float forceMultiplier = 0.90 + pSeed * 0.2;
    vel += cn * 5.0 * forceMultiplier * timeScale;

    //  Damping
    vel *= 0.96;

    //  Containment (Box)
    float _min = 600.0;
    float _max = 800.0;
    
    float d = length( tmpPos.xyz );
    if( d > _max )
    {
        vec3 dir = normalize( tmpPos.xyz );
        vel -= dir * ( d - _max ) * 0.1;
    }
    
    //  grav center
    vel -= normalize( tmpPos.xyz ) * 2.0 * timeScale;


    gl_FragColor = vec4( vel, pSeed );
    }`

    static particleVertexShader = `#include <common>
uniform float time;
uniform float dofRange;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform float baseSize;

attribute vec2 reference;

varying vec3 vNormal;
varying vec2 vReference;
varying float vBlur; // Pass blur amount to fragment shader
varying float vDelta; // Signed distance from focus

void main()
{
    vReference = reference;

    vec4 posTemp = texture2D( texturePosition, reference );
    vec3 pos = posTemp.xyz;

    vec4 velTemp = texture2D( textureVelocity, reference );
    // vec3 vel = velTemp.xyz;

    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_Position = projectionMatrix * mvPosition;

    // Bokeh / Depth of Field Logic
    // Switch to Euclidean distance from camera (Spherical focus)
    float dist = length( mvPosition.xyz );
    float focusDist = length( cameraPosition ); // Use built-in cameraPosition 

    // Signed distance from focus (- = Near/Foreground, + = Far/Background)
    float delta = dist - focusDist;
    vDelta = delta;

    // Clamped blur factor (0.0 = sharp, 1.0 = blurry)
    float blur = smoothstep( 0.0, dofRange, abs(delta) );
    vBlur = blur;

    // Asymmetric Size
    // Near (Foreground): Massive Bokeh (up to 72px)
    // Far (Background): Smaller Bokeh (up to 12px)
    // Seamless transition using smoothstep
    float depthFactor = smoothstep(-100.0, 100.0, delta); // 0.0=Foreground, 1.0=Background
    
    // Optimization: Reduced max Size from 72.0 to 48.0 to prevent overwhelming fill-rate
    float bokehScale = mix(48.0, 8.0, depthFactor);

    gl_PointSize = 1.8 + blur * bokehScale * 2.0 * baseSize;
    }`

    static particleFragmentShader = `uniform float time;

uniform vec3 planeColor;
uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 ambientColor;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;


varying vec3 vNormal;
varying vec2 vReference;
varying float vBlur;
varying float vDelta; // Signed distance from focus

uniform sampler2D textureVelocity;

    vec3 hueShift( vec3 color, float hue) {
        const vec3 k = vec3(0.57735, 0.57735, 0.57735);
        float cosAngle = cos(hue);
        return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
    }

    void main()
    {
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    float distToCenter = length(circCoord);
    if (distToCenter > 1.0) {
        discard;
    }
    
    // --- Bokeh Shape Calculation ---
    
    // 1. In-Focus Profile: Sharp, solid dot
    float inFocusShape = 1.0 - smoothstep(0.8, 1.0, distToCenter);
    
    // [Feature] Hero Particle Differentiation (Branchless)
    float rnd = fract(sin(dot(vReference.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float isHero = step(0.99, rnd); 
    float isNonHero = 1.0 - isHero;
    
    // Determine context (vDelta < 0.0 means isForeground = 1.0)
    float isForeground = 1.0 - step(0.0, vDelta);
    
    // Active Factor: 1.0 if (Foreground AND NonHero)
    float activeFactor = isForeground * isNonHero;

    // Parameters selection (Branchless)
    
    // Default (Background/Focus/Hero Background): Rim 3.0, Sharp 0.9, Alpha 1.0
    vec3 paramsDefault = vec3(3.0, 0.9, 1.0);
    
    // Non-Hero Foreground: Rim 0.5, Sharp 0.5, Alpha 0.4 (Blurred, Faint)
    vec3 paramsNonHeroFG = vec3(0.5, 0.5, 0.4);
    
    // Hero Foreground: Rim 0.0, Sharp 0.0, Alpha 0.2 (Very Faint Blur)
    // User Request: "Blur whole particle", "Drop transparency further".
    vec3 paramsHeroFG = vec3(0.0, 0.0, 0.2);
    
    // Logic:
    // If Foreground:
    //    Use mix(paramsNonHeroFG, paramsHeroFG, isHero)
    // Else:
    //    Use paramsDefault
    
    vec3 paramsFG = mix(paramsNonHeroFG, paramsHeroFG, isHero);
    vec3 currentParams = mix(paramsDefault, paramsFG, isForeground);
    
    float rimPower = currentParams.x;
    float edgeSharpness = currentParams.y;
    float alphaAtten = currentParams.z;

    // 2. Out-of-Focus Profile (Bokeh)
    // Base Fill
    float fill = 1.0 - smoothstep(edgeSharpness, 1.0, distToCenter);
    
    // Rim Highlight (Bright edge)
    // Rim also softens if edgeSharpness is low to avoid a sharp ring on a fuzzy ball
    float rimStart = max(0.0, edgeSharpness - 0.1); 
    float rim = smoothstep(rimStart, 1.0, distToCenter) * (1.0 - smoothstep(0.95, 1.0, distToCenter));
    
    // Composite
    float standardBokeh = fill * 0.85 + rim * rimPower * 0.5;

    // (Gaussian Blur removed COMPLETELY to serve SOLID center)
    // No "softness" mixing. Pure Tamaboke.
    
    // Final Shape: Use Standard Bokeh directly
    float finalShape = standardBokeh;

    // 3. Mix based on Blur (Sharp -> Bokeh)
    float shape = mix( inFocusShape, finalShape, vBlur );

    
    vec4 velTemp = texture2D( textureVelocity, vReference )/100.0;
    
    float speed = length( velTemp.xyz );
    float speedFactor = smoothstep( 0.0, 8.0, speed );

    vec3 col = planeColor;
    col = hueShift(col, speedFactor * 3.1416 * 2.0 * 4.0);
    vec3 cSlow = col; 
    vec3 cFast = vec3( 1.0, 1.0, 1.0 ); 

    vec3 finalColor = mix( cSlow, cFast, speedFactor * 0.8 );

    // Alpha variation
    // Base alpha: In-focus items should be more solid/visible.
    float baseAlpha = 0.4 + speedFactor * 0.6;
    
    // Boost sharpness for in-focus items (seamless transition)
    float focusBoost = smoothstep(0.3, 0.0, vBlur) * 0.4;
    baseAlpha += focusBoost;

    // Final Alpha: Shape * Base
    float finalAlpha = shape * baseAlpha;
    
    // [Feature] Apply Non-Hero Opacity Reduction
    finalAlpha *= alphaAtten;
    
    // [Feature] Hero Boost REMOVED (Handled by paramsHeroFG alpha=0.8)
    
    finalAlpha = min(1.0, finalAlpha); // Clamp
    
    // Asymmetric attenuation (seamless transition)
    // BACKGROUND: Fade out strongly if blurred (0.2)
    // FOREGROUND: Keep visible, large bokeh (0.5)
    float blurAttenuation = smoothstep(0.15, 0.25, vBlur);
    float depthFactor = smoothstep(-50.0, 50.0, vDelta); // 0.0=Foreground, 1.0=Background
    float attenuationAmount = mix(0.5, 0.2, depthFactor);
    finalAlpha *= mix(1.0, attenuationAmount, blurAttenuation);

    // Twinkling / Glittering Effect (Kirakira)
    float pSeed = velTemp.w * 100.0; // Recover seed stored in alpha (approx 0.8-1.2)
    
    // Hero Particle Check (Unified with global isHero)
    // We remove the separate seed check to ensure consistency.
    // bool isHero = fract(pSeed * 123.45) > 0.995; <--- Duplicate removed
    
    // Vary blink speed and offset based on seed
    // Increased speed and variance
    float flashSpeed = 5.0 + (pSeed * 10.0 - 10.0) * 5.0; 
    float flashOffset = pSeed * 53.0;
    
    // Sharp sine wave for glittering
    float twinkle = sin(time * flashSpeed * 8.0 + flashOffset);
    twinkle = smoothstep(-1.0, 1.0, twinkle); // 0.0 to 1.0
    
    // Modulate alpha: 
    // Fast moving (bright) particles twinkle less (stable light)
    // Slow moving (dim) particles twinkle more (unstable dust)
    float twinkleStrength = 0.5 + (1.0 - speedFactor) * 0.5;
    
    // Increased range: 0.1 to 1.0 (Deep blinking)
    finalAlpha *= (1.0 - twinkleStrength) + twinkleStrength * (0.1 + 0.9 * twinkle);

    // [New] Hero Particle Override
    // Force high opacity for the "protagonists"
    // Use global float isHero (1.0 or 0.0)
    if (isHero > 0.5) {
        // Pulse slowly and brightly
        float heroPulse = 0.5 + 0.5 * sin(time * 3.0 + pSeed * 20.0);
        float heroAlpha = 0.9 + 0.1 * heroPulse; // Always >= 0.9
        
        // IMPORTANT: Multiply by 'shape' to keep the circle/bokeh appearance!
        finalAlpha = heroAlpha * shape;

        // Make them whiter/brighter
        finalColor = mix(finalColor, vec3(1.0), 0.4);
    }


    gl_FragColor = vec4( finalColor, finalAlpha );
    // gl_FragColor *= vec4( diffuse + ambient, 1.0 );
    

    //  FOG
    #ifdef USE_FOG
        #ifdef USE_LOGDEPTHBUF_EXT
            float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
            float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif
        float fogFactor = smoothstep( fogNear, fogFar, depth );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    #endif
    }`

    constructor(_world, _width) {
        this.world = _world;

        this.WIDTH = _width;
        this.PARTICLES = this.WIDTH * this.WIDTH;
        this.velocityVariable;
        this.velocityUniforms;
        this.positionVariable;
        this.positionUniforms;
        this.particleUniforms;

        this.timer = 0.0;
        this.init();
        this.initGPU();

    }

    init() {
        this.particleUniforms = {
            time: { value: 0 },
            dofRange: { value: 300.0 },
            texturePosition: { value: null },
            textureVelocity: { value: null },
            backbuffer: { value: null },
            baseSize: { value: window.innerHeight / 1080 },

            'planeColor': { type: "c", value: new THREE.Color(Math.random() * 0.1 + 0.1, Math.random() * 0.3 + 0.3, Math.random() * 0.3 + 0.6) },
            'fogColor': { type: "c", value: this.world.scene.fog.color },
            'fogNear': { type: "f", value: this.world.scene.fog.near },
            'fogFar': { type: "f", value: this.world.scene.fog.far },
        }

        // Geometry setup
        var _geometry = new THREE.BufferGeometry();

        // References (Instanced Attribute)
        var reference = new Float32Array(this.PARTICLES * 2);
        var _idx = 0;
        for (var i = 0; i < this.WIDTH; i++) {
            for (var j = 0; j < this.WIDTH; j++) {
                reference[_idx++] = i / (this.WIDTH - 1);
                reference[_idx++] = j / (this.WIDTH - 1);
            }
        }
        _geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2));
        _geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.PARTICLES * 3), 3)); // Dummy positions

        var _material = new THREE.ShaderMaterial({
            uniforms: this.particleUniforms,
            vertexShader: UnlimitedParticle.particleVertexShader,
            fragmentShader: UnlimitedParticle.particleFragmentShader,
            transparent: true,
            //wireframe: true,
            side: THREE.DoubleSide,
            fog: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });

        this.particles = new THREE.Points(_geometry, _material);
        this.particles.frustumCulled = false; // Important for GPGPU particles that move outside initial bounds
        this.world.add(this.particles);
    }
    initGPU() {
        //	
        this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, this.world.renderer);

        //	演算領域の確保
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();

        this.initDataField(dtPosition, dtVelocity);

        //	shaderプログラムのアタッチ
        this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', UnlimitedParticle.computeShaderVelocity, dtVelocity);
        this.positionVariable = this.gpuCompute.addVariable('texturePosition', UnlimitedParticle.computeShaderPosition, dtPosition);

        //	おまじない
        this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);

        // Uniformsの設定
        this.positionUniforms = this.positionVariable.material.uniforms;
        this.velocityUniforms = this.velocityVariable.material.uniforms;

        this.positionUniforms.time = { value: 0.0 };
        this.velocityUniforms.time = { value: 0.0 };

        this.velocityVariable.material.defines.randomX = Math.random() * 100.0;
        this.velocityVariable.material.defines.randomY = Math.random() * 100.0;
        this.velocityVariable.material.defines.randomZ = Math.random() * 100.0;

        this.positionVariable.material.uniforms.timeScale = { value: 1.0 };
        this.velocityVariable.material.uniforms.timeScale = { value: 1.0 };

        var error = this.gpuCompute.init();
        if (error !== null) {
            console.error(error);
        }
    }

    update(_stepTime = 0.016) {

        this.gpuCompute.compute();
        this.timer += _stepTime;
        this.velocityUniforms.time.value = this.timer;
        this.particles.material.uniforms.time.value = this.timer;
        this.particles.material.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        this.particles.material.uniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
    }

    resize() {
        this.particleUniforms.baseSize.value = window.innerHeight / 1080;
    }

    initDataField(texturePosition, textureVelocity) {
        //	データを一度取り出す
        var posArray = texturePosition.image.data;
        var velArray = textureVelocity.image.data;

        //	パーティクルの初期位置と、初期速度をランダムに設定
        for (var k = 0, kl = posArray.length; k < kl; k += 4) {
            // Rectangular "Full Screen" distribution
            var x = (Math.random() - 0.5) * 1600; // Width
            var y = (Math.random() - 0.5) * 1000; // Height
            var z = (Math.random() - 0.5) * 400; // Depth

            //	position
            posArray[k + 0] = x;
            posArray[k + 1] = y;
            posArray[k + 2] = z;
            posArray[k + 3] = 0;

            //	velocity
            // velArray[k + 0] = THREE.Math.randFloatSpread(4);
            // velArray[k + 1] = THREE.Math.randFloatSpread(4);
            // velArray[k + 2] = THREE.Math.randFloatSpread(4);
            velArray[k + 0] = (Math.random() - 0.5) * 8
            velArray[k + 1] = (Math.random() - 0.5) * 8
            velArray[k + 2] = (Math.random() - 0.5) * 8
            // Very subtle variation range: 0.90 to 1.10 (nearly uniform)
            velArray[k + 3] = Math.random() * 0.2 + 0.90;
        }
    }

    dispose() {
        if (this.gpuCompute) {
            // Dispose generated textures in variables
            if (this.positionVariable && this.positionVariable.initialValueTexture) {
                this.positionVariable.initialValueTexture.dispose();
            }
            if (this.velocityVariable && this.velocityVariable.initialValueTexture) {
                this.velocityVariable.initialValueTexture.dispose();
            }

            // Dispose render targets (if accessible via internal variables or loop)
            // GPUComputationRenderer usually exposes getCurrentRenderTarget for the variables
            const posRT = this.gpuCompute.getCurrentRenderTarget(this.positionVariable);
            if (posRT) posRT.dispose();
            const velRT = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable);
            if (velRT) velRT.dispose();

            // If there's an internal dispose, call it (some versions don't have it, but we cleaned RTs)
            if (this.gpuCompute.dispose) this.gpuCompute.dispose();
            this.gpuCompute = null;
        }

        if (this.particles) {
            this.world.remove(this.particles);
            if (this.particles.geometry) this.particles.geometry.dispose();
            if (this.particles.material) this.particles.material.dispose();
            this.particles = null;
        }
    }
}