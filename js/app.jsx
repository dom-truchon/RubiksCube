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

        sceneController.clearAllMeshes();

        // +z = front, -z = back, +x = right, -x = left, +y = top, -y = bottom
        
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
                    let sticker_X = (x !== 0) ? sceneController.createCube((x*0.475), 0, 0, 0.1, 0.9, 0.9, color__X, undefined, false) : false; // R/L sticker
                    let sticker_Y = (y !== 0) ? sceneController.createCube(0, (y*0.475), 0, 0.9, 0.1, 0.9, color__Y, undefined, false) : false; // F/B sticker
                    let sticker_Z = (z !== 0) ? sceneController.createCube(0, 0, (z*0.475), 0.9, 0.9, 0.1, color__Z, undefined, false) : false; // U/D sticker

                    if(sticker_X) cubie.add(sticker_X);
                    if(sticker_Y) cubie.add(sticker_Y);
                    if(sticker_Z) cubie.add(sticker_Z);   

                    this.cubies.push(cubie);
                }
            }
        }   
    }

    move(face) {
        const faceMap = {
            'L': { axis: 'x', value: -1 }, // Left
            'R': { axis: 'x', value: 1 }, // Right
            'D': { axis: 'y', value: -1 }, // Down
            'U': { axis: 'y', value: 1 }, // Up
            'B': { axis: 'z', value: -1 }, // Back
            'F': { axis: 'z', value: 1 }, // Front
        };

        const faceInfo = faceMap[face]; 
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
        const rotationAngle = Math.PI / 2;  
        
        // Animate rotation
        let startTime = null;
        const animateRotation = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const duration = 250; // Duration of rotation in ms
            const progress = Math.min(elapsed / duration, 1);
            faceGroup.rotation[axis] = rotationAngle * progress;
            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            }
        };
        requestAnimationFrame(animateRotation); 
    }
}