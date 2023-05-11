import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class Book {
    constructor(x, y, z, group, model, palette) {

        let matColor = new THREE.Color(palette);

        this.bookMat = new THREE.MeshLambertMaterial({
            color: matColor,
            reflectivity: 0
        });

        this.book = new THREE.Mesh(model.geometry, this.bookMat);
        this.group = group;
        this.group.add(this.book);

        this.book.castShadow = true;
        this.book.receiveShadow = false;

        this.book.position.set(x, y - 0.5, z)
        this.book.scale.set(0.3, 0.3, 0.1);
        this.book.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.book.geometry.boundingBox).applyMatrix4(this.book.matrixWorld);
        //this.box.expandByVector(new THREE.Vector3(1.5, 1, 1.5));

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

    showTitle(text) {
        let canvas = document.createElement("canvas");

        let context = canvas.getContext("2d");

        context.font = "2em sans-serif";
        context.fillText(text, 0, 60);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;


        var material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
        });


        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, canvas.width / canvas.height * 2, 10, 10), material);
        mesh.overdraw = true;



        this.group.add(mesh);
    }



}