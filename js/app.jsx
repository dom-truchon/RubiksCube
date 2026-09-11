import React from 'react';
import { createRoot } from 'react-dom/client';
import { SceneController } from './3d.jsx';
import * as THREE from 'three';

function App() {
    const sceneRef = React.useRef(null);

    React.useEffect(() => {
        window.sceneController = new SceneController(sceneRef.current);
        initialScene();
        
        window.rubiksCube = new RubiksCube();

        return () => {
            // Cleanup later
        };
    }, []);

    // App HTML goes here
    return (
        <div id="scene" ref={sceneRef}></div>
    );

}

createRoot(document.getElementById('app')).render(
    <App />
);

function initialScene() {
    sceneController.camera.position.z = 7.5;

    // Add cube
    let cubeSpinAnimation = (time, cube) => {
        cube.rotation.x = time / 2000;
        cube.rotation.y = time / 1000;

        sceneController.renderer.render( sceneController.scene, sceneController.camera );
    }
    cubeSpinAnimation = undefined; // Disable animation for now
    sceneController.createCube(cubeSpinAnimation)

    // Add test lights
    sceneController.addAmbientLight();
    sceneController.addDirectionalLight(0.5, 0.5, 1);
    sceneController.addDirectionalLight(-0.5, -0.5, -1);

    // Scene BG color
    sceneController.setSceneBackground(0xA9BAA8);

    sceneController.renderer.render( sceneController.scene, sceneController.camera );
}

class RubiksCube {

    constructor() {
        this.cubies = [];
        this.moveQueue = [];
        this.isAnimating = false;

        sceneController.clearAllMeshes();

        // +z = F, -z = B
        // +x = R, -x = L
        // +y = U, -y = D
        
        for(let x = -1; x <= 1; x++) {
            for(let y = -1; y <= 1; y++) {
                for(let z = -1; z <= 1; z++) {
                    if(x === 0 && y === 0 && z === 0) continue; // Skip center cube
                    let color = sceneController.makeColor(0, 0, 0); // Black for cubie base
                    let cubie = sceneController.createCube(x, y, z, 1, 1, 1, color);
                    
                    // Define face colors
                    let color__X = (x === 1) ? 0xFF0000 : (x === -1) ? 0xFFA500 : color; // Red for right, orange for left, else black
                    let color__Y = (y === 1) ? 0xFFFF00 : (y === -1) ? 0xFFFFFF : color; // Yellow for top, white for bottom, else black 
                    let color__Z = (z === 1) ? 0x00FF00 : (z === -1) ? 0x0000FF : color; // Green for front, blue for back, else black

                    // Create stickers for each face
                    let sticker_X = (x !== 0) ? sceneController.createCube((x*0.46), 0, 0, 0.1, 0.9, 0.9, color__X, undefined, false) : false; // R/L sticker
                    let sticker_Y = (y !== 0) ? sceneController.createCube(0, (y*0.46), 0, 0.9, 0.1, 0.9, color__Y, undefined, false) : false; // F/B sticker
                    let sticker_Z = (z !== 0) ? sceneController.createCube(0, 0, (z*0.46), 0.9, 0.9, 0.1, color__Z, undefined, false) : false; // U/D sticker
                    if(sticker_X) cubie.add(sticker_X);
                    if(sticker_Y) cubie.add(sticker_Y);
                    if(sticker_Z) cubie.add(sticker_Z);   

                    this.cubies.push(cubie);
                }
            }
        }   
    }

    move(face) {
        if(face) this.moveQueue.push(face);
        if(this.isAnimating) return;
        if(this.moveQueue.length === 0) return;

        const nextMove = this.moveQueue.shift();

        this.processNextMove(nextMove);
    }

    processNextMove(face) {
        const faceMap = {
            'L': { axis: 'x', value: -1 }, // Left
            'R': { axis: 'x', value: 1 }, // Right
            'D': { axis: 'y', value: -1 }, // Down
            'U': { axis: 'y', value: 1 }, // Up
            'B': { axis: 'z', value: -1 }, // Back
            'F': { axis: 'z', value: 1 }, // Front
        };

        const faceInfo = faceMap[face[0]]; // Get the first character of the face string
        const direction = face[1] === "'" ? -1 : 1; // If the second character is a prime symbol, rotate counter-clockwise
        const distance = face[1] === "2" ? 2 : 1; // If the third character is "2", rotate 180 degrees
        const angle = direction * (Math.PI / 2) * distance; // 90 degrees in radians, adjusted for direction and distance

        if (!faceInfo) {
            console.error(`Invalid face: ${face}`);
            return;
        }

        const worldPosition = new THREE.Vector3();
        const { axis, value } = faceInfo;
        // Select cubies on the specified face, based on world position
        const selectedCubies = this.cubies.filter(cubie => {
            cubie.getWorldPosition(worldPosition);
            return Math.round(worldPosition[axis]) === value;
        });

        let faceGroup = new THREE.Group();
        selectedCubies.forEach(cubie => {
            faceGroup.attach(cubie);
        });
        sceneController.scene.add(faceGroup);
        
        // Rotate group by 90 degrees clockwise around the specified axis
        const rotationAxis = new THREE.Vector3(
            axis === 'x' ? 1 : 0,
            axis === 'y' ? 1 : 0,
            axis === 'z' ? 1 : 0
        );
        const rotationAngle = angle;  
        
        // Animate rotation
        let startTime = null;
        this.isAnimating = true;
        const animateRotation = (timestamp) => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const duration = 100 * distance; // Duration of rotation in ms
            const progress = Math.min(elapsed / duration, 1);

            faceGroup.rotation[axis] = rotationAngle * progress;

            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            }
            else {
                this.isAnimating = false;

                // Reattach cubies to the main scene and remove the temporary group
                selectedCubies.forEach(cubie => {
                    sceneController.scene.attach(cubie);
                });
                sceneController.scene.remove(faceGroup);

                console.log(`Move ${face} completed.`);

                // Start next queued move
                this.move();
            }
            
        };
        requestAnimationFrame(animateRotation); 
    }
}