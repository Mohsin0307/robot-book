---
sidebar_position: 1
---

# Project 1: Building a Mobile Robot

## Project Overview

Build an autonomous mobile robot that navigates an environment, avoids obstacles, and reaches goal positions.

## Learning Objectives

- Design and assemble a wheeled robot platform
- Implement obstacle avoidance using sensors
- Develop navigation algorithms
- Integrate ROS for software architecture

## Hardware Components

### Required Parts

| Component | Specification | Quantity | Est. Cost |
|-----------|---------------|----------|-----------|
| Chassis | Differential drive | 1 | $30 |
| Motors | DC with encoders | 2 | $20 |
| Motor Driver | L298N or similar | 1 | $5 |
| Microcontroller | Arduino/ESP32 | 1 | $10 |
| SBC | Raspberry Pi 4 | 1 | $55 |
| Ultrasonic Sensors | HC-SR04 | 3 | $6 |
| IMU | MPU6050 | 1 | $5 |
| Battery | 12V LiPo | 1 | $40 |
| **Total** | | | **~$171** |

### Assembly

1. Mount motors to chassis
2. Attach wheels and caster
3. Install motor driver
4. Connect microcontroller and SBC
5. Mount sensors (ultrasonic, IMU)
6. Wire power distribution

## Software Architecture

```
┌─────────────────────────────────────┐
│         Raspberry Pi (ROS)          │
│  ┌──────────────────────────────┐  │
│  │   Navigation Stack           │  │
│  │  - SLAM (Gmapping)           │  │
│  │  - Path Planning (A*)         │  │
│  │  - Obstacle Avoidance        │  │
│  └──────────────────────────────┘  │
└─────────────────┬───────────────────┘
                  │ Serial/I2C
┌─────────────────┴───────────────────┐
│      Arduino (Motor Control)        │
│  - Read encoders                    │
│  - PID control                      │
│  - Send velocity commands to motors │
└─────────────────────────────────────┘
```

## Step 1: Motor Control

### Arduino Code

```cpp
// Motor pins
#define MOTOR_LEFT_PWM 9
#define MOTOR_LEFT_DIR1 7
#define MOTOR_LEFT_DIR2 8
#define MOTOR_RIGHT_PWM 10
#define MOTOR_RIGHT_DIR1 11
#define MOTOR_RIGHT_DIR2 12

// Encoder pins
#define ENC_LEFT_A 2
#define ENC_LEFT_B 3
#define ENC_RIGHT_A 18
#define ENC_RIGHT_B 19

volatile long left_encoder = 0;
volatile long right_encoder = 0;

void setup() {
    pinMode(MOTOR_LEFT_PWM, OUTPUT);
    pinMode(MOTOR_LEFT_DIR1, OUTPUT);
    pinMode(MOTOR_LEFT_DIR2, OUTPUT);
    pinMode(MOTOR_RIGHT_PWM, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR1, OUTPUT);
    pinMode(MOTOR_RIGHT_DIR2, OUTPUT);

    attachInterrupt(digitalPinToInterrupt(ENC_LEFT_A), leftEncoderISR, CHANGE);
    attachInterrupt(digitalPinToInterrupt(ENC_RIGHT_A), rightEncoderISR, CHANGE);

    Serial.begin(115200);
}

void setMotor(int pwm_pin, int dir1, int dir2, int speed) {
    if (speed > 0) {
        digitalWrite(dir1, HIGH);
        digitalWrite(dir2, LOW);
    } else {
        digitalWrite(dir1, LOW);
        digitalWrite(dir2, HIGH);
    }
    analogWrite(pwm_pin, abs(speed));
}

void leftEncoderISR() {
    if (digitalRead(ENC_LEFT_B)) left_encoder++;
    else left_encoder--;
}

void rightEncoderISR() {
    if (digitalRead(ENC_RIGHT_B)) right_encoder++;
    else right_encoder--;
}

void loop() {
    // Read velocity commands from serial
    if (Serial.available()) {
        // Parse commands and set motor speeds
    }

    // Send encoder values
    Serial.print(left_encoder);
    Serial.print(",");
    Serial.println(right_encoder);

    delay(50);
}
```

## Step 2: Obstacle Avoidance

### Python (ROS Node)

```python
#!/usr/bin/env python3
import rospy
from sensor_msgs.msg import Range
from geometry_msgs.msg import Twist

class ObstacleAvoidance:
    def __init__(self):
        rospy.init_node('obstacle_avoidance')

        self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=10)

        rospy.Subscriber('/sonar/left', Range, self.left_callback)
        rospy.Subscriber('/sonar/center', Range, self.center_callback)
        rospy.Subscriber('/sonar/right', Range, self.right_callback)

        self.left_dist = float('inf')
        self.center_dist = float('inf')
        self.right_dist = float('inf')

        self.MIN_DISTANCE = 0.3  # meters

    def left_callback(self, msg):
        self.left_dist = msg.range

    def center_callback(self, msg):
        self.center_dist = msg.range

    def right_callback(self, msg):
        self.right_dist = msg.range

    def avoid_obstacles(self):
        cmd = Twist()

        if self.center_dist < self.MIN_DISTANCE:
            # Obstacle ahead, turn
            cmd.linear.x = 0.0
            cmd.angular.z = 0.5 if self.left_dist > self.right_dist else -0.5
        elif self.left_dist < self.MIN_DISTANCE:
            # Obstacle on left, turn right
            cmd.linear.x = 0.2
            cmd.angular.z = -0.3
        elif self.right_dist < self.MIN_DISTANCE:
            # Obstacle on right, turn left
            cmd.linear.x = 0.2
            cmd.angular.z = 0.3
        else:
            # No obstacles, move forward
            cmd.linear.x = 0.3
            cmd.angular.z = 0.0

        self.cmd_pub.publish(cmd)

    def run(self):
        rate = rospy.Rate(10)  # 10 Hz
        while not rospy.is_shutdown():
            self.avoid_obstacles()
            rate.sleep()

if __name__ == '__main__':
    node = ObstacleAvoidance()
    node.run()
```

## Step 3: SLAM and Navigation

### Launch File

```xml
<launch>
    <!-- Gmapping SLAM -->
    <node name="slam_gmapping" pkg="gmapping" type="slam_gmapping">
        <param name="base_frame" value="base_link"/>
        <param name="odom_frame" value="odom"/>
        <param name="map_update_interval" value="5.0"/>
        <param name="maxUrange" value="5.0"/>
        <param name="particles" value="30"/>
    </node>

    <!-- Move Base -->
    <node pkg="move_base" type="move_base" name="move_base">
        <rosparam file="$(find my_robot)/config/costmap_common.yaml" command="load" ns="global_costmap"/>
        <rosparam file="$(find my_robot)/config/costmap_common.yaml" command="load" ns="local_costmap"/>
        <rosparam file="$(find my_robot)/config/local_costmap.yaml" command="load"/>
        <rosparam file="$(find my_robot)/config/global_costmap.yaml" command="load"/>
        <rosparam file="$(find my_robot)/config/base_local_planner.yaml" command="load"/>
    </node>
</launch>
```

## Testing and Debugging

1. **Motor Test**: Verify motors respond correctly to commands
2. **Sensor Test**: Check ultrasonic readings
3. **Odometry Calibration**: Measure encoder counts per meter
4. **SLAM Test**: Drive around, verify map builds correctly
5. **Navigation Test**: Send goal positions, verify robot reaches them

## Extensions

- Add camera for visual navigation
- Implement object recognition
- Multi-robot coordination
- Outdoor navigation with GPS

## Summary

This project integrates mechanical design, electronics, and software to create a functional mobile robot. You've learned motor control, sensor integration, and ROS-based navigation.

## Deliverables

1. Assembled robot hardware
2. Working obstacle avoidance
3. SLAM-generated map of environment
4. Demonstration video

---

**Next**: [Project 2: Robotic Arm Manipulation](./chapter2-project2-manipulation.md)
