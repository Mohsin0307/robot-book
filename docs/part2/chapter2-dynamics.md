---
sidebar_position: 2
---

# Chapter 2: Robot Dynamics

## Introduction

While kinematics describes motion, dynamics explains the forces and torques that cause motion. Understanding dynamics is essential for control, trajectory planning, and simulating robot behavior.

## Equations of Motion

### Newton-Euler Formulation

Force-based approach:

```math
F = ma
```

```math
\tau = I\alpha
```

### Lagrangian Formulation

Energy-based approach using generalized coordinates:

```text
d/dt(∂L/∂q̇) - ∂L/∂q = τ
```

Where L is the Lagrangian (L = T - V, kinetic minus potential energy), q is joint position, q̇ is joint velocity, and τ is applied torque.

## Manipulator Dynamics

General form:

```math
M(q)\ddot{q} + C(q, \dot{q})\dot{q} + G(q) = \tau
```

Where:
- M(q): Inertia matrix (configuration-dependent mass)
- C(q, q̇): Coriolis and centrifugal terms
- G(q): Gravity terms
- τ: Joint torques
- q: Joint positions

```python
import numpy as np

class RobotDynamics:
    def __init__(self, mass, length):
        self.m = mass
        self.l = length
        self.g = 9.81

    def inertia_matrix(self, q):
        """Compute M(q) for 2-link planar arm."""
        q1, q2 = q
        m1, m2 = self.m
        l1, l2 = self.l

        M11 = (m1 + m2) * l1**2 + m2 * l2**2 + 2 * m2 * l1 * l2 * np.cos(q2)
        M12 = m2 * l2**2 + m2 * l1 * l2 * np.cos(q2)
        M22 = m2 * l2**2

        return np.array([[M11, M12], [M12, M22]])

    def coriolis_matrix(self, q, q_dot):
        """Compute C(q, q_dot)."""
        q2 = q[1]
        q1_dot, q2_dot = q_dot
        m2, l1, l2 = self.m[1], self.l[0], self.l[1]

        h = -m2 * l1 * l2 * np.sin(q2)
        C = np.array([
            [h * q2_dot, h * (q1_dot + q2_dot)],
            [-h * q1_dot, 0]
        ])
        return C

    def gravity_vector(self, q):
        """Compute G(q)."""
        q1, q2 = q
        m1, m2 = self.m
        l1, l2 = self.l
        g = self.g

        G1 = (m1 + m2) * g * l1 * np.cos(q1) + m2 * g * l2 * np.cos(q1 + q2)
        G2 = m2 * g * l2 * np.cos(q1 + q2)

        return np.array([G1, G2])

    def forward_dynamics(self, q, q_dot, tau):
        """Compute q_ddot given current state and torques."""
        M = self.inertia_matrix(q)
        C = self.coriolis_matrix(q, q_dot)
        G = self.gravity_vector(q)

        q_ddot = np.linalg.solve(M, tau - C @ q_dot - G)
        return q_ddot
```

## Control Strategies

### Computed Torque Control

Model-based control that linearizes the system:

```math
\tau = M(q)(\ddot{q}_d + K_v(\dot{q}_d - \dot{q}) + K_p(q_d - q)) + C(q,\dot{q})\dot{q} + G(q)
```

Requires accurate dynamic model.

### Impedance Control

Control the dynamic relationship between force and position:

```math
M_d(\ddot{x} - \ddot{x}_d) + D_d(\dot{x} - \dot{x}_d) + K_d(x - x_d) = F_{ext}
```

Allows compliant interaction with environment.

## Trajectory Planning

### Point-to-Point Motion

**Minimum Time**: Bang-bang control (max acceleration/deceleration)
**Minimum Jerk**: Smooth motion (comfortable for humans)

### Polynomial Trajectories

Cubic polynomial for position:

```math
q(t) = a_0 + a_1 t + a_2 t^2 + a_3 t^3
```

Quintic for smooth acceleration:

```math
q(t) = a_0 + a_1 t + a_2 t^2 + a_3 t^3 + a_4 t^4 + a_5 t^5
```

```python
def quintic_trajectory(q0, qf, v0, vf, a0, af, T, t):
    """
    Quintic polynomial trajectory.

    q0, qf: Start/end positions
    v0, vf: Start/end velocities
    a0, af: Start/end accelerations
    T: Total time
    t: Current time
    """
    # Solve for coefficients
    A = np.array([
        [1, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0],
        [1, T, T**2, T**3, T**4, T**5],
        [0, 1, 2*T, 3*T**2, 4*T**3, 5*T**4],
        [0, 0, 2, 6*T, 12*T**2, 20*T**3]
    ])
    b = np.array([q0, v0, a0, qf, vf, af])
    coeffs = np.linalg.solve(A, b)

    # Evaluate at time t
    q = sum(coeffs[i] * t**i for i in range(6))
    q_dot = sum(i * coeffs[i] * t**(i-1) for i in range(1, 6))
    q_ddot = sum(i * (i-1) * coeffs[i] * t**(i-2) for i in range(2, 6))

    return q, q_dot, q_ddot
```

## Summary

Dynamics connects forces to motion, enabling accurate control and realistic simulation. The manipulator equation provides a systematic framework for deriving robot dynamics, which can be used for model-based control strategies like computed torque control.

## Key Takeaways

- Dynamics explains how forces create motion
- Manipulator equation: M(q)q̈ + C(q,q̇)q̇ + G(q) = τ
- Model-based control uses dynamics for better performance
- Trajectory planning generates smooth reference motions
- Impedance control enables compliant physical interaction

---

**Next**: [Chapter 3: Control Systems](./chapter3-control-systems.md)
