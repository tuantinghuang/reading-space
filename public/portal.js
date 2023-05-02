import * as THREE from 'three';


export class Portal {
    constructor(x, y, z, group) {

        let hue = Math.floor(this.getRandomArbitrary(0, 360));
        let c = 'hsl(';
        let color = c.concat(hue).concat(', 100%, 20%)');
        let matColor = new THREE.Color(color);

        this.geo = new THREE.PlaneGeometry(1.5, 1.5);

        let mat = new THREE.MeshStandardMaterial({
            emissive: matColor,
            emissiveIntensity: 0.01,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        this.mesh = new THREE.Mesh(this.geo, mat);
        this.mesh.position.set(x, y + 0.01, z - 0.7);
        this.mesh.rotateX(Math.PI / 2);
        group.add(this.mesh);

        //calculate the position without the book group's translate

        this.mesh.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.mesh.geometry.boundingBox).applyMatrix4(this.mesh.matrixWorld);

        let helper = new THREE.Box3Helper(this.box);
        //group.add(helper);
    }

    activate() {
        this.mesh.material.emissiveIntensity = 20;
        this.mesh.material.wireframe = false;

    }

    reset() {
        this.mesh.material.emissiveIntensity = 0.1;
        this.mesh.material.wireframe = true;

    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}