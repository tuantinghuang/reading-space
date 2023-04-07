import * as THREE from 'three';


export class Portal {
    constructor(x, y, z, group) {

        let hue = Math.floor(this.getRandomArbitrary(0, 360));
        let c = 'hsl(';
        let color = c.concat(hue).concat(', 100%, 50%)');
        let matColor = new THREE.Color(color);

        this.geo = new THREE.BoxGeometry(2, 0.2, 2);
        let mat = new THREE.MeshStandardMaterial({
            emissive: matColor,
            emissiveIntensity: 0.1
        });
        this.mesh = new THREE.Mesh(this.geo, mat);
        this.mesh.position.set(x, y, z);
        group.add(this.mesh);

        //calculate the position without the book group's translate

        this.mesh.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.mesh.geometry.boundingBox).applyMatrix4(this.mesh.matrixWorld);

        let helper = new THREE.Box3Helper(this.box);
        group.add(helper);
    }

    activate() {
        this.mesh.material.emissiveIntensity = 20;

    }

    reset() {
        this.mesh.material.emissiveIntensity = 0.1;

    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}