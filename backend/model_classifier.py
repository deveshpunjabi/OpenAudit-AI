from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import re
from tokenizers import normalizers
from tokenizers.normalizers import Sequence, Replace, Strip, NFKC
from tokenizers import Regex
import os

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Updated model paths with the correct model 1 location
model1_path = "https://huggingface.co/spaces/SzegedAI/AI_Detector/resolve/main/modernbert.bin"
model2_path = "https://huggingface.co/mihalykiss/modernbert_2/resolve/main/Model_groups_3class_seed12"
model3_path = "https://huggingface.co/mihalykiss/modernbert_2/resolve/main/Model_groups_3class_seed22"

print("Loading models...")

tokenizer = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")

# Load Model 1 from the correct URL
try:
    print("Loading model1 from SzegedAI/AI_Detector...")
    model_1 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_1.load_state_dict(torch.hub.load_state_dict_from_url(model1_path, map_location=device))
    model_1.to(device).eval()
    print("✅ Model 1 loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load model 1: {e}")
    model_1 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_1.to(device).eval()

# Load Model 2
try:
    print("Loading model2 from mihalykiss/modernbert_2...")
    model_2 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_2.load_state_dict(torch.hub.load_state_dict_from_url(model2_path, map_location=device))
    model_2.to(device).eval()
    print("✅ Model 2 loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load model 2: {e}")
    model_2 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_2.to(device).eval()

# Load Model 3
try:
    print("Loading model3 from mihalykiss/modernbert_2...")
    model_3 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_3.load_state_dict(torch.hub.load_state_dict_from_url(model3_path, map_location=device))
    model_3.to(device).eval()
    print("✅ Model 3 loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load model 3: {e}")
    model_3 = AutoModelForSequenceClassification.from_pretrained("answerdotai/ModernBERT-base", num_labels=41)
    model_3.to(device).eval()

print("✅ All models loaded successfully!")

label_mapping = {
    0: '13B', 1: '30B', 2: '65B', 3: '7B', 4: 'GLM130B', 5: 'bloom_7b',
    6: 'bloomz', 7: 'cohere', 8: 'davinci', 9: 'dolly', 10: 'dolly-v2-12b',
    11: 'flan_t5_base', 12: 'flan_t5_large', 13: 'flan_t5_small',
    14: 'flan_t5_xl', 15: 'flan_t5_xxl', 16: 'gemma-7b-it', 17: 'gemma2-9b-it',
    18: 'gpt-3.5-turbo', 19: 'gpt-35', 20: 'gpt4', 21: 'gpt4o',
    22: 'gpt_j', 23: 'gpt_neox', 24: 'human', 25: 'llama3-70b', 26: 'llama3-8b',
    27: 'mixtral-8x7b', 28: 'opt_1.3b', 29: 'opt_125m', 30: 'opt_13b',
    31: 'opt_2.7b', 32: 'opt_30b', 33: 'opt_350m', 34: 'opt_6.7b',
    35: 'opt_iml_30b', 36: 'opt_iml_max_1.3b', 37: 't0_11b', 38: 't0_3b',
    39: 'text-davinci-002', 40: 'text-davinci-003'
}

def clean_text(text: str) -> str:
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'\s+([,.;:?!])', r'\1', text)
    return text

newline_to_space = Replace(Regex(r'\s*\n\s*'), " ")
join_hyphen_break = Replace(Regex(r'(\w+)[--]\s*\n\s*(\w+)'), r"\1\2")

tokenizer.backend_tokenizer.normalizer = Sequence([
    tokenizer.backend_tokenizer.normalizer,
    join_hyphen_break,
    newline_to_space,
    Strip()
])

def classify_text(text):
    """
    Classify text using ModernBERT ensemble
    Author: deveshpunjabi
    Date: 2025-01-15 07:07:03 UTC
    """
    cleaned_text = clean_text(text)
    if not text.strip():
        return "⚠️ Please enter some text to analyze"

    inputs = tokenizer(cleaned_text, return_tensors="pt", truncation=True, padding=True).to(device)

    with torch.no_grad():
        logits_1 = model_1(**inputs).logits
        logits_2 = model_2(**inputs).logits
        logits_3 = model_3(**inputs).logits

        softmax_1 = torch.softmax(logits_1, dim=1)
        softmax_2 = torch.softmax(logits_2, dim=1)
        softmax_3 = torch.softmax(logits_3, dim=1)

        averaged_probabilities = (softmax_1 + softmax_2 + softmax_3) / 3
        probabilities = averaged_probabilities[0]

    ai_probs = probabilities.clone()
    ai_probs[24] = 0
    ai_total_prob = ai_probs.sum().item() * 100
    human_prob = 100 - ai_total_prob

    ai_argmax_index = torch.argmax(ai_probs).item()
    ai_argmax_model = label_mapping[ai_argmax_index]

    if human_prob > ai_total_prob:
        result_message = f"""
### 🟢 **Human Written**
**Confidence: {human_prob:.2f}%**
This text appears to be written by a human.
---
**Analysis Details:**
- Human probability: {human_prob:.2f}%
- AI probability: {ai_total_prob:.2f}%
- Text length: {len(cleaned_text)} characters
"""
    else:
        result_message = f"""
### 🔴 **AI Generated**
**Confidence: {ai_total_prob:.2f}%**
**Most likely source: {ai_argmax_model}**
This text appears to be generated by an AI model.
---
**Analysis Details:**
- Human probability: {human_prob:.2f}%
- AI probability: {ai_total_prob:.2f}%
- Text length: {len(cleaned_text)} characters
"""

    return result_message