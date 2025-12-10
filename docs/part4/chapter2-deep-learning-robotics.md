# Chapter 2: Deep Learning for Robotics

## Introduction

Deep learning has revolutionized robotics perception and control. This chapter explores neural network architectures and applications in robotics.

## Convolutional Neural Networks (CNNs)

### Image Processing

```python
import torch
import torch.nn as nn

class RobotVisionCNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.classifier = nn.Sequential(
            nn.Linear(256 * 28 * 28, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x
```

## Recurrent Neural Networks (RNNs)

### Sequential Decision Making

```python
class RobotLSTMController(nn.Module):
    def __init__(self, state_dim, action_dim, hidden_dim):
        super().__init__()
        self.lstm = nn.LSTM(state_dim, hidden_dim, num_layers=2, batch_first=True)
        self.fc = nn.Linear(hidden_dim, action_dim)

    def forward(self, state_sequence, hidden=None):
        lstm_out, hidden = self.lstm(state_sequence, hidden)
        actions = self.fc(lstm_out)
        return actions, hidden
```

## Reinforcement Learning

### Deep Q-Networks (DQN)

```python
class DQN(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, action_dim)
        )

    def forward(self, state):
        return self.network(state)

class DQNAgent:
    def __init__(self, state_dim, action_dim, lr=1e-3):
        self.q_network = DQN(state_dim, action_dim)
        self.target_network = DQN(state_dim, action_dim)
        self.optimizer = torch.optim.Adam(self.q_network.parameters(), lr=lr)
        self.memory = ReplayBuffer(capacity=10000)

    def select_action(self, state, epsilon=0.1):
        if np.random.rand() < epsilon:
            return np.random.randint(self.action_dim)  # Explore
        else:
            with torch.no_grad():
                q_values = self.q_network(torch.FloatTensor(state))
                return q_values.argmax().item()  # Exploit

    def train(self, batch_size=64):
        if len(self.memory) < batch_size:
            return

        # Sample batch
        states, actions, rewards, next_states, dones = self.memory.sample(batch_size)

        # Compute Q-values
        q_values = self.q_network(states).gather(1, actions.unsqueeze(1))

        # Compute target Q-values
        with torch.no_grad():
            next_q_values = self.target_network(next_states).max(1)[0]
            targets = rewards + 0.99 * next_q_values * (1 - dones)

        # Update network
        loss = nn.MSELoss()(q_values.squeeze(), targets)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
```

### Policy Gradient Methods (PPO)

```python
class PPOAgent:
    def __init__(self, state_dim, action_dim):
        self.actor = Actor(state_dim, action_dim)
        self.critic = Critic(state_dim)
        self.optimizer_actor = torch.optim.Adam(self.actor.parameters(), lr=3e-4)
        self.optimizer_critic = torch.optim.Adam(self.critic.parameters(), lr=1e-3)

    def train(self, trajectories, epochs=10, clip_ratio=0.2):
        states, actions, old_log_probs, returns, advantages = trajectories

        for _ in range(epochs):
            # Actor loss (clipped surrogate objective)
            log_probs = self.actor.log_prob(states, actions)
            ratio = torch.exp(log_probs - old_log_probs)
            clipped_ratio = torch.clamp(ratio, 1-clip_ratio, 1+clip_ratio)
            actor_loss = -torch.min(ratio * advantages,
                                   clipped_ratio * advantages).mean()

            # Critic loss
            values = self.critic(states)
            critic_loss = nn.MSELoss()(values, returns)

            # Update networks
            self.optimizer_actor.zero_grad()
            actor_loss.backward()
            self.optimizer_actor.step()

            self.optimizer_critic.zero_grad()
            critic_loss.backward()
            self.optimizer_critic.step()
```

## Vision-Language-Action (VLA) Models

### Transformer-Based Controllers

```python
class VLAModel(nn.Module):
    def __init__(self, vision_encoder, language_encoder, action_decoder):
        super().__init__()
        self.vision_encoder = vision_encoder
        self.language_encoder = language_encoder
        self.action_decoder = action_decoder
        self.fusion = nn.MultiheadAttention(embed_dim=512, num_heads=8)

    def forward(self, image, text_instruction):
        # Encode visual input
        vision_features = self.vision_encoder(image)

        # Encode language instruction
        language_features = self.language_encoder(text_instruction)

        # Cross-attention fusion
        fused_features, _ = self.fusion(vision_features, language_features, language_features)

        # Decode actions
        actions = self.action_decoder(fused_features)

        return actions
```

## Summary

Deep learning enables robots to learn complex behaviors from data, improving perception, control, and decision-making.

## Exercises

1. Train a CNN for object recognition
2. Implement DQN for robot navigation
3. Design a VLA model architecture
4. Compare supervised vs. reinforcement learning

## Further Reading

- Goodfellow et al. - "Deep Learning"
- Sutton & Barto - "Reinforcement Learning"
- Levine et al. - "End-to-End Training of Deep Visuomotor Policies"
