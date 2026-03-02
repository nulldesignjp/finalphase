'use client';

import * as THREE from 'three';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import KVEngine from '../utils/KVEngine';
import Scene01 from '../utils/Scene01';
import Scene02 from '../utils/Scene02';
import Scene03 from '../utils/Scene03';

import styles from './KVisual.module.scss';

import data from '../utils/data.json';

export default function KVisual() {

    const test = [
        {
            "title": "title1",
            "description": "description1",
            "image": "/assets/img/brokenBuild.PNG",
            "class": "entry",
            "scene": Scene01
        },
        {
            "title": "title2",
            "description": "description2",
            "image": "/assets/img/brokenBuild.PNG",
            "class": "entry",
            "scene": Scene02
        },
        {
            "title": "title3",
            "description": "description3",
            "image": "/assets/img/brokenBuild.PNG",
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
        let _domlist = document.querySelectorAll(`.${styles.entry}`);
        console.log(_domlist);

        return () => {
            world.dispose();
        }

    }, []);

    return (
        <div id={styles.kv}>
            <canvas className={styles.webglview} ref={webglview} />


            <div className={styles.main}>

                {test.map((scene, index) => (
                    <div key={index} className={styles.entry}>
                        {scene.title}
                    </div>
                ))}

            </div>
        </div>
    )

}