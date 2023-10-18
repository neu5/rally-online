import {
  ArcRotateCamera,
  // Color3,
  Engine,
  HavokPlugin,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeMesh,
  PhysicsShapeType,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

async function getInitializedHavok() {
  try {
    return await HavokPhysics();
  } catch (e) {
    return e;
  }
}

const groundSize = 100;
let groundPhysicsMaterial = { friction: 0.2, restitution: 0.3 };

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  disableWebGL2Support: false,
});

function createHeightmap({
  scene,
  material,
}: {
  scene: Scene;
  material: StandardMaterial;
}) {
  console.log("create heightmap");
  var ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "assets/heightmap.png",
    {
      width: groundSize,
      height: groundSize,
      subdivisions: 100,
      maxHeight: 10,
      onReady: (mesh) => {
        // meshesToDispose.push(mesh);
        mesh.material = new StandardMaterial("heightmapMaterial");
        // matsToDispose.push(mesh.material);
        // mesh.material.emissiveColor = Color3.Green();
        // mesh.material.wireframe = true;

        var groundShape = new PhysicsShapeMesh(ground, scene);
        // shapesToDispose.push(groundShape);

        const body = new PhysicsBody(
          ground,
          PhysicsMotionType.STATIC,
          false,
          scene
        );
        // bodiesToDispose.push(body);
        groundShape.material = material;
        body.shape = groundShape;
        body.setMassProperties({
          mass: 0,
        });
        console.log("finish creating heightmap");
      },
    },
    scene
  );
}

const createScene = async function () {
  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new Scene(engine);

  // This creates and positions a free camera (non-mesh)
  const camera = new ArcRotateCamera(
    "camera1",
    -Math.PI / 2,
    0.8,
    200,
    new Vector3(0, 0, 0)
  );

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
  sphere.position.y = 60;

  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: groundSize, height: groundSize },
    scene
  );

  // initialize plugin
  const havokInstance = await getInitializedHavok();
  // pass the engine to the plugin
  const hk = new HavokPlugin(true, havokInstance);
  // enable physics in the scene with a gravity
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  // Create a sphere shape and the associated body. Size will be determined automatically.
  // eslint-disable-next-line
  const sphereAggregate = new PhysicsAggregate(
    sphere,
    PhysicsShapeType.SPHERE,
    { mass: 1, restitution: 0.75 },
    scene
  );

  // Create a static box shape.
  // eslint-disable-next-line
  const groundAggregate = new PhysicsAggregate(
    ground,
    PhysicsShapeType.BOX,
    { mass: 0 },
    scene
  );

  createHeightmap({
    scene,
    material: groundPhysicsMaterial,
  });

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
