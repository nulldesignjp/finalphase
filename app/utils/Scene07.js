import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

import { DelaunayGeometry } from './DelaunayGeometry.js'

export default class Scene07 extends AbstructScene {

    static meta = {
        title: 'orbe object',
        description: 'scene06.js',
        image: "",
        url: 'https://nulldeisn.jp',
        tags: ['template-A', 'template-B', 'template-C'],
        transition: {
            type: 0, // crossfade
            duration: 0.5,
            threshold: 0.6
        }
    }

    constructor(_props) {
        super(_props)

        //  blank scene


        this.objList = []


        let _geom = new DelaunayGeometry(500, 500, 100, []);

        let _mate = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true
        })

        let _mesh = new THREE.Mesh( _geom, _mate );
        this.scene.add( _mesh )

        this.objList.push( _mesh)


    }

    update() {
        super.update()

        let len = this.objList.length;
        this.objList.forEach((_obj, i) => {

            _obj.rotation.x += 0.001
            _obj.rotation.y += 0.001
        })

    }

    dispose() {
        if (super.dispose) {
            super.dispose();
        }
    }
}