use super::types::ActiveWindowContextPayload;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use windows::core::{BSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HANDLE, HWND};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_INPROC_SERVER,
    COINIT_APARTMENTTHREADED,
};
use windows::Win32::System::ProcessStatus::GetModuleFileNameExW;
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_INFORMATION,
    PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
};
use windows::Win32::System::Variant::VARIANT;
use windows::Win32::UI::Accessibility::{
    CUIAutomation, IUIAutomation, IUIAutomationCondition, IUIAutomationElement,
    IUIAutomationElementArray, IUIAutomationValuePattern, TreeScope_Subtree,
    UIA_ControlTypePropertyId, UIA_EditControlTypeId, UIA_ValuePatternId,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
};

const BROWSER_KIND_CHROME: &str = "chrome";
const BROWSER_KIND_EDGE: &str = "edge";
const BROWSER_KIND_OTHER_BROWSER: &str = "other_browser";
const BROWSER_KIND_NON_BROWSER: &str = "non_browser";
const CHROME_MCP_BROWSER_URL: &str = "http://127.0.0.1:9222";

struct ComGuard {
    should_uninitialize: bool,
}

impl ComGuard {
    fn initialize() -> Result<Self, String> {
        let result = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };

        if result.is_ok() {
            Ok(Self {
                should_uninitialize: true,
            })
        } else {
            Ok(Self {
                should_uninitialize: false,
            })
        }
    }
}

impl Drop for ComGuard {
    fn drop(&mut self) {
        if self.should_uninitialize {
            unsafe {
                CoUninitialize();
            }
        }
    }
}

/// Reads the current active desktop window context, resolving browser URL when
/// the active process exposes one.
pub fn read_active_window_context() -> Result<Option<ActiveWindowContextPayload>, String> {
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.0.is_null() {
        return Ok(None);
    }

    let process_path = get_process_path(hwnd);
    let app_name = process_path
        .as_deref()
        .and_then(extract_process_stem)
        .unwrap_or_else(|| "unknown".to_string());
    let browser_kind = classify_browser_kind(&app_name);
    let title = get_window_title(hwnd);
    let url = match browser_kind {
        BROWSER_KIND_CHROME => read_chrome_url_via_mcp(title.as_deref()).or_else(|| read_browser_url_via_uia(hwnd)),
        BROWSER_KIND_EDGE | BROWSER_KIND_OTHER_BROWSER => read_browser_url_via_uia(hwnd),
        _ => None,
    };

    Ok(Some(ActiveWindowContextPayload {
        app_name,
        process_path,
        title,
        url,
        browser_kind: browser_kind.to_string(),
    }))
}

fn classify_browser_kind(app_name: &str) -> &'static str {
    match app_name.to_ascii_lowercase().as_str() {
        "chrome" => BROWSER_KIND_CHROME,
        "msedge" => BROWSER_KIND_EDGE,
        "firefox" | "opera" | "brave" | "vivaldi" => BROWSER_KIND_OTHER_BROWSER,
        _ => BROWSER_KIND_NON_BROWSER,
    }
}

fn get_process_path(hwnd: HWND) -> Option<String> {
    let process_handle = open_process(hwnd)?;
    let path = get_module_file_name(process_handle).or_else(|| get_query_process_image_name(process_handle));

    unsafe {
        let _ = CloseHandle(process_handle);
    }

    path
}

fn open_process(hwnd: HWND) -> Option<HANDLE> {
    let process_id = unsafe {
        let mut process_id = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        process_id
    };

    if process_id == 0 {
        return None;
    }

    unsafe {
        OpenProcess(
            PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            false,
            process_id,
        )
        .ok()
    }
}

fn get_module_file_name(process: HANDLE) -> Option<String> {
    let mut buffer = vec![0u16; 1024];
    let size = unsafe { GetModuleFileNameExW(Some(process), None, &mut buffer) };
    if size == 0 {
        return None;
    }

    Some(String::from_utf16_lossy(&buffer[..size as usize]))
}

fn get_query_process_image_name(process: HANDLE) -> Option<String> {
    let mut buffer = vec![0u16; 1024];
    let mut size = buffer.len() as u32;

    if unsafe {
        QueryFullProcessImageNameW(process, PROCESS_NAME_WIN32, PWSTR(buffer.as_mut_ptr()), &mut size)
    }
    .is_err()
        || size == 0
    {
        return None;
    }

    Some(String::from_utf16_lossy(&buffer[..size as usize]))
}

fn extract_process_stem(path: &str) -> Option<String> {
    Path::new(path)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .map(ToString::to_string)
}

fn get_window_title(hwnd: HWND) -> Option<String> {
    let text_length = unsafe { GetWindowTextLengthW(hwnd) };
    if text_length <= 0 {
        return None;
    }

    let mut buffer = vec![0u16; text_length as usize + 1];
    let written = unsafe { GetWindowTextW(hwnd, &mut buffer) };
    if written <= 0 {
        return None;
    }

    Some(String::from_utf16_lossy(&buffer[..written as usize]))
}

fn read_chrome_url_via_mcp(window_title: Option<&str>) -> Option<String> {
    let browser_url_arg = format!("--browser-url={CHROME_MCP_BROWSER_URL}");

    let mut child = Command::new("cmd")
        .args([
            "/C",
            "npx",
            "-y",
            "chrome-devtools-mcp@latest",
            browser_url_arg.as_str(),
            "--no-usage-statistics",
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;

    let mut stdin = child.stdin.take()?;
    let stdout = child.stdout.take()?;
    let mut reader = BufReader::new(stdout);

    if write_mcp_message(
        &mut stdin,
        &serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "cialloclaw-desktop",
                    "version": "0.1.0"
                }
            }
        }),
    )
    .is_err()
    {
        let _ = child.kill();
        return None;
    }

    let _ = read_mcp_message(&mut reader);
    let _ = write_mcp_message(
        &mut stdin,
        &serde_json::json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
        }),
    );
    let _ = write_mcp_message(
        &mut stdin,
        &serde_json::json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "list_pages",
                "arguments": {}
            }
        }),
    );

    let response = read_mcp_message(&mut reader).ok();
    let _ = child.kill();

    response.and_then(|value| parse_chrome_mcp_url(&value, window_title))
}

fn write_mcp_message(writer: &mut dyn Write, message: &serde_json::Value) -> Result<(), String> {
    let payload = message.to_string();
    writer
        .write_all(format!("Content-Length: {}\r\n\r\n{}", payload.len(), payload).as_bytes())
        .map_err(|error| format!("failed to write MCP message: {error}"))?;
    writer.flush().map_err(|error| format!("failed to flush MCP message: {error}"))
}

fn read_mcp_message(reader: &mut dyn BufRead) -> Result<serde_json::Value, String> {
    let mut content_length = 0usize;

    loop {
        let mut line = String::new();
        let bytes_read = reader.read_line(&mut line).map_err(|error| format!("failed to read MCP header: {error}"))?;
        if bytes_read == 0 {
            return Err("unexpected EOF while reading MCP message".to_string());
        }

        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }

        if let Some(length) = trimmed.strip_prefix("Content-Length:") {
            content_length = length.trim().parse().map_err(|error| format!("invalid MCP content length: {error}"))?;
        }
    }

    if content_length == 0 {
        return Err("missing MCP content length".to_string());
    }

    let mut payload = vec![0u8; content_length];
    reader.read_exact(&mut payload).map_err(|error| format!("failed to read MCP payload: {error}"))?;
    serde_json::from_slice(&payload).map_err(|error| format!("failed to parse MCP payload: {error}"))
}

fn parse_chrome_mcp_url(value: &serde_json::Value, window_title: Option<&str>) -> Option<String> {
    let result = value.get("result")?;

    if let Some(pages) = result
        .get("structuredContent")
        .and_then(|content| content.get("pages"))
        .and_then(serde_json::Value::as_array)
    {
        return select_matching_page_url(pages, window_title);
    }

    let text = result
        .get("content")
        .and_then(serde_json::Value::as_array)
        .and_then(|items| items.iter().find_map(|item| item.get("text")?.as_str()))?;

    text.lines()
        .filter_map(|line| {
            line.split_whitespace()
                .find(|segment| looks_like_url(segment))
                .map(ToString::to_string)
        })
        .next()
}

fn select_matching_page_url(pages: &[serde_json::Value], window_title: Option<&str>) -> Option<String> {
    if let Some(title) = window_title {
        if let Some(page) = pages.iter().find(|page| {
            page.get("title")
                .and_then(serde_json::Value::as_str)
                .map(|value| title.contains(value) || value.contains(title))
                .unwrap_or(false)
        }) {
            return page.get("url").and_then(serde_json::Value::as_str).map(ToString::to_string);
        }
    }

    pages
        .iter()
        .find(|page| page.get("selected").and_then(serde_json::Value::as_bool).unwrap_or(false))
        .or_else(|| pages.first())
        .and_then(|page| page.get("url").and_then(serde_json::Value::as_str))
        .map(ToString::to_string)
}

fn read_browser_url_via_uia(hwnd: HWND) -> Option<String> {
    let _com_guard = ComGuard::initialize().ok()?;
    let automation: IUIAutomation = unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok()? };
    let root_element = unsafe { automation.ElementFromHandle(hwnd).ok()? };
    let edit_control_type = VARIANT::from(UIA_EditControlTypeId.0);
    let condition: IUIAutomationCondition = unsafe {
        automation
            .CreatePropertyCondition(UIA_ControlTypePropertyId, &edit_control_type)
            .ok()?
    };
    let matches: IUIAutomationElementArray = unsafe { root_element.FindAll(TreeScope_Subtree, &condition).ok()? };
    let length = unsafe { matches.Length().ok()? };

    for index in 0..length {
        let element = unsafe { matches.GetElement(index).ok()? };
        if let Some(candidate_url) = read_element_url_candidate(&element) {
            return Some(candidate_url);
        }
    }

    None
}

fn read_element_url_candidate(element: &IUIAutomationElement) -> Option<String> {
    let value_pattern: IUIAutomationValuePattern = unsafe { element.GetCurrentPatternAs(UIA_ValuePatternId).ok()? };
    let value = unsafe { value_pattern.CurrentValue().ok()? }.to_string();
    let trimmed_value = value.trim();
    if looks_like_url(trimmed_value) {
        return Some(trimmed_value.to_string());
    }

    let name: BSTR = unsafe { element.CurrentName().ok()? };
    let trimmed_name = name.to_string().trim().to_string();
    if looks_like_url(&trimmed_name) {
        return Some(trimmed_name);
    }

    None
}

fn looks_like_url(value: &str) -> bool {
    let lower = value.to_ascii_lowercase();
    lower.starts_with("http://")
        || lower.starts_with("https://")
        || lower.starts_with("file://")
        || lower.starts_with("edge://")
        || lower.starts_with("chrome://")
        || lower.starts_with("about:")
}
