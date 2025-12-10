# Chapter 5: Localization and Mapping

## Introduction

Localization (knowing where you are) and mapping (knowing what's around you) are fundamental problems in mobile robotics. Together, they enable autonomous navigation in unknown environments.

## Localization

### Monte Carlo Localization (Particle Filters)

Particle filters represent the robot's belief as a set of weighted samples:

```python
import numpy as np

class ParticleFilter:
    def __init__(self, num_particles, map_bounds):
        self.num_particles = num_particles
        self.particles = self.initialize_particles(map_bounds)
        self.weights = np.ones(num_particles) / num_particles

    def initialize_particles(self, bounds):
        """Randomly distribute particles"""
        x = np.random.uniform(bounds[0], bounds[1], self.num_particles)
        y = np.random.uniform(bounds[2], bounds[3], self.num_particles)
        theta = np.random.uniform(-np.pi, np.pi, self.num_particles)
        return np.column_stack([x, y, theta])

    def predict(self, control, dt, noise_std):
        """Motion update"""
        v, w = control
        self.particles[:, 0] += (v * np.cos(self.particles[:, 2]) * dt +
                                np.random.normal(0, noise_std[0], self.num_particles))
        self.particles[:, 1] += (v * np.sin(self.particles[:, 2]) * dt +
                                np.random.normal(0, noise_std[1], self.num_particles))
        self.particles[:, 2] += (w * dt +
                                np.random.normal(0, noise_std[2], self.num_particles))

    def update(self, measurement, sensor_model):
        """Measurement update"""
        for i, particle in enumerate(self.particles):
            self.weights[i] *= sensor_model.likelihood(particle, measurement)

        # Normalize weights
        self.weights /= np.sum(self.weights)

    def resample(self):
        """Systematic resampling"""
        indices = np.random.choice(
            self.num_particles,
            size=self.num_particles,
            p=self.weights
        )
        self.particles = self.particles[indices]
        self.weights = np.ones(self.num_particles) / self.num_particles

    def estimate(self):
        """Weighted mean of particles"""
        return np.average(self.particles, weights=self.weights, axis=0)
```

### Kalman Filtering

For linear systems with Gaussian noise, Kalman filters provide optimal state estimation:

```python
class KalmanFilter:
    def __init__(self, A, B, H, Q, R, x0, P0):
        self.A = A  # State transition matrix
        self.B = B  # Control input matrix
        self.H = H  # Measurement matrix
        self.Q = Q  # Process noise covariance
        self.R = R  # Measurement noise covariance
        self.x = x0  # Initial state estimate
        self.P = P0  # Initial covariance estimate

    def predict(self, u):
        """Prediction step"""
        self.x = self.A @ self.x + self.B @ u
        self.P = self.A @ self.P @ self.A.T + self.Q

    def update(self, z):
        """Update step"""
        # Innovation
        y = z - self.H @ self.x

        # Innovation covariance
        S = self.H @ self.P @ self.H.T + self.R

        # Kalman gain
        K = self.P @ self.H.T @ np.linalg.inv(S)

        # State update
        self.x = self.x + K @ y

        # Covariance update
        I = np.eye(len(self.x))
        self.P = (I - K @ self.H) @ self.P
```

### Extended Kalman Filter (EKF)

For nonlinear systems, EKF linearizes around the current estimate:

```math
\hat{x}_{k|k-1} = f(\hat{x}_{k-1|k-1}, u_k)
```

```math
P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k
```

where F_k is the Jacobian of f.

## Mapping

### Occupancy Grid Mapping

Represent the environment as a grid of cells:

```python
class OccupancyGrid:
    def __init__(self, width, height, resolution):
        self.width = width
        self.height = height
        self.resolution = resolution
        self.grid = np.ones((height, width)) * 0.5  # Unknown = 0.5

    def update(self, laser_scan, robot_pose):
        """Update grid with laser scan"""
        for angle, distance in laser_scan:
            if distance < max_range:
                # Endpoint (obstacle)
                x_end, y_end = self.ray_endpoint(robot_pose, angle, distance)
                self.set_occupied(x_end, y_end)

                # Ray trace for free space
                self.ray_trace(robot_pose, x_end, y_end)

    def log_odds_update(self, cell, is_occupied):
        """Bayesian update using log-odds"""
        if is_occupied:
            cell += log_odds_occupied
        else:
            cell += log_odds_free

        # Clamp values
        return np.clip(cell, -max_log_odds, max_log_odds)
```

### Feature-Based Mapping

Extract and map landmarks:

```python
class FeatureMap:
    def __init__(self):
        self.landmarks = []

    def add_landmark(self, feature, covariance):
        """Add detected feature to map"""
        self.landmarks.append({
            'position': feature.position,
            'descriptor': feature.descriptor,
            'covariance': covariance
        })

    def data_association(self, observed_features):
        """Match observed features to map landmarks"""
        associations = []
        for obs in observed_features:
            best_match = None
            min_distance = float('inf')

            for landmark in self.landmarks:
                dist = self.mahalanobis_distance(obs, landmark)
                if dist < min_distance and dist < threshold:
                    min_distance = dist
                    best_match = landmark

            associations.append(best_match)
        return associations
```

## SLAM (Simultaneous Localization and Mapping)

### EKF-SLAM

Jointly estimate robot pose and landmark positions:

State vector:

```math
x = [x_r, y_r, \theta_r, x_1, y_1, ..., x_n, y_n]^T
```

```python
class EKFSLAM:
    def __init__(self, initial_pose):
        # State: [robot_x, robot_y, robot_theta, landmark_1_x, landmark_1_y, ...]
        self.state = initial_pose
        self.covariance = np.eye(3) * 0.1  # Initial uncertainty

    def predict(self, control, dt):
        """Motion model"""
        v, w = control
        theta = self.state[2]

        # Update robot pose
        self.state[0] += v * np.cos(theta) * dt
        self.state[1] += v * np.sin(theta) * dt
        self.state[2] += w * dt

        # Compute Jacobian and update covariance
        F = self.motion_jacobian(control, dt)
        self.covariance = F @ self.covariance @ F.T + self.Q

    def update(self, observations):
        """Measurement update for observed landmarks"""
        for obs in observations:
            if obs.landmark_id not in self.landmark_ids:
                self.add_landmark(obs)
            else:
                self.update_landmark(obs)
```

### Graph-SLAM

Formulate SLAM as graph optimization:

- Nodes: Robot poses and landmarks
- Edges: Measurements (odometry, observations)

```python
def graph_slam_optimization(poses, landmarks, constraints):
    """Optimize pose graph using least squares"""
    # Build information matrix
    H = build_information_matrix(constraints)
    b = build_information_vector(constraints)

    # Solve H * dx = b
    dx = np.linalg.solve(H, b)

    # Update poses and landmarks
    return apply_correction(poses, landmarks, dx)
```

## Modern SLAM Systems

### ORB-SLAM

Visual SLAM using ORB features:
- **Tracking**: Localize camera from previous frame
- **Mapping**: Create and refine 3D map
- **Loop Closing**: Detect and correct drift

### LiDAR-based SLAM

LOAM (Lidar Odometry and Mapping):
```cpp
// Point cloud registration
void scan_matching(PointCloud& current, PointCloud& previous) {
    // Extract edge and planar features
    auto edges = extract_edge_features(current);
    auto planes = extract_planar_features(current);

    // Match features and compute transform
    Transform T = icp_matching(edges, planes, previous);

    // Update odometry
    update_pose(T);
}
```

## Summary

Localization and mapping enable robots to navigate autonomously. Particle filters, Kalman filters, and SLAM algorithms form the foundation of mobile robotics.

## Exercises

1. Implement a particle filter for robot localization
2. Build an occupancy grid map from laser scans
3. Implement EKF-SLAM for a simple 2D environment
4. Compare particle filter vs. Kalman filter performance

## Further Reading

- Thrun et al. - "Probabilistic Robotics"
- Durrant-Whyte & Bailey - "Simultaneous Localization and Mapping" (SLAM tutorial)
- Cadena et al. - "Past, Present, and Future of SLAM"
