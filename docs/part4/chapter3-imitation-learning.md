# Chapter 3: Imitation Learning

## Introduction

Imitation learning enables robots to learn from demonstrations, accelerating skill acquisition without manual reward engineering.

## Behavioral Cloning

### Supervised Learning from Demonstrations

```python
import torch
import torch.nn as nn

class BehavioralCloningPolicy(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, action_dim),
            nn.Tanh()  # Bound actions to [-1, 1]
        )

    def forward(self, state):
        return self.network(state)

def train_behavioral_cloning(demonstrations, policy, epochs=100):
    """Train policy on expert demonstrations"""
    optimizer = torch.optim.Adam(policy.parameters(), lr=1e-3)
    criterion = nn.MSELoss()

    states, actions = demonstrations

    for epoch in range(epochs):
        predicted_actions = policy(states)
        loss = criterion(predicted_actions, actions)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
```

### Distribution Mismatch Problem

Behavioral cloning suffers from compounding errors:

```python
def evaluate_with_dagger(policy, expert, env, n_iterations=10):
    """DAgger: Dataset Aggregation algorithm"""
    dataset = []

    for iteration in range(n_iterations):
        # Collect trajectories using current policy
        states = []
        for episode in range(num_episodes):
            state = env.reset()
            done = False

            while not done:
                # Policy action
                action_policy = policy(state)

                # Expert action (oracle)
                action_expert = expert(state)

                # Store (state, expert_action)
                dataset.append((state, action_expert))

                # Execute policy action
                state, _, done, _ = env.step(action_policy)

        # Retrain policy on aggregated dataset
        train_behavioral_cloning(dataset, policy)

    return policy
```

## Inverse Reinforcement Learning (IRL)

### Learning Reward Functions

```python
def maximum_entropy_irl(demonstrations, feature_extractor, env):
    """MaxEnt IRL: Learn reward function from demonstrations"""

    # Initialize reward weights
    theta = np.random.randn(feature_dim)

    for iteration in range(max_iterations):
        # Compute optimal policy under current reward
        policy = compute_optimal_policy(theta, feature_extractor, env)

        # Compute feature expectations
        expert_features = compute_feature_expectations(demonstrations, feature_extractor)
        policy_features = compute_feature_expectations(policy, feature_extractor, env)

        # Gradient step
        gradient = expert_features - policy_features
        theta += learning_rate * gradient

    return theta  # Learned reward weights
```

### Generative Adversarial Imitation Learning (GAIL)

```python
class Discriminator(nn.Module):
    """Distinguish expert from policy trajectories"""
    def __init__(self, state_action_dim):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_action_dim, 128),
            nn.Tanh(),
            nn.Linear(128, 128),
            nn.Tanh(),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

    def forward(self, state_action):
        return self.network(state_action)

def train_gail(policy, discriminator, expert_data, env):
    """GAIL training loop"""
    for iteration in range(num_iterations):
        # Sample policy trajectories
        policy_data = collect_trajectories(policy, env)

        # Train discriminator
        for _ in range(discriminator_steps):
            expert_batch = sample(expert_data)
            policy_batch = sample(policy_data)

            # Discriminator loss
            expert_labels = torch.ones(len(expert_batch))
            policy_labels = torch.zeros(len(policy_batch))

            d_expert = discriminator(expert_batch)
            d_policy = discriminator(policy_batch)

            d_loss = -torch.mean(torch.log(d_expert) + torch.log(1 - d_policy))

            # Update discriminator
            d_loss.backward()
            discriminator_optimizer.step()

        # Train policy with discriminator as reward
        rewards = -torch.log(discriminator(policy_data))
        update_policy_ppo(policy, policy_data, rewards)
```

## Learning from Observation (LfO)

### Third-Person Imitation

```python
def learn_from_observation(observer_demos, robot, env):
    """Learn from third-person demonstrations"""

    # Visual correspondence: map observer view to robot view
    correspondence_model = train_correspondence(observer_demos, robot_demos)

    # Translate observed actions to robot frame
    robot_actions = []
    for obs_demo in observer_demos:
        robot_state = correspondence_model.map_state(obs_demo.state)
        robot_action = correspondence_model.map_action(obs_demo.action, robot_state)
        robot_actions.append((robot_state, robot_action))

    # Train policy on translated demonstrations
    policy = train_behavioral_cloning(robot_actions)

    return policy
```

## Summary

Imitation learning enables robots to learn from expert demonstrations, overcoming reward engineering challenges and improving sample efficiency.

## Exercises

1. Implement behavioral cloning
2. Apply DAgger to mitigate distribution shift
3. Train GAIL for a manipulation task
4. Compare imitation vs. reinforcement learning

## Further Reading

- Argall et al. - "A Survey of Robot Learning from Demonstration"
- Ho & Ermon - "Generative Adversarial Imitation Learning"
- Ziebart et al. - "Maximum Entropy Inverse Reinforcement Learning"
