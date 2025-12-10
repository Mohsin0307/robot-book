# Project 4: Deploying a Vision-Language-Action Model

## Project Overview

Deploy a pre-trained VLA model (RT-2, OpenVLA) on a real robot for instruction-following manipulation tasks.

## Prerequisites

- Robotic arm with camera (e.g., Franka Emika, UR5)
- Workstation with GPU (NVIDIA RTX 3080+ recommended)
- Pre-trained VLA checkpoint

## System Architecture

```
[Camera] → [VLA Model] → [Robot Controller]
   ↑            ↓              ↓
[Instruction] [Actions]  [Joint Commands]
```

## Phase 1: Model Deployment

### Loading Pre-trained VLA

```python
import torch
from transformers import AutoModel, AutoProcessor

class VLADeployment:
    def __init__(self, model_name="openvla/openvla-7b"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Load model and processor
        self.model = AutoModel.from_pretrained(
            model_name,
            trust_remote_code=True
        ).to(self.device)

        self.processor = AutoProcessor.from_pretrained(
            model_name,
            trust_remote_code=True
        )

        self.model.eval()  # Inference mode

    @torch.no_grad()
    def predict_action(self, image, instruction, robot_state):
        """Predict robot action from observations"""

        # Prepare inputs
        inputs = self.processor(
            images=image,
            text=instruction,
            robot_state=robot_state,
            return_tensors="pt"
        ).to(self.device)

        # Forward pass
        outputs = self.model(**inputs)

        # Extract actions (7-DOF: 6 joint velocities + gripper)
        actions = outputs.actions[0].cpu().numpy()

        return actions
```

### Action Space Normalization

```python
class ActionNormalizer:
    def __init__(self, action_stats):
        """action_stats: dict with 'mean' and 'std' for each action dim"""
        self.mean = np.array(action_stats['mean'])
        self.std = np.array(action_stats['std'])

    def normalize(self, actions):
        """Normalize actions to [-1, 1]"""
        return (actions - self.mean) / (self.std + 1e-8)

    def denormalize(self, normalized_actions):
        """Convert normalized actions back to robot units"""
        return normalized_actions * self.std + self.mean
```

## Phase 2: Robot Interface

### Real Robot Control

```python
import rospy
from sensor_msgs.msg import JointState
from geometry_msgs.msg import Twist

class RobotInterface:
    def __init__(self, robot_type="franka"):
        self.robot_type = robot_type

        # ROS setup
        rospy.init_node('vla_controller')

        # Joint state subscriber
        self.joint_states = None
        rospy.Subscriber('/joint_states', JointState, self.joint_state_callback)

        # Control publisher
        self.cmd_pub = rospy.Publisher('/joint_velocity_controller/command',
                                      JointState, queue_size=1)

        # Gripper control
        self.gripper_pub = rospy.Publisher('/gripper/command', Twist, queue_size=1)

    def joint_state_callback(self, msg):
        """Update current joint states"""
        self.joint_states = msg

    def execute_action(self, action):
        """Execute VLA output on robot"""
        # Action format: [joint_vel_1, ..., joint_vel_6, gripper]
        joint_velocities = action[:6]
        gripper_command = action[6]

        # Send joint velocities
        cmd = JointState()
        cmd.velocity = joint_velocities
        self.cmd_pub.publish(cmd)

        # Send gripper command
        gripper_msg = Twist()
        gripper_msg.linear.x = gripper_command
        self.gripper_pub.publish(gripper_msg)

    def get_robot_state(self):
        """Get current robot state for VLA input"""
        if self.joint_states is None:
            return np.zeros(7)  # Default

        state = np.array(self.joint_states.position)
        return state
```

### Safety Monitoring

```python
class SafetyMonitor:
    def __init__(self, robot):
        self.robot = robot
        self.joint_limits = robot.get_joint_limits()
        self.velocity_limits = robot.get_velocity_limits()
        self.workspace_bounds = np.array([
            [-0.5, 0.5],  # x range
            [-0.5, 0.5],  # y range
            [0.0, 0.8]     # z range
        ])

    def check_safety(self, action):
        """Verify action is safe to execute"""

        # 1. Check joint limits
        predicted_joints = self.robot.get_joints() + action[:6] * dt
        if not self.within_joint_limits(predicted_joints):
            return False, "Joint limit violation"

        # 2. Check velocity limits
        if np.any(np.abs(action[:6]) > self.velocity_limits):
            return False, "Velocity limit violation"

        # 3. Check workspace bounds
        predicted_ee_pos = self.robot.forward_kinematics(predicted_joints)
        if not self.within_workspace(predicted_ee_pos):
            return False, "Workspace violation"

        # 4. Check collision (simplified)
        if self.robot.check_self_collision(predicted_joints):
            return False, "Self-collision detected"

        return True, "Safe"

    def within_joint_limits(self, joints):
        return np.all((joints >= self.joint_limits[:, 0]) &
                     (joints <= self.joint_limits[:, 1]))

    def within_workspace(self, position):
        return np.all((position >= self.workspace_bounds[:, 0]) &
                     (position <= self.workspace_bounds[:, 1]))
```

## Phase 3: Closed-Loop Control

### Main Control Loop

```python
class VLAController:
    def __init__(self):
        self.vla = VLADeployment()
        self.robot = RobotInterface()
        self.safety = SafetyMonitor(self.robot)
        self.normalizer = ActionNormalizer(action_stats)

        # Control parameters
        self.control_hz = 10  # 10 Hz control loop
        self.action_horizon = 10  # Predict 10 steps ahead

    def execute_instruction(self, instruction, max_steps=100):
        """Execute language instruction using VLA"""

        print(f"Executing: {instruction}")

        for step in range(max_steps):
            # Get observations
            image = self.robot.get_camera_image()
            robot_state = self.robot.get_robot_state()

            # Predict action
            action_normalized = self.vla.predict_action(
                image, instruction, robot_state
            )

            # Denormalize
            action = self.normalizer.denormalize(action_normalized)

            # Safety check
            is_safe, message = self.safety.check_safety(action)

            if not is_safe:
                print(f"Safety violation: {message}")
                self.robot.stop()
                return False

            # Execute action
            self.robot.execute_action(action)

            # Check task completion (heuristic)
            if self.task_completed(instruction, image):
                print("Task completed!")
                return True

            # Control rate
            rospy.sleep(1.0 / self.control_hz)

        print("Max steps reached without completion")
        return False

    def task_completed(self, instruction, current_image):
        """Heuristic to check if task is done"""
        # Use CLIP or similar for task completion detection
        completion_texts = [
            f"A robot that has finished: {instruction}",
            f"A robot in the middle of: {instruction}"
        ]

        scores = []
        for text in completion_texts:
            score = self.vla.processor.compute_similarity(current_image, text)
            scores.append(score)

        # If "finished" score higher, task likely complete
        return scores[0] > scores[1] + 0.1  # Threshold
```

## Phase 4: Fine-Tuning for Your Robot

### Data Collection

```python
class DemonstrationCollector:
    def __init__(self, robot):
        self.robot = robot
        self.demonstrations = []

    def record_demonstration(self, instruction):
        """Record human demonstration"""
        print(f"Recording demonstration for: {instruction}")
        print("Press ENTER when ready...")
        input()

        trajectory = []

        print("Recording... (Press Ctrl+C to stop)")
        try:
            while True:
                # Capture data
                image = self.robot.get_camera_image()
                state = self.robot.get_robot_state()
                action = self.robot.get_executed_action()  # From teleop

                trajectory.append({
                    'image': image,
                    'state': state,
                    'action': action,
                    'instruction': instruction
                })

                rospy.sleep(0.1)  # 10 Hz

        except KeyboardInterrupt:
            pass

        self.demonstrations.append({
            'instruction': instruction,
            'trajectory': trajectory
        })

        print(f"Recorded {len(trajectory)} timesteps")

    def save_dataset(self, filename):
        """Save demonstrations for fine-tuning"""
        import pickle
        with open(filename, 'wb') as f:
            pickle.dump(self.demonstrations, f)
```

### Fine-Tuning Script

```python
def fine_tune_vla(model, demonstrations, num_epochs=10):
    """Fine-tune VLA on robot-specific demonstrations"""

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)
    criterion = nn.MSELoss()

    for epoch in range(num_epochs):
        total_loss = 0

        for demo in demonstrations:
            for t, step in enumerate(demo['trajectory']):
                # Forward pass
                pred_action = model(
                    images=step['image'],
                    text=demo['instruction'],
                    robot_state=step['state']
                )

                # Loss
                loss = criterion(pred_action, step['action'])

                # Backward
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {total_loss/len(demonstrations):.4f}")

    return model
```

## Phase 5: Evaluation and Benchmarking

### Task Suite

```python
BENCHMARK_TASKS = [
    "Pick up the red cube",
    "Place the object in the box",
    "Open the drawer",
    "Pour water into the cup",
    "Stack the blocks"
]

def evaluate_vla(controller, tasks, num_trials=10):
    """Evaluate VLA on benchmark tasks"""

    results = []

    for task in tasks:
        successes = 0

        for trial in range(num_trials):
            print(f"Trial {trial+1}/{num_trials}: {task}")

            # Reset environment
            reset_scene()

            # Execute
            success = controller.execute_instruction(task)

            if success:
                successes += 1

        success_rate = successes / num_trials
        results.append({
            'task': task,
            'success_rate': success_rate
        })

        print(f"{task}: {success_rate*100:.1f}% success\n")

    return results
```

## Summary

This project demonstrates end-to-end deployment of a VLA model on a real robot, including safety monitoring, closed-loop control, and fine-tuning for robot-specific tasks.

## Extensions

1. Multi-modal fusion (tactile + vision)
2. Long-horizon task planning
3. Failure recovery strategies
4. Sim-to-real transfer

## Further Reading

- Brohan et al. - "RT-2: Vision-Language-Action Models"
- Kim et al. - "OpenVLA: An Open-Source Vision-Language-Action Model"
- Ahn et al. - "Do As I Can, Not As I Say"
