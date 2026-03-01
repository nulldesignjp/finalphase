import * as THREE from 'three'
import StarPlatinum from './StarPlatinum'

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js'

export default class hrsk {

    constructor(element) {
        this.element = element
        this.init();
        this.update();
    }

    init() {
        this.world = new StarPlatinum({
            canvas: this.element,
            isOrthographic: false,
            isOrbitControls: true,
            backgroundColor: 0xf7f7f5
        })

        this.world.focalLengthToFOV(35)
        // this.world.camera.position.z = this.world.pixelEqualMagnification()
        this.world.camera.position.set(1, 1, 1);
        this.world.camera.position.copy(this.world.camera.position.normalize().multiplyScalar(this.world.pixelEqualMagnification()));


        this.world.scene.fog = new THREE.Fog(0xf7f7f5, 500, 1000);
        this.world.camera.far = 3000
        this.world.camera.updateProjectionMatrix();

        this.world.controls.autoRotate = true;
        this.world.controls.autoRotateSpeed = 0.5;

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(100, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        )
        // this.world.scene.add(this.mesh)




        let _geom = new THREE.BoxGeometry(100, 100, 100)
        let _mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                tex: { value: new THREE.TextureLoader().load('/assets/img/sample/thumb-0.jpg') }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `

                float noise( vec2 st )
                {
                    return fract( sin( dot(st.xy, vec2(12.9898,78.233)) ) * 43758.5453 );
                }

                uniform float time;
                uniform sampler2D tex;
                varying vec2 vUv;
                void main() {

                    float _n = noise( vUv );
                    _n = smoothstep( 0.5, 1.0, _n );

                    vec4 img = texture2D( tex, vUv + time );
                    gl_FragColor = vec4( img.rgb, _n);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        })
        this.box = new THREE.Mesh(_geom, _mat)
        this.world.scene.add(this.box)
        this.box.castShadow = true;
        this.box.position.set(0, 50, 0);

        this.wire = Wire.Box(100, 0x333333)
        this.box.add(this.wire)



        let _geom0 = new THREE.PlaneGeometry(100, 100)
        _geom0.rotateX(- Math.PI * 0.5);
        let _mat0 = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/img/sample/thumb-1.jpg')
        })
        let _mesh0 = new THREE.Mesh(_geom0, _mat0)
        this.world.scene.add(_mesh0)
        _mesh0.position.set(150, 0, -50);

        this.field = new THREE.GridHelper(10000, 100)
        this.field.material.transparent = true;
        this.field.material.opacity = 0.4;
        this.world.scene.add(this.field)


        let _geom1 = new THREE.PlaneGeometry(100, 100)
        _geom1.rotateX(- Math.PI * 0.5);
        let _mat1 = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/img/sample/thumb-3.jpg')
        })
        let _mesh1 = new THREE.Mesh(_geom1, _mat1)
        this.world.scene.add(_mesh1)
        _mesh1.position.set(-150, 0, 50);


        let _geom2 = new THREE.PlaneGeometry(100, 100)
        _geom2.rotateX(- Math.PI * 0.5);
        let _mat2 = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/assets/img/sample/thumb-4.jpg')
        })
        let _mesh2 = new THREE.Mesh(_geom2, _mat2)
        this.world.scene.add(_mesh2)
        _mesh2.position.set(-50, 0, -350);




        let _t0 = new canvasFont('400 48px "EB Garamond"', 'Digital DiverZ');
        let _c0 = new THREE.CanvasTexture(_t0.canvas);
        _c0.needsUpdate = true;
        let _geom3 = new THREE.PlaneGeometry(_t0.canvas.width, _t0.canvas.height).translate(_t0.canvas.width * 0.5, -_t0.canvas.height * 0.5, 0).rotateX(- Math.PI * 0.5);
        let _mat3 = new THREE.MeshBasicMaterial({
            map: _c0,
            transparent: true,
            color: 0x000000
        })
        let _mesh3 = new THREE.Mesh(_geom3, _mat3)
        this.world.scene.add(_mesh3)
        _mesh3.position.set(100, 0, -150);
        _mesh3.scale.set(0.5, 0.5, 0.5);

        let _t1 = new canvasFont('400 24px "EB Garamond"', 'with HACKist');
        let _c1 = new THREE.CanvasTexture(_t1.canvas);
        _c1.needsUpdate = true;
        let _geom4 = new THREE.PlaneGeometry(_t1.canvas.width, _t1.canvas.height).translate(_t1.canvas.width * 0.5, -_t1.canvas.height * 0.5, 0).rotateX(- Math.PI * 0.5);
        let _mat4 = new THREE.MeshBasicMaterial({
            map: _c1,
            transparent: true,
            color: 0x000000,
            // depthWrite: false
        })
        let _mesh4 = new THREE.Mesh(_geom4, _mat4);
        _mesh4.renderOrder = -1;
        this.world.scene.add(_mesh4)
        _mesh4.position.set(100, 0, -120);
        _mesh4.scale.set(0.5, 0.5, 0.5);

        let _t2 = new canvasFont('400 24px "Zen Kaku Gothic New"', 'ここに日本ンゴが入ります。\nMFG');
        let _c2 = new THREE.CanvasTexture(_t2.canvas);
        _c2.needsUpdate = true;
        let _geom5 = new THREE.PlaneGeometry(_t2.canvas.width, _t2.canvas.height).translate(_t2.canvas.width * 0.5, -_t2.canvas.height * 0.5, 0).rotateX(- Math.PI * 0.5);
        let _mat5 = new THREE.MeshBasicMaterial({
            map: _c2,
            transparent: true,
            color: 0x0000FF,
            // depthWrite: false
        })
        let _mesh5 = new THREE.Mesh(_geom5, _mat5);
        _mesh5.renderOrder = -1;
        this.world.scene.add(_mesh5)
        _mesh5.position.set(100, 0, 10);
        _mesh5.scale.set(0.5, 0.5, 0.5);



        let _grain = {
            uniforms: {
                time: { value: 0 },
                tDiffuse: { value: null }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                float noise( vec2 st )
                {
                    return fract( sin( dot(st.xy, vec2(12.9898,78.233)) ) * 43758.5453 );
                }

                uniform float time;
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    float _n = noise( vUv + sin(time) );
                    _n = smoothstep( 0.01, 0.02, _n );
                    _n = _n * 0.5 + 0.5;
                    vec4 img = texture2D( tDiffuse, vUv );
                    gl_FragColor = vec4( img.rgb * _n, 1.0);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        }
        let _shader = new ShaderPass(_grain);
        this.world.addPath(_shader)

        let _shaderV = new ShaderPass(VerticalTiltShiftShader)
        _shaderV.uniforms.r.value = 0.45;
        _shaderV.uniforms.v.value = 1.0 / 256.0;
        this.world.addPath(_shaderV)

        let _rgbShift = {
            uniforms: {
                time: { value: 0 },
                tDiffuse: { value: null }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    float d = length( vUv - 0.5 );
                    float _r = texture2D( tDiffuse, vUv + sin(time)*0.001*d ).r;
                    float _g = texture2D( tDiffuse, vUv + cos(time*0.00095*3.1416) * 0.05*d ).g;
                    float _b = texture2D( tDiffuse, vUv + cos(time*0.00105) * 0.05*d ).b;
                    gl_FragColor = vec4( _r, _g, _b, 1.0);    
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        }
        let _rgbShiftShader = new ShaderPass(_rgbShift);
        // this.world.addPath(_rgbShiftShader)

        let _vignetting = {
            uniforms: {
                time: { value: 0 },
                tDiffuse: { value: null }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `

                // float luminance( vec3 color) {
                //     return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
                // }

                uniform float time;
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    float d = length( vUv - 0.5 ) * 2.0;
                    vec4 img = texture2D( tDiffuse, vUv );

                    float l = luminance(img.rgb);
                    img.rgb = vec3(l);

                    img.rgb *= 1.0 - pow( d * 0.5, 5.0 );

                    gl_FragColor = img;    
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        }
        let _vignettingShader = new ShaderPass(_vignetting);
        this.world.addPath(_vignettingShader)

    }

    update() {
        this.updateKey = requestAnimationFrame(this.update.bind(this));
        this.world.controls?.update();
    }

    resize() { }

    dispose() { }

}