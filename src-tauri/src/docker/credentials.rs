use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "dock";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredCredential {
    pub username: String,
    pub registry: String,
}

/// Store a Docker registry credential in the OS keychain.
pub fn save(registry: &str, username: &str, password: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, registry).map_err(|e| e.to_string())?;
    let payload = format!("{}:{}", username, password);
    entry.set_password(&payload).map_err(|e| e.to_string())
}

/// Retrieve a stored credential from the OS keychain.
pub fn get(registry: &str) -> Result<StoredCredential, String> {
    let entry = Entry::new(SERVICE_NAME, registry).map_err(|e| e.to_string())?;
    let payload = entry.get_password().map_err(|e| e.to_string())?;
    let (username, _password) = payload
        .split_once(':')
        .ok_or_else(|| "Invalid credential format".to_string())?;
    Ok(StoredCredential {
        username: username.to_string(),
        registry: registry.to_string(),
    })
}

/// Delete a stored credential from the OS keychain.
pub fn delete(registry: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, registry).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}
