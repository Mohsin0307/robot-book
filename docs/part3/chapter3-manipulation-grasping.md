# Chapter 3: Manipulation and Grasping

## Introduction

Humanoid robots must manipulate objects in human environments. This chapter covers grasp planning, force control, and dexterous manipulation.

## Grasp Taxonomy

### Power Grasps vs. Precision Grasps

- **Power grasp**: Palm and fingers wrap around object (high force)
- **Precision grasp**: Fingertips contact object (high dexterity)

```python
class GraspClassifier:
    def classify_grasp(self, object_size, required_force):
        if object_size > hand_size * 0.7 or required_force > 50:  # Newtons
            return "POWER_GRASP"
        else:
            return "PRECISION_GRASP"
```

## Grasp Planning

### Force Closure

A grasp achieves force closure if it can resist arbitrary external forces:

```python
def check_force_closure(contact_points, contact_normals, friction_coeff):
    """Verify force closure using convex hull method"""
    # Build grasp matrix
    G = build_grasp_matrix(contact_points, contact_normals, friction_coeff)

    # Check if origin is in convex hull of possible forces
    return is_force_closure(G)
```

### Grasp Quality Metrics

```python
def grasp_quality(contact_points, object_com):
    """Compute grasp quality metric"""
    # Distance from contacts to object COM
    distances = [np.linalg.norm(cp - object_com) for cp in contact_points]

    # Volume of grasp wrench space
    wrench_space_volume = compute_wrench_space(contact_points)

    return wrench_space_volume / np.mean(distances)
```

## Impedance Control

### Mass-Spring-Damper Model

```python
class ImpedanceController:
    def __init__(self, M, K, D):
        self.M = M  # Desired inertia
        self.K = K  # Stiffness
        self.D = D  # Damping

    def compute_force(self, pos, vel, pos_desired, force_external):
        """Impedance control law"""
        error = pos_desired - pos
        f_desired = self.K @ error - self.D @ vel

        # Compensate for external forces
        f_command = f_desired + force_external

        return f_command
```

## Dexterous Manipulation

### Finger Gaiting

Reposition fingers while maintaining grasp:

```python
def finger_gaiting(object_pose, target_pose, hand_state):
    """Plan finger repositioning sequence"""
    sequence = []

    while not reached(object_pose, target_pose):
        # Select finger to move
        finger_to_move = select_finger(hand_state)

        # Plan finger motion
        new_contact = plan_contact(finger_to_move, object_pose, target_pose)

        # Execute: lift, move, place
        sequence.append(("LIFT", finger_to_move))
        sequence.append(("MOVE", finger_to_move, new_contact))
        sequence.append(("PLACE", finger_to_move))

        # Update object pose
        object_pose = push_object(hand_state, target_pose)

    return sequence
```

## Summary

Manipulation combines planning, control, and perception for dexterous interaction with objects.

## Exercises

1. Implement force closure verification
2. Design an impedance controller
3. Plan a grasp for various objects
4. Simulate in-hand manipulation

## Further Reading

- Murray et al. - "A Mathematical Introduction to Robotic Manipulation"
- Bicchi & Kumar - "Robotic Grasping and Contact"
- Mason - "Mechanics of Robotic Manipulation"
