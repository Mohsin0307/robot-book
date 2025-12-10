---
sidebar_position: 4
---

# Chapter 4: Computing and Control Architecture

## Introduction

A robot's computing system is its brain—processing sensor data, running control algorithms, making decisions, and commanding actuators. This chapter covers the hardware, software, and architectural patterns that enable real-time robotic control.

## Computing Hardware

### Onboard Computers

**Single Board Computers (SBCs)**:
- Raspberry Pi 4: Quad-core ARM, 8GB RAM, \$75
- NVIDIA Jetson Nano/Orin: GPU acceleration for AI, \$99-\$499
- Intel NUC: x86 platform, higher performance, \$300-\$1000

**Microcontrollers**:
- Arduino: Simple, real-time control
- STM32: More powerful ARM Cortex-M series
- ESP32: Built-in WiFi/Bluetooth, low cost

**Embedded GPUs**:
- Critical for vision processing and deep learning
- NVIDIA Jetson series dominates robotics applications

### Distributed Computing

Many robots use layered architecture:
- **Low-level**: Microcontroller for motor control (hard real-time)
- **Mid-level**: SBC for sensor processing and state estimation
- **High-level**: Powerful computer or cloud for planning and learning

## Real-Time Operating Systems

### Linux (Non-Real-Time)

Standard Linux is not real-time but widely used:
- ROS (Robot Operating System) runs on Ubuntu
- Rich software ecosystem
- Soft real-time possible with proper configuration

### Real-Time Extensions

**RT-PREEMPT**:
- Linux kernel patch for preemptive scheduling
- Reduces worst-case latency to &lt;100μs

**Xenomai**:
- Dual-kernel approach (Linux + real-time co-kernel)
- Deterministic timing for critical tasks

### RTOS

Dedicated real-time operating systems:
- FreeRTOS: Popular for microcontrollers
- QNX: Commercial RTOS (used in automotive)
- VxWorks: Industrial and aerospace applications

## Robot Operating System (ROS)

The de facto standard middleware for robotics:

### Core Concepts

**Nodes**: Independent processes performing computation
**Topics**: Named buses for publishing/subscribing to messages
**Services**: Synchronous request/response communication
**Actions**: Asynchronous, goal-oriented tasks with feedback

```python
#!/usr/bin/env python3
import rospy
from std_msgs.msg import String
from geometry_msgs.msg import Twist

class RobotController:
    def __init__(self):
        rospy.init_node('robot_controller')

        # Publisher for velocity commands
        self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=10)

        # Subscriber for sensor data
        rospy.Subscriber('/sensors', String, self.sensor_callback)

        self.rate = rospy.Rate(50)  # 50 Hz

    def sensor_callback(self, msg):
        rospy.loginfo(f"Received: {msg.data}")

    def move_forward(self, speed=0.5):
        cmd = Twist()
        cmd.linear.x = speed
        self.cmd_pub.publish(cmd)

    def run(self):
        while not rospy.is_shutdown():
            self.move_forward()
            self.rate.sleep()

if __name__ == '__main__':
    controller = RobotController()
    controller.run()
```

### ROS 2

Next generation with improvements:
- DDS middleware (better performance)
- Real-time support
- Better security
- Native Windows/macOS support

## Control Architecture Patterns

### Hierarchical Architecture

Subsumption architecture (Brooks, 1986):
- Layers of increasing abstraction
- Lower layers can override higher layers
- Example: obstacle avoidance overrides path planning

### Behavior-Based Architecture

Parallel behaviors compete or cooperate:
- Reactive to environment
- No explicit world model
- Fast response to stimuli

### Hybrid Deliberative/Reactive

Three-layer architecture:
1. **Deliberative Layer**: Planning and decision-making
2. **Executive Layer**: Task decomposition and coordination
3. **Reactive Layer**: Sensor-motor control

## Control Loops

### Single Control Loop

Simple but limited:
```python
while True:
    sensors = read_sensors()
    state = estimate_state(sensors)
    command = compute_control(state, goal)
    send_to_actuators(command)
```

Frequency: 50-1000 Hz depending on application

### Multi-Rate Control

Different subsystems at different rates:
- Vision processing: 30 Hz
- State estimation: 100 Hz
- Motor control: 1000 Hz
- High-level planning: 1 Hz

### Asynchronous Control

Event-driven rather than periodic:
- React to sensor events
- Efficient use of computing resources
- More complex to design and debug

## State Machines

Organizing robot behavior:

```python
from enum import Enum

class RobotState(Enum):
    IDLE = 0
    WALKING = 1
    REACHING = 2
    GRASPING = 3
    ERROR = 4

class StateMachine:
    def __init__(self):
        self.state = RobotState.IDLE

    def transition(self, new_state):
        print(f"Transitioning: {self.state} -> {new_state}")
        self.state = new_state

    def update(self, sensors):
        if self.state == RobotState.IDLE:
            if sensors.button_pressed:
                self.transition(RobotState.WALKING)

        elif self.state == RobotState.WALKING:
            if sensors.object_detected:
                self.transition(RobotState.REACHING)
            elif sensors.goal_reached:
                self.transition(RobotState.IDLE)

        # ... more state logic
```

## Communication Protocols

### Serial Communication

**UART/RS-232**:
- Simple point-to-point
- Typical speeds: 9600-115200 baud

**CAN Bus**:
- Multi-master bus (automotive standard)
- Deterministic arbitration
- Used in mobile robots

### Network Communication

**Ethernet/WiFi**:
- High bandwidth
- Variable latency (not real-time)

**EtherCAT**:
- Real-time Ethernet for industrial control
- Microsecond synchronization

## Data Logging and Debugging

Essential for development:

```python
import rosbag

# Record data
bag = rosbag.Bag('session.bag', 'w')
bag.write('/camera/image', image_msg)
bag.write('/imu/data', imu_msg)
bag.close()

# Playback for analysis
bag = rosbag.Bag('session.bag')
for topic, msg, t in bag.read_messages():
    process(msg)
```

## Safety and Fault Tolerance

### Watchdog Timers

Detect software hangs:
```cpp
void watchdog_thread() {
    while(true) {
        if (time_since_last_heartbeat() > TIMEOUT) {
            trigger_emergency_stop();
        }
        sleep(100ms);
    }
}
```

### Redundancy

- Duplicate critical sensors
- Fallback control modes
- Safe default behaviors

### Emergency Stop

Hardware e-stop button:
- Cuts power to motors
- Cannot be overridden by software
- Required for safe human-robot interaction

## Summary

Robot control architecture bridges high-level intelligence and low-level hardware. Key design considerations include real-time performance, modularity, communication bandwidth, and safety. ROS has emerged as the standard software platform, providing tools for common robotics tasks and enabling code reuse across different robots.

## Key Takeaways

- Robot computing involves embedded systems, SBCs, and sometimes cloud resources
- Real-time performance is critical for stable control
- ROS provides middleware for robotics software development
- Multi-rate control accommodates different subsystem requirements
- Safety mechanisms (watchdogs, e-stops) are essential

---

**Part 1 Complete!**

Continue to: [Part 2: Robotics Fundamentals](../part2/chapter1-kinematics.md)
