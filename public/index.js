import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Book } from './book.js'
import { Portal } from './portal.js'


let scene, renderer, camera, controls;
let controller, controllerBox;
let controllerOldPosition = new THREE.Vector3();
let books = [];
let portals = [];
let bookGroup, portalGroup;


function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');
    document.body.appendChild(canvas);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    controls = new OrbitControls(camera, renderer.domElement);

    let gridhelper = new THREE.GridHelper(100, 100);
    gridhelper.position.set(0, -0.2, 0)
    //scene.add(gridhelper);

    createBoard();
    createController();
    createBooks();
    createPortals();

    //light
    let light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    let dir_light = new THREE.DirectionalLight(0xffffff, 0.1);
    dir_light.position.set(10, 3, 3);
    dir_light.castShadow = true;
    scene.add(dir_light);
}



function createBoard() {
    let boardTexture = new THREE.TextureLoader().load('assets/grid-01.png');
    let boardGeo = new THREE.BoxGeometry(100, 1, 100);
    let boardMat = new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    let board = new THREE.Mesh(boardGeo, [boardMat, new THREE.MeshLambertMaterial({
        color: 0xefefef,
        bumpMap: boardTexture,
        bumpScale: 10,
    })]);
    board.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 14, materialIndex: 1 }];
    board.position.set(0, -0.7, 0);
    scene.add(board);
}

function createController() {
    let controllerGeo = new THREE.SphereGeometry(0.2, 16, 16);
    controller = new THREE.Mesh(controllerGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
    scene.add(controller);

    controller.geometry.computeBoundingBox();
    controllerBox = new THREE.Box3();

    let helper = new THREE.Box3Helper(controllerBox);
    scene.add(helper);
}


function createBooks() {
    bookGroup = new THREE.Group();
    scene.add(bookGroup);
}


function createPortals() {
    for (let i = 0; i < 10; i++) {
        let x = Math.floor(getRandomArbitrary(-50, 50));
        let z = Math.floor(getRandomArbitrary(-50, 50));
        let p = new Portal(x, 0.1, z, scene);
        portals.push(p);
    }
}



async function getData() {
    const requestURL = "./data.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    let data = await response.json();

    if (data.length > 0) {

        for (let i = 0; i < data.length; i++) {
            let x = data[i].x - 50;//translate to center baord size
            let z = data[i].y - 50;
            let b = new Book(x, 0.5, z, scene);
            books.push(b);
        }
    }
}




window.addEventListener('keydown', checkCollision);

function moveController(e) {

    switch (e.key) {
        case 'ArrowLeft':
            controller.position.x -= 2;
            controller.rotateZ(-Math.PI / 4);

            break;

        case 'ArrowUp':
            controller.position.z -= 2;
            controller.rotateX(Math.PI / 4);
            break;

        case 'ArrowRight':
            controller.position.x += 2;
            controller.rotateZ(Math.PI / 4);
            break;

        case 'ArrowDown':
            controller.position.z += 2;
            controller.rotateX(-Math.PI / 4);
            break;
    }
}
let bookID = undefined;
let portalID = undefined;

function checkCollision(e) {
    let okToMove = 1;


    //save the preivous controller position
    controllerOldPosition.copy(controller.position);

    //then move the controller based on keypress
    moveController(e);

    controller.updateMatrixWorld();
    //compute the controller bounding box with new controller position
    controllerBox.copy(controller.geometry.boundingBox).applyMatrix4(controller.matrixWorld);

    //loop through books
    for (let i = 0; i < books.length; i++) {

        books[i].box.copy(books[i].book.geometry.boundingBox).applyMatrix4(books[i].book.matrixWorld);

        if (controllerBox.intersectsBox(books[i].box)) {
            okToMove *= -1;
            bookID = i;
        }
    }


    for (let i = 0; i < portals.length; i++) {
        portals[i].box.copy(portals[i].mesh.geometry.boundingBox).applyMatrix4(portals[i].mesh.matrixWorld);

        if (controllerBox.intersectsBox(portals[i].box)) {
            okToMove *= -1;
            portalID = i;
        }
    }
    console.log(okToMove)

    if (okToMove < 0) {
        controller.position.copy(controllerOldPosition);

        if (bookID) {
            books[bookID].activate();
        }
        else if (portalID) {
            portals[portalID].activate();
        }

        okToMove *= -1;

    } else {
        if (bookID) {
            books[bookID].reset();
            bookID = undefined;
        }
        else if (portalID) {
            portals[portalID].reset();
            portalID = undefined;
        }

    }


}



function render() {
    const cameraOffset = new THREE.Vector3(10, 10, 10); // NOTE Constant offset between the camera and the target
    camera.position.copy(controller.position).add(cameraOffset);
    camera.lookAt(controller.position)
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

init();
getData();
render();


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
