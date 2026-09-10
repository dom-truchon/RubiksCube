import React from 'react';
import { createRoot } from 'react-dom/client';
import { SceneController } from './3d.jsx';

function App() {
    const sceneRef = React.useRef(null);

    React.useEffect(() => {
        window.sceneController = new SceneController(sceneRef.current);
        testScene()

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

function testScene() {
    sceneController.camera.position.z = 5;

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