---
sidebar_position: 1
---

# Chapter 1: Robot Kinematics

## Introduction

Kinematics is the study of motion without considering the forces that cause it. For robots, kinematics answers questions like: "Where is the robot's end-effector?" and "What joint angles produce a desired hand position?" This chapter covers forward and inverse kinematics, essential tools for robot control.

## Coordinate Frames and Transformations

### Homogeneous Transformations

Represent position and orientation in a single 4×4 matrix:

```text
T = [R | t]  where R is 3x3 rotation matrix, t is 3x1 translation vector
    [0 | 1]
```

Where R is rotation matrix, t is translation vector.

### Rotation Representations

**Rotation Matrices**: 3×3 orthogonal matrices
**Euler Angles**: Roll, pitch, yaw (gimbal lock issue)
**Quaternions**: 4D representation, no singularities
**Axis-Angle**: Rotation axis + angle

```python
import numpy as np
from scipy.spatial.transform import Rotation

# Create rotation from Euler angles
r = Rotation.from_euler('xyz', [90, 0, 45], degrees=True)
rotation_matrix = r.as_matrix()

# Convert to quaternion
quaternion = r.as_quat()  # [x, y, z, w]

print(f"Quaternion: {quaternion}")
```

## Forward Kinematics

Calculate end-effector pose from joint angles.

### Denavit-Hartenberg (DH) Parameters

Standard method to describe robot geometry:

| Joint | a_i | α_i | d_i | θ_i |
|-------|--------|-------------|--------|-------------|
| 1 | 0 | 0 | d_1 | θ_1 (variable) |
| 2 | a_2 | 0 | 0 | θ_2 (variable) |

**Transformation Matrix**:
```text
T_i^(i-1) = [cos(θ_i)  -sin(θ_i)cos(α_i)   sin(θ_i)sin(α_i)   a_i·cos(θ_i)]
            [sin(θ_i)   cos(θ_i)cos(α_i)  -cos(θ_i)sin(α_i)   a_i·sin(θ_i)]
            [   0          sin(α_i)            cos(α_i)             d_i     ]
            [   0             0                    0                 1      ]
```

```python
def dh_matrix(a, alpha, d, theta):
    """Compute DH transformation matrix."""
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)

    return np.array([
        [ct, -st*ca, st*sa, a*ct],
        [st, ct*ca, -ct*sa, a*st],
        [0, sa, ca, d],
        [0, 0, 0, 1]
    ])

# Forward kinematics: multiply all transformations
def forward_kinematics(dh_params, joint_angles):
    T = np.eye(4)
    for (a, alpha, d), theta in zip(dh_params, joint_angles):
        T = T @ dh_matrix(a, alpha, d, theta)
    return T
```

## Inverse Kinematics (IK)

Calculate joint angles for desired end-effector pose.

### Challenges

- **Multiple solutions**: Different joint configurations reach same position
- **No solution**: Position outside workspace
- **Singularities**: Infinite solutions or velocity amplification

### Analytical IK

Closed-form solution (when possible):
- Fast computation
- All solutions enumerated
- Limited to simple geometries

### Numerical IK

Iterative optimization:

**Jacobian-based IK**:
```text
Δθ = J⁺(θ) · Δx
```

Where J⁺ is pseudoinverse of Jacobian.

```python
def jacobian_ik(current_joints, target_pose, max_iter=100):
    """Iterative IK using Jacobian pseudoinverse."""
    joints = current_joints.copy()

    for i in range(max_iter):
        # Compute current pose
        current_pose = forward_kinematics(joints)

        # Compute error
        error = target_pose - current_pose
        if np.linalg.norm(error) < 0.001:
            return joints  # Converged

        # Compute Jacobian
        J = compute_jacobian(joints)

        # Update joints
        delta_joints = np.linalg.pinv(J) @ error
        joints += 0.1 * delta_joints  # Step size 0.1

    return joints  # May not have converged
```

## Differential Kinematics

Relates joint velocities to end-effector velocity.

### Jacobian Matrix

```text
ẋ = J(θ) · θ̇
```

Where:
- ẋ: End-effector velocity (6D: linear + angular)
- J(θ): Jacobian matrix (6 × n for n joints)
- θ̇: Joint velocities

### Singularities

Configurations where Jacobian loses rank:
- Loss of mobility in certain directions
- Infinite joint velocities required
- Example: Fully extended or folded arm

## Workspace Analysis

The volume reachable by the end-effector:

**Reachable Workspace**: All points that can be reached
**Dexterous Workspace**: Points reachable with arbitrary orientation

```python
def compute_workspace(dh_params, num_samples=10000):
    """Monte Carlo sampling of workspace."""
    points = []

    for _ in range(num_samples):
        # Random joint angles
        joints = np.random.uniform(-np.pi, np.pi, len(dh_params))

        # Forward kinematics
        T = forward_kinematics(dh_params, joints)
        position = T[:3, 3]

        points.append(position)

    return np.array(points)
```

## Summary

Kinematics provides the mathematical foundation for robot motion planning and control. Forward kinematics determines where the robot is, while inverse kinematics determines how to get where you want to go. The Jacobian matrix connects joint space and task space, enabling velocity control and force analysis.

## Key Takeaways

- Homogeneous transformations represent pose in 3D
- DH parameters standardize robot description
- Forward kinematics: joints → pose (always solvable)
- Inverse kinematics: pose → joints (may have multiple or no solutions)
- Jacobian matrix relates joint and end-effector velocities
- Singularities are configurations with loss of mobility

---

**Next**: [Chapter 2: Robot Dynamics](./chapter2-dynamics.md)
