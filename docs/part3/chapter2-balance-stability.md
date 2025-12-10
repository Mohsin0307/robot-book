# Chapter 2: Balance and Stability Control

## Introduction

Maintaining balance is one of the most challenging aspects of humanoid robotics. This chapter explores stability criteria, balance control strategies, and practical implementations.

## Static vs. Dynamic Stability

### Static Stability

A robot is statically stable if its center of mass (COM) projection falls within the support polygon:

```python
def is_statically_stable(com, support_polygon):
    """Check if COM is inside support polygon"""
    from shapely.geometry import Point, Polygon

    com_point = Point(com[0], com[1])
    polygon = Polygon(support_polygon)

    return polygon.contains(com_point)
```

### Support Polygon

The support polygon is the convex hull of all contact points:

```python
import numpy as np
from scipy.spatial import ConvexHull

def compute_support_polygon(contact_points):
    """Compute convex hull of foot contact points"""
    if len(contact_points) < 3:
        return contact_points

    hull = ConvexHull(contact_points[:, :2])  # 2D projection
    return contact_points[hull.vertices]
```

## Zero Moment Point (ZMP)

### ZMP Theory

The ZMP is the point on the ground where the net moment is zero. For dynamic stability:

```text
p_ZMP = (sum of mass * acceleration * moment arms) / (sum of vertical forces)
```

Where masses, accelerations (including gravity), and positions of all body segments are considered.

```python
class ZMPCalculator:
    def __init__(self, robot_model):
        self.robot = robot_model
        self.g = 9.81  # gravity

    def compute_zmp(self, joint_positions, joint_velocities, joint_accelerations):
        """Calculate ZMP from robot state"""
        total_moment = np.zeros(3)
        total_force = 0

        for link in self.robot.links:
            mass = link.mass
            pos = link.position(joint_positions)
            acc = link.acceleration(joint_positions, joint_velocities,
                                   joint_accelerations)

            force = mass * (acc + np.array([0, 0, self.g]))
            moment = np.cross(pos, force)

            total_moment += moment
            total_force += force[2]

        # ZMP x and y coordinates
        zmp_x = -total_moment[1] / total_force
        zmp_y = total_moment[0] / total_force

        return np.array([zmp_x, zmp_y, 0])
```

### ZMP-Based Walking

Generate walking patterns that keep ZMP inside support polygon:

```python
def zmp_based_walk_pattern(step_length, step_time, com_height):
    """Generate COM trajectory for stable walking"""
    # Preview control for ZMP tracking
    preview_controller = PreviewController(com_height)

    # Desired ZMP trajectory
    zmp_ref = generate_zmp_reference(step_length, step_time)

    # Compute COM trajectory
    com_trajectory = preview_controller.compute_com_trajectory(zmp_ref)

    return com_trajectory, zmp_ref
```

## Center of Mass Control

### COM Jacobian

Relate joint velocities to COM velocity:

```text
ṙ_COM = J_COM(q) · q̇
```

Where ṙ_COM is the COM velocity vector, J_COM is the COM Jacobian matrix, and q̇ is joint velocities.

```python
def compute_com_jacobian(robot, q):
    """Compute COM Jacobian"""
    total_mass = sum(link.mass for link in robot.links)
    J_com = np.zeros((3, len(q)))

    for link in robot.links:
        J_link = robot.compute_jacobian(link, q)
        J_com += (link.mass / total_mass) * J_link

    return J_com
```

### COM Trajectory Tracking

```python
class COMController:
    def __init__(self, robot, kp=100, kd=20):
        self.robot = robot
        self.kp = kp
        self.kd = kd

    def compute_torques(self, q, q_dot, com_desired, com_dot_desired):
        """Compute joint torques to track COM trajectory"""
        # Current COM state
        com_current = self.robot.center_of_mass(q)
        J_com = compute_com_jacobian(self.robot, q)
        com_dot_current = J_com @ q_dot

        # COM error
        com_error = com_desired - com_current
        com_dot_error = com_dot_desired - com_dot_current

        # Desired COM acceleration (PD control)
        com_ddot_desired = self.kp * com_error + self.kd * com_dot_error

        # Map to joint space
        tau = J_com.T @ com_ddot_desired

        return tau
```

## Capture Point and Divergent Component of Motion

### Capture Point Theory

The capture point is where the robot must step to come to a complete stop:

```text
r_CP = r_COM + (1/ω) · ṙ_COM
```

where ω = √(g/h) is the natural frequency, r_COM is COM position, and ṙ_COM is COM velocity.

```python
def compute_capture_point(com_pos, com_vel, com_height):
    """Calculate instantaneous capture point"""
    omega = np.sqrt(9.81 / com_height)
    capture_point = com_pos + com_vel / omega
    return capture_point
```

### Capture Point Control

```python
class CapturePointController:
    def __init__(self, com_height):
        self.omega = np.sqrt(9.81 / com_height)

    def compute_desired_com_velocity(self, com_pos, desired_cp, dt):
        """Control law to track desired capture point"""
        current_cp = com_pos  # Simplified: assume com_vel = 0

        # Proportional control
        cp_error = desired_cp - current_cp
        com_vel_desired = self.omega * cp_error

        return com_vel_desired
```

## Ankle and Hip Strategies

### Ankle Strategy

For small disturbances, use ankle torque:

```python
def ankle_strategy(com_error, com_dot_error):
    """Generate ankle torque for balance"""
    kp_ankle = 500  # N·m/m
    kd_ankle = 50   # N·m·s/m

    tau_ankle = kp_ankle * com_error[0] + kd_ankle * com_dot_error[0]
    return np.clip(tau_ankle, -max_ankle_torque, max_ankle_torque)
```

### Hip Strategy

For larger disturbances, move the hip:

```python
def hip_strategy(com_error):
    """Generate hip motion for balance recovery"""
    # Move hip opposite to COM error
    hip_displacement = -2.0 * com_error[0]
    return hip_displacement
```

### Stepping Strategy

For very large disturbances, take a step:

```python
def should_take_step(com_pos, com_vel, support_polygon):
    """Decide if stepping is necessary"""
    capture_point = compute_capture_point(com_pos, com_vel, com_height)

    # Check if capture point is outside support polygon
    if not is_inside_polygon(capture_point, support_polygon):
        return True, compute_step_location(capture_point)

    return False, None
```

## Push Recovery

### Detecting Disturbances

```python
class PushDetector:
    def __init__(self, threshold=50):  # Newtons
        self.threshold = threshold

    def detect(self, force_torque_sensor):
        """Detect external forces"""
        force = np.linalg.norm(force_torque_sensor.force[:2])

        if force > self.threshold:
            return True, force_torque_sensor.force

        return False, None
```

### Recovery Actions

```python
def push_recovery(robot_state, external_force):
    """Generate recovery motion"""
    # Estimate disturbance effect on COM
    com_acceleration = external_force / robot_state.total_mass

    # Predict COM velocity after dt
    predicted_com_vel = robot_state.com_vel + com_acceleration * dt

    # Compute required step location
    capture_point = compute_capture_point(
        robot_state.com_pos,
        predicted_com_vel,
        robot_state.com_height
    )

    # Plan step to capture point
    return plan_recovery_step(capture_point, robot_state.support_foot)
```

## Practical Implementation

### State Machine for Balance

```python
class BalanceController:
    def __init__(self):
        self.state = "DOUBLE_SUPPORT"
        self.ankle_controller = AnkleController()
        self.hip_controller = HipController()
        self.step_planner = StepPlanner()

    def update(self, robot_state, dt):
        """Balance control state machine"""
        com_error = robot_state.desired_com - robot_state.current_com

        if np.linalg.norm(com_error) < small_threshold:
            # Use ankle strategy
            return self.ankle_controller.control(com_error)

        elif np.linalg.norm(com_error) < medium_threshold:
            # Use hip strategy
            return self.hip_controller.control(com_error)

        else:
            # Plan recovery step
            return self.step_planner.plan_step(robot_state)
```

## Summary

Balance control is critical for humanoid robots. ZMP, capture point, and multi-strategy approaches enable robust stability in dynamic environments.

## Exercises

1. Implement ZMP calculation for a planar biped
2. Design a capture point controller
3. Compare ankle vs. hip strategies experimentally
4. Simulate push recovery

## Further Reading

- Vukobratović & Borovac - "Zero-Moment Point — Thirty Five Years of its Life"
- Pratt et al. - "Capture Point: A Step toward Humanoid Push Recovery"
- Kajita et al. - "Biped Walking Pattern Generation using Preview Control"
