mod types;

#[cfg(windows)]
mod windows;

#[cfg(not(windows))]
mod stub;

pub use types::ActiveWindowContextPayload;

/// Reads the current active window context using the active platform adapter.
pub fn read_active_window_context() -> Result<Option<ActiveWindowContextPayload>, String> {
    #[cfg(windows)]
    {
        return windows::read_active_window_context();
    }

    #[cfg(not(windows))]
    {
        stub::read_active_window_context()
    }
}
