use base64::Engine;
use serde::Serialize;
use std::process::Stdio;
use tauri::ipc::Channel;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StreamEvent {
    event_type: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    exit_code: Option<i32>,
}

/// Find the claude CLI binary path.
/// On Windows, `which` doesn't exist, so we try `where` first,
/// then fall back to common install paths.
fn find_claude_path() -> String {
    // Check env override
    if let Ok(p) = std::env::var("CLAUDE_PATH") {
        return p;
    }

    #[cfg(target_os = "windows")]
    {
        // Try `where claude` to resolve from PATH
        if let Ok(output) = std::process::Command::new("where")
            .arg("claude")
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout);
                if let Some(first_line) = path.lines().next() {
                    let trimmed = first_line.trim();
                    if !trimmed.is_empty() {
                        return trimmed.to_string();
                    }
                }
            }
        }

        // Fallback: common npm global install locations on Windows
        if let Ok(appdata) = std::env::var("APPDATA") {
            let npm_path = format!("{}\\npm\\claude.cmd", appdata);
            if std::path::Path::new(&npm_path).exists() {
                return npm_path;
            }
        }

        // Try common paths
        if let Ok(home) = std::env::var("USERPROFILE") {
            let paths = [
                format!("{}\\.claude\\local\\claude.exe", home),
                format!("{}\\AppData\\Local\\Programs\\claude\\claude.exe", home),
            ];
            for p in paths {
                if std::path::Path::new(&p).exists() {
                    return p;
                }
            }
        }

        "claude.cmd".to_string()
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Try login shell resolution
        for shell in &["/bin/zsh", "/bin/bash"] {
            if let Ok(output) = std::process::Command::new(shell)
                .args(["-lc", "which claude"])
                .output()
            {
                if output.status.success() {
                    let path = String::from_utf8_lossy(&output.stdout);
                    let trimmed = path.trim();
                    if !trimmed.is_empty() {
                        return trimmed.to_string();
                    }
                }
            }
        }

        "claude".to_string()
    }
}

#[tauri::command]
async fn generate_content(
    prompt: String,
    on_event: Channel<StreamEvent>,
) -> Result<(), String> {
    let claude_path = find_claude_path();

    let mut cmd = tokio::process::Command::new(&claude_path);
    cmd.arg("-p")
        .arg("--dangerously-skip-permissions")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    // Set working directory and explicitly pass MCP config so Claude CLI loads brand-brain tools
    if let Some(root) = find_project_root() {
        let mcp_config = root.join(".claude").join("mcp.json");
        if mcp_config.exists() {
            cmd.arg("--mcp-config").arg(&mcp_config);
        }
        cmd.current_dir(&root);

        // Ensure bun is in PATH so the MCP server subprocess can find it
        let bun_path = find_bun_path();
        if let Some(bun_dir) = std::path::Path::new(&bun_path).parent() {
            let sep = if cfg!(windows) { ";" } else { ":" };
            if let Ok(current_path) = std::env::var("PATH") {
                cmd.env("PATH", format!("{}{}{}", bun_dir.display(), sep, current_path));
            }
        }
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn claude at '{}': {}", claude_path, e))?;

    // Send PID so frontend can kill the process if needed
    let pid = child.id().unwrap_or(0);
    let _ = on_event.send(StreamEvent {
        event_type: "started".to_string(),
        content: pid.to_string(),
        exit_code: None,
    });

    // Write prompt to stdin then close it
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        // stdin is dropped here, closing the pipe → sends EOF to claude
    }

    // Stream stdout
    let stdout = child.stdout.take();
    let on_event_stdout = on_event.clone();
    let stdout_handle = tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = on_event_stdout.send(StreamEvent {
                    event_type: "stdout".to_string(),
                    content: line,
                    exit_code: None,
                });
            }
        }
    });

    // Stream stderr
    let stderr = child.stderr.take();
    let on_event_stderr = on_event.clone();
    let stderr_handle = tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = on_event_stderr.send(StreamEvent {
                    event_type: "stderr".to_string(),
                    content: line,
                    exit_code: None,
                });
            }
        }
    });

    // Wait for process to finish
    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for claude: {}", e))?;

    // Wait for output readers to finish
    let _ = stdout_handle.await;
    let _ = stderr_handle.await;

    // Send close event
    let _ = on_event.send(StreamEvent {
        event_type: "close".to_string(),
        content: String::new(),
        exit_code: status.code(),
    });

    Ok(())
}

#[tauri::command]
async fn stop_generation(pid: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F", "/T"])
            .output()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("kill")
            .args(["-9", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (compatible; BrandContentCreator/1.0)")
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch {}: {}", url, e))?;

    resp.text()
        .await
        .map_err(|e| format!("Failed to read response from {}: {}", url, e))
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalFileInfo {
    file_name: String,
    file_path: String,
    file_size: u64,
    file_type: String,
}

fn guess_mime(ext: &str) -> &str {
    match ext {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "mp4" => "video/mp4",
        "mov" => "video/quicktime",
        "avi" => "video/x-msvideo",
        "pdf" => "application/pdf",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt" => "text/plain",
        _ => "application/octet-stream",
    }
}

#[tauri::command]
async fn scan_directory(path: String) -> Result<Vec<LocalFileInfo>, String> {
    let dir = std::path::Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("'{}' is not a directory", path));
    }

    let mut files = Vec::new();
    let entries = std::fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata().map_err(|e| format!("Failed to read metadata: {}", e))?;
        if !metadata.is_file() {
            continue;
        }
        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().to_string();
        let ext = entry
            .path()
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        let file_type = guess_mime(&ext).to_string();

        files.push(LocalFileInfo {
            file_name,
            file_path,
            file_size: metadata.len(),
            file_type,
        });
    }

    Ok(files)
}

/// Find the bun binary path (similar to find_claude_path).
fn find_bun_path() -> String {
    if let Ok(p) = std::env::var("BUN_PATH") {
        return p;
    }

    #[cfg(target_os = "windows")]
    {
        // Check ~/.bun/bin/bun.exe first (the real binary)
        if let Ok(home) = std::env::var("USERPROFILE") {
            let p = format!("{}\\.bun\\bin\\bun.exe", home);
            if std::path::Path::new(&p).exists() {
                return p;
            }
        }

        // Try `where bun` but only pick .exe or .cmd results
        if let Ok(output) = std::process::Command::new("where")
            .arg("bun")
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                // Prefer .exe, then .cmd
                for ext in &[".exe", ".cmd"] {
                    for line in stdout.lines() {
                        let trimmed = line.trim();
                        if trimmed.to_lowercase().ends_with(ext) {
                            return trimmed.to_string();
                        }
                    }
                }
            }
        }

        "bun.exe".to_string()
    }

    #[cfg(not(target_os = "windows"))]
    {
        for shell in &["/bin/zsh", "/bin/bash"] {
            if let Ok(output) = std::process::Command::new(shell)
                .args(["-lc", "which bun"])
                .output()
            {
                if output.status.success() {
                    let path = String::from_utf8_lossy(&output.stdout);
                    let trimmed = path.trim();
                    if !trimmed.is_empty() {
                        return trimmed.to_string();
                    }
                }
            }
        }
        "bun".to_string()
    }
}

/// Walk up from CWD to find the project root (directory containing package.json).
fn find_project_root() -> Option<std::path::PathBuf> {
    let mut dir = std::env::current_dir().ok()?;
    loop {
        if dir.join("package.json").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            return None;
        }
    }
}

#[tauri::command]
async fn upload_file_to_cloud(file_path: String) -> Result<String, String> {
    let bun_path = find_bun_path();
    let project_root =
        find_project_root().ok_or("Could not find project root (no package.json)")?;
    let script_path = project_root.join("scripts").join("upload.ts");

    if !script_path.exists() {
        return Err(format!(
            "Upload script not found at {}",
            script_path.display()
        ));
    }

    let output = tokio::process::Command::new(&bun_path)
        .arg("run")
        .arg(script_path.to_str().unwrap())
        .arg(&file_path)
        .current_dir(&project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run upload (bun at '{}'): {}", bun_path, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(err) = v.get("error").and_then(|e| e.as_str()) {
                return Err(format!("Upload error: {}", err));
            }
        }
        return Err(format!(
            "Upload failed: {}",
            if stderr.is_empty() { &stdout } else { &stderr }
        ));
    }

    let result: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse upload result: {} (output: {})", e, stdout))?;

    result
        .get("url")
        .and_then(|u| u.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("No URL in upload response: {}", stdout))
}

#[tauri::command]
async fn upload_data_to_cloud(
    file_name: String,
    data_base64: String,
) -> Result<String, String> {
    let file_data = base64::engine::general_purpose::STANDARD
        .decode(data_base64.trim())
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(&file_name);
    tokio::fs::write(&temp_path, &file_data)
        .await
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let result = upload_file_to_cloud(temp_path.to_string_lossy().to_string()).await;

    // Clean up temp file
    let _ = tokio::fs::remove_file(&temp_path).await;

    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env from project root so UPLOADTHING_TOKEN is available
    if let Ok(cwd) = std::env::current_dir() {
        let _ = dotenvy::from_path(cwd.join(".env"));
        if let Some(parent) = cwd.parent() {
            let _ = dotenvy::from_path(parent.join(".env"));
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            generate_content,
            stop_generation,
            fetch_url,
            scan_directory,
            upload_file_to_cloud,
            upload_data_to_cloud,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
