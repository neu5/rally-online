import {
  Engine,
  FreeCamera,
  HavokPlugin,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

async function getInitializedHavok() {
  return await HavokPhysics();
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  disableWebGL2Support: false,
});
const createScene = async function () {
  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new Scene(engine);

  // This creates and positions a free camera (non-mesh)
  const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'sphere' shape.
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );

  // Move the sphere upward at 4 units
  sphere.position.y = 4;

  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 10, height: 10 },
    scene
  );

  // initialize plugin
  const havokInstance = await getInitializedHavok();
  // pass the engine to the plugin
  const hk = new HavokPlugin(true, havokInstance);
  // enable physics in the scene with a gravity
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  // Create a sphere shape and the associated body. Size will be determined automatically.
  const sphereAggregate = new PhysicsAggregate(
    sphere,
    PhysicsShapeType.SPHERE,
    { mass: 1, restitution: 0.75 },
    scene
  );

  // Create a static box shape.
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0 },
    scene
  );

  return scene;
};

createScene().then((scene) => {
  engine.runRenderLoop(function () {
    if (scene) {
      scene.render();
    }
  });
});
// Resize
window.addEventListener("resize", function () {
  engine.resize();
});
