---
sidebar_position: 1
---

# Chapter 1: Computer Vision for Robotics

## Introduction

Vision is a robot's primary sense for understanding its environment. This chapter covers computer vision techniques essential for robotic perception, from classical methods to modern deep learning approaches.

## Image Processing Fundamentals

### Filtering

**Gaussian Blur**: Smooth images, reduce noise
```text
G(x,y) = (1 / 2πσ²) * exp(-(x² + y²) / 2σ²)
```

**Edge Detection**: Find object boundaries
- Sobel, Canny, Laplacian operators

```python
import cv2

# Load image
img = cv2.imread('scene.jpg')

# Edge detection
edges = cv2.Canny(img, threshold1=100, threshold2=200)

# Contour detection
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Draw contours
cv2.drawContours(img, contours, -1, (0,255,0), 2)
```

## Feature Detection and Matching

### Classical Features

**SIFT (Scale-Invariant Feature Transform)**:
- Robust to scale, rotation
- 128-dimensional descriptors
- Good but slow

**ORB (Oriented FAST and Rotated BRIEF)**:
- Fast alternative to SIFT
- Binary descriptors
- Used in ORB-SLAM

```python
# Feature matching
orb = cv2.ORB_create()
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

# Match features
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = bf.match(des1, des2)
matches = sorted(matches, key=lambda x: x.distance)

# Draw matches
result = cv2.drawMatches(img1, kp1, img2, kp2, matches[:20], None)
```

## Object Detection

### Deep Learning Approaches

**YOLO (You Only Look Once)**:
- Real-time detection (30-60 FPS)
- Single-stage detector
- Good speed-accuracy tradeoff

**Faster R-CNN**:
- Two-stage detector
- Higher accuracy, slower
- Region proposals + classification

```python
from ultralytics import YOLO

# Load pre-trained model
model = YOLO('yolov8n.pt')

# Detect objects
results = model.predict(source='robot_view.jpg', conf=0.5)

# Process detections
for r in results:
    boxes = r.boxes
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        print(f"{model.names[cls]}: {conf:.2f} at ({x1}, {y1})")
```

## Semantic Segmentation

Pixel-wise classification:

**U-Net**: Medical imaging, dense prediction
**DeepLab**: High-quality segmentation
**Mask R-CNN**: Instance segmentation

Applications:
- Terrain classification
- Object boundary detection
- Scene understanding

## 3D Vision

### Stereo Vision

Two cameras → depth estimation:

**Disparity**:
```text
depth = (f × baseline) / disparity
```

Where f is focal length, baseline is the distance between cameras, and disparity is the pixel difference between corresponding points.

```python
# Stereo matching
stereo = cv2.StereoBM_create(numDisparities=16*5, blockSize=15)
disparity = stereo.compute(left_img, right_img)

# Convert to depth
depth = (focal_length * baseline) / (disparity + 1e-6)
```

### Point Cloud Processing

**Filtering**: Remove outliers, downsample
**Segmentation**: Separate objects
**Registration**: Align multiple scans (ICP)

```python
import open3d as o3d

# Load point cloud
pcd = o3d.io.read_point_cloud("scene.pcd")

# Downsample
pcd_down = pcd.voxel_down_sample(voxel_size=0.05)

# Plane segmentation
plane_model, inliers = pcd_down.segment_plane(
    distance_threshold=0.01,
    ransac_n=3,
    num_iterations=1000
)

# Extract objects (non-plane points)
objects = pcd_down.select_by_index(inliers, invert=True)
```

## Pose Estimation

### 6D Object Pose

Determining 3D position and orientation:

**PnP (Perspective-n-Point)**:
- Given 2D-3D correspondences → solve for camera pose
- RANSAC for robustness

**Deep Learning Methods**:
- PoseCNN, DenseFusion
- End-to-end pose prediction

### Human Pose Estimation

Skeleton tracking:
- OpenPose: 2D keypoints
- MediaPipe: Real-time on mobile
- Applications: HRI, gesture recognition

```python
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# Process image
results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

if results.pose_landmarks:
    for landmark in results.pose_landmarks.landmark:
        print(f"x: {landmark.x}, y: {landmark.y}, z: {landmark.z}")
```

## Vision for Manipulation

### Visual Servoing

Control robot using visual feedback:

**Image-Based**: Control in image space
**Position-Based**: Estimate 3D pose, control in Cartesian space

### Grasp Detection

Identifying good grasps from images:
- Grasp rectangles/oriented boxes
- Grasp quality CNN
- Tactile feedback integration

## Summary

Computer vision transforms images into actionable information for robots. Classical techniques provide efficiency and interpretability, while deep learning offers robustness and end-to-end learning. Modern robotic systems combine both approaches for reliable perception.

## Key Takeaways

- Image processing extracts features from raw pixels
- Object detection identifies and localizes objects
- Stereo vision and depth sensors provide 3D information
- Pose estimation determines object orientation
- Visual servoing enables vision-based control
- Deep learning has revolutionized robotic perception

---

**Next**: [Chapter 2: Deep Learning for Robotics](./chapter2-deep-learning-robotics.md)
