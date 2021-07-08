import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoughnessMipmapper} from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import head from './head.glb';
import {AnimationAction} from "three/src/animation/AnimationAction";

let scene, renderer;

let mouseX = 0, mouseY = 0;

let windowWidth, windowHeight, activeAction, previousAction;

let mixer, actions;
let clock = new THREE.Clock();

const views = [
    { // RIGHT
        left: 0.62,
        bottom: -0.05,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [400, -50, 0],
        up: [0, 0, 1],
        fov: 30,

    },
    { // LEFT
        left: -0.12,
        bottom: -0.05,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.5, 0.7, 0.7),
        eye: [-400, -50, 1],
        up: [0, 0, 1],
        fov: 30,

    },
    { // CENTER
        left: 0.25,
        bottom: 0.3,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0.5, 0.5, 0.7),
        eye: [0, -10, 400],
        up: [0, 1, 0],
        fov: 30,
    }
];

init();

const roughnessMipmapper = new RoughnessMipmapper(renderer);
animate();

function init() {

    const container = document.getElementById('container');

    scene = new THREE.Scene();

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    scene.add(light);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(-10, -10, 0);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff);
    light3.position.set(10, 10, 0);
    scene.add(light3);

    const ambient = new THREE.AmbientLight(0x222222, 0.7);
    scene.add(ambient);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0.1, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const shadowTexture = new THREE.CanvasTexture(canvas);

    const shadowMaterial = new THREE.MeshBasicMaterial({map: shadowTexture, transparent: true});
    const shadowGeo = new THREE.PlaneGeometry(300, 300, 1, 1);

    const radius = 200;

    const geometry1 = new THREE.IcosahedronGeometry(radius, 1);

    const count = geometry1.attributes.position.count;
    geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const loader = new GLTFLoader();
    loader.load(head, function (gltf) {
        const model = gltf.scene;

        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                roughnessMipmapper.generateMipmaps(child.material);
            }
        })
        mixer = new THREE.AnimationMixer(gltf.scene);
        initAnimations(gltf)
        console.log(actions)
        activeAction = actions["idle"]
        setTimeout(() => {
            fadeToAction("stand", .1)
        }, 1000)

        setTimeout(() => {
            fadeToAction("speak", 0.2)
        }, 3000)

        setTimeout(() => {
            fadeToAction("hi", 0.2)
        }, 6000)

        setTimeout(() => {
            fadeToAction("stand", 0.2)
        }, 9000)

        setTimeout(() => {
            fadeToAction("idle", 0.2)
        }, 12000)

        // playAnimationOnce("Take 001_right_finger1");
        model.position.set(0, 25, 0);
        model.scale.set(40, 40, 40);
        model.rotation.set(0, 0, Math.PI);
        console.log(gltf.animations.filter(i => {
            return i.duration > 0
        }));
        scene.add(model);
    }, undefined, function (error) {
    }, undefined, function (error) {
        console.error(error);
    });

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    for (let ii = 0; ii < views.length; ++ii) {
        const view = views[ii];
        const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.fromArray(view.eye);
        camera.up.fromArray(view.up);
        camera.lookAt(scene.position);
        view.camera = camera;
    }
    document.addEventListener('mousemove', onDocumentMouseMove);

}

function fadeToAction( name, duration ) {

    previousAction = activeAction;
    activeAction = actions[ name ];

    if ( previousAction !== activeAction ) {

        previousAction.fadeOut( duration );

    }

    activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

function initAnimations(gltf) {
    actions = {};
    gltf.animations.forEach(i => {
        actions[i.name] = mixer.clipAction(i)
    })
}

function playAnimationOnce(animName, animationStopCallback = () => {}, reverse = false) {
    let action = actions[animName]
    if (action !== null && action !== undefined) {
        try {
            action.loop = 2200
            action.enabled = true;
            action.clampWhenFinished = true;
            action.paused = false;
            if(reverse){
                action.timeScale = -1;
            }
            action.play();
            console.log("playing...")
            setTimeout(() => {
                animationStopCallback()
            }, action.duration * 1000)
        } catch (e) {
            console.error(e)
        }
    } else {
        console.error("animation play error! animName => " + animName);
    }
}

function startAnimation(animName) {
    let g = actions[animName]
    if (g !== null && g !== undefined) {
        try {
            g.play();
        } catch (e) {
            console.error(e)
        }
    } else {
        console.error("animation play error! animName => " + animName);
    }
}

function stopAnimation(animName) {
    let g = actions[animName]
    if (g !== null && g !== undefined) {
        try {
            g.stop();
        } catch (e) {
            console.error(e)
        }
    } else {
        console.error("animation play error! animName => " + animName);
    }
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowWidth / 2);
    mouseY = (event.clientY - windowHeight / 2);
}

function updateSize() {
    if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        renderer.setSize(windowWidth, windowHeight);
    }
}

function animate() {

    render();

    requestAnimationFrame(animate);
    updateSize()
}

function render() {

    updateSize();

    var delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    for (let ii = 0; ii < views.length; ++ii) {

        const view = views[ii];
        const left = Math.floor(windowWidth * view.left);
        const bottom = Math.floor(windowHeight * view.bottom);
        const width = Math.floor(windowWidth * view.width);
        const height = Math.floor(windowHeight * view.height);

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.setScissorTest(true);

        renderer.render(scene, view.camera);

    }

}