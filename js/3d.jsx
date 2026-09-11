import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneController {

    constructor(sceneElement) {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.meshes = []; // All meshes
        this.groups = {}; // All groups
        this.eventHandlers = {};
        this.camera = new THREE.PerspectiveCamera(
            75, // fov
            window.innerWidth / window.innerHeight, // aspect
            0.1, // near
            1000 // far
        );

        // Camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.renderer.setAnimationLoop(() => {
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        });

        // Create canvas
        sceneElement.appendChild(this.renderer.domElement);
        this.sceneElement = sceneElement;

        // Set renderer size and render the scene
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.render( this.scene, this.camera );
        
        // Resize window scene on window resize
        this.eventHandlers.handleSceneResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.render( this.scene, this.camera );
        };
        window.addEventListener('resize', this.eventHandlers.handleSceneResize);
    }

    addAmbientLight(color=0xffffff, intensity=0.5) {
        const ambientLight = new THREE.AmbientLight(color, intensity);
        this.scene.add(ambientLight);
    }

    addDirectionalLight(x=0, y=0, z=0, color=0xffffff, intensity=1) {
        const directionalLight = new THREE.DirectionalLight(color, intensity);
        directionalLight.position.set(x, y, z);
        this.scene.add(directionalLight);
    }

    setSceneBackground(color=0x000000) {
        this.scene.background = new THREE.Color(color);
    }

    makeColor = (r=Math.random(), g=Math.random(), b=Math.random()) => {
        return new THREE.Color(r, g, b);
    }

    clearAllMeshes(group) {
        this.meshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.meshes = [];
    }

    createCube(x=0, y=0, z=0, len_x=1, len_y=1, len_z=1, color=0xFF69B4, animation=undefined, addToScene=true) {
        const geometry = new THREE.BoxGeometry( len_x, len_y, len_z );
        const material = new THREE.MeshStandardMaterial( { color: color } );
        const cube = new THREE.Mesh( geometry, material );
        cube.position.set(x, y, z);
        if(addToScene) {
            this.scene.add( cube );
        }
        this.meshes.push(cube);
        
        if(animation) {
            this.renderer.setAnimationLoop((time) => {
                animation(time, cube);
            });
        }

        return cube;
    }
}