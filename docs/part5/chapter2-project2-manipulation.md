# Project 2: Robotic Arm Manipulation System

## Project Overview

Build a complete manipulation system for pick-and-place tasks using a robotic arm, vision system, and grasp planning.

## Hardware Requirements

- 6-DOF robotic arm (e.g., UR5, Franka Emika Panda)
- RGB-D camera (Intel RealSense, Kinect)
- Parallel jaw or 3-finger gripper
- Workstation PC with GPU

## Software Stack

```python
# requirements.txt
numpy
opencv-python
pyrealsense2
ros2-foxy
moveit2
open3d
torch
torchvision
```

## Phase 1: Camera Calibration and Setup

### Hand-Eye Calibration

```python
import cv2
import numpy as np

def calibrate_hand_eye(robot_poses, camera_images, aruco_dict):
    """Hand-eye calibration using AruCo markers"""

    R_gripper2base_list = []
    t_gripper2base_list = []
    R_target2cam_list = []
    t_target2cam_list = []

    for pose, image in zip(robot_poses, camera_images):
        # Detect ArUco marker
        corners, ids, _ = cv2.aruco.detectMarkers(image, aruco_dict)

        if ids is not None:
            # Estimate marker pose
            rvec, tvec, _ = cv2.aruco.estimatePoseSingleMarkers(
                corners, marker_length, camera_matrix, dist_coeffs
            )

            R_target2cam, _ = cv2.Rodrigues(rvec[0])
            t_target2cam = tvec[0]

            R_target2cam_list.append(R_target2cam)
            t_target2cam_list.append(t_target2cam)

            # Robot pose
            R_gripper2base_list.append(pose[:3, :3])
            t_gripper2base_list.append(pose[:3, 3])

    # Solve hand-eye calibration
    R_cam2gripper, t_cam2gripper = cv2.calibrateHandEye(
        R_gripper2base_list, t_gripper2base_list,
        R_target2cam_list, t_target2cam_list,
        method=cv2.CALIB_HAND_EYE_TSAI
    )

    return R_cam2gripper, t_cam2gripper
```

## Phase 2: Object Detection and Pose Estimation

### Point Cloud Processing

```python
import open3d as o3d

class ObjectDetector:
    def __init__(self, camera_intrinsics):
        self.intrinsics = camera_intrinsics

    def detect_objects(self, color_image, depth_image):
        """Detect objects using point cloud segmentation"""

        # Create point cloud
        pcd = self.create_point_cloud(color_image, depth_image)

        # Plane segmentation (remove table)
        plane_model, inliers = pcd.segment_plane(
            distance_threshold=0.01,
            ransac_n=3,
            num_iterations=1000
        )

        # Extract objects above plane
        objects_pcd = pcd.select_by_index(inliers, invert=True)

        # Cluster objects
        labels = np.array(objects_pcd.cluster_dbscan(
            eps=0.02, min_points=100
        ))

        # Process each cluster
        objects = []
        for label in set(labels):
            if label == -1:  # Noise
                continue

            mask = labels == label
            object_pcd = objects_pcd.select_by_index(np.where(mask)[0])

            # Estimate 6D pose
            pose = self.estimate_pose(object_pcd)
            objects.append({
                'pointcloud': object_pcd,
                'pose': pose,
                'centroid': object_pcd.get_center()
            })

        return objects

    def estimate_pose(self, object_pcd):
        """Estimate 6D object pose"""
        # Principal Component Analysis
        obb = object_pcd.get_oriented_bounding_box()

        pose = np.eye(4)
        pose[:3, :3] = obb.R
        pose[:3, 3] = obb.center

        return pose
```

## Phase 3: Grasp Planning

### Antipodal Grasp Detection

```python
class GraspPlanner:
    def __init__(self, gripper_width=0.08):
        self.gripper_width = gripper_width

    def plan_grasps(self, object_pcd):
        """Generate candidate grasps"""
        grasps = []

        # Sample grasp points on object surface
        points = np.asarray(object_pcd.points)
        normals = np.asarray(object_pcd.normals)

        for i in range(0, len(points), 10):  # Sample every 10th point
            grasp_center = points[i]
            approach_direction = -normals[i]  # Approach along normal

            # Check antipodal points
            antipodal_point = self.find_antipodal(
                grasp_center, approach_direction, object_pcd
            )

            if antipodal_point is not None:
                # Compute grasp pose
                grasp_pose = self.compute_grasp_pose(
                    grasp_center, antipodal_point, approach_direction
                )

                # Evaluate grasp quality
                quality = self.evaluate_grasp(grasp_pose, object_pcd)

                grasps.append({
                    'pose': grasp_pose,
                    'quality': quality,
                    'width': np.linalg.norm(grasp_center - antipodal_point)
                })

        # Sort by quality
        grasps.sort(key=lambda g: g['quality'], reverse=True)

        return grasps

    def evaluate_grasp(self, grasp_pose, object_pcd):
        """Compute grasp quality metric"""
        # Ferrari-Canny metric
        contact_points = self.get_contact_points(grasp_pose, object_pcd)

        if len(contact_points) < 2:
            return 0.0

        # Measure force closure
        wrench_space = self.compute_wrench_space(contact_points)
        quality = self.measure_wrench_space_quality(wrench_space)

        return quality
```

## Phase 4: Motion Planning with MoveIt

### ROS 2 + MoveIt Integration

```python
import rclpy
from moveit_msgs.msg import MoveGroupAction
from geometry_msgs.msg import Pose

class ManipulationController:
    def __init__(self):
        rclpy.init()
        self.node = rclpy.create_node('manipulation_controller')

        # MoveIt interface
        self.move_group = MoveGroupInterface("manipulator", self.node)

    def pick_object(self, object_pose, grasp_pose):
        """Execute pick motion"""

        # 1. Move to pre-grasp pose
        pre_grasp_pose = grasp_pose.copy()
        pre_grasp_pose[2, 3] += 0.1  # 10cm above grasp

        self.move_to_pose(pre_grasp_pose)

        # 2. Open gripper
        self.set_gripper(0.08)  # Open

        # 3. Approach grasp
        self.move_to_pose(grasp_pose)

        # 4. Close gripper
        self.set_gripper(0.02)  # Close

        # 5. Lift object
        lift_pose = grasp_pose.copy()
        lift_pose[2, 3] += 0.15  # Lift 15cm

        self.move_to_pose(lift_pose)

    def place_object(self, target_pose):
        """Execute place motion"""

        # 1. Move to pre-place pose
        pre_place_pose = target_pose.copy()
        pre_place_pose[2, 3] += 0.1

        self.move_to_pose(pre_place_pose)

        # 2. Lower to place pose
        self.move_to_pose(target_pose)

        # 3. Open gripper
        self.set_gripper(0.08)

        # 4. Retract
        self.move_to_pose(pre_place_pose)

    def move_to_pose(self, target_pose):
        """Plan and execute motion to target pose"""
        self.move_group.set_pose_target(target_pose)
        success = self.move_group.go(wait=True)
        self.move_group.stop()
        self.move_group.clear_pose_targets()

        return success
```

## Phase 5: Integration and Testing

### Complete Pick-and-Place System

```python
class PickAndPlaceSystem:
    def __init__(self):
        self.detector = ObjectDetector(camera_intrinsics)
        self.grasp_planner = GraspPlanner()
        self.controller = ManipulationController()

    def run(self, target_location):
        """Main control loop"""

        # 1. Perception
        color_img, depth_img = self.capture_images()
        objects = self.detector.detect_objects(color_img, depth_img)

        if not objects:
            print("No objects detected")
            return

        # 2. Select target object (closest)
        target_object = min(objects, key=lambda o: np.linalg.norm(o['centroid']))

        # 3. Plan grasp
        grasps = self.grasp_planner.plan_grasps(target_object['pointcloud'])

        if not grasps:
            print("No valid grasps found")
            return

        best_grasp = grasps[0]

        # 4. Execute pick
        success = self.controller.pick_object(
            target_object['pose'],
            best_grasp['pose']
        )

        if not success:
            print("Pick failed")
            return

        # 5. Execute place
        self.controller.place_object(target_location)

        print("Pick and place completed successfully!")

# Run system
if __name__ == "__main__":
    system = PickAndPlaceSystem()
    target = np.array([0.5, 0.2, 0.1])  # Target location
    system.run(target)
```

## Evaluation Metrics

- **Success rate**: Percentage of successful pick-and-place operations
- **Grasp stability**: Force required to dislodge grasped object
- **Execution time**: Time from detection to placement
- **Precision**: Distance between placed object and target location

## Extensions

1. Multi-object manipulation
2. Deformable object handling
3. Bin picking scenarios
4. Real-time adaptive grasping

## Summary

This project integrates perception, planning, and control for robust robotic manipulation, demonstrating end-to-end system development.
