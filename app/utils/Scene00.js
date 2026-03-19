import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene00 extends AbstructScene {

    static meta = {
        title: 'blank scene',
        description: 'scene00.js',
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



    }

    update() {
        super.update()

        if (this.scene) {
            this.scene.rotation.y += 0.002
        }

    }

    dispose() {
        if (super.dispose) {
            super.dispose();
        }
    }
}