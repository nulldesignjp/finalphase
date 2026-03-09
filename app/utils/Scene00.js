import AbstructScene from './AbstructScene';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

export default class Scene00 extends AbstructScene {

    static meta = {
        title: 'nulldesign.archives',
        description: 'passing the time until the death.',
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

        // this.setAngle(100);



    }

    update() {
        super.update()

        if (this.scene) {
            this.scene.rotation.y += 0.002
        }

    }

    dispose() {
        if (this.pane) {
            this.pane.dispose();
        }
        if (this.paneContainer && this.paneContainer.parentNode) {
            this.paneContainer.parentNode.removeChild(this.paneContainer);
        }
        if (super.dispose) {
            super.dispose();
        }
    }
}