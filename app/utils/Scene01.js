import * as THREE from 'three';

export default class Scene01 extends AbstructScene {

    static meta = {
        title: 'template title element',
        description: 'template description element',
        url: 'https://nulldeisn.jp',
        tags: ['template-A', 'template-B', 'template-C'],
        transition: {
            type: 8,
            duration: 0.5,
            threshold: 0.5
        }
    }

    constructor(_props) {
        super(_props)

        let _geom = new THREE.BoxGeometry(100, 100, 100)
        let _mat = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
        this.mesh = new THREE.Mesh(_geom, _mat)
        this.scene.add(this.mesh)
    }

    update() {
        super.update()

        this.mesh.rotation.x += 0.01
        this.mesh.rotation.y += 0.01

    }
}