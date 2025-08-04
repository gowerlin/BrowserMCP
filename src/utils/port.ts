import { execSync } from "node:child_process";
import net from "node:net";
import os from "node:os";

// Use a proper logger if available, fallback to console
const logger = {
  info: (msg: string) => console.log(`[BrowserMCP] ${msg}`),
  warn: (msg: string) => console.warn(`[BrowserMCP] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[BrowserMCP] ${msg}`, error || ''),
  debug: (msg: string) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(`[BrowserMCP:DEBUG] ${msg}`);
    }
  }
};

/**
 * Detects the current shell environment
 */
function detectShellEnvironment(): "cmd" | "powershell" | "gitbash" | "wsl" | "unix" {
  const platform = process.platform;
  
  // Check for Unix-like systems
  if (platform !== "win32") {
    return "unix";
  }
  
  // On Windows, check the shell environment
  const shell = process.env.SHELL || "";
  const term = process.env.TERM || "";
  const msystem = process.env.MSYSTEM || "";
  
  // Check for Git Bash
  if (shell.includes("bash") || term.includes("xterm") || msystem) {
    return "gitbash";
  }
  
  // Check for WSL
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
    return "wsl";
  }
  
  // Check for PowerShell
  if (process.env.PSModulePath) {
    return "powershell";
  }
  
  // Default to CMD on Windows
  return "cmd";
}

export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true)); // Port is still in use
    server.once("listening", () => {
      server.close(() => resolve(false)); // Port is free
    });
    server.listen(port);
  });
}

/**
 * Kills process on the specified port with cross-platform compatibility
 */
export function killProcessOnPort(port: number) {
  try {
    const shellEnv = detectShellEnvironment();
    logger.debug(`Detected shell environment: ${shellEnv}`);
    
    switch (shellEnv) {
      case "unix":
        // Unix/Linux/macOS
        try {
          execSync(`lsof -ti:${port} | xargs kill -9`);
        } catch {
          // Alternative for systems without lsof
          execSync(`fuser -k ${port}/tcp`);
        }
        break;
        
      case "gitbash":
      case "wsl":
        // Git Bash or WSL on Windows - use netstat with awk
        try {
          const cmd = `netstat -ano | grep ':${port}' | awk '{print $5}' | xargs -I {} kill -9 {}`;
          execSync(cmd, { shell: "/bin/bash" });
        } catch (e) {
          // Fallback: try Windows command through cmd.exe
          try {
            execSync(`cmd.exe /c "netstat -ano | findstr :${port}" | awk '{print $5}'`, 
              { shell: true }
            ).toString()
              .split('\n')
              .filter(pid => pid && !isNaN(Number(pid)))
              .forEach(pid => {
                try {
                  execSync(`taskkill /F /PID ${pid}`, { shell: true });
                } catch {}
              });
          } catch {
            logger.warn(`Could not kill process on port ${port} in Git Bash/WSL environment`);
          }
        }
        break;
        
      case "powershell":
        // PowerShell
        try {
          const psCommand = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`;
          execSync(psCommand, { shell: "powershell.exe" });
        } catch {
          // Fallback to netstat
          execSync(`cmd.exe /c "FOR /F \\"tokens=5\\" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a"`);
        }
        break;
        
      case "cmd":
      default:
        // Windows CMD
        try {
          // Use cmd.exe explicitly to ensure proper execution
          execSync(
            `cmd.exe /c "FOR /F \\"tokens=5\\" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a"`,
            { shell: false }
          );
        } catch (error) {
          logger.warn(`Could not kill process on port ${port} in CMD environment`);
        }
        break;
    }
    
    logger.info(`Successfully attempted to kill process on port ${port}`);
  } catch (error) {
    logger.error(`Failed to kill process on port ${port}:`, error);
    // Don't throw - allow the application to continue
    // The port might already be free or the process might have different permissions
  }
}

/**
 * Alternative method to free a port using native Node.js approach
 */
export async function freePort(port: number): Promise<boolean> {
  // First check if port is in use
  const inUse = await isPortInUse(port);
  
  if (!inUse) {
    logger.info(`Port ${port} is already free`);
    return true;
  }
  
  // Try to kill the process
  killProcessOnPort(port);
  
  // Wait a moment for the process to terminate
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check again
  const stillInUse = await isPortInUse(port);
  
  if (!stillInUse) {
    logger.info(`Successfully freed port ${port}`);
    return true;
  } else {
    logger.warn(`Port ${port} is still in use after kill attempt`);
    return false;
  }
}
