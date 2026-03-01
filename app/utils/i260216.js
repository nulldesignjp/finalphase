
import * as THREE from 'three'
import StarPlatinum from '../utils/StarPlatinum'
import { gsap } from 'gsap';
import { Pane } from 'tweakpane';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export default class i260216 {

    constructor(props) {
        this.props = props
        this.pane = new Pane({
            title: 'Vibe Controller',
        });

        this.params = {
            div: 32, // グリッド分割数
            speed: 0.5, // アニメーション速度
            distortion: 0.5, // 歪みの強さ
            zoom: 1.0, // UVのズーム率
            colorShift: 0.0, // 色相の回転
        };

        this.init();
        this.generate();
        this.setupPane();
        this.update();
    }

    init() {
        this.world = new StarPlatinum({
            canvas: this.props.canvas,
            backgroundColor: 0x000000,
            isOrthographic: false,
        })

        this.world.focalLengthToFOV(35);
        this.world.camera.position.set(0, 0, ~~this.world.pixelEqualMagnification());

        // Post processing
        let _shader = {
            uniforms: {
                time: { value: 0 },
                tDiffuse: { value: null },
                rgbShift: { value: 0.005 },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform sampler2D tDiffuse;
        uniform float rgbShift;

        void main() {
          vec2 uv = vUv;
          
          // RGB Shift based on distance from center
          float dist = length(uv - 0.5);
          float shift = rgbShift * dist;

          float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;

          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
        };
        this.postEffect = new ShaderPass(_shader);
        this.postEffect.renderToScreen = false;
        this.world.addPath(this.postEffect);

        window.addEventListener('resize', this.resize.bind(this))
    }

    setupPane() {
        // Refresh pane
        // this.pane.dispose(); 
        // this.pane = new Pane({ title: 'Vibe Controller' });

        const f1 = this.pane.addFolder({ title: 'Fluid Grid' });
        f1.addBinding(this.params, 'div', { min: 1, max: 200, step: 1 }).on('change', (ev) => {
            this.mesh.material.uniforms.div.value = ev.value;
        });
        f1.addBinding(this.params, 'distortion', { min: 0.0, max: 2.0 }).on('change', (ev) => {
            this.mesh.material.uniforms.distortion.value = ev.value;
        });
        f1.addBinding(this.params, 'zoom', { min: 0.1, max: 3.0 }).on('change', (ev) => {
            this.mesh.material.uniforms.zoom.value = ev.value;
        });

        const f2 = this.pane.addFolder({ title: 'Time & Color' });
        f2.addBinding(this.params, 'speed', { min: 0.0, max: 2.0 });
        f2.addBinding(this.params, 'colorShift', { min: 0.0, max: 1.0 }).on('change', (ev) => {
            this.mesh.material.uniforms.colorShift.value = ev.value;
        });
    }

    generate() {
        const geom = new THREE.PlaneGeometry(1, 1, 1, 1)
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                div: { value: this.params.div },
                distortion: { value: this.params.distortion },
                zoom: { value: this.params.zoom },
                colorShift: { value: this.params.colorShift },
                tDiffuse: { value: new THREE.TextureLoader().load('/assets/img/Starry-Night-canvas-Vincent-van-Gogh-New-1889.jpg') }
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform sampler2D tDiffuse;
        uniform float div;
        uniform float distortion;
        uniform float zoom;
        uniform float colorShift;

        #define PI 3.14159265359

        // Simplex 3D Noise 
        // from https://github.com/patriciogonzalezvivo/thebookofshaders/blob/master/glsl/noise/simplex/3d.glsl
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
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

            //   x0 = x0 - 0.0 + 0.0 * C.xxx;
            //   x1 = x0 - i1  + 1.0 * C.xxx;
            //   x2 = x0 - i2  + 2.0 * C.xxx;
            //   x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

            // Permutations
            i = mod289(i);
            vec4 p = permute( permute( permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
            //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
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

        vec3 curlNoise(vec3 p) {
            const float e = 0.0009765625;
            vec3 dx = vec3(e, 0.0, 0.0);
            vec3 dy = vec3(0.0, e, 0.0);
            vec3 dz = vec3(0.0, 0.0, e);

            vec3 p_x0 = snoise(p - dx) * vec3(1.0, 0.0, 0.0);
            vec3 p_x1 = snoise(p + dx) * vec3(1.0, 0.0, 0.0);
            vec3 p_y0 = snoise(p - dy) * vec3(0.0, 1.0, 0.0);
            vec3 p_y1 = snoise(p + dy) * vec3(0.0, 1.0, 0.0);
            vec3 p_z0 = snoise(p - dz) * vec3(0.0, 0.0, 1.0);
            vec3 p_z1 = snoise(p + dz) * vec3(0.0, 0.0, 1.0);

            float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
            float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
            float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

            const float divisor = 1.0 / (2.0 * e);
            return normalize(vec3(x, y, z) * divisor);
        }

        // HSV to RGB
        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = vUv;
          
          // Zoom
          uv = (uv - 0.5) * zoom + 0.5;

          // Grid
          vec2 gridUv = floor(uv * div) / div;
          vec2 localUv = fract(uv * div) - 0.5;

          // Organic Distortion using Curl Noise applied to UV
          vec3 noisePos = vec3(gridUv * 5.0, time * 0.2); // Position based on grid
          vec3 flow = curlNoise(noisePos);
          
          vec2 distortedLocalUv = localUv + flow.xy * distortion;

          // Circular shape based on flow
          float len = length(distortedLocalUv);
          float circle = smoothstep(0.4, 0.35, len);

          // Texture fetch with flow
          vec4 texColor = texture2D(tDiffuse, gridUv + flow.xy * 0.05);

          // Color Shift
          vec3 hsv = texColor.rgb; // This is actually RGB, treating as base
          // Simple hue rotation sim
          float angle = colorShift * PI * 2.0;
          float s = sin(angle);
          float c = cos(angle);
          mat3 rot = mat3(
              vec3(0.213 + 0.787*c - 0.213*s, 0.715 - 0.715*c - 0.715*s, 0.072 - 0.072*c + 0.928*s),
              vec3(0.213 - 0.213*c + 0.143*s, 0.715 + 0.285*c + 0.140*s, 0.072 - 0.072*c - 0.283*s),
              vec3(0.213 - 0.213*c - 0.787*s, 0.715 - 0.715*c + 0.715*s, 0.072 + 0.928*c + 0.072*s)
          );
          
          vec3 finalColor = circle * texColor.rgb * rot;
          
          // Add some glow based on flow z
          finalColor += vec3(0.1, 0.2, 0.5) * (flow.z * 0.5 + 0.5) * circle;

          gl_FragColor = vec4(finalColor, circle); // Alpha cutout
        }
      `,
            transparent: true,
            side: THREE.DoubleSide
        })
        this.mesh = new THREE.Mesh(geom, mat)
        this.world.scene.add(this.mesh)
        this.resize();
    }

    update() {
        this.updatekey = requestAnimationFrame(this.update.bind(this))

        // Uniforms update
        this.mesh.material.uniforms.time.value += 0.016 * this.params.speed;
    }

    resize() {
        let _scale = Math.max(window.innerWidth, window.innerHeight);
        this.mesh.scale.set(_scale, _scale, 1)
    }

    dispose() {
        this.pane.dispose();
        this.world.dispose()
        cancelAnimationFrame(this.updatekey)
        window.removeEventListener('resize', this.resize.bind(this))
    }

}