import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Book } from './book.js'
import { Portal } from './portal.js'


let scene, renderer, camera, controls;
let controller, controllerBox;
let controllerOldPosition = new THREE.Vector3();
let books = [];
let portals = [];
let bookGroup, gateModel, portalGroup;


let welcomeScene, activeScene;
let bigBookGroup, bookModel;


function init() {
    scene = new THREE.Scene();
    welcomeScene = new THREE.Scene();
    //welcomeScene.background = new THREE.Color(0xEEF3F5);

    if (window.location.pathname.endsWith('book.html')) {
        activeScene = scene;
    } else {
        activeScene = welcomeScene;
    }


    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');
    document.body.appendChild(canvas);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    controls = new OrbitControls(camera, renderer.domElement);

    let gridhelper = new THREE.GridHelper(100, 100);
    gridhelper.position.set(0, -0.2, 0)
    //scene.add(gridhelper);

    createWelcomePageComponents();
    callModel();
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

function callModel() {
    let objLoader = new OBJLoader();
    objLoader.load('assets/model/model.obj', function (object) {
        gateModel = object;

        console.log('gate model loaded!');

        getData(gateModel.children[0]);
    });

    objLoader.load('assets/model/Book_OBJ.obj', function (object) {
        bookModel = object;
        console.log('book model loaded');

        createBigBook();
    });
}

function createWelcomePageComponents() {
    //light
    let light = new THREE.AmbientLight(0xffffff, 0.8);
    welcomeScene.add(light);

    let dir_light = new THREE.DirectionalLight(0xffffff, 0.2);
    dir_light.position.set(10, 3, 3);
    dir_light.castShadow = true;
    welcomeScene.add(dir_light);

    bigBookGroup = new THREE.Group();
    welcomeScene.add(bigBookGroup);
}


//welcome page's big book
function createBigBook() {
    bookModel.scale.set(10, 10, 10);
    bookModel.position.set(1.5, -8.45, 0)
    bigBookGroup.add(bookModel);
}


function createBoard() {
    let boardTexture = new THREE.TextureLoader().load('assets/grid-01.png');
    let boardGeo = new THREE.BoxGeometry(100, 0.5, 100);
    let boardMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    let board = new THREE.Mesh(boardGeo, [boardMat, new THREE.MeshLambertMaterial({
        color: 0xefefef,
        bumpMap: boardTexture,
        bumpScale: 10,
    })]);
    board.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 14, materialIndex: 1 }];
    board.position.set(0, -0.7, 0);

    scene.add(board);


    //welcome page
    let wboardGeo = new THREE.BoxGeometry(60, 0.5, 100);
    let wBoard = new THREE.Mesh(wboardGeo, [boardMat, new THREE.MeshLambertMaterial({
        color: 0xffffff,
        bumpMap: boardTexture,
        bumpScale: 0.1,
    })]);
    wBoard.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 14, materialIndex: 1 }];
    wBoard.position.set(0, -0.7, 0);

    bigBookGroup.add(wBoard);
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



async function getData(model) {
    const requestURL = "./data.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    let data = await response.json();

    if (data.length > 0) {
        console.log('get book data!')
        for (let i = 0; i < data.length; i++) {
            //translate to center baord size
            let x = Math.floor(getRandomArbitrary(-28, 28));
            if (x % 2 == 1) x++;

            let z = Math.floor(getRandomArbitrary(-50, 50));
            if (z % 2 == 1) z++;

            let b = new Book(x, 0.2, z, bookGroup, model);
            b.book.userData = data[i];
            books.push(b);

            let b_clone = new Book(x, 0.2, z, undefined, model);
            bigBookGroup.add(b_clone.book);

        }

    }
}




window.addEventListener('keydown', checkCollision);

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

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

    //update controller's position
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
            showBookInfo(bookID);
        }
        else if (portalID) {
            portals[portalID].activate();
        }

        okToMove *= -1;

    } else {
        if (bookID) {
            books[bookID].reset();
            clearBookInfo();
            bookID = undefined;
        }
        else if (portalID) {
            portals[portalID].reset();
            portalID = undefined;
        }

    }


}



function render() {
    if (activeScene == scene) {
        const cameraOffset = new THREE.Vector3(10, 10, 10); // NOTE Constant offset between the camera and the target
        camera.position.copy(controller.position).add(cameraOffset);
        camera.lookAt(controller.position)
        camera.updateProjectionMatrix();
    }

    bigBookGroup.rotateY(0.001);
    renderer.render(activeScene, camera);
    //renderer.render(scene, camera);
    requestAnimationFrame(render);


}

init();
getData();
render();


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/*

------------------------------------------Welcome Page JAVASCRIPT ------------------------------------

*/


/*

------------------------------------------INTERFACE JAVASCRIPT ------------------------------------

*/
let collection = [];

function showBookInfo(id) {
    let container = document.querySelector("#infoContainer");
    container.style.display = "block";
    let div = document.querySelector("#info");

    let t = books[id].book.userData.title;
    let title = document.createTextNode(t);
    let titleDiv = document.querySelector("#title");


    let originalT = books[id].book.userData.translatedTitle;
    let originalTitle = document.createTextNode(originalT);
    let originalTitleDiv = document.querySelector("#originalTitle");


    let a = books[id].book.userData.author;
    let author = document.createTextNode(a);
    let authorDiv = document.querySelector("#author");


    let i = books[id].book.userData.isbn;
    let isbn = document.createTextNode(i);
    let isbnDiv = document.querySelector("#isbn");


    if (titleDiv.innerHTML == "") {
        titleDiv.appendChild(title);
        originalTitleDiv.appendChild(originalTitle);
        authorDiv.appendChild(author);
        isbnDiv.appendChild(isbn);
    }


    //if the encountered book is not in the collection array yet, add it to the collection
    if (!collection.includes(t)) {

        let collectionContainer = document.querySelector("#collectionContainer");

        //switch the collection container's display just once  
        if (collection.length < 1) {
            collectionContainer.style.display = "block";
        }

        collection.push(t);



        //make a new div for the collected book
        //append it to the collection div
        let collectionDiv = document.createElement("div");
        collectionDiv.innerHTML = t;

        collectionContainer.appendChild(collectionDiv);
    }

}

function clearBookInfo() {
    let container = document.querySelector("#infoContainer");
    container.style.display = "none";

    let divs = document.querySelector("#info").children;
    for (let d of divs) {
        d.innerHTML = "";
    }
}



