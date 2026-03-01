import * as THREE from 'three'
import StarPlatinum from '../utils/StarPlatinum'
import { gsap } from 'gsap';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export default class i260213 {

  constructor(props) {
    this.props = props
    this.init();
    this.generate();
    this.update();
  }

  init() {
    this.world = new StarPlatinum({
      canvas: this.props.canvas,
      backgroundColor: 0xFFFFFF,
      isOrthographic: false,
      // isOrbitControls: true
    })

    this.world.focalLengthToFOV(35);
    this.world.camera.position.set(0, 0, ~~this.world.pixelEqualMagnification());

    let _shader = {
      uniforms: {
        time: { value: 0 },
        tDiffuse: { value: null },
        div: { value: 9 },
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
        void main() {
          vec2 _uv = vUv;

          float len = length(_uv - vec2(0.5));
          float angle = atan(_uv.y - 0.5, _uv.x - 0.5);

          angle = 0.05 * len * len;

          float r = texture2D(tDiffuse, _uv + angle * 0.1).r;
          float g = texture2D(tDiffuse, _uv - angle * 0.1).g;
          float b = texture2D(tDiffuse, _uv + angle * 0.05).b;

          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
    };
    let _effect = new ShaderPass(_shader);
    _effect.renderToScreen = false;
    this.world.addPath(_effect);


    window.addEventListener('resize', this.resize.bind(this))
  }

  generate() {
    const geom = new THREE.PlaneGeometry(1, 1, 1, 1)
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        div: { value: 9 },
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

        #define PI 3.14159265359

        float random(vec2 uv) {
          return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec2 rotate(vec2 v, float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
        }

        // リサージュ曲線を計算する関数
        float getLissajous(vec2 uv, float phase, float freqA, float freqB) {
          vec2 p = uv * 2.0 - 1.0;
          
          float minDist = 1.0;
          const int samples = 100; // サンプル数
          
          vec2 prevPoint;
          
          for(int i = 0; i <= samples; i++) {
            float t = float(i) * 2.0 * PI / float(samples);
            
            // 現在の点を計算
            vec2 currentPoint = vec2(sin(freqA * t + phase), sin(freqB * t));
            
            if (i > 0) {
              // 線分との距離を計算
              vec2 pa = p - prevPoint;
              vec2 ba = currentPoint - prevPoint;
              float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
              float dist = length( pa - ba*h );
              
              minDist = min(minDist, dist);
            }
            
            prevPoint = currentPoint;
          }
          
          float lineThickness = 0.01; 
          return smoothstep(lineThickness, lineThickness + 0.005, minDist);
        }

        void main() {

          vec2 _uv = vUv;
          _uv = rotate(_uv -vec2(0.5), time * 0.01 ) + vec2(0.5);

          vec2 uv = floor(_uv * div) / div;
          // gl_FragColor = texture2D(tDiffuse, uv);

          // 余白を計算
          vec2 f = fract(_uv * div);
          vec2 fPad = (f - 0.5) * 1.1 + 0.5;

          //  f値をセルごとにランダムに角度をつける。回転の中心はセルの中心で角度はセルごとにランダム
          // float angle = random(uv) * 3.1416;
          // f = rotate(f-vec2(0.5), angle) + vec2(0.5);

          // 背景色を取得
          vec3 baseColor = texture2D(tDiffuse, uv).rgb;

          // 輝度
          float luminance = 0.2126 * baseColor.r + 0.7152 * baseColor.g + 0.0722 * baseColor.b;
          luminance = floor( luminance * 8.0 ) + 1.0;
          float freqA = luminance + 1.0;
          float freqB = luminance + 0.0;
          
          // リサージュ曲線の寄与度を計算
          float intensity = getLissajous( fPad, time * 0.5 + ( vUv.x + vUv.y ) * 3.1416, freqA, freqB);

          // 白い線で合成
          gl_FragColor = vec4( vec3(intensity), 0.1);
        }
      `,
      transparent: true
    })
    this.mesh = new THREE.Mesh(geom, mat)
    this.world.scene.add(this.mesh)
    this.resize();

    this.intervalKey = setInterval(() => {
      const _pow = Math.floor(Math.random() * 3) + 3;
      // this.mesh.material.uniforms.div.value = Math.pow(2, _pow)

      gsap.to(this.mesh.material.uniforms.div, {
        value: Math.pow(2, _pow),
        duration: 0.75,
        ease: 'power2.inOut'
      })


    }, 6000)
  }

  update() {
    this.updatekey = requestAnimationFrame(this.update.bind(this))

    this.mesh.material.uniforms.time.value += 0.016 * 2.0
  }

  resize() {

    let _scale = Math.max(window.innerWidth, window.innerHeight);
    this.mesh.scale.set(_scale, _scale, 1)
  }

  dispose() {
    this.world.dispose()
    cancelAnimationFrame(this.updatekey)
    window.removeEventListener('resize', this.resize.bind(this))
  }

}
