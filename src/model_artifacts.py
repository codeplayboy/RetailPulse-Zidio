"""Utility helpers for loading and saving production model artifacts."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Union

import joblib


def save_artifact(obj: Any, artifact_path: Union[str, Path]) -> Path:
    """Persist a Python object to disk using joblib."""
    path = Path(artifact_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(obj, path)
    return path


def load_artifact(artifact_path: Union[str, Path]) -> Any:
    """Load a joblib-persisted Python object from disk."""
    path = Path(artifact_path)
    if not path.exists():
        raise FileNotFoundError(f"Artifact not found: {path}")
    return joblib.load(path)


def save_prophet_model_artifact(model: Any, artifact_path: Union[str, Path] = "models/prophet_model.pkl") -> Path:
    """Persist a fitted Prophet model for later inference."""
    return save_artifact(model, artifact_path)


def load_prophet_model_artifact(artifact_path: Union[str, Path] = "models/prophet_model.pkl") -> Any:
    """Load a fitted Prophet model artifact."""
    return load_artifact(artifact_path)


def save_churn_model_artifact(model: Any, artifact_path: Union[str, Path] = "models/churn_model.pkl") -> Path:
    """Persist a fitted churn model artifact."""
    return save_artifact(model, artifact_path)


def load_churn_model_artifact(artifact_path: Union[str, Path] = "models/churn_model.pkl") -> Any:
    """Load a fitted churn model artifact."""
    return load_artifact(artifact_path)


def save_model_bundle(bundle: Dict[str, Any], base_dir: Union[str, Path] = "models") -> Dict[str, Path]:
    """Save a dictionary of model assets into a shared directory."""
    base_path = Path(base_dir)
    base_path.mkdir(parents=True, exist_ok=True)

    written_paths: Dict[str, Path] = {}
    for name, obj in bundle.items():
        written_paths[name] = save_artifact(obj, base_path / f"{name}.pkl")
    return written_paths
