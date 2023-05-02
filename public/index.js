import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Book } from './book.js';
import { Portal } from './portal.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const params = {
    exposure: 0,
    bloomStrength: 0.2,
    bloomThreshold: 0.95,
    bloomRadius: 0.1
};
let bloomPass, composer;

const palette = [
    0xffccf9,//pink
    0xCCFFF7,//tiffany teal
    0xccd5fe,//light purple
    0xcdffdb,//light green
    0xD6D6D6, //yellow
    0xFFE3CC//light blue
]

const palette_rgb = [
    'rgb(255,204,249)',
    'rgb(204,255,247)',
    'rgb(204,213,254)',
    'rgb(205,255,219)',
    'rgb(214,214,214)',
    'rgb(255,227,204)'
]

//location parameters
let bookSectionParams = [
    [20, 0, 60, 50],//1 (x,y) to(x,y)
    [0, 0, 20, 40],
    [40, 50, 60, 98],
    [0, 50, 40, 70],
    [0, 70, 40, 98],
    [20, 35, 40, 55]
]

let bookSectionLabels = [
    ["They lent me lens with a soft cover of sorrow that clarifies"],
    ["A bit exciting, a bit thrilling"],
    ["Calming descriptions nurtured by (personal) time and history"],
    ["How could art be so blessed and cursed by text?"],
    ["The membranes between every day"],
    ["My book guardians"]
]

let scene, renderer, camera, controls;
let controller, controllerBox;
let controllerOldPosition = new THREE.Vector3();
let books = [];
let portals = [];
let bookGroup, gateModel, portalGroup, sectionGroup;
let particleGroup;
let font;

//welcome page elements
let zoomOutScene, activeScene;
let welcomeGroup, bigBookGroup, bookModel;

//world map elements
let topCamera, activeCamera;
let raycaster, pointer, event, INTERSECTED;
let sectionPlanes = [];
let sectionLines = [];


let socket;




function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0xdddddd);
    zoomOutScene = new THREE.Scene();

    zoomOutScene.background = new THREE.Color(0xffffff);

    if (window.location.pathname.endsWith('book.html')) {
        activeScene = scene;
    } else {
        activeScene = zoomOutScene;
    }


    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');
    document.body.appendChild(canvas);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 3, 1000);
    camera.position.set(0, 60, 180);
    controls = new OrbitControls(camera, renderer.domElement);

    activeCamera = camera;


    let loader = new FontLoader();

    loader.load('assets/helvetiker_regular.typeface.json', function (data) {
        font = data;
        console.log('font loaded!')
    });

    establishWebsocketConnection();

    initWelcomePageComponents();
    initWorldmapComponents();

    createParticles();
    callModel();
    createBoard();
    createController();
    createBooks();
    createSectionPlanes();
    createPortals();



    //light
    let light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    let dir_light = new THREE.DirectionalLight(0xffffff, 0.1);

    dir_light.position.set(10, 100, 100);
    dir_light.castShadow = true;


    dir_light.shadow.camera.top = 50;
    dir_light.shadow.camera.right = 30;
    dir_light.shadow.camera.bottom = -50;
    dir_light.shadow.camera.left = -30;
    dir_light.shadow.camera.far = 200;

    scene.add(dir_light);

    // const helper = new THREE.CameraHelper(dir_light.shadow.camera);
    // scene.add(helper);

    //post processing
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(activeScene, camera);
    composer.addPass(renderPass);

    const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms['damp'] = { value: 0.7 }
    composer.addPass(afterimagePass);

    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    composer.addPass(bloomPass);

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


//--------------------------------------Welcome page functions ----------------------------


function initWelcomePageComponents() {
    //light
    let light = new THREE.AmbientLight(0xffffff, 1);
    zoomOutScene.add(light);

    let dir_light = new THREE.DirectionalLight(0xffffff, 0.1);
    dir_light.position.set(10, 100, 100);
    dir_light.castShadow = true;
    dir_light.shadow.camera.top = 50;
    dir_light.shadow.camera.right = 30;
    dir_light.shadow.camera.bottom = -50;
    dir_light.shadow.camera.left = -30;
    dir_light.shadow.camera.far = 200;
    zoomOutScene.add(dir_light);



    welcomeGroup = new THREE.Group();
    bigBookGroup = new THREE.Group();
    zoomOutScene.add(welcomeGroup);
    welcomeGroup.add(bigBookGroup);

}

function createParticles() {
    particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    let materials = [];

    // const textureLoader = new THREE.TextureLoader();


    for (let i = 0; i < 1000; i++) {

        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;

        vertices.push(x, y, z);

    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    let parameters = [
        [[0.5, 0.2, 0.1], 5],
        [[0.45, 0.5, 0.1], 4],
        [[0.40, 0.5, 0.1], 3],
        [[0.35, 0.3, 0.1], 2],
        [[0.30, 0.3, 0.1], 1]
    ];

    for (let i = 0; i < parameters.length; i++) {

        const color = parameters[i][0];
        const size = parameters[i][1];

        materials[i] = new THREE.PointsMaterial({
            size: size,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        materials[i].color.setHSL(color[0], color[1], color[2]);

        const particles = new THREE.Points(geometry, materials[i]);

        particles.rotation.x = Math.random() * 6;
        particles.rotation.y = Math.random() * 6;
        particles.rotation.z = Math.random() * 6;

        particleGroup.add(particles);

    }


}


//welcome page's big book
function createBigBook() {
    bookModel.scale.set(10, 10, 10);
    bookModel.position.set(1.5, -8.45, -1);
    bookModel.traverse(function (child) {

        if (child.isMesh) {

            child.material.color = new THREE.Color(0xcccccc);
        }

    });
    welcomeGroup.add(bookModel);
}


//--------------------------------------World map functions ----------------------------

function initWorldmapComponents() {
    topCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    topCamera.position.set(0, 110, 0);
    topCamera.lookAt(0, 0, 0);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

}

window.addEventListener('pointermove', onPointerMove);


function onPointerMove(e) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

    let div = document.getElementById("sectionLabel");
    div.style.left = e.clientX + 10 + 'px';
    div.style.top = e.clientY + 10 + 'px';
}

let hoveredIndex = undefined;
let showingLabel = false;

function renderRaycaster() {

    raycaster.setFromCamera(pointer, topCamera);

    let intersects = raycaster.intersectObjects(sectionGroup.children, true);

    if (intersects.length > 0) {


        if (INTERSECTED != intersects[0].object) {
            //reset color
            if (INTERSECTED) {
                if (INTERSECTED.material.color) {
                    INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                    INTERSECTED.material.opacity = 0;
                    //zoomOutScene.remove(sectionPlanes[hoveredIndex]);
                    zoomOutScene.remove(sectionLines[hoveredIndex]);

                    clearLabel();
                    showingLabel = false;

                }

            }
            //update intersected object
            INTERSECTED = intersects[0].object;
            hoveredIndex = INTERSECTED.userData.index;


            if (INTERSECTED.material.color) {

                //save the intersected object current color
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                INTERSECTED.material.opacity = 0.5;


                //then change the color
                let colorHex = palette[hoveredIndex];

                INTERSECTED.material.color.setHex(colorHex);
                showLabel(bookSectionLabels[hoveredIndex]);


                //zoomOutScene.add(sectionPlanes[hoveredIndex]);
                zoomOutScene.add(sectionLines[hoveredIndex])
            }
            console.log(INTERSECTED);

        }

    } else {

        if (INTERSECTED) {
            if (INTERSECTED.material.color) {
                //reset the objects color to its original
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                INTERSECTED.material.opacity = 0;
                //zoomOutScene.remove(sectionPlanes[hoveredIndex]);
                zoomOutScene.remove(sectionLines[hoveredIndex]);
                clearLabel();
                hoveredIndex = undefined;
            }
        }
        //reset the intersected
        INTERSECTED = null;


    }

}

window.addEventListener('mousedown', checkShowingLabel);
// let bookSectionParams = [
//     [20, 0, 60, 50],//1 (x,y) to(x,y)
//     [0, 0, 20, 40],
//     [40, 50, 60, 98],
//     [0, 50, 40, 70],
//     [0, 70, 40, 98],
//     [20, 35, 40, 55]
// ]
function checkShowingLabel() {
    console.log('mouse clicked')
    if (hoveredIndex) {
        console.log(hoveredIndex);
        activeCamera = camera;
        activeScene = scene;

        let minX = bookSectionParams[hoveredIndex][0];
        let minY = bookSectionParams[hoveredIndex][1];
        let maxX = bookSectionParams[hoveredIndex][2];
        let maxY = bookSectionParams[hoveredIndex][3];
        let x = (minX + maxX) / 2;
        let y = (minY + maxY) / 2;

        controller.position.x = x - 30;
        controller.position.z = y - 50;

        clearLabel();
        showingLabel = false;
        zoomOutScene.remove(sectionLines[hoveredIndex]);
    }
}

function showLabel(name) {
    let div = document.getElementById("sectionLabel");
    div.textContent = name;

}

function clearLabel(name) {
    let div = document.getElementById("sectionLabel");
    div.textContent = "";
    div.style.color = 'black'
}





//--------------------------------------Main page functions ----------------------------

function createBoard() {
    let boardTexture = new THREE.TextureLoader().load('assets/grid-01.png', function () {
        boardTexture.wrapS = boardTexture.wrapT = THREE.RepeatWrapping;
        boardtexture.offset.set(0, 0);
        boardTexture.repeat.set(2, 2);
    });
    let boardGeo = new THREE.BoxGeometry(60, 0.5, 100);
    let boardMat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    let board = new THREE.Mesh(boardGeo, [boardMat, new THREE.MeshLambertMaterial({
        color: 0xcccccc,
        bumpMap: boardTexture,
        bumpScale: 10,
    })]);
    board.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 14, materialIndex: 1 }];
    board.position.set(0, -0.7, -1);
    board.receiveShadow = true;
    board.castShadow = false;
    scene.add(board);


    //welcome page
    let wboardGeo = new THREE.BoxGeometry(60, 0.8, 100);
    let wBoard = new THREE.Mesh(wboardGeo, [boardMat, new THREE.MeshLambertMaterial({
        color: 0xcccccc,
        bumpMap: boardTexture,
        bumpScale: 0.1,
    })]);
    wBoard.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 14, materialIndex: 1 }];
    wBoard.position.set(0, -0.7, -1);
    wBoard.receiveShadow = true;
    welcomeGroup.add(wBoard);
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



function createSectionPlanes() {
    sectionGroup = new THREE.Group();
    zoomOutScene.add(sectionGroup);

    for (let i = 0; i < bookSectionParams.length; i++) {
        let minX = bookSectionParams[i][0];
        let minY = bookSectionParams[i][1];
        let maxX = bookSectionParams[i][2];
        let maxY = bookSectionParams[i][3];
        let w = maxX - minX;
        let h = maxY - minY;
        let geo = new THREE.PlaneGeometry(1, 1);
        geo.translate(0.5, -0.5, 0);

        let mat = new THREE.MeshStandardMaterial({
            color: palette[i],
            transparent: true,
            opacity: 0,
        });

        //create a plane holder for raycaster detection
        let planeHolder = new THREE.Mesh(geo, mat);
        planeHolder.scale.set(w - 2, h - 2);

        planeHolder.rotateX(-Math.PI / 2)
        // //x-28, y-50
        planeHolder.position.set(minX + 1 - 30, 2, minY + 1 - 50);
        planeHolder.userData.index = i;

        sectionGroup.add(planeHolder);

        // let cv = document.createElement("canvas");
        // cv.width = w * 10;
        // cv.height = h * 10;
        // let ctx = cv.getContext('2d');
        // ctx.fillText(bookSectionLabels[i], w / 2, h / 2);
        // ctx.font = 'bold 20px Helvetica';

        // let cvTexture = new THREE.Texture(cv);
        // cvTexture.needsUpdate = true;

        //this plane and line is to be displayed when raycaster detected hover
        let points = [];
        points.push(new THREE.Vector3(minX, 0, minY));
        points.push(new THREE.Vector3(minX, 0, maxY - 2));
        points.push(new THREE.Vector3(maxX - 2, 0, maxY - 2));
        points.push(new THREE.Vector3(maxX - 2, 0, minY));
        points.push(new THREE.Vector3(minX, 0, minY));
        let lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        let line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
            color: palette[i],
            linewidth: 1
        }));
        line.position.set(1 - 30, 2, 1 - 50);
        sectionLines.push(line);



        // let plane = planeHolder.clone();
        // plane.material.dispose();
        // plane.material = new THREE.MeshStandardMaterial({
        //     map: cvTexture,
        //     transparent: true
        // })

        // sectionPlanes.push(plane);

    }

}


function createPortals() {
    for (let i = 0; i < 10; i++) {
        let x = Math.floor(getRandomArbitrary(-28, 28));
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


        for (let i = 0; i < data.length; i++) {
            let x, z;

            //tag is 1-6, index is 0-5
            let index = data[i].tag - 1;

            let minX = bookSectionParams[index][0] - 28;
            let minY = bookSectionParams[index][1] - 50;
            let maxX = bookSectionParams[index][2] - 32;
            let maxY = bookSectionParams[index][3] - 50;

            x = Math.floor(getRandomArbitrary(minX, maxX));
            if ((x % 2 == 1) || (x % 2 == -1)) {
                x++;
            }

            z = Math.floor(getRandomArbitrary(minY, maxY));
            if ((z % 2 == 1) || (z % 2 == -1)) z++;

            console.log(x + ', ' + z);

            let b = new Book(x, 0.2, z - 0.2, bookGroup, model, palette[index]);
            b.book.userData = data[i];
            books.push(b);


            let b_clone = new Book(x, 0.2, z - 0.2, bigBookGroup, model, palette[index]);
            b_clone.book.userData = data[i];
        }

    }

}





window.addEventListener('keydown', checkKeyPressed);

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

function checkBoardEdge() {

}
let bookID = undefined;
let portalID = undefined;

function checkKeyPressed(e) {
    if (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40') {
        checkCollision(e);
    }
}
let prevKey = '';
let collectBook = false;
function checkCollision(e) {
    let okToMove = 1;



    //save the preivous controller position
    controllerOldPosition.copy(controller.position);

    //then move the controller based on keypress
    moveController(e);
    checkBoardEdge();

    //update controller's position
    controller.updateMatrixWorld();
    //compute the controller bounding box with new controller position
    controllerBox.copy(controller.geometry.boundingBox).applyMatrix4(controller.matrixWorld);

    //loop through books
    for (let i = 0; i < books.length; i++) {

        books[i].box.copy(books[i].book.geometry.boundingBox).applyMatrix4(books[i].book.matrixWorld);
        books[i].box.expandByVector(new THREE.Vector3(0.5, 0, 0.5));

        if (controllerBox.intersectsBox(books[i].box)) {
            okToMove *= -1;
            bookID = i;
        }
    }

    //loop through portals
    for (let i = 0; i < portals.length; i++) {
        portals[i].box.copy(portals[i].mesh.geometry.boundingBox).applyMatrix4(portals[i].mesh.matrixWorld);
        if (controllerBox.intersectsBox(portals[i].box)) {
            okToMove *= -1;
            portalID = i;
        }
    }

    console.log(okToMove)

    //if collided show info card
    if (okToMove < 0) {
        //keep the controller at the old position
        controller.position.copy(controllerOldPosition);

        //if it collided with a book
        if (bookID) {
            //if the arrow keys are up or down
            if (e.keyCode == "38" || e.keyCode == "40") {

                //show info card
                books[bookID].activate();
                let title = books[bookID].book.userData.title;

                // books[bookID].showTitle(JSON.stringify(title));
                showBookInfo(bookID);

                moveController(e);
                //show the hint if they past the door, they collect the book

                //1st time: true to false
                collectBook = !collectBook;

                if (collectBook) {
                    addtoCollection();
                }
                console.log(collectBook)

                // //if the keycode is the same as the prev key (still up or down), let it move
                // if (e.keyCode == prevKey) {

                //     moveController(e);
                //     //collect book
                //     addtoCollection();
                //     prevKey = '';


                // } else {
                //     moveController(e);
                //     //save this keycode
                //     prevKey = e.keyCode;

                // }
                // console.log(prevKey);



            }

        }
        else if (portalID) {
            portals[portalID].activate();
            showCommentBox();
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
            clearCommentBox();
            portalID = undefined;
        }

    }


}

let cameraOffsetOn = true;

function render() {

    const time = Date.now() * 0.00005;


    if (activeScene == scene) {

        const cameraOffset = new THREE.Vector3(0, 3, 8); // NOTE Constant offset between the camera and the target
        camera.position.copy(controller.position).add(cameraOffset);

        camera.lookAt(controller.position);
        camera.updateProjectionMatrix();

    }

    if (activeCamera == topCamera) {
        welcomeGroup.rotation.y = 0;
        renderRaycaster();
    } else {
        welcomeGroup.rotateY(0.001);
    }

    let maxEdge = new THREE.Vector3(30, 2, 50);
    let minEdge = new THREE.Vector3(-30, -2, -50);
    controller.position.clamp(minEdge, maxEdge);

    //move particle systems

    for (let i = 0; i < particleGroup.children.length; i++) {

        const object = particleGroup.children[i];

        if (object instanceof THREE.Points) {

            // object.rotation.x = time * (i < 4 ? i + 1 : - (i + 1)) ;
            object.position.y += Math.sin(time * 10 + i) * 0.1;
            object.material.size += Math.sin(time + i) * 0.001;

        }

    }
    if (activeCamera === camera) {
        composer.render();
    } else {
        renderer.render(activeScene, activeCamera);
    }

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

------------------------------------------World Map Page JAVASCRIPT ------------------------------------

*/

if (document.getElementById('worldmapBtn')) {
    document.getElementById('worldmapBtn').addEventListener('click', function () {
        activeCamera = topCamera;
        activeScene = zoomOutScene;
    });
}


/*

------------------------------------------INTERFACE JAVASCRIPT ------------------------------------

*/
let collection = [];
let addBtn = document.getElementById('addCollectionBtn');

function showBookInfo(id) {

    let container = document.querySelector("#infoContainer");
    container.style.display = "grid";

    let t = books[id].book.userData.title;
    let title = document.createTextNode(t);
    let titleDiv = document.querySelector("#title");
    titleDiv.innerHTML = "";


    let originalT = books[id].book.userData.translatedTitle;
    let originalTitle = document.createTextNode(originalT);
    let originalTitleDiv = document.querySelector("#originalTitle");
    originalTitleDiv.innerHTML = "";


    let a = books[id].book.userData.author;
    let author = document.createTextNode(a);
    let authorDiv = document.querySelector("#author");
    authorDiv.innerHTML = "";

    let imgsrc = books[id].book.userData.img;
    if (imgsrc) {
        let cover = document.querySelector("#cover");
        cover.src = imgsrc;
    }


    let i = books[id].book.userData.isbn;
    let isbn = document.createTextNode(i);
    let isbnDiv = document.querySelector("#isbn");
    isbnDiv.innerHTML = "";

    let th = books[id].book.userData.thoughts;
    let thoughts = document.createTextNode(th);
    let thoughtsDiv = document.querySelector("#thoughts");
    thoughtsDiv.innerHTML = "";

    if (titleDiv.innerHTML == "") {
        titleDiv.appendChild(title);
        originalTitleDiv.appendChild(originalTitle);
        authorDiv.appendChild(author);
        isbnDiv.appendChild(isbn);
        thoughtsDiv.appendChild(thoughts);
    }


    if (collection.includes(t)) {
        addBtn.innerHTML = 'Added!';
    }


}

addBtn.addEventListener('click', addtoCollection);

function addtoCollection() {
    let titleDiv = document.querySelector("#title");
    let title = titleDiv.innerHTML;

    //if the encountered book is not in the collection array yet, add it to the collection
    if (!collection.includes(title)) {

        let collectionContainer = document.querySelector("#collectionContainer");

        //switch the collection container's display just once  
        if (collection.length < 1) {
            collectionContainer.style.display = "block";
        }

        collection.push(title);

        //make a new div for the collected book
        //append it to the collection div
        let collectionDiv = document.createElement("div");
        collectionDiv.className = "collectionBookTitle";

        collectionDiv.innerHTML = title;
        let deleteBtn = document.createElement("button");
        deleteBtn.className = "deleteCollectionBtn";
        deleteBtn.innerHTML = "delete";
        collectionDiv.appendChild(deleteBtn);

        collectionContainer.appendChild(collectionDiv);

    }
    addBtn.innerHTML = "Added!";

}



function clearBookInfo() {
    let container = document.querySelector("#infoContainer");
    container.style.display = "none";

    let cover = document.querySelector("#cover");
    cover.src = "";

    let addBtn = document.getElementById('addCollectionBtn');
    addBtn.innerHTML = '+ Add to collection';
}

function showCommentBox() {
    let containerDiv = document.getElementById('portalContainer');
    containerDiv.style.display = 'block';
}

function clearCommentBox() {
    let containerDiv = document.getElementById('portalContainer');
    containerDiv.style.display = 'none';
}

//-----------------------SOCKET CLIENT SIDE -------------------------------------

function establishWebsocketConnection() {
    socket = io();

    socket.on("msg", (msg) => {
        console.log(
            "Got a message from friend with ID ",
            msg.from,
            "and data:",
            msg.data
        );

    });

    // document.addEventListener(
    //   "keyup",
    //   (ev) => {
    //     if (ev.key === "t") {
    //       socket.emit("msg", Date.now());
    //     }
    //   },
    //   false
    // );
}