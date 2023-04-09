import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class Book {
    constructor(x, y, z, group, model) {



        let hue = Math.floor(this.getRandomArbitrary(0, 360));
        let c = 'hsl(';
        let color = c.concat(hue).concat(', 100%, 90%)');
        let matColor = new THREE.Color(color);

        let bookMat = new THREE.MeshBasicMaterial({
            color: matColor,
        });

        this.book = new THREE.Mesh(model.geometry, bookMat);
        group.add(this.book);

        this.book.position.set(x, y - 0.5, z)
        this.book.scale.set(0.3, 0.3, 0.1);
        this.book.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.book.geometry.boundingBox).applyMatrix4(this.book.matrixWorld);
        this.book.geometry.attributes.position.needsUpdate = true;
        let helper = new THREE.Box3Helper(this.box);
        //group.add(helper);
    }

    activate() {
        this.book.scale.set(0.5, 0.5, 0.1);
    }

    reset() {
        this.book.scale.set(0.3, 0.3, 0.1);
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}