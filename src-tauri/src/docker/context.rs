use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::Arc,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DockerContext {
    pub current_context: String,
    pub contexts: Vec<String>,
    pub auths: Vec<String>,
    pub creds_store: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DockerConfig {
    #[serde(default)]
    current_context: Option<String>,
    #[serde(default)]
    auths: HashMap<String, serde_json::Value>,
    #[serde(default)]
    creds_store: Option<String>,
}

/// Read the Docker CLI config (~/.docker/config.json) and return the
/// current context, available contexts, and credential store info.
pub async fn read_config() -> DockerContext {
    tokio::task::spawn_blocking(|| read_config_sync())
        .await
        .unwrap_or_default()
}

fn config_path() -> PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| "/root".into());
    PathBuf::from(home).join(".docker").join("config.json")
}

fn read_config_sync() -> DockerContext {
    let path = config_path();
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => {
            return DockerContext {
                current_context: "default".into(),
                contexts: vec!["default".into()],
                auths: vec![],
                creds_store: None,
            };
        }
    };

    let config: DockerConfig = match serde_json::from_str(&content) {
        Ok(c) => c,
        Err(_) => {
            return DockerContext {
                current_context: "default".into(),
                contexts: vec!["default".into()],
                auths: vec![],
                creds_store: None,
            };
        }
    };

    // Scan ~/.docker/contexts/meta/ for available contexts
    let contexts = list_context_dirs();

    DockerContext {
        current_context: config.current_context.unwrap_or_else(|| "default".into()),
        contexts,
        auths: config.auths.keys().cloned().collect(),
        creds_store: config.creds_store,
    }
}

/// Scan the Docker contexts directory for available context names.
fn list_context_dirs() -> Vec<String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| "/root".into());
    let meta_dir = PathBuf::from(home).join(".docker").join("contexts").join("meta");

    let mut contexts = vec!["default".to_string()];
    if let Ok(entries) = std::fs::read_dir(&meta_dir) {
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                if let Ok(meta_file) = std::fs::read_to_string(entry.path().join("meta.json")) {
                    if let Ok(meta) = serde_json::from_str::<serde_json::Value>(&meta_file) {
                        if let Some(name) = meta.get("Name").and_then(|n| n.as_str()) {
                            contexts.push(name.to_string());
                        }
                    }
                }
            }
        }
    }
    contexts
}

impl Default for DockerContext {
    fn default() -> Self {
        Self {
            current_context: "default".into(),
            contexts: vec!["default".into()],
            auths: vec![],
            creds_store: None,
        }
    }
}
