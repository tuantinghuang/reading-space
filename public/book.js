import * as THREE from 'three';

export class Book {
    constructor(x, y, z, group) {

        let hue = Math.floor(this.getRandomArbitrary(0, 360));
        let c = 'hsl(';
        let color = c.concat(hue).concat(', 100%, 90%)');
        let matColor = new THREE.Color(color);

        this.bookGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
        let bookMat = new THREE.MeshBasicMaterial({
            color: matColor,
        });
        this.book = new THREE.Mesh(this.bookGeo, bookMat);
        this.book.position.set(x, y, z);
        group.add(this.book);

        //calculate the position without the book group's translate

        this.book.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.book.geometry.boundingBox).applyMatrix4(this.book.matrixWorld);
        this.book.geometry.attributes.position.needsUpdate = true;
        let helper = new THREE.Box3Helper(this.box);
        group.add(helper);
    }

    activate() {
        this.book.scale.set(2, 3, 0.5);
    }

    reset() {
        this.book.scale.set(1, 1, 1);

    }
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}