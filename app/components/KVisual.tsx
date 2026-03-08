'use client';

import * as THREE from 'three';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import KVEngine from '../utils/KVEngine';
import Scene01 from '../utils/Scene01';
import Scene02 from '../utils/Scene02';
import Scene03 from '../utils/Scene03';
import Scene04 from '../utils/Scene04';

import styles from './KVisual.module.scss';

export default function KVisual() {

    const scenes = [
        {
            "class": "entry",
            "scene": Scene04
        },
        {
            "class": "entry",
            "scene": Scene01
        },
        {
            "class": "entry",
            "scene": Scene02
        },
        {
            "class": "entry",
            "scene": Scene03
        }
    ];

    let sceneInstances = [];
    let _screen;
    let _geom, _mat;

    // 描画管理用
    let _currentDisplayIndex = 0;
    let _departureIndex = 0;

    let observers = [];

    const webglview = useRef(null);
    let world;

    useEffect(() => {
        world = new KVEngine({
            canvas: webglview.current
        })

        //  check
        const _domlist = document.querySelectorAll(`.${styles.entry}`);

        let len = _domlist.length;
        for (let i = 0; i < len; i++) {
            let scene = new scenes[i].scene({
                renderer: world.renderer,
                size: world.size
            });
            sceneInstances.push(scene);
        }

        //  drawing plane
        _geom = new THREE.PlaneGeometry(1, 1)
        _mat = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0.0 },
                u_transition: { value: 0.0 },
                u_texture0: { value: sceneInstances[0].renderTarget.texture },
                u_texture1: { value: sceneInstances[0].renderTarget.texture }, // 初期は両方同じ
                u_transition_type: { value: 1 },
                u_aspect: { value: window.innerWidth / window.innerHeight }
            },
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            fragmentShader: `
            uniform sampler2D u_texture0;
            uniform sampler2D u_texture1;
            uniform int u_transition_type;
            uniform float u_time;
            uniform float u_transition;
            uniform float u_aspect;
            varying vec2 vUv;

            // 擬似乱数生成用関数
            float random(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            // 数学的にトランジションのグラデーション値を生成する関数
            float getTransitionValue(int type, vec2 uv) {
                float val = 0.0;
                
                // アスペクト比を補正した中心からのベクトル
                vec2 cUv = vec2((uv.x - 0.5) * u_aspect, uv.y - 0.5);

                // 0. クロスフェード (crossfade) : 1パターン
                if (type == 0) val = 0.5; // u_transitionの変化のみに依存する均一値

                // 1. 直線グラデーション (linear) : 8パターン
                else if (type == 7) val = uv.x;                                            // linear_01 (左→右)
                else if (type == 8) val = 1.0 - uv.x;                                 // linear_02 (右→左)
                else if (type == 9) val = 1.0 - uv.y;                                 // linear_03 (上→下)
                else if (type == 10) val = uv.y;                                       // linear_04 (下→上)
                else if (type == 11) val = (uv.x + (1.0 - uv.y)) / 2.0;               // linear_05 (左上→右下)
                else if (type == 12) val = ((1.0 - uv.x) + uv.y) / 2.0;               // linear_06 (右下→左上)
                else if (type == 13) val = ((1.0 - uv.x) + (1.0 - uv.y)) / 2.0;       // linear_07 (右上→左下)
                else if (type == 14) val = (uv.x + uv.y) / 2.0;                       // linear_08 (左下→右上)
                
                // 2. 円形・放射グラデーション (circle / radiun) : 4パターン
                else if (type == 5) val = length(cUv) * 2.0;                                        // circle_01 (中心から外)
                else if (type == 6) val = 1.0 - (length(cUv) * 2.0);                                // circle_02 (外から中心)
                else if (type == 15) val = (atan(cUv.x, cUv.y) / 6.2831853) + 0.5;                  // radiun_01 (時計)
                else if (type == 16) val = 1.0 - ((atan(cUv.x, cUv.y) / 6.2831853) + 0.5);          // radiun_02 (反時計)
                
                // 3. 中央分離グラデーション (center) : 4パターン
                else if (type == 1) val = abs(uv.x - 0.5) * 2.0;                      // center_01 (中央から左右)
                else if (type == 2) val = 1.0 - (abs(uv.x - 0.5) * 2.0);              // center_02 (左右から中央)
                else if (type == 3) val = abs(uv.y - 0.5) * 2.0;                      // center_03 (中央から上下)
                else if (type == 4) val = 1.0 - (abs(uv.y - 0.5) * 2.0);              // center_04 (上下から中央)
                
                // 4. 矩形グラデーション (rect) : 2パターン
                else if (type == 17) val = max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0;       // rect_01 (四角外)
                else if (type == 18) val = 1.0 - (max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0); // rect_02 (四角内)




                return clamp(val, 0.0, 1.0);
            }

            void main() {

                vec4 col0 = texture2D(u_texture0, vUv);
                vec4 col1 = texture2D(u_texture1, vUv);
                
                // type 0 (クロスフェード) の場合は、単純に u_transition に応じて透過ブレンドする
                if (u_transition_type == 0) {
                    gl_FragColor = mix(col1, col0, 1.0 - u_transition);
                    return;
                }

                // 数学的にグラデーションを算出
                float tran = getTransitionValue(u_transition_type, vUv);
                
                // 白い部分から先に切り替わるように数値を反転
                tran = 1.0 - tran;
                
                // GSAPから渡されるu_transition (0.0 から 1.0) をプログレスとして使用
                float progress = u_transition;
                
                // progress (0.0 ～ 1.0) を -0.1 から 1.1 の範囲にマッピングし、
                // 完全にシーンが切り替わるようにする（グラデーションの境界幅を考慮）
                float mappedProgress = progress * 1.2 - 0.1;
                
                // 算出された mappedProgress を基準として、グラデーション(tran)が
                // -0.1 から +0.1 の帯幅でブレンドされるようにする
                float _par = smoothstep(mappedProgress - 0.1, mappedProgress + 0.1, tran);
                
                // ディザリング（微小なノイズ）を追加してバンディングを軽減
                float noise = (random(vUv) - 0.5) / 64.0; // 64階調分程度のノイズ
                _par += noise;
                _par = clamp(_par, 0.0, 1.0); // ノイズ付加後に再度クランプ
                
                // シーンが逆だったため、col0 と col1 の順序を入れ替え
                gl_FragColor = mix(col1, col0, _par );
            }
            `
        })

        _screen = new THREE.Mesh(_geom, _mat)
        world.add(_screen);

        //  setup
        world.addEventListener('update', ({ time }) => {
            _mat.uniforms.u_time.value = time;
            // 現在の目的地となるシーンを必ずupdate
            sceneInstances[_currentDisplayIndex].update();
            // 遷移中なら、出発元のシーンもupdateする
            if (_departureIndex !== _currentDisplayIndex) {
                sceneInstances[_departureIndex].update();
            }

        })

        world.addEventListener('resize', () => {
            sceneInstances.forEach(scene => scene.resize());
            _screen.scale.set(world.size.width, world.size.height, 1)
            _mat.uniforms.u_aspect.value = world.size.width / world.size.height;
        })

        // Intersection Observer による遷移の発火処理
        const transitionToScene = (nextIndex) => {
            const meta = scenes[nextIndex].scene.meta;
            const duration = meta.transition?.duration ?? 0.5;
            const type = meta.transition?.type ?? 0;

            gsap.killTweensOf(_mat.uniforms.u_transition);

            // 現在まで目的としていたシーンを出発地とする
            _departureIndex = _currentDisplayIndex;
            _currentDisplayIndex = nextIndex;

            // u_texture0(直前まで表示されていたもの)からu_texture1(次に表示したいもの)への遷移
            _mat.uniforms.u_texture0.value = sceneInstances[_departureIndex].renderTarget.texture;
            _mat.uniforms.u_texture1.value = sceneInstances[_currentDisplayIndex].renderTarget.texture;
            _mat.uniforms.u_transition_type.value = type;

            _mat.uniforms.u_transition.value = 0.0;

            gsap.to(_mat.uniforms.u_transition, {
                value: 1.0,
                duration: duration,
                ease: 'power2.inOut',
                onComplete: () => {
                    // 遷移完了後、出発地フラグを目的地に揃えることで無駄なupdateを止める
                    _departureIndex = _currentDisplayIndex;
                }
            });
        }


        // クライアント側のみでObserverをセットアップ
        _domlist.forEach((el, index) => {

            const threshold = scenes[index].scene.meta.transition?.threshold ?? 0.5;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (_currentDisplayIndex === index) return;
                        transitionToScene(index);
                    }
                });
            }, {
                threshold: threshold
            });

            observer.observe(el);
            observers.push(observer);
        });

        // メッシュ登録後に必要な初回サイズ・アスペクト比計算を発火させ、
        // 初期ロード時の真っ暗（未描画）状態を解消する
        world.resize();

        return () => {
            world.dispose();
        }

    }, []);

    return (
        <div id={styles.kv}>

            <section className={`${styles.section} ${styles.header}`}>
                <div className={styles.inner}>
                    <h2>static key visiula</h2>
                    <p>tired web</p>
                </div>
            </section>

            {scenes.map((scene, index) => (
                <section key={index} className={`${styles.section} ${styles.entry}`}>
                    <div className={styles.inner}>
                        <h2>{scene.scene.meta.title}</h2>
                        <p>{scene.scene.meta.description}</p>
                        <img src={scene.scene.meta.image} alt={scene.scene.meta.title} />
                    </div>
                </section>
            ))}

            <section className={`${styles.section} ${styles.footer}`}>
                <div className={styles.inner}>
                    <h2>About this site</h2>
                    <p>Hiroshi Koi</p>
                    <p>Design Engineer.</p>

                    <p>Archives</p>
                    <ul>
                        <li>
                            <a href="https://ijisosaku.com/ambitious_kenya/" target="_blank">
                                ambitious_kenya
                            </a>
                        </li>
                        <li>
                            <a href="https://nulldesign.jp/skynet/">
                                SkyNet
                            </a>
                        </li>
                        <li>
                            <a href="https://nulldesign.jp/metrogram3d/">
                                metrogram3d
                            </a>
                        </li>
                        <li>
                            <a href="https://nulldesign.jp/metrogram/">
                                metrogram
                            </a>
                        </li>
                        <li>
                            <a href="https://nulldesign.jp/log/">
                                <s>.log</s>
                            </a>
                        </li>
                    </ul>

                    <p>SNS</p>
                    <ul>
                        <li>
                            <a href="https://x.com/nulldesign" target="_blank">
                                Twitter
                            </a>
                        </li>
                        <li>
                            <a href="https://www.instagram.com/hrsk.log/" target="_blank">
                                Instagram
                            </a>
                        </li>
                    </ul>

                    <p>Awards</p>
                    <ul>
                        <li>The Webby Awards 2016 NETART winner.</li>
                        <li>Yahoo! JAPAN internet creative award 2015 innovation: Silver.</li>
                        <li>W3 Awards</li>
                        <li>etc....</li>
                    </ul>

                    <p>&copy;nulldesign.jp All Rights Reserved.</p>
                </div>
            </section>

            <canvas className={styles.webglview} ref={webglview} />

        </div >
    )

}