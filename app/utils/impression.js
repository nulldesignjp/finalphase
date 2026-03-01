import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import {MeshRefractionMaterial} from './MeshRefractionMaterial';

import { Pane } from 'tweakpane';
import gsap from 'gsap';



export default class impression {
    constructor(_props) {
        this.props = _props;
        this.canvas = this.props.canvas;
        this.mouse = new THREE.Vector2(0, 0);
 
        this.init();
        this.update();

        // イベントリスナーのthisを固定
        this.boundResize = this.resize.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnClick = this.onClick.bind(this);
        window.addEventListener('resize', this.boundResize);
        window.addEventListener('mousemove', this.boundOnMouseMove);
        window.addEventListener('click', this.boundOnClick);
    }
 
    init() {
        // サイズ設定
        this.sizes = {
            width: this.canvas.offsetWidth,
            height: this.canvas.offsetHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        };
 
        // シーン
        this.scene = new THREE.Scene();
 
        // カメラ
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        );
        this.camera.position.z = 3;
        this.scene.add(this.camera);
 
        // レンダラー
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(this.sizes.pixelRatio);
        this.renderer.setClearColor(0xF0F0F0, 1);
 
        // 屈折表現のためのレンダーターゲットを作成。
        // テクスチャのフィルタリングをLinearに設定して、ガビガビ感を軽減する
        this.renderTarget = new THREE.WebGLRenderTarget(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
        );
        this.renderTarget.texture.minFilter = THREE.LinearFilter;
        this.renderTarget.texture.magFilter = THREE.LinearFilter;

        // コントロール
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
 
        // ライトを追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.directionalLight.position.set(5, 5, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.far = 20;
        this.scene.add(this.directionalLight);

        // 地面を追加
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = -6;
        ground.receiveShadow = true;
        // this.scene.add(ground);

        // グループを作成
        this.meshGroup = new THREE.Group();
        this.scene.add(this.meshGroup);

        this.uniforms = {
            uTime: { value: 0 }
        };

        // ジオメトリとマテリアルは１つだけ作る
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        this.meshes = [];
        // 50個の箱をランダムに配置
        for (let i = 0; i < 50; i++) {
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 40%, 75%)`),
                metalness: 0.3,
                roughness: 0.4
            });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            const scale = Math.random() * 0.5 + 0.2;
            mesh.scale.set(scale, scale, scale);

            this.meshGroup.add(mesh);
            this.meshes.push(mesh);
        }

        // パーティクルを追加
        const particlesGeometry = new THREE.BufferGeometry();
        const count = 500;

        const positions = new Float32Array(count * 3);

        for(let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // パーティクル用のシェーダー
        const particleVertexShader = `
            uniform float uTime;
            void main() {
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                gl_Position = projectionPosition;
                gl_PointSize = 5.0 * ( 1.0 / -viewPosition.z );
            }
        `;
        const particleFragmentShader = `
            uniform float uTime;
            void main() {
                float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                float strength = 1.0 - (distanceToCenter * 2.0);
                gl_FragColor = vec4(0.8, 0.8, 1.0, strength * 0.5);
            }
        `;

        const particlesMaterial = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particles);




        const _geom = new THREE.BoxGeometry(1, 1, 1);
        const _mat = new THREE.ShaderMaterial({

            uniforms: {
                time: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    // vec4 viewPosition = viewMatrix * modelPosition;
                    // vec4 worldPosition = modelViewMatrix * modelPosition;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    float lum = length(vNormal * (sin(time + uMouse.x * 2.0 / 1920.0) * 0.5 + 0.5));
                    gl_FragColor = vec4(vec3(lum), 1.0);
                }
            `
        })
        this.mesh = new THREE.Mesh( _geom, _mat );
        // this.scene.add( this.mesh );

        this.mesh.rotation.x = ( Math.random() - 0.5 ) * Math.PI * 25
        this.mesh.rotation.y = ( Math.random() - 0.5 ) * Math.PI * 25




        let num = 10000
        let vertices = new Float32Array(num * 3)
        for (let i = 0; i < num; i++) {
            vertices[i * 3] = (Math.random() - 0.5) * 10
            vertices[i * 3 + 1] = (Math.random() - 0.5) * 10
            vertices[i * 3 + 2] = (Math.random() - 0.5) * 10
        }
        let geometry2 = new THREE.BufferGeometry()
        geometry2.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        let material2 = new THREE.PointsMaterial({
            size: 0.01,
            depthTest: false
        });
        this.points = new THREE.Points(geometry2, material2);
        this.scene.add(this.points);

        // gltfLoader = new THREE.GLTFLoader();

        this.wrapper = new THREE.Object3D()
        this.scene.add(this.wrapper)
        this.wrapper.position.z = 1

        let _ldr = new GLTFLoader();
        // _ldr.load('/fonts.glb', (gltf) => {
        _ldr.load('/break.glb', (gltf) => {

            const _s = 1
            gltf.scene.scale.set(_s,_s,_s)
            gltf.scene.rotation.x = Math.PI * 0.5

                    let _mat = new THREE.ShaderMaterial({
                        uniforms: MeshRefractionMaterial.uniforms,
                        vertexShader: MeshRefractionMaterial.vertexShader,
                        fragmentShader: MeshRefractionMaterial.fragmentShader,
                        transparent: true,
                        side: THREE.DoubleSide
                    });
                    // uniformの初期値を設定
                    _mat.uniforms.uRefractPower.value = 0.15;
                    _mat.uniforms.uTransparent.value = 0.6;
                    _mat.uniforms.uNoise.value = 0.03;
                    _mat.uniforms.uSat.value = 1.0;
                    _mat.uniforms.uHue.value = 1.0;

            let _pane = new Pane()
            _pane.addBinding(_mat.uniforms.uRefractPower, 'value', { label: 'Refract Power', min: 0, max: 1, step: 0.01 })
            _pane.addBinding(_mat.uniforms.uTransparent, 'value', { label: 'Transparent', min: 0, max: 1, step: 0.01 })
            _pane.addBinding(_mat.uniforms.uNoise, 'value', { label: 'NoiseuSat', min: 0, max: 1, step: 0.01 })
            _pane.addBinding(_mat.uniforms.uSat, 'value', { label: 'Saturation', min: 0, max: 1, step: 0.01 })
            _pane.addBinding(_mat.uniforms.uHue, 'value', { label: 'Hue', min: 0, max: 3.1416 * 2.0, step: 0.01 })

            gltf.scene.traverse((child) => {
                if( child.isMesh )
                {
                    
                    child.material = _mat;



                    // onBeforeRenderを使って、描画直前にuniformを更新する
                    child.onBeforeRender = () => {
                        const material = child.material;
                        material.uniforms.uSceneTex.value = this.renderTarget.texture;
                        material.uniforms.winResolution.value.x = this.sizes.width * this.sizes.pixelRatio;
                        material.uniforms.winResolution.value.y = this.sizes.height * this.sizes.pixelRatio;
                        // 時間経過で色相を変化させる
                        // material.uniforms.uHue.value = (this.uniforms.uTime.value * 0.1) % 1.0;
                    };

                    // child.rotation.x = ( Math.random() - 0.5 ) * Math.PI * 0.2
                    // child.rotation.x = ( Math.random() - 0.5 ) * Math.PI * 0.2

                    gsap.to(child.rotation, {
                        x: child.rotation.x + (Math.random() - 0.5) * Math.PI * 0.5,
                        y: child.rotation.y + (Math.random() - 0.5) * Math.PI * 0.5,
                        duration: 5.0,
                        delay: Math.random() * 2.0 + 1.0,
                        repeat: -1,
                        yoyo: true,
                        ease: "power2.inOut"
                        });


                }
            });

        // this.sphere.onBeforeRender = ()=>{
        //   this.sphere.material.uniforms.uSceneTex.value = this.renderTarget.texture;
        //   this.sphere.material.uniforms.winResolution.value.x = window.innerWidth * window.devicePixelRatio;
        //   this.sphere.material.uniforms.winResolution.value.y = window.innerHeight * window.devicePixelRatio;
        //   this.sphere.material.uniforms.uHue.value = Math.random();
        //   this.sphere.material.uniforms.uSat.value = Math.random();
        //   this.sphere.material.uniforms.uNoise.value = Math.random() * 0.1;
        //   this.sphere.material.uniforms.uRefractPower.value = Math.random();
        //   this.sphere.material.uniforms.uTransparent.value = Math.random();
        //   this.sphere.material.uniforms.needsUpdate = true;
        //   this.sphere.material.uniformsNeedUpdate = true;

        // }
        // this.sphere.material.uniforms.needsUpdate = true;
        // this.sphere.material.uniformsNeedUpdate = true;





            this.wrapper.add(gltf.scene);
        })




        //  bp
        let _ge = new THREE.PlaneGeometry( 4, 3, 1, 1 )
        let _ma = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colors: {   value: [ 
                    new THREE.Color(0.1,    0.9,    0.6),
                    new THREE.Color(0.1,    0.96,   0.86),
                    new THREE.Color(0.1,    0.4,    0.8)
               ] },
                positions: {    value: [
                    new THREE.Vector2( 0.8, 0.8 ),
                    new THREE.Vector2( 0.7, 0.9 ),
                    new THREE.Vector2( 0.75, 0.5 )
                ]},
                resolution: {   value: new THREE.Vector2( 4, 3 ) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    //vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `
                uniform float time;
                uniform vec3 colors[3];
                uniform vec2 positions[3];
                uniform vec2 resolution;
                varying vec2 vUv;
                void main() {
                    vec2 uv = vUv;
                    vec2 st = (gl_FragCoord.xy - 0.5 * resolution.xy) / min( resolution.x, resolution.y );
                    st = uv;
                    gl_FragColor = vec4(0.0);
                    vec4 color = vec4(0.0);
                    vec3 bgcolor = vec3( 240.0 / 255.0 );

                    float _radius0 = 0.6;
                    float _radius1 = 0.5;
                    float _radius2 = 0.4;

                    //  c0
                    float _dist0 = length( positions[0] - st );
                    float _opacity0 = 1.0 - smoothstep( 0.0, _radius0, _dist0 );
                    vec3 _color0 = ( 1.0 - colors[0] ) * _opacity0;

                    //  c1
                    float _dist1 = length( positions[1] - st );
                    float _opacity1 = 1.0 - smoothstep( 0.0, _radius1, _dist1 );
                    vec3 _color1 = ( 1.0 - colors[1] ) * _opacity1;

                    //  c2
                    float _dist2 = length( positions[2] - st );
                    float _opacity2 = 1.0 - smoothstep( 0.0, _radius2, _dist2 );
                    vec3 _color2 = ( 1.0 - colors[2] ) * _opacity2;

                    vec3 _color = _color0 + _color1 + _color2;
                    _color = min( _color, vec3( 1.0 ) );
                    _color = max( _color, vec3( 0.0 ) );

                    // _color += 1.0 - bgcolor;

                    gl_FragColor = vec4( bgcolor - _color, 1.0 );

                }`,
            transparent: true,
            side: THREE.DoubleSide

        })

        this.bg = new THREE.Mesh( _ge, _ma )
        // this.scene.add( this.bg )

        this.bg.position.z = -1;



        const __ldr = new THREE.TextureLoader().load('/IMG_1363.jpg', _texture =>{
            let _s = 0.0025;
            let _w = _texture.image.width * _s;
            let _h = _texture.image.height * _s;
            let _geom = new THREE.PlaneGeometry( _w, _h, 1, 1 );
            let _mat = new THREE.MeshBasicMaterial({
                map: _texture,
                side: THREE.DoubleSide,
                transparent: true
            });
            let _mesh = new THREE.Mesh( _geom, _mat );
            this.scene.add( _mesh );

            _mesh.position.set( 0, 0, -2 );

        })


    }
 
    update() {
        // アニメーションループ
        this.controls.update();
        if( this.mesh )
        {
            this.mesh.rotation.x -= 0.001;
            this.mesh.rotation.y -= 0.0011;
            this.mesh.material.uniforms.time.value += 0.016;
            this.mesh.material.uniforms.uMouse.value = this.mouse;

            this.points.rotation.y += 0.001;
            this.points.rotation.x += 0.001;
        }

        if( this.wrapper )
        {
            let _rad = Date.now() * 0.0001;
            this.wrapper.rotation.y = Math.sin( _rad ) * Math.PI * 0.125;
            this.wrapper.rotation.x = Math.cos( _rad ) * Math.PI * 0.125;
        }

        // uniformの時間を更新
        if(this.uniforms) {
            this.uniforms.uTime.value += 0.02;
        }

        // ライトの色を時間で変化させる
        if (this.directionalLight) {
            const time = this.uniforms.uTime.value;
            this.directionalLight.color.setHSL((time * 0.05) % 1, 0.2, 0.7);
        }

        // 個々のメッシュを更新
        this.meshes.forEach(mesh => {
            if (mesh.velocity) {
                mesh.position.add(mesh.velocity);
                // 摩擦でだんだん遅くする
                mesh.velocity.multiplyScalar(0.98);
            }
            if (mesh.rotationSpeed) {
                mesh.rotation.x += mesh.rotationSpeed.x;
                mesh.rotation.y += mesh.rotationSpeed.y;
                mesh.rotation.z += mesh.rotationSpeed.z;
                // 摩擦でだんだん遅くする
                mesh.rotationSpeed.multiplyScalar(0.98);
            }
        });

        // パーティクルをアニメーション
        if (this.particles) {
            this.particles.rotation.y += 0.0005;
        }

        // グループを回転させる
        if (this.meshGroup) {
            // マウスの位置に向かって滑らかに回転
            const targetRotationY = this.mouse.x * 0.5;
            const targetRotationX = this.mouse.y * 0.5;
            this.meshGroup.rotation.y += (targetRotationY - this.meshGroup.rotation.y) * 0.05;
            this.meshGroup.rotation.x += (targetRotationX - this.meshGroup.rotation.x) * 0.05;
        }

        // --- 屈折表現のための2パスレンダリング ---

        // Pass 1: 屈折オブジェクトを非表示にして、背景をレンダーターゲットに描画
        if (this.wrapper) this.wrapper.visible = false;
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);

        // Pass 2: 屈折オブジェクトを再表示して、最終的なシーンを画面に描画
        if (this.wrapper) this.wrapper.visible = true;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);

 
        this.raf = window.requestAnimationFrame(this.update.bind(this));
    }

    onMouseMove(event) {
        // マウス座標を -1 ~ 1 の範囲に正規化
        this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
        this.mouse.y = - (event.clientY / this.sizes.height) * 2 + 1;
    }

    onClick() {
        // 各メッシュにランダムな速度と回転を与える
        this.meshes.forEach(mesh => {
            mesh.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            mesh.rotationSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            );
        });
    }

    resize(){
        // サイズ設定

        let _width = this.canvas.offsetWidth;
        let _height = this.canvas.offsetHeight;
        let _aspect = this.sizes.width / this.sizes.height;

        this.sizes.width = _width;
        this.sizes.height = _height;

        if( this.camera.aspect )
        {
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();
        }   

        // レンダーターゲットもリサイズ
        if (this.renderTarget) {
            this.renderTarget.setSize(this.sizes.width * this.sizes.pixelRatio, this.sizes.height * this.sizes.pixelRatio);
        }

        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        

        
    }
 
    dispose() {
        // 後片付け
        window.cancelAnimationFrame(this.raf);
 
        // グループ内のオブジェクトを解放
        if (this.meshGroup) {
            this.meshes.forEach(child => {
                child.geometry.dispose();
                child.material.dispose();
            });
            this.scene.remove(this.meshGroup);
        }

        // パーティクルを解放
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }

        this.renderTarget.dispose();
        this.renderer.dispose();
        this.controls.dispose();

        // イベントリスナーを解除
        window.removeEventListener('resize', this.boundResize);
        window.removeEventListener('mousemove', this.boundOnMouseMove);
        window.removeEventListener('click', this.boundOnClick);
 
        console.log('disposed');
    }
}