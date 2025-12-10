# Chapter 3: Control Systems

## Introduction

Control systems are fundamental to robotics, enabling robots to execute precise movements and maintain stability. This chapter explores classical and modern control techniques used in robotics.

## PID Control

### Proportional-Integral-Derivative Controllers

PID controllers are the most common control mechanism in robotics:

```python
class PIDController:
    def __init__(self, kp, ki, kd):
        self.kp = kp  # Proportional gain
        self.ki = ki  # Integral gain
        self.kd = kd  # Derivative gain
        self.prev_error = 0
        self.integral = 0

    def compute(self, setpoint, measured_value, dt):
        error = setpoint - measured_value
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt

        output = (self.kp * error +
                 self.ki * self.integral +
                 self.kd * derivative)

        self.prev_error = error
        return output
```

### Tuning PID Controllers

The Ziegler-Nichols method provides a systematic approach to PID tuning:

```text
K_p = 0.6 * K_u
K_i = 2*K_p / T_u
K_d = K_p * T_u / 8
```

where K_u is the ultimate gain and T_u is the oscillation period.

## State-Space Control

### Modern Control Theory

State-space representation provides a more general framework:

```math
\dot{x} = Ax + Bu
```

```math
y = Cx + Du
```

Example implementation:

```python
import numpy as np

class StateSpaceController:
    def __init__(self, A, B, C, D):
        self.A = A  # System matrix
        self.B = B  # Input matrix
        self.C = C  # Output matrix
        self.D = D  # Feedthrough matrix

    def step(self, x, u, dt):
        # Discrete-time state update
        x_next = x + (self.A @ x + self.B @ u) * dt
        y = self.C @ x + self.D @ u
        return x_next, y
```

## Feedback and Feedforward Control

### Feedback Control Loop

Feedback control uses sensor measurements to correct errors:

1. **Measure** the current state
2. **Compare** with desired state
3. **Compute** control action
4. **Apply** to actuators

### Feedforward Control

Feedforward control anticipates disturbances:

```python
def feedforward_control(desired_trajectory, model):
    """Compute feedforward control based on system model"""
    return model.inverse_dynamics(desired_trajectory)
```

## Stability Analysis

### Lyapunov Stability

A system is stable if there exists a Lyapunov function V(x) such that:

```math
\dot{V}(x) < 0 \quad \forall x \neq 0
```

### Pole Placement

Control system poles determine stability and response characteristics.

## Practical Considerations

### Sensor Noise Filtering

```python
class LowPassFilter:
    def __init__(self, alpha=0.1):
        self.alpha = alpha
        self.filtered_value = None

    def filter(self, measurement):
        if self.filtered_value is None:
            self.filtered_value = measurement
        else:
            self.filtered_value = (self.alpha * measurement +
                                 (1 - self.alpha) * self.filtered_value)
        return self.filtered_value
```

### Control Loop Timing

Ensure consistent control loop execution:

- Use real-time operating systems (RTOS) when possible
- Monitor loop timing and adjust control gains accordingly
- Implement timeout handling for sensor failures

## Summary

Control systems are the bridge between planning and execution in robotics. Understanding PID, state-space methods, and stability analysis is essential for robust robot behavior.

## Exercises

1. Implement and tune a PID controller for a simulated motor
2. Design a state-space controller for a cart-pole system
3. Analyze stability using Lyapunov methods
4. Compare feedback vs. feedforward control performance

## Further Reading

- Astrom & Murray - "Feedback Systems"
- Ogata - "Modern Control Engineering"
- Khalil - "Nonlinear Systems"
