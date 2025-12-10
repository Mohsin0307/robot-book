---
sidebar_position: 2
---

# Chapter 2: Sensors and Perception

## Introduction

Perception is the process by which robots gather information about their environment and internal state. Unlike digital AI systems that work with clean, structured data, Physical AI must interpret noisy, high-dimensional sensor data to understand the world. This chapter explores the sensors used in robotics and the algorithms that transform raw measurements into actionable information.

## Types of Sensors

Robotic sensors can be categorized by what they measure:

### Proprioceptive Sensors
These sensors provide information about the robot's internal state.

#### Encoders
Measure joint angles and rotation:
- **Optical encoders**: Use light patterns to detect position
- **Magnetic encoders**: Use magnetic fields
- **Absolute vs. Incremental**: Absolute encoders know position at power-on

```python
# Reading encoder values in a typical robot control loop
def read_joint_positions():
    positions = []
    for joint in robot.joints:
        encoder_value = joint.encoder.read()
        angle_rad = encoder_value * (2 * pi / encoder.resolution)
        positions.append(angle_rad)
    return positions
```

#### Inertial Measurement Units (IMUs)
Measure acceleration and angular velocity:
- **Accelerometers**: Linear acceleration (including gravity)
- **Gyroscopes**: Angular velocity
- **Magnetometers**: Magnetic field (compass heading)

**Key Equation**: IMU fusion for orientation estimation

```math
\theta_{t+1} = \theta_t + \omega \cdot \Delta t
```

Where θ is orientation, ω is angular velocity from gyroscope.

#### Force/Torque Sensors
Measure forces applied to joints or end effectors:
- Critical for manipulation and contact-rich tasks
- Enable compliant control and force feedback

### Exteroceptive Sensors
These sensors gather information about the environment.

#### Cameras
Visual perception is crucial for most robotic tasks:

**RGB Cameras**:
- Standard color cameras
- Resolution: 640x480 to 4K+
- Frame rate: 30-120 fps typical

**Depth Cameras**:
- Provide distance to each pixel
- Technologies: Stereo, structured light (Kinect), time-of-flight (RealSense)
- Critical for 3D perception and manipulation

**Event Cameras**:
- Asynchronous pixels that trigger on brightness changes
- Extremely low latency (&lt;1ms)
- High dynamic range

```python
import cv2
import numpy as np

# Capture and process camera image
cap = cv2.VideoCapture(0)
ret, frame = cap.read()

# Convert to grayscale for processing
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

# Apply edge detection
edges = cv2.Canny(gray, threshold1=50, threshold2=150)
```

#### LiDAR (Light Detection and Ranging)
Measures distance using laser pulses:
- **2D LiDAR**: Scans in a plane (common in mobile robots)
- **3D LiDAR**: Full 3D point cloud (autonomous vehicles)
- Range: 0.1m to 100m+ depending on model
- Accuracy: mm to cm level

**Point Cloud Data**:
```python
# Processing LiDAR point cloud
import numpy as np

def filter_ground_plane(points, threshold=0.1):
    """Remove ground points from 3D point cloud."""
    # Assume ground is near z=0
    non_ground = points[points[:, 2] > threshold]
    return non_ground

def cluster_obstacles(points, epsilon=0.5):
    """Group points into obstacles using DBSCAN."""
    from sklearn.cluster import DBSCAN
    clustering = DBSCAN(eps=epsilon, min_samples=5)
    labels = clustering.fit_predict(points)
    return labels
```

#### Ultrasonic Sensors
Low-cost distance measurement:
- Range: 2cm to 4m typical
- Lower resolution than LiDAR
- Useful for proximity detection and obstacle avoidance

#### Tactile Sensors
Measure contact and pressure:
- **Binary touch sensors**: On/off detection
- **Force-sensitive resistors**: Pressure magnitude
- **Tactile arrays**: Distributed pressure sensing (robotic skin)

## Perception Algorithms

Raw sensor data must be processed to extract meaningful information.

### Computer Vision

#### Object Detection
Identifying and localizing objects in images:

**Classical Methods**:
- Histogram of Oriented Gradients (HOG)
- Haar cascades

**Deep Learning Methods**:
- YOLO (You Only Look Once): Real-time detection
- Faster R-CNN: Two-stage detection
- EfficientDet: Efficient architecture

```python
# Using YOLO for object detection
import cv2
from ultralytics import YOLO

model = YOLO('yolov8n.pt')  # Load YOLOv8 nano model

# Run inference on image
results = model('image.jpg')

# Process results
for result in results:
    boxes = result.boxes
    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        print(f"Detected: {model.names[class_id]} ({confidence:.2f})")
```

#### Semantic Segmentation
Classifying every pixel in an image:
- **U-Net**: Medical imaging and robotics
- **DeepLab**: High-quality segmentation
- **Mask R-CNN**: Instance segmentation

#### Pose Estimation
Determining 3D position and orientation:

**6D Pose Estimation**:

```math
T = \begin{bmatrix} R & t \\ 0 & 1 \end{bmatrix}
```

Where R is 3×3 rotation matrix, t is 3D translation vector.

### Sensor Fusion

Combining multiple sensors for robust perception:

#### Kalman Filter
Optimal state estimation under Gaussian noise assumptions:

**Prediction**:

```math
\hat{x}_{t|t-1} = F_t \hat{x}_{t-1|t-1}
```

```math
P_{t|t-1} = F_t P_{t-1|t-1} F_t^T + Q_t
```

**Update**:

```math
K_t = P_{t|t-1} H_t^T (H_t P_{t|t-1} H_t^T + R_t)^{-1}
```

```math
\hat{x}_{t|t} = \hat{x}_{t|t-1} + K_t(z_t - H_t \hat{x}_{t|t-1})
```

Where:
- x̂: State estimate
- P: Covariance matrix
- F: State transition matrix
- Q: Process noise
- H: Measurement matrix
- R: Measurement noise
- K: Kalman gain

```python
import numpy as np

class KalmanFilter:
    def __init__(self, F, H, Q, R, x0, P0):
        self.F = F  # State transition
        self.H = H  # Measurement matrix
        self.Q = Q  # Process noise
        self.R = R  # Measurement noise
        self.x = x0  # Initial state
        self.P = P0  # Initial covariance

    def predict(self):
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q

    def update(self, z):
        y = z - self.H @ self.x  # Innovation
        S = self.H @ self.P @ self.H.T + self.R  # Innovation covariance
        K = self.P @ self.H.T @ np.linalg.inv(S)  # Kalman gain
        self.x = self.x + K @ y
        self.P = (np.eye(len(self.x)) - K @ self.H) @ self.P
```

#### Particle Filter
Non-parametric Bayesian filter for non-Gaussian distributions:

1. **Prediction**: Propagate particles through motion model
2. **Update**: Weight particles by measurement likelihood
3. **Resample**: Sample new particles from weighted distribution

### SLAM (Simultaneous Localization and Mapping)

Building a map while determining robot position:

#### Visual SLAM
Using camera images:
- **ORB-SLAM**: Feature-based, real-time
- **LSD-SLAM**: Direct methods (no features)
- **VINS-Mono**: Visual-inertial fusion

#### LiDAR SLAM
Using laser scans:
- **Gmapping**: 2D grid maps
- **Cartographer**: Google's SLAM solution
- **LOAM**: LiDAR odometry and mapping

```python
# Simplified ICP (Iterative Closest Point) for scan matching
import numpy as np
from scipy.spatial import cKDTree

def icp_step(source, target, max_iter=20):
    """Basic ICP algorithm for point cloud alignment."""
    transformation = np.eye(3)

    for i in range(max_iter):
        # Find nearest neighbors
        tree = cKDTree(target)
        distances, indices = tree.query(source)

        # Compute transformation
        T = compute_transformation(source, target[indices])

        # Apply transformation
        source = apply_transform(source, T)
        transformation = T @ transformation

        # Check convergence
        if np.mean(distances) < 0.01:
            break

    return transformation
```

## Perception Challenges

### Robustness
Real-world perception must handle:
- **Occlusions**: Objects blocking the view
- **Lighting variations**: Shadows, glare, darkness
- **Weather**: Rain, fog, snow (for outdoor robots)
- **Dynamic environments**: Moving objects and people

### Computational Constraints
- Real-time requirements (30-60 Hz typical)
- Limited onboard compute (power/weight constraints)
- Edge vs. cloud processing tradeoffs

### Sensor Limitations
- **Noise**: Random measurement errors
- **Bias**: Systematic errors (e.g., IMU drift)
- **Range limits**: Minimum and maximum distances
- **Field of view**: Limited coverage area

## Perception for Humanoid Robots

Humanoids face unique perception challenges:

### Multi-Modal Sensing
Integrating vision, touch, proprioception, and balance:
- Visual servoing for manipulation
- Tactile feedback for grasping
- Vestibular sensing for balance

### Human Detection and Tracking
Safe operation requires awareness of nearby people:
- Face detection and recognition
- Skeleton tracking (OpenPose, MediaPipe)
- Intent prediction

### Egocentric Vision
Seeing from the robot's perspective:
- Head-mounted cameras moving with robot motion
- Compensation for body sway during walking
- Active vision (looking where needed)

## Summary

Perception transforms raw sensor measurements into the structured information robots need to act intelligently. Effective perception requires:

1. Appropriate sensor selection for the task
2. Robust algorithms that handle real-world noise and variation
3. Sensor fusion to combine complementary information
4. Real-time processing within computational budgets

Modern deep learning has revolutionized vision-based perception, while classical techniques remain important for sensor fusion and geometric reasoning.

## Key Takeaways

- Robots use proprioceptive sensors (internal state) and exteroceptive sensors (environment)
- Cameras and LiDAR are primary sensors for spatial perception
- Sensor fusion combines measurements for robust estimates
- SLAM enables navigation in unknown environments
- Real-world perception must be robust, real-time, and computationally efficient

## Exercises

1. **Sensor Noise**: Record encoder data from a stationary joint. Analyze the noise characteristics (mean, standard deviation).

2. **Camera Calibration**: Calibrate a camera using a checkerboard pattern and OpenCV.

3. **Kalman Filter**: Implement a Kalman filter to track a moving object from noisy position measurements.

4. **Object Detection**: Train a YOLO model to detect objects relevant to your robot application.

## Further Reading

- Thrun, S., Burgard, W., & Fox, D. (2005). "Probabilistic Robotics"
- Hartley, R. & Zisserman, A. (2003). "Multiple View Geometry in Computer Vision"
- Ma, Y., et al. (2012). "An Invitation to 3-D Vision"

---

**Next**: [Chapter 3: Actuators and Motion](./chapter3-actuators.md)
