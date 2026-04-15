import csv
import json
import os
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer

class DarkPatternDataset(Dataset):
    def __init__(
        self,
        csv_path: str,
        tokenizer_name: str = "distilbert-base-uncased",
        max_length: int = 128,
        tokenizer: AutoTokenizer = None,
    ):
        self.max_length = max_length
        self.tokenizer = tokenizer or AutoTokenizer.from_pretrained(tokenizer_name)
        self.texts = []
        self.labels = []

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                text = row["text"].strip()
                if text:
                    self.texts.append(text)
                    self.labels.append(json.loads(row["labels"]))

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        labels = self.labels[idx]

        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.tensor(labels, dtype=torch.float),
        }

def create_dataloaders(
    train_path: str,
    test_path: str,
    tokenizer_name: str = "distilbert-base-uncased",
    max_length: int = 128,
    batch_size: int = 32,
    num_workers: int = 0,
) -> tuple:
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)

    train_dataset = DarkPatternDataset(
        csv_path=train_path,
        max_length=max_length,
        tokenizer=tokenizer,
    )

    test_dataset = DarkPatternDataset(
        csv_path=test_path,
        max_length=max_length,
        tokenizer=tokenizer,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    print(f"✓ Created DataLoaders:")
    print(f"  Train: {len(train_dataset)} samples, {len(train_loader)} batches")
    print(f"  Test:  {len(test_dataset)} samples, {len(test_loader)} batches")

    return train_loader, test_loader, tokenizer

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

    processed_dir = os.path.join(os.path.dirname(__file__), "processed")
    train_path = os.path.join(processed_dir, "train_augmented.csv")
    test_path = os.path.join(processed_dir, "test.csv")

    if not os.path.exists(train_path):
        train_path = os.path.join(processed_dir, "train.csv")

    if os.path.exists(train_path) and os.path.exists(test_path):
        train_loader, test_loader, tokenizer = create_dataloaders(
            train_path, test_path, batch_size=8
        )
        batch = next(iter(train_loader))
        print(f"\nSample batch shapes:")
        print(f"  input_ids:      {batch['input_ids'].shape}")
        print(f"  attention_mask:  {batch['attention_mask'].shape}")
        print(f"  labels:          {batch['labels'].shape}")
    else:
        print("✗ Processed data not found. Run preprocess.py first!")
