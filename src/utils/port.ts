import { execSync } from "node:child_process";
import net from "node:net";

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
        // Git Bash or WSL on Windows - need to properly extract PID from netstat output
        try {
          // Windows netstat format: Proto Local Foreign State PID
          // We need the 5th column (PID) from lines containing the port
          const output = execSync(`netstat -ano | grep ':${port} '`, { shell: "/bin/bash" }).toString();
          const lines = output.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            // Extract PID from the last column
            const columns = line.trim().split(/\s+/);
            const pid = columns[columns.length - 1];
            
            if (pid && !isNaN(Number(pid)) && Number(pid) > 0) {
              try {
                // Use taskkill for Windows processes
                execSync(`taskkill /F /PID ${pid}`, { shell: "/bin/bash", stdio: 'ignore' });
                logger.debug(`Killed process ${pid} on port ${port}`);
              } catch {
                // Process might already be gone or we lack permissions
              }
            }
          }
        } catch (e) {
          // Fallback: try direct Windows command
          try {
            const output = execSync(`cmd.exe /c "netstat -ano | findstr :${port}"`).toString();
            const lines = output.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const columns = line.trim().split(/\s+/);
              const pid = columns[columns.length - 1];
              
              if (pid && !isNaN(Number(pid)) && Number(pid) > 0) {
                try {
                  execSync(`cmd.exe /c "taskkill /F /PID ${pid}"`);
                } catch {}
              }
            }
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
        // Windows CMD - use pure Windows syntax without Unix commands
        try {
          // First get the list of PIDs using the port
          const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
          const lines = output.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            // Windows netstat output format: Proto Local Foreign State PID
            const columns = line.trim().split(/\s+/);
            const pid = columns[columns.length - 1];
            
            if (pid && !isNaN(Number(pid)) && Number(pid) > 0) {
              try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                logger.debug(`Killed process ${pid} on port ${port}`);
              } catch {
                // Process might already be gone or we lack permissions
              }
            }
          }
        } catch (error) {
          // Port might already be free or no process found
          logger.warn(`Could not find or kill process on port ${port} in CMD environment`);
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
