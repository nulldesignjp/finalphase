'use client'; // 👈 1行目に必ず記述。これでブラウザ専用になります。

import { useEffect, useRef } from 'react';
import { useState } from 'react';

import styles from './Myscene.module.scss';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import vertexShader from '../shaders/vertex.vert';
import fragmentShader from '../shaders/fragment.frag';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Myscene(props: { color: string }) {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // --- ここから慣れ親しんだ Three.js のコード ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setClearColor(0xF0F0F0, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current?.appendChild(renderer.domElement);

        camera.position.z = 5;

        const _obj = new THREE.Object3D();
        scene.add(_obj);

        const _ldr = new GLTFLoader();
        _ldr.load(
            `${basePath}/assets/models/hexgrid.glb`,
            (gltf) => {
                _obj.add(gltf.scene);
                const _material = new THREE.ShaderMaterial({
                    uniforms: {
                        uTime: { value: 0 },
                        uColor: { value: new THREE.Color(props.color) }
                    },
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    wireframe: true
                });

                gltf.scene.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = _material;
                    }
                });

            },
            undefined,
            (error) => {
                console.error(error);
            }
        );

        const animate = () => {
            requestAnimationFrame(animate);
            _obj.rotation.x += 0.001;
            _obj.rotation.y += 0.00105;

            _obj.children.forEach((child) => {

                child.children[0].material.uniforms.uTime.value += 0.016;

            });


            renderer.render(scene, camera);
        };
        animate();

        // クリーンアップ（画面から消える時の処理）
        return () => {
            mountRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
        };
        // --- ここまで ---
    }, []);

    return <div className={styles.webglview} ref={mountRef} style={{ color: props.color }} />; // 👈 Three.jsを貼り付ける土台
}