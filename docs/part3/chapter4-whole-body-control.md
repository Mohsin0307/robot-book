# Chapter 4: Whole-Body Control

## Introduction

Whole-body control coordinates all degrees of freedom to achieve multiple simultaneous objectives like walking while manipulating objects.

## Task Hierarchy

### Prioritized Tasks

```python
class TaskHierarchy:
    def __init__(self):
        self.tasks = []  # Ordered by priority

    def add_task(self, task, priority):
        """Add task with priority level"""
        self.tasks.insert(priority, task)

    def solve(self, q, q_dot):
        """Solve hierarchical optimization"""
        tau = np.zeros(len(q))
        null_space_proj = np.eye(len(q))

        for task in self.tasks:
            # Solve in null space of higher-priority tasks
            J_task = task.jacobian(q)
            J_projected = J_task @ null_space_proj

            # Task-space command
            x_ddot = task.compute_acceleration(q, q_dot)

            # Joint-space torques
            tau += null_space_proj.T @ J_projected.T @ x_ddot

            # Update null space projector
            null_space_proj = null_space_proj @ (np.eye(len(q)) -
                                                 np.linalg.pinv(J_projected) @ J_projected)

        return tau
```

## Quadratic Programming Formulation

### Optimization-Based Control

Quadratic Program formulation:
```text
minimize: (1/2) * q_ddot^T * H * q_ddot + g^T * q_ddot
```

Subject to:
```text
A·q̈ = b  (equality constraints)
C·q̈ ≤ d  (inequality constraints)
```

Where q̈ is joint accelerations, H is Hessian matrix, A and C are constraint matrices, and b and d are constraint vectors.

```python
import cvxpy as cp

def whole_body_qp_control(robot, tasks, contacts):
    """QP-based whole-body controller"""
    n_q = len(robot.q)

    # Decision variables
    q_ddot = cp.Variable(n_q)
    contact_forces = cp.Variable(len(contacts) * 3)

    # Dynamics constraint: M*q_ddot + h = S*tau + J^T*f
    M = robot.mass_matrix()
    h = robot.nonlinear_effects()
    J_contacts = robot.contact_jacobian(contacts)

    dynamics_constraint = [
        M @ q_ddot + h == robot.selection_matrix() @ tau + J_contacts.T @ contact_forces
    ]

    # Task objectives (soft constraints)
    cost = 0
    for task in tasks:
        J_task = task.jacobian(robot.q)
        x_ddot_desired = task.desired_acceleration()
        cost += task.weight * cp.sum_squares(J_task @ q_ddot - x_ddot_desired)

    # Friction cone constraints
    friction_constraints = []
    for i, contact in enumerate(contacts):
        f = contact_forces[i*3:(i+1)*3]
        friction_constraints += friction_cone_constraint(f, contact.mu)

    # Solve QP
    problem = cp.Problem(cp.Minimize(cost), dynamics_constraint + friction_constraints)
    problem.solve()

    return q_ddot.value, contact_forces.value
```

## Multi-Contact Scenarios

### Contact Planning

```python
def plan_contacts(robot, environment, task):
    """Plan contact sequence for task"""
    contacts = []

    # Identify necessary contact points
    if task.requires_support:
        contacts.extend(find_support_contacts(robot, environment))

    if task.requires_manipulation:
        contacts.extend(find_manipulation_contacts(robot, task.target_object))

    return optimize_contact_placement(contacts, task.objectives)
```

## Summary

Whole-body control enables humanoids to perform complex, multi-objective tasks by coordinating all degrees of freedom.

## Exercises

1. Implement hierarchical task control
2. Formulate and solve a whole-body QP
3. Plan multi-contact scenarios
4. Simulate reaching while walking

## Further Reading

- Sentis & Khatib - "Synthesis of Whole-Body Behaviors through Hierarchical Control of Behavioral Primitives"
- Del Prete et al. - "Joint Position and Velocity Bounds in Discrete-Time Acceleration/Torque Control of Robot Manipulators"
