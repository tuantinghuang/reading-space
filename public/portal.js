import * as THREE from 'three';


export class Portal {
    constructor(x, y, z, group) {

        // let hue = Math.floor(this.getRandomArbitrary(0, 360));
        // let c = 'hsl(';
        // let color = c.concat(hue).concat(', 100%, 90%)');
        let matColor = new THREE.Color('hsl(100,0%,45%)');

        //this.geo = new THREE.PlaneGeometry(1.5, 1.5);
        this.geo = new THREE.CylinderGeometry(0, 1, 1, 32);
        let mat = new THREE.MeshBasicMaterial({
            color: matColor
        });
        this.mesh = new THREE.Mesh(this.geo, mat);
        this.mesh.position.set(x, y + 0.01, z - 0.7);
        //this.mesh.rotateX(Math.PI / 2);
        //group.add(this.mesh);

        //calculate the position without the book group's translate

        this.mesh.geometry.computeBoundingBox();

        this.box = new THREE.Box3();
        this.box.copy(this.mesh.geometry.boundingBox).applyMatrix4(this.mesh.matrixWorld);

        let helper = new THREE.Box3Helper(this.box);
        //group.add(helper);
    }

    activate() {
        this.mesh.material.emissiveIntensity = 20;
        this.mesh.material.color.set(0xeeeeee);

    }

    reset() {
        this.mesh.material.emissiveIntensity = 0;
        this.mesh.material.color.set(0x111111)

    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}