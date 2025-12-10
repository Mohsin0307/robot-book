---
sidebar_position: 1
---

# Chapter 1: Bipedal Locomotion

## Introduction

Walking on two legs is remarkably challenging—it requires dynamic balance, coordinated movement of many joints, and continuous adaptation to terrain. This chapter explores the principles and control strategies for humanoid robot locomotion.

## The Challenge of Bipedal Walking

### Why Walking is Hard

1. **Underactuated System**: Cannot directly control center of mass
2. **Hybrid Dynamics**: Discrete events (foot contact) + continuous dynamics
3. **High-Dimensional**: 12+ DOF in legs alone
4. **Energy Efficiency**: Maintaining balance costs energy

### Gait Phases

**Stance Phase**: Foot on ground, supporting body weight
**Swing Phase**: Foot moving through air to next step
**Double Support**: Both feet on ground (brief overlap)

## Static vs. Dynamic Walking

### Static Walking

Center of Mass (CoM) always over support polygon:
- Slow but stable
- No risk of falling
- Used in early humanoid robots

### Dynamic Walking

CoM can leave support polygon:
- Faster, more natural gait
- Uses momentum and gravity
- Requires active balance control

## Zero Moment Point (ZMP)

A key concept for bipedal stability.

### Definition

ZMP is the point on the ground where the net moment from ground reaction forces is zero.

**Stability Criterion**:
```text
If ZMP stays inside support polygon → No tipping
```

```python
def compute_zmp(com_pos, com_acc, height, g=9.81):
    """
    Compute ZMP position.

    com_pos: Center of mass position [x, y, z]
    com_acc: Center of mass acceleration [ax, ay, az]
    height: CoM height above ground
    g: Gravity acceleration
    """
    x_com, y_com, z_com = com_pos
    ax, ay, az = com_acc

    # ZMP equations
    x_zmp = x_com - (z_com / (az + g)) * ax
    y_zmp = y_com - (z_com / (az + g)) * ay

    return np.array([x_zmp, y_zmp])

def is_stable(zmp, support_polygon):
    """Check if ZMP is inside support polygon."""
    from shapely.geometry import Point, Polygon

    zmp_point = Point(zmp[0], zmp[1])
    polygon = Polygon(support_polygon)

    return polygon.contains(zmp_point)
```

## Walking Pattern Generation

### Preview Control

Predict future ZMP and adjust CoM trajectory:

```text
u* = argmin Σ(i=1 to N) ||p_zmp(k+i) - p_ref(k+i)||²
```

This minimizes the difference between predicted ZMP and reference ZMP over the horizon N.

### Capture Point

Point where robot should step to come to a stop:
```text
ξ = p + ṗ/ω₀
```

Where ω₀ = √(g/h) is natural frequency, p is position, and ṗ is velocity.

### Linear Inverted Pendulum Model (LIPM)

Simplified walking model:

```text
ẍ = ω₀² (x - x_zmp)
```

Where ẍ is CoM acceleration, ω₀ is natural frequency, x is CoM position, and x_zmp is ZMP position. Allows analytical trajectory generation.

```python
class LIPM:
    def __init__(self, height, g=9.81):
        self.h = height
        self.g = g
        self.omega = np.sqrt(g / height)

    def step_dynamics(self, x, x_dot, x_zmp, dt):
        """
        Simulate one step of LIPM.

        x: CoM position
        x_dot: CoM velocity
        x_zmp: Desired ZMP position
        dt: Time step
        """
        x_ddot = self.omega**2 * (x - x_zmp)

        # Euler integration
        x_dot_new = x_dot + x_ddot * dt
        x_new = x + x_dot_new * dt

        return x_new, x_dot_new
```

## Whole-Body Control

Coordinating all joints for locomotion.

### Hierarchical Quadratic Programming (HQP)

Prioritized objectives:
1. **High priority**: Balance (ZMP/CoM control)
2. **Medium priority**: Foot placement
3. **Low priority**: Posture regularization

### Model Predictive Control (MPC)

Optimize future trajectory over a horizon:

```python
def mpc_gait_control(current_state, horizon=10):
    """
    MPC for gait generation.

    Optimizes foot placement and CoM trajectory.
    """
    # Decision variables: foot positions, CoM trajectory
    # Cost function: track reference + smooth motion + energy
    # Constraints: stability (ZMP), joint limits, collision avoidance

    # ... solve optimization problem ...

    return optimal_controls
```

## Terrain Adaptation

### Foot Placement Planning

Selecting where to step based on terrain:
- Flat regions preferred
- Avoid obstacles and slopes
- Maximize stability margin

### Compliance Control

Absorbing impacts and adapting to uneven ground:
- Virtual damping in leg joints
- Force feedback from foot sensors

## Push Recovery

Responding to external disturbances:

### Ankle Strategy

Small disturbances: Adjust ankle torque
- Fast response
- Limited range

### Hip Strategy

Moderate disturbances: Swing hips
- Larger forces
- Maintains foot position

### Stepping Strategy

Large disturbances: Take a recovery step
- Highest robustness
- Changes foot position

```python
def select_recovery_strategy(com_error, com_velocity):
    """
    Choose appropriate balance recovery strategy.

    com_error: Deviation from desired CoM position
    com_velocity: CoM velocity
    """
    # Compute "fall risk" metric
    risk = np.linalg.norm(com_error) + 0.5 * np.linalg.norm(com_velocity)

    if risk < 0.05:
        return "ankle"  # Small correction
    elif risk < 0.15:
        return "hip"  # Moderate correction
    else:
        return "step"  # Need to take a step
```

## Running and Dynamic Gaits

Beyond walking:

**Running**: Flight phase (both feet off ground)
**Hopping**: Continuous flight phases
**Bounding**: Quadruped-like gait

Requires:
- Higher joint torques
- Faster control loops (>500 Hz)
- Impact absorption

## Summary

Bipedal locomotion combines gait planning, balance control, and whole-body coordination. The ZMP criterion provides a practical stability measure, while modern control methods like MPC enable dynamic, adaptive walking. Push recovery strategies ensure robustness to disturbances.

## Key Takeaways

- Bipedal walking is an underactuated, hybrid dynamical system
- ZMP must stay within support polygon for stability
- Preview control generates stable walking trajectories
- Whole-body control coordinates all joints
- Recovery strategies (ankle/hip/step) handle disturbances
- Terrain adaptation requires perception and compliant control

---

**Next**: [Chapter 3: Manipulation and Grasping](./chapter3-manipulation-grasping.md)
