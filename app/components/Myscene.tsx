'use client'; // 👈 1行目に必ず記述。これでブラウザ専用になります。

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import * as THREE from 'three';
import styles from './Myscene.module.scss';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Myscene(props: { color: string }) {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // --- ここから慣れ親しんだ Three.js のコード ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current?.appendChild(renderer.domElement);

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: props.color, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
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