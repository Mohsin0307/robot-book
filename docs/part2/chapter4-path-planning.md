# Chapter 4: Path Planning and Navigation

## Introduction

Path planning enables robots to navigate from a start position to a goal while avoiding obstacles. This chapter covers fundamental planning algorithms used in robotics.

## Configuration Space

### C-Space Representation

The configuration space (C-space) represents all possible robot configurations:

- **For a 2D point robot**: C-space is 2D (x, y)
- **For a rigid body**: C-space includes position and orientation (x, y, θ)
- **For a manipulator**: C-space is the joint space

### Obstacles in C-Space

Transform workspace obstacles to configuration space obstacles:

```python
def workspace_to_cspace(obstacle, robot_shape):
    """Minkowski sum for obstacle inflation"""
    return obstacle.minkowski_sum(robot_shape.reflect())
```

## Graph-Based Planning

### A* Algorithm

A* is a widely-used optimal path planning algorithm:

```python
import heapq

def a_star(start, goal, graph, heuristic):
    """A* pathfinding algorithm"""
    open_set = [(0, start)]
    came_from = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}

    while open_set:
        current = heapq.heappop(open_set)[1]

        if current == goal:
            return reconstruct_path(came_from, current)

        for neighbor in graph.neighbors(current):
            tentative_g = g_score[current] + graph.cost(current, neighbor)

            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None  # No path found
```

### Dijkstra's Algorithm

Special case of A* with zero heuristic (guaranteed optimal).

## Sampling-Based Planning

### RRT (Rapidly-Exploring Random Trees)

RRT efficiently explores high-dimensional spaces:

```python
import numpy as np

class RRT:
    def __init__(self, start, goal, obstacles, step_size=0.5):
        self.start = start
        self.goal = goal
        self.obstacles = obstacles
        self.step_size = step_size
        self.tree = {start: None}

    def plan(self, max_iterations=1000):
        for _ in range(max_iterations):
            # Sample random configuration
            rand_config = self.random_config()

            # Find nearest node in tree
            nearest = self.nearest_neighbor(rand_config)

            # Extend towards random configuration
            new_config = self.extend(nearest, rand_config)

            # Check collision
            if not self.in_collision(new_config):
                self.tree[new_config] = nearest

                # Check if goal reached
                if self.distance(new_config, self.goal) < self.step_size:
                    self.tree[self.goal] = new_config
                    return self.extract_path()

        return None  # Planning failed

    def extend(self, from_config, to_config):
        direction = np.array(to_config) - np.array(from_config)
        direction = direction / np.linalg.norm(direction)
        new_config = tuple(np.array(from_config) + direction * self.step_size)
        return new_config
```

### RRT* (Optimal RRT)

Asymptotically optimal variant that rewires the tree:

```python
def rrt_star(start, goal, obstacles, radius):
    """RRT* with rewiring for optimal paths"""
    # Similar to RRT, but with rewiring step
    # Find nearby nodes within radius
    # Rewire tree to minimize cost
    pass
```

## Potential Field Methods

### Artificial Potential Fields

Attractive and repulsive forces guide the robot:

```python
def potential_field_navigation(robot_pos, goal_pos, obstacles):
    # Attractive potential (goal)
    attractive_force = K_att * (goal_pos - robot_pos)

    # Repulsive potential (obstacles)
    repulsive_force = np.zeros(2)
    for obs in obstacles:
        dist = np.linalg.norm(robot_pos - obs.pos)
        if dist < influence_distance:
            repulsive_force += K_rep * (1/dist - 1/influence_distance) * \
                             (robot_pos - obs.pos) / dist**3

    return attractive_force + repulsive_force
```

### Local Minima Problem

Potential fields can trap the robot in local minima. Solutions:
- Random walks
- Hybrid approaches (potential fields + global planner)
- Navigation functions

## Dynamic Window Approach (DWA)

DWA considers robot dynamics for local planning:

```python
def dynamic_window_approach(robot_state, goal, obstacles):
    """Select velocity commands considering dynamics"""
    v, w = robot_state.velocity, robot_state.angular_velocity

    # Compute dynamic window
    v_range = [v - max_accel*dt, v + max_accel*dt]
    w_range = [w - max_alpha*dt, w + max_alpha*dt]

    # Score velocity candidates
    best_score = -inf
    best_v, best_w = 0, 0

    for v_cand in np.linspace(*v_range, num=20):
        for w_cand in np.linspace(*w_range, num=20):
            score = evaluate_trajectory(v_cand, w_cand, goal, obstacles)
            if score > best_score:
                best_score = score
                best_v, best_w = v_cand, w_cand

    return best_v, best_w
```

## Trajectory Optimization

### Minimum Jerk Trajectories

Smooth trajectories minimize jerk (third derivative of position):

```math
J = \int_0^T \dddot{x}(t)^2 dt
```

### Quintic Polynomials

Fifth-order polynomials provide smooth trajectories:

```python
def quintic_trajectory(x0, xf, v0, vf, a0, af, T):
    """Generate quintic polynomial trajectory"""
    # Solve for coefficients a0...a5
    A = np.array([
        [0, 0, 0, 0, 0, 1],
        [T**5, T**4, T**3, T**2, T, 1],
        [0, 0, 0, 0, 1, 0],
        [5*T**4, 4*T**3, 3*T**2, 2*T, 1, 0],
        [0, 0, 0, 2, 0, 0],
        [20*T**3, 12*T**2, 6*T, 2, 0, 0]
    ])
    b = np.array([x0, xf, v0, vf, a0, af])
    coeffs = np.linalg.solve(A, b)
    return coeffs
```

## Summary

Path planning is essential for autonomous navigation. Key algorithms include A*, RRT, and potential fields, each with specific advantages for different scenarios.

## Exercises

1. Implement A* for grid-based navigation
2. Build an RRT planner for a 2D environment
3. Compare DWA vs. potential fields
4. Generate minimum-jerk trajectories

## Further Reading

- LaValle - "Planning Algorithms"
- Choset et al. - "Principles of Robot Motion"
- Siegwart & Nourbakhsh - "Introduction to Autonomous Mobile Robots"
