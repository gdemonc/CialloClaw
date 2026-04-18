use super::types::ActiveWindowContextPayload;

/// Returns no active window context on platforms that do not yet expose a
/// native desktop-window implementation.
pub fn read_active_window_context() -> Result<Option<ActiveWindowContextPayload>, String> {
    Ok(None)
}
