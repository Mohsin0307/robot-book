# Chapter 4: Foundation Models for Robotics

## Introduction

Foundation models pre-trained on massive datasets are transforming robotics by providing powerful representations for perception, language, and control.

## Vision Foundation Models

### CLIP (Contrastive Language-Image Pre-training)

```python
import torch
import clip

class CLIPBasedPerception:
    def __init__(self):
        self.model, self.preprocess = clip.load("ViT-B/32")

    def classify_object(self, image, candidate_labels):
        """Zero-shot object classification"""
        image_input = self.preprocess(image).unsqueeze(0)
        text_inputs = clip.tokenize(candidate_labels)

        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_inputs)

            # Compute similarity
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            similarity = (image_features @ text_features.T).squeeze()

        return candidate_labels[similarity.argmax().item()]

    def compute_similarity(self, image, text_description):
        """Measure image-text similarity"""
        image_input = self.preprocess(image).unsqueeze(0)
        text_input = clip.tokenize([text_description])

        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_input)

            similarity = torch.cosine_similarity(image_features, text_features)

        return similarity.item()
```

### Segment Anything Model (SAM)

```python
from segment_anything import sam_model_registry, SamPredictor

class SAMBasedSegmentation:
    def __init__(self, checkpoint_path):
        sam = sam_model_registry["vit_h"](checkpoint=checkpoint_path)
        self.predictor = SamPredictor(sam)

    def segment_object(self, image, point_prompt):
        """Segment object from point prompt"""
        self.predictor.set_image(image)

        masks, scores, logits = self.predictor.predict(
            point_coords=point_prompt,
            point_labels=np.array([1]),  # Foreground point
            multimask_output=True
        )

        # Select best mask
        best_mask = masks[scores.argmax()]

        return best_mask

    def segment_from_text(self, image, text_description):
        """Text-prompted segmentation (using CLIP + SAM)"""
        # Use CLIP to find relevant regions
        attention_map = self.clip_attention(image, text_description)

        # Use attention peaks as prompts for SAM
        point_prompts = self.extract_peaks(attention_map, num_points=5)

        masks = []
        for point in point_prompts:
            mask = self.segment_object(image, point)
            masks.append(mask)

        # Merge masks
        final_mask = self.merge_masks(masks)

        return final_mask
```

## Language Models for Robot Control

### LLM-Based Task Planning

```python
class LLMTaskPlanner:
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)

    def plan_task(self, task_description, scene_description, available_skills):
        """Generate task plan using LLM"""

        prompt = f"""
You are a robot task planner. Given a task, scene, and available skills,
generate a step-by-step plan.

Task: {task_description}
Scene: {scene_description}
Available Skills: {', '.join(available_skills)}

Generate a JSON plan with this structure:
{{
    "steps": [
        {{"skill": "skill_name", "parameters": {{"param": "value"}}}},
        ...
    ]
}}
"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        plan = json.loads(response.choices[0].message.content)
        return plan

    def verify_plan(self, plan, constraints):
        """Verify plan feasibility"""
        for step in plan['steps']:
            if not self.check_preconditions(step, constraints):
                return False, f"Step {step} violates constraints"

        return True, "Plan is feasible"
```

### Code Generation for Robot Control

```python
class CodeGeneratingLLM:
    def __init__(self):
        self.client = OpenAI()

    def generate_controller(self, specification):
        """Generate controller code from specification"""

        prompt = f"""
Generate Python code for a robot controller with this specification:
{specification}

The code should:
1. Use proper error handling
2. Include safety checks
3. Be production-ready

Return only the Python code, no explanations.
"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        code = response.choices[0].message.content

        # Validate generated code
        if self.validate_code(code):
            return code
        else:
            raise ValueError("Generated code failed validation")

    def validate_code(self, code):
        """Static analysis of generated code"""
        try:
            ast.parse(code)  # Syntax check
            # Additional checks: imports, safety patterns, etc.
            return True
        except SyntaxError:
            return False
```

## Multimodal Foundation Models

### Vision-Language-Action (VLA) Models

```python
class RT2Model:
    """Robotic Transformer 2 (RT-2) for VLA"""

    def __init__(self, checkpoint_path):
        self.model = load_pretrained_vla(checkpoint_path)

    def predict_action(self, image, text_instruction, robot_state):
        """Predict robot action from vision and language"""

        # Tokenize inputs
        image_tokens = self.model.encode_image(image)
        text_tokens = self.model.encode_text(text_instruction)
        state_tokens = self.model.encode_state(robot_state)

        # Concatenate tokens
        input_tokens = torch.cat([image_tokens, text_tokens, state_tokens], dim=1)

        # Predict action tokens
        action_tokens = self.model.generate(input_tokens, max_length=10)

        # Decode to continuous actions
        actions = self.model.decode_actions(action_tokens)

        return actions

    def fine_tune(self, robot_demonstrations):
        """Fine-tune VLA model on robot-specific data"""
        for demo in robot_demonstrations:
            loss = self.compute_loss(demo)
            loss.backward()
            self.optimizer.step()
```

## Prompt Engineering for Robotics

### Effective Prompting Strategies

```python
def create_robot_prompt(task, context, few_shot_examples=None):
    """Create effective prompt for robot LLM"""

    system_prompt = """
You are an expert robot control system. You must:
- Generate safe, executable plans
- Consider physical constraints
- Validate preconditions before actions
- Handle failures gracefully
"""

    user_prompt = f"""
Task: {task}
Current Scene: {context['scene']}
Robot Capabilities: {context['capabilities']}
Safety Constraints: {context['constraints']}

Generate a detailed action plan.
"""

    # Add few-shot examples if provided
    if few_shot_examples:
        examples_text = "\n\n".join([
            f"Example {i+1}:\nTask: {ex['task']}\nPlan: {ex['plan']}"
            for i, ex in enumerate(few_shot_examples)
        ])
        user_prompt = f"{examples_text}\n\n{user_prompt}"

    return system_prompt, user_prompt
```

## Summary

Foundation models provide powerful pre-trained representations that can be adapted for robotics tasks with minimal fine-tuning, enabling zero-shot and few-shot learning.

## Exercises

1. Use CLIP for zero-shot object recognition
2. Generate task plans with LLM
3. Fine-tune a VLA model
4. Design effective prompts for robot control

## Further Reading

- Radford et al. - "Learning Transferable Visual Models From Natural Language Supervision" (CLIP)
- Brohan et al. - "RT-2: Vision-Language-Action Models"
- OpenAI - "GPT-4 Technical Report"
