import {
  Axis,
  PhysicsRaycastResult,
  Quaternion,
  Vector3,
} from "@babylonjs/core";

const getBodyVelocityAtPoint = (body, point) => {
  const r = point.subtract(body.transformNode.position);
  const angularVelocity = body.getAngularVelocity();
  Vector3.Cross(angularVelocity, r);
  const res = Vector3.Cross(angularVelocity, r);
  const velocity = body.getLinearVelocity();
  res.addInPlace(velocity);
  return res;
};

const clampNumber = (num, a, b) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

const tmp1 = new Vector3();
const tmp2 = new Vector3();
const tmpq1 = new Quaternion();
const upAxisLocal = new Vector3(0, 1, 0);
const rightAxisLocal = new Vector3(1, 0, 0);
const forwardAxisLocal = Vector3.Cross(upAxisLocal, rightAxisLocal);
forwardAxisLocal.normalize();
rightAxisLocal.normalize();

const raycastResult = new PhysicsRaycastResult();

class RaycastVehicle {
  constructor(body, scene) {
    this.body = body;
    this.scene = scene;
    this.physicsEngine = body._physicsEngine;
    this.wheels = [];
    this.numberOfFramesToPredict = 60;
    this.predictionRatio = 0.6;
    this.nWheelsOnGround = 0;
    this.speed = 0;
    this.antiRollAxles = [];
  }

  addWheel(wheel) {
    this.wheels.push(wheel);
  }

  removeWheel(wheel, index) {
    if (index) this.wheels.splice(index, 1);
    this.wheels.splice(this.wheels.indexOf(wheel), 1);
  }

  addAntiRollAxle(axle) {
    this.antiRollAxles.push(axle);
  }

  removeAntiRollAxle(axle, index) {
    if (index) this.antiRollAxles.splice(index, 1);
    this.antiRollAxles.splice(this.antiRollAxles.indexOf(axle), 1);
  }

  updateWheelTransform(wheel) {
    Vector3.TransformCoordinatesToRef(
      wheel.positionLocal,
      this.body.transformNode.getWorldMatrix(),
      wheel.positionWorld
    );
    Vector3.TransformNormalToRef(
      wheel.suspensionAxisLocal,
      this.body.transformNode.getWorldMatrix(),
      wheel.suspensionAxisWorld
    );
  }

  updateVehicleSpeed() {
    Vector3.TransformNormalToRef(
      this.body.getLinearVelocity(),
      this.body.transformNode.getWorldMatrix().clone().invert(),
      tmp1
    );
    this.speed = tmp1.z;
  }

  updateWheelSteering(wheel) {
    Quaternion.RotationAxisToRef(
      wheel.suspensionAxisLocal.negateToRef(tmp1),
      wheel.steering,
      tmpq1
    );
    this.body.transformNode.rotationQuaternion.multiplyToRef(
      tmpq1,
      wheel.transform.rotationQuaternion
    );
    wheel.transform.rotationQuaternion.normalize();
    wheel.transform.computeWorldMatrix(true);
  }

  updateWheelRaycast(wheel) {
    tmp1
      .copyFrom(wheel.suspensionAxisWorld)
      .scaleInPlace(wheel.suspensionRestLength)
      .addInPlace(wheel.positionWorld);
    const rayStart = wheel.positionWorld;
    const rayEnd = tmp1;
    this.physicsEngine.raycastToRef(rayStart, rayEnd, raycastResult);
    if (!raycastResult.hasHit) {
      wheel.inContact = false;
      return;
    }
    wheel.hitPoint.copyFrom(raycastResult.hitPointWorld);
    wheel.hitNormal.copyFrom(raycastResult.hitNormalWorld);
    wheel.hitDistance = raycastResult.hitDistance;
    wheel.inContact = true;
    this.nWheelsOnGround++;
  }

  updateWheelSuspension(wheel) {
    if (!wheel.inContact) {
      wheel.prevSuspensionLength = wheel.suspensionLength;
      wheel.hitDistance = wheel.suspensionRestLength;
      return;
    }

    let force = 0.0;
    wheel.suspensionLength = wheel.suspensionRestLength - wheel.hitDistance;
    wheel.suspensionLength = clampNumber(
      wheel.suspensionLength,
      0,
      wheel.suspensionRestLength
    );
    const compressionRatio =
      wheel.suspensionLength / wheel.suspensionRestLength;

    const compressionForce = wheel.suspensionForce * compressionRatio;
    force += compressionForce;

    const rate =
      (wheel.prevSuspensionLength - wheel.suspensionLength) /
      this.scene.getPhysicsEngine().getTimeStep();
    wheel.prevSuspensionLength = wheel.suspensionLength;

    const dampingForce = rate * wheel.suspensionForce * wheel.suspensionDamping;
    force -= dampingForce;

    const suspensionForce = Vector3.TransformNormalToRef(
      wheel.suspensionAxisLocal.negateToRef(tmp1),
      this.body.transformNode.getWorldMatrix(),
      tmp1
    ).scaleInPlace(force);

    this.body.applyForce(suspensionForce, wheel.hitPoint);
  }

  updateWheelSideForce(wheel) {
    if (!wheel.inContact) return;
    const tireWorldVel = getBodyVelocityAtPoint(this.body, wheel.positionWorld);
    const steeringDir = Vector3.TransformNormalToRef(
      wheel.axleAxisLocal,
      wheel.transform.getWorldMatrix(),
      tmp1
    );
    const steeringVel = Vector3.Dot(steeringDir, tireWorldVel);
    const desiredVelChange = -steeringVel;
    const desiredAccel =
      desiredVelChange / this.scene.getPhysicsEngine().getTimeStep();
    this.body.applyForce(
      steeringDir.scaleInPlace(wheel.sideForce * desiredAccel),
      Vector3.LerpToRef(
        wheel.hitPoint,
        wheel.positionWorld,
        wheel.sideForcePositionRatio,
        tmp2
      )
    );
  }

  updateWheelForce(wheel) {
    if (!wheel.inContact) return;
    if (wheel.force !== 0) {
      const forwardDirectionWorld = Vector3.TransformNormalToRef(
        wheel.forwardAxisLocal,
        wheel.transform.getWorldMatrix(),
        tmp1
      ).scaleInPlace(wheel.force);
      this.body.applyForce(
        forwardDirectionWorld,
        tmp2.copyFrom(wheel.hitPoint)
      );
    }
  }

  updateWheelRotation(wheel) {
    wheel.rotation += this.speed * wheel.rotationMultiplier * wheel.radius;
    Quaternion.RotationAxisToRef(wheel.axleAxisLocal, wheel.rotation, tmpq1);
    wheel.transform.rotationQuaternion.multiplyToRef(
      tmpq1,
      wheel.transform.rotationQuaternion
    );
    wheel.transform.rotationQuaternion.normalize();
  }

  updateWheelTransformPosition(wheel) {
    wheel.transform.position.copyFrom(wheel.positionWorld);
    wheel.transform.position.addInPlace(
      wheel.suspensionAxisWorld.scale(wheel.hitDistance - wheel.radius)
    );
  }

  updateVehiclePredictiveLanding() {
    if (this.nWheelsOnGround > 0) return;
    const position = this.body.transformNode.position;
    const gravity = tmp1
      .copyFrom(this.physicsEngine.gravity)
      .scaleInPlace(this.body.getGravityFactor());
    const frameTime = this.scene.getPhysicsEngine().getTimeStep();
    const predictTime = this.numberOfFramesToPredict * frameTime;

    const predictedPosition = tmp2;
    predictedPosition
      .copyFrom(this.body.getLinearVelocity())
      .scaleInPlace(predictTime);
    predictedPosition.addInPlace(
      gravity.scaleInPlace(0.5 * predictTime * predictTime)
    );
    predictedPosition.addInPlace(this.body.transformNode.position);

    this.physicsEngine.raycastToRef(position, predictedPosition, raycastResult);

    if (raycastResult.hasHit) {
      const velocity = this.body.getLinearVelocity().normalize();
      const direction = raycastResult.hitPointWorld.subtractToRef(
        position,
        tmp1
      );
      const displacement = tmp2;
      displacement.x = velocity.x == 0 ? 0 : direction.x / velocity.x;
      displacement.y = velocity.y == 0 ? 0 : direction.y / velocity.y;
      displacement.z = velocity.z == 0 ? 0 : direction.z / velocity.z;
      const nFrames = displacement.length();
      const R1 = Vector3.TransformNormalToRef(
        Axis.Y,
        this.body.transformNode.getWorldMatrix(),
        tmp1
      );
      const R2 = raycastResult.hitNormalWorld;
      const rotationDifference = Vector3.CrossToRef(R1, R2, tmp2);
      const timeStepDuration = frameTime * nFrames;
      const predictedAngularVelocity = rotationDifference.scaleToRef(
        1 / timeStepDuration,
        tmp2
      );

      this.body.setAngularVelocity(
        Vector3.LerpToRef(
          this.body.getAngularVelocity(),
          predictedAngularVelocity,
          this.predictionRatio,
          tmp1
        )
      );
    }
  }

  update() {
    this.body.transformNode.computeWorldMatrix(true);
    this.nWheelsOnGround = 0;
    this.updateVehicleSpeed();

    this.wheels.forEach((wheel, index) => {
      this.updateWheelTransform(wheel);
      this.updateWheelSteering(wheel);
      this.updateWheelRaycast(wheel);
      this.updateWheelSuspension(wheel);
      this.updateWheelForce(wheel);
      this.updateWheelSideForce(wheel);
      this.updateWheelTransformPosition(wheel);
      this.updateWheelRotation(wheel);
    });

    this.updateVehiclePredictiveLanding();

    this.antiRollAxles.forEach((axle) => {
      const wheelA = this.wheels[axle.wheelA];
      const wheelB = this.wheels[axle.wheelB];
      if (!wheelA || !wheelB) return;
      if (!wheelA.inContact && !wheelB.inContact) return;
      const wheelOrder =
        wheelA.suspensionLength <= wheelB.suspensionLength
          ? [wheelA, wheelB]
          : [wheelB, wheelA];
      const maxCompressionRestLength =
        (wheelA.suspensionRestLength + wheelB.suspensionRestLength) / 2;
      const compressionDifference =
        wheelOrder[1].suspensionLength - wheelOrder[0].suspensionLength;
      const compressionRatio =
        Math.min(compressionDifference, maxCompressionRestLength) /
        maxCompressionRestLength;

      const antiRollForce = tmp1
        .copyFrom(wheelOrder[0].suspensionAxisWorld)
        .scaleInPlace(axle.force * compressionRatio);
      this.body.applyForce(antiRollForce, wheelOrder[0].positionWorld);
      antiRollForce
        .copyFrom(wheelOrder[1].suspensionAxisWorld)
        .negateInPlace()
        .scaleInPlace(axle.force * compressionRatio);
      this.body.applyForce(antiRollForce, wheelOrder[1].positionWorld);
    });
  }
}

export { RaycastVehicle };
