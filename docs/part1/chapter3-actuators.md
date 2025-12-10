---
sidebar_position: 3
---

# Chapter 3: Actuators and Motion

## Introduction

While sensors enable robots to perceive the world, actuators allow them to act upon it. Actuators convert electrical, pneumatic, or hydraulic energy into mechanical motion. For humanoid robots, selecting and controlling actuators is critical—they must be powerful enough for dynamic tasks yet precise enough for delicate manipulation, all while being lightweight and energy-efficient.

## Types of Actuators

### Electric Motors

The most common actuators in robotics:

#### DC Motors
**Brushed DC Motors**:
- Simple, low-cost
- Require maintenance (brush replacement)
- Good speed-torque characteristics

**Brushless DC Motors (BLDC)**:
- Higher efficiency (no brush friction)
- Longer lifespan
- More complex control (requires electronic commutation)
- Used in drones, servos, and high-performance robots

```python
# Simple DC motor control with PWM
import RPi.GPIO as GPIO

class DCMotor:
    def __init__(self, enable_pin, in1_pin, in2_pin):
        self.enable_pin = enable_pin
        self.in1 = in1_pin
        self.in2 = in2_pin

        GPIO.setup(enable_pin, GPIO.OUT)
        GPIO.setup(in1_pin, GPIO.OUT)
        GPIO.setup(in2_pin, GPIO.OUT)

        self.pwm = GPIO.PWM(enable_pin, 1000)  # 1kHz frequency
        self.pwm.start(0)

    def set_speed(self, speed):
        """Set motor speed: -100 to 100"""
        if speed > 0:
            GPIO.output(self.in1, GPIO.HIGH)
            GPIO.output(self.in2, GPIO.LOW)
        else:
            GPIO.output(self.in1, GPIO.LOW)
            GPIO.output(self.in2, GPIO.HIGH)

        self.pwm.ChangeDutyCycle(abs(speed))
```

#### Servo Motors
Position-controlled motors with built-in feedback:
- Standard servos: 180° rotation typical
- Continuous rotation servos: Full rotation
- Digital servos: Better holding torque and precision

**Position Control**:
```text
τ = Kp(θ_desired - θ_actual) + Kd·θ_dot
```

Where τ is torque, Kp is proportional gain, Kd is derivative gain, θ is angle, and θ_dot is angular velocity.

#### Stepper Motors
Discrete step positioning without feedback:
- Precise positioning (e.g., 1.8° per step)
- Can lose steps under high load
- Used in 3D printers, CNC machines

### Hydraulic Actuators

High force-to-weight ratio:
- Used in large-scale robots and heavy machinery
- Boston Dynamics' Atlas uses hydraulics
- Challenges: Messy, requires pump and reservoir, control complexity

**Advantages**:
- Very high power density
- Fast response
- Natural compliance

**Disadvantages**:
- Leakage and maintenance
- Energy inefficiency
- Noise

### Pneumatic Actuators

Compressed air-powered:
- Soft robotics applications
- Inherently compliant (safe for human interaction)
- Used in industrial automation

### Series Elastic Actuators (SEA)

Motor with an elastic element (spring) in series:

**Key Benefits**:
1. Force control through spring deflection
2. Impact absorption
3. Energy storage
4. Safer human interaction

**Torque Measurement**:
```text
τ = ks · Δx
```

Where ks is spring stiffness and Δx is deflection.

Many modern humanoid robots (e.g., ANYmal, Cassie) use SEAs.

## Motor Specifications

Understanding datasheets:

### Key Parameters

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| **Rated Voltage** | Nominal operating voltage | 12V, 24V, 48V |
| **No-load Speed** | Maximum speed without load | 5000-10000 RPM |
| **Stall Torque** | Maximum torque at zero speed | 1-10 Nm |
| **Rated Current** | Current at rated load | 1-10 A |
| **Efficiency** | Power out / Power in | 70-90% |
| **Weight** | Motor mass | 100g - 5kg |

### Torque-Speed Curve

Linear relationship for DC motors:

```text
ω = ω₀ - (τ / τ_stall) * ω₀
```

Where ω₀ is no-load speed, τ is current torque, and τ_stall is stall torque.

```python
import matplotlib.pyplot as plt
import numpy as np

# Motor specifications
omega_0 = 6000  # RPM no-load speed
tau_stall = 5   # Nm stall torque

# Generate torque-speed curve
tau = np.linspace(0, tau_stall, 100)
omega = omega_0 * (1 - tau/tau_stall)

plt.plot(tau, omega)
plt.xlabel('Torque (Nm)')
plt.ylabel('Speed (RPM)')
plt.title('DC Motor Torque-Speed Curve')
plt.grid(True)
plt.show()
```

## Gearboxes and Transmissions

Motors typically spin too fast and with too little torque for direct use.

### Gear Reduction

**Gear Ratio**:
```text
GR = ω_in / ω_out = τ_out / τ_in
```

Higher gear ratio = lower speed, higher torque.

### Types of Gearboxes

**Spur Gears**:
- Simple, efficient (95-98%)
- Noisy at high speeds

**Planetary Gears**:
- Compact, coaxial input/output
- High gear ratios in small package
- Used in robot joints

**Harmonic Drives**:
- Very high gear ratios (50:1 to 300:1)
- Zero backlash
- Expensive but precise
- Common in robot arms

**Cycloidal Drives**:
- High efficiency and torque density
- Used in humanoid hip and knee joints

### Backlash

Play in the gears causing positioning error:
- Critical for precision tasks
- Minimize with preloading or zero-backlash designs

## Motor Control

Converting desired motion into electrical signals.

### Open-Loop Control

No feedback—just apply voltage/current:
- Simple but inaccurate
- Sensitive to disturbances and model errors

### Closed-Loop Control

Use encoder feedback for precision:

#### PID Control

Most common controller in robotics:

```text
u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de(t)/dt
```

Where:
- e(t) = r(t) - y(t) is error
- Kp, Ki, Kd are tunable gains

```python
class PIDController:
    def __init__(self, kp, ki, kd, dt):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.dt = dt

        self.integral = 0
        self.prev_error = 0

    def compute(self, setpoint, measurement):
        error = setpoint - measurement

        # Proportional term
        P = self.kp * error

        # Integral term with anti-windup
        self.integral += error * self.dt
        self.integral = np.clip(self.integral, -10, 10)  # Limit
        I = self.ki * self.integral

        # Derivative term
        derivative = (error - self.prev_error) / self.dt
        D = self.kd * derivative

        # Store for next iteration
        self.prev_error = error

        return P + I + D
```

**Tuning Guidelines**:
1. Start with Kp only, increase until oscillation
2. Add Kd to dampen oscillations
3. Add Ki to eliminate steady-state error
4. Fine-tune iteratively

#### Cascade Control

Nested control loops:
- Outer loop: Position control
- Inner loop: Velocity control
- Innermost: Current/torque control

Provides better disturbance rejection and performance.

### Advanced Control Methods

**Model Predictive Control (MPC)**:
- Predicts future behavior
- Optimizes control over a horizon
- Handles constraints naturally

**Adaptive Control**:
- Adjusts parameters online
- Useful for changing loads or dynamics

**Impedance Control**:
- Controls relationship between force and position
- Essential for physical interaction tasks

## Power and Energy

Energy is a critical constraint for mobile robots:

### Battery Technology

| Type | Energy Density | Power Density | Cycle Life | Cost |
|------|----------------|---------------|------------|------|
| **Lead-Acid** | 30-50 Wh/kg | Low | 500 | Low |
| **NiMH** | 60-100 Wh/kg | Medium | 1000 | Medium |
| **Li-Ion** | 150-250 Wh/kg | High | 500-1000 | Medium |
| **Li-Po** | 150-200 Wh/kg | Very High | 300-500 | High |

### Power Consumption

**Motor Power**:
```text
P = τ · ω = I · V
```

**Energy Calculation**:
```text
E = ∫P(t)dt from 0 to T
```

```python
def estimate_runtime(battery_capacity_wh, avg_power_w):
    """
    Estimate robot runtime.

    Args:
        battery_capacity_wh: Battery capacity in Watt-hours
        avg_power_w: Average power consumption in Watts

    Returns:
        Runtime in hours
    """
    efficiency = 0.85  # Battery discharge efficiency
    runtime_hours = (battery_capacity_wh * efficiency) / avg_power_w
    return runtime_hours

# Example: 1000Wh battery, 200W average consumption
print(f"Runtime: {estimate_runtime(1000, 200):.1f} hours")
```

### Energy-Efficient Actuation

Strategies to extend runtime:
1. **Regenerative braking**: Capture energy during deceleration
2. **Elastic energy storage**: Springs to store/release energy (e.g., in walking)
3. **Optimal gait**: Choose walking patterns that minimize energy
4. **Intermittent operation**: Power down unused subsystems

## Actuation in Humanoid Robots

Humanoids have unique actuation requirements:

### Joint Count and DOF

Typical humanoid has 30-50 degrees of freedom:
- Legs: 6 DOF each (hip: 3, knee: 1, ankle: 2)
- Arms: 7 DOF each (shoulder: 3, elbow: 1, wrist: 3)
- Hands: 12-20 DOF (fingers)
- Torso: 2-3 DOF
- Head/neck: 2-3 DOF

### Requirements by Body Part

**Legs**:
- High torque for lifting body weight
- Fast response for balance
- Example: Hip flexor ~200 Nm, knee ~150 Nm for human-sized robot

**Arms/Hands**:
- Lower torque but high dexterity
- Precise position control
- Force sensing for manipulation

**Torso**:
- Moderate torque
- Stabilization during locomotion

### Motor Placement

**Proximal**: Motors at hip (like humans)
- Reduces leg inertia
- Complex mechanical design (linkages, cable drives)

**Distal**: Motors at each joint
- Simple mechanical design
- Increases leg inertia (affects dynamics)

## Soft Robotics and Variable Stiffness

Emerging actuation paradigms:

### Soft Actuators

Made from compliant materials:
- Pneumatic artificial muscles (PAMs)
- Fluidic elastomer actuators
- Shape memory alloys (SMAs)

**Benefits**:
- Inherently safe
- Adaptable to object shapes
- Robust to impacts

### Variable Stiffness Actuators

Can change joint stiffness on demand:
- Useful for tasks requiring variable compliance
- Energy storage in elastic elements
- Example: MACCEPA, AwAS actuators

## Summary

Actuation is the means by which robots interact physically with their environment. The choice of actuators involves tradeoffs between power, precision, weight, cost, and efficiency. Electric motors remain dominant due to their versatility and controllability, but hydraulic, pneumatic, and soft actuators have important niche applications. For humanoid robots, the challenge is achieving human-like performance with artificial actuators that differ fundamentally from biological muscles.

## Key Takeaways

- Electric motors (DC, BLDC, servo, stepper) are the workhorses of robotics
- Gearboxes trade speed for torque; gear ratio is a critical design choice
- PID control is ubiquitous for motor position/velocity control
- Energy and power constraints are fundamental limitations for mobile robots
- Humanoid robots require many actuators with varying torque/speed requirements
- Soft and variable stiffness actuators enable new interaction capabilities

## Exercises

1. **Motor Selection**: Given a joint that requires 50 Nm at 30 RPM, select an appropriate motor and gearbox combination.

2. **PID Tuning**: Implement and tune a PID controller for a simulated DC motor with position feedback.

3. **Power Analysis**: Calculate the total power consumption of a humanoid robot standing vs. walking. Estimate battery runtime.

4. **Torque Calculation**: For a humanoid leg, compute the knee torque required to stand up from a sitting position.

## Further Reading

- Siciliano, B., et al. (2016). "Robotics: Modelling, Planning and Control"
- Spong, M. W., et al. (2020). "Robot Modeling and Control"
- Documentation from motor manufacturers (Maxon, Dynamixel, ODrive)

---

**Next**: [Chapter 4: Computing and Control Architecture](./chapter4-computing.md)
