# Project 3: Humanoid Walking Controller

## Project Overview

Implement a complete walking controller for a humanoid robot using ZMP-based pattern generation and whole-body control.

## Hardware/Simulation Setup

- Humanoid robot (real or simulated in Gazebo/Isaac Sim)
- IMU for orientation feedback
- Force-torque sensors in feet
- Position/torque-controlled joints

## Software Architecture

```python
# System components
class WalkingController:
    def __init__(self):
        self.pattern_generator = ZMPPatternGenerator()
        self.whole_body_controller = WholeBodyController()
        self.state_estimator = StateEstimator()
        self.stabilizer = BalanceStabilizer()
```

## Phase 1: Foot

step Pattern Generation

### Footstep Planner

```python
class FootstepPlanner:
    def __init__(self, step_length=0.2, step_width=0.15):
        self.step_length = step_length
        self.step_width = step_width

    def plan_footsteps(self, goal_position, current_pose):
        """Generate footstep sequence to goal"""
        footsteps = []

        current_pos = current_pose[:2]
        distance_remaining = np.linalg.norm(goal_position[:2] - current_pos)

        # Alternating feet
        support_foot = "right"  # Start with right support

        while distance_remaining > 0.1:  # Threshold
            # Compute next step
            direction = (goal_position[:2] - current_pos) / distance_remaining
            step = {
                'foot': support_foot,
                'position': current_pos + direction * self.step_length,
                'orientation': np.arctan2(direction[1], direction[0])
            }

            footsteps.append(step)

            # Update
            current_pos = step['position']
            distance_remaining = np.linalg.norm(goal_position[:2] - current_pos)
            support_foot = "left" if support_foot == "right" else "right"

        return footsteps
```

### ZMP Trajectory Generation

```python
class ZMPPatternGenerator:
    def __init__(self, com_height=0.8, step_time=0.8):
        self.h = com_height
        self.T_step = step_time
        self.T_ds = 0.1  # Double support time

    def generate_zmp_trajectory(self, footsteps):
        """Generate ZMP reference for footstep plan"""
        zmp_trajectory = []
        time_stamps = []
        t = 0

        for i, step in enumerate(footsteps):
            # Single support: ZMP at support foot
            if i > 0:
                support_foot_pos = footsteps[i-1]['position']
                zmp_trajectory.append(support_foot_pos)
                time_stamps.append(t)
                t += self.T_step

            # Double support: ZMP transitions between feet
            if i < len(footsteps) - 1:
                next_foot_pos = step['position']
                # Linear interpolation during double support
                for alpha in np.linspace(0, 1, 5):
                    zmp_pos = ((1 - alpha) * support_foot_pos +
                              alpha * next_foot_pos)
                    zmp_trajectory.append(zmp_pos)
                    time_stamps.append(t)
                    t += self.T_ds / 5

        return np.array(zmp_trajectory), np.array(time_stamps)
```

### COM Trajectory from ZMP

```python
def generate_com_trajectory(zmp_ref, time_stamps, com_height):
    """Compute COM trajectory using preview control"""
    omega = np.sqrt(9.81 / com_height)

    # Preview control gains (precomputed)
    Gp, Gi, Gx = compute_preview_gains(omega, time_stamps[1] - time_stamps[0])

    com_trajectory = []
    com_vel_trajectory = []
    com_state = np.zeros(2)

    for i in range(len(zmp_ref)):
        # Future ZMP preview
        zmp_future = zmp_ref[i:min(i+preview_window, len(zmp_ref))]

        # Control input
        u = -Gi * np.sum(com_state - zmp_ref[i]) - Gp @ (com_state - zmp_future)

        # Update COM state
        com_state += omega**2 * u * dt
        com_vel = omega * u

        com_trajectory.append(com_state.copy())
        com_vel_trajectory.append(com_vel)

    return np.array(com_trajectory), np.array(com_vel_trajectory)
```

## Phase 2: Whole-Body Inverse Kinematics

### Task-Based IK

```python
class WholeBodyIK:
    def __init__(self, robot):
        self.robot = robot

    def solve(self, tasks, q_init):
        """Solve hierarchical IK for multiple tasks"""
        q = q_init.copy()

        for iteration in range(max_iterations):
            # Compute task errors
            errors = [task.error(q) for task in tasks]

            if all(np.linalg.norm(e) < tolerance for e in errors):
                break  # Converged

            # Hierarchical least squares
            dq = self.hierarchical_ik_step(tasks, q)

            # Update configuration
            q += learning_rate * dq

        return q

    def hierarchical_ik_step(self, tasks, q):
        """One step of hierarchical IK"""
        dq = np.zeros(len(q))
        null_space_proj = np.eye(len(q))

        for task in tasks:
            J = task.jacobian(q)
            error = task.error(q)

            # Project into null space of higher-priority tasks
            J_proj = J @ null_space_proj

            # Pseudo-inverse solution
            dq_task = np.linalg.pinv(J_proj) @ error

            dq += null_space_proj @ dq_task

            # Update null space projector
            null_space_proj = null_space_proj @ (np.eye(len(q)) -
                                                np.linalg.pinv(J_proj) @ J_proj)

        return dq
```

### Walking IK Tasks

```python
def setup_walking_tasks(com_desired, left_foot_desired, right_foot_desired, support_phase):
    """Define IK tasks for walking"""
    tasks = []

    # Task 1 (highest priority): Support foot must stay fixed
    if support_phase == "right":
        tasks.append(FootPoseTask(right_foot_desired, foot="right", weight=1000))
    else:
        tasks.append(FootPoseTask(left_foot_desired, foot="left", weight=1000))

    # Task 2: COM position
    tasks.append(COMTask(com_desired, weight=100))

    # Task 3: Swing foot position
    if support_phase == "right":
        tasks.append(FootPoseTask(left_foot_desired, foot="left", weight=10))
    else:
        tasks.append(FootPoseTask(right_foot_desired, foot="right", weight=10))

    # Task 4 (lowest priority): Posture regularization
    tasks.append(PostureTask(q_nominal, weight=1))

    return tasks
```

## Phase 3: Balance Stabilization

### Online ZMP Feedback

```python
class BalanceStabilizer:
    def __init__(self, com_height):
        self.kp_com = 50  # COM position gain
        self.kd_com = 10  # COM velocity gain
        self.omega = np.sqrt(9.81 / com_height)

    def stabilize(self, zmp_measured, zmp_desired, com_state, com_desired):
        """Compute stabilization adjustment"""

        # ZMP error
        zmp_error = zmp_measured - zmp_desired

        # COM adjustment using capture point
        com_adjustment = -zmp_error / self.omega**2

        # PD control on COM
        com_pos, com_vel = com_state
        com_pos_desired, com_vel_desired = com_desired

        com_correction = (self.kp_com * (com_pos_desired + com_adjustment - com_pos) +
                         self.kd_com * (com_vel_desired - com_vel))

        return com_correction
```

### Ankle Strategy for Stabilization

```python
def ankle_torque_stabilization(zmp_error, foot_contact_points):
    """Compute ankle torques to adjust ZMP"""

    # Map ZMP error to required moment
    required_moment = np.cross(zmp_error, [0, 0, robot_weight * 9.81])

    # Distribute moment to ankle joints
    tau_ankle_x = required_moment[0] / 2  # Split between feet
    tau_ankle_y = required_moment[1] / 2

    return np.array([tau_ankle_x, tau_ankle_y])
```

## Phase 4: Integration and Testing

### Complete Walking Controller

```python
class HumanoidWalkingSystem:
    def __init__(self, robot):
        self.robot = robot
        self.footstep_planner = FootstepPlanner()
        self.pattern_generator = ZMPPatternGenerator()
        self.ik_solver = WholeBodyIK(robot)
        self.stabilizer = BalanceStabilizer(com_height=0.8)

    def walk_to_goal(self, goal_position):
        """Execute walking motion to goal"""

        # 1. Plan footsteps
        current_pose = self.robot.get_base_pose()
        footsteps = self.footstep_planner.plan_footsteps(goal_position, current_pose)

        # 2. Generate trajectories
        zmp_ref, time_stamps = self.pattern_generator.generate_zmp_trajectory(footsteps)
        com_traj, com_vel_traj = generate_com_trajectory(zmp_ref, time_stamps, com_height=0.8)

        # 3. Execute trajectory
        for t, (com_desired, zmp_desired) in enumerate(zip(com_traj, zmp_ref)):
            # Get feedback
            zmp_measured = self.robot.measure_zmp()
            com_state = self.robot.get_com_state()

            # Stabilization
            com_correction = self.stabilizer.stabilize(
                zmp_measured, zmp_desired, com_state, (com_desired, com_vel_traj[t])
            )

            # IK
            left_foot_des, right_foot_des = self.compute_foot_poses(t, footsteps)
            tasks = setup_walking_tasks(
                com_desired + com_correction,
                left_foot_des,
                right_foot_des,
                self.get_support_phase(t)
            )

            q_desired = self.ik_solver.solve(tasks, self.robot.get_joint_positions())

            # Send commands
            self.robot.set_joint_positions(q_desired)

            # Wait for next control cycle
            time.sleep(dt)
```

## Evaluation

- **Stability**: Measure ZMP deviation from support polygon
- **Tracking**: COM trajectory tracking error
- **Efficiency**: Energy consumption per meter walked
- **Robustness**: Push recovery success rate

## Extensions

1. Adaptive step length based on terrain
2. Online footstep replanning
3. Rough terrain walking
4. Stair climbing

## Summary

This project implements a complete humanoid walking controller, integrating pattern generation, whole-body IK, and stabilization for robust bipedal locomotion.
