#!/usr/bin/env node

/**
 * 測試運行器 - 執行所有測試套件
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 測試配置
const TEST_CONFIG = {
  timeout: 60000,
  wsUrl: process.env.WS_URL || 'ws://localhost:9002',
  testFiles: [
    'devtools.test.cjs',
    'integration.test.cjs',
    'puppeteer-fallback.test.cjs'
  ],
  coverage: process.argv.includes('--coverage'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  bail: process.argv.includes('--bail'), // 遇到失敗時停止
  grep: process.argv.find(arg => arg.startsWith('--grep='))?.split('=')[1]
};

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

// 檢查 WebSocket 伺服器是否運行
async function checkWebSocketServer() {
  return new Promise(async (resolve) => {
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(TEST_CONFIG.wsUrl);
    
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      ws.close();
      resolve(true);
    });
    
    ws.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// 執行單個測試檔案
function runTestFile(testFile) {
  return new Promise((resolve) => {
    log(`\n🧪 運行測試: ${testFile}`, 'cyan');
    
    const args = [
      path.join(__dirname, testFile),
      '--timeout', TEST_CONFIG.timeout.toString()
    ];
    
    if (TEST_CONFIG.grep) {
      args.push('--grep', TEST_CONFIG.grep);
    }
    
    const testProcess = spawn('npx', ['mocha', ...args], {
      stdio: TEST_CONFIG.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        WS_URL: TEST_CONFIG.wsUrl,
        NODE_ENV: 'test'
      }
    });
    
    let output = '';
    let errorOutput = '';
    
    if (!TEST_CONFIG.verbose) {
      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
    }
    
    testProcess.on('close', (code) => {
      const result = {
        file: testFile,
        success: code === 0,
        output,
        errorOutput,
        code
      };
      
      if (result.success) {
        log(`✅ ${testFile} 通過`, 'green');
      } else {
        log(`❌ ${testFile} 失敗 (退出代碼: ${code})`, 'red');
        if (!TEST_CONFIG.verbose && errorOutput) {
          console.error(errorOutput);
        }
      }
      
      resolve(result);
    });
    
    testProcess.on('error', (error) => {
      log(`❌ ${testFile} 執行錯誤: ${error.message}`, 'red');
      resolve({
        file: testFile,
        success: false,
        output: '',
        errorOutput: error.message,
        code: -1
      });
    });
  });
}

// 生成測試報告
function generateReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  log('\n' + '='.repeat(60), 'bright');
  log('📊 測試報告', 'bright');
  log('='.repeat(60), 'bright');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.file}`, color);
  });
  
  log('\n📈 統計資訊:', 'bright');
  log(`總測試檔案: ${totalTests}`);
  log(`通過: ${passedTests}`, passedTests > 0 ? 'green' : 'reset');
  log(`失敗: ${failedTests}`, failedTests > 0 ? 'red' : 'reset');
  log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    log('\n❌ 失敗的測試:', 'red');
    results.filter(r => !r.success).forEach(result => {
      log(`- ${result.file} (退出代碼: ${result.code})`, 'red');
      if (result.errorOutput && TEST_CONFIG.verbose) {
        console.error(result.errorOutput);
      }
    });
  }
  
  return passedTests === totalTests;
}

// 檢查測試環境
async function checkTestEnvironment() {
  log('🔍 檢查測試環境...', 'yellow');
  
  // 檢查 Node.js 版本
  const nodeVersion = process.version;
  log(`Node.js 版本: ${nodeVersion}`);
  
  // 檢查測試檔案是否存在
  const missingFiles = [];
  for (const testFile of TEST_CONFIG.testFiles) {
    const testPath = path.join(__dirname, testFile);
    if (!fs.existsSync(testPath)) {
      missingFiles.push(testFile);
    }
  }
  
  if (missingFiles.length > 0) {
    log(`❌ 缺少測試檔案: ${missingFiles.join(', ')}`, 'red');
    return false;
  }
  
  // 檢查 WebSocket 伺服器
  log('檢查 WebSocket 伺服器連接...', 'yellow');
  const serverRunning = await checkWebSocketServer();
  
  if (!serverRunning) {
    log('❌ WebSocket 伺服器未運行或無法連接', 'red');
    log(`請確保伺服器在 ${TEST_CONFIG.wsUrl} 上運行`, 'yellow');
    log('可以運行: npm run watch', 'yellow');
    return false;
  }
  
  log('✅ WebSocket 伺服器連接正常', 'green');
  return true;
}

// 主要執行函數
async function main() {
  log('🚀 BrowserMCP 測試套件', 'bright');
  log(`測試配置: ${JSON.stringify(TEST_CONFIG, null, 2)}`, 'blue');
  
  // 檢查環境
  const envOk = await checkTestEnvironment();
  if (!envOk) {
    process.exit(1);
  }
  
  // 執行測試
  log('\n🧪 開始執行測試...', 'bright');
  const results = [];
  
  for (const testFile of TEST_CONFIG.testFiles) {
    const result = await runTestFile(testFile);
    results.push(result);
    
    // 如果啟用 bail 模式且測試失敗，則停止
    if (TEST_CONFIG.bail && !result.success) {
      log('\n🛑 遇到失敗，停止執行 (--bail 模式)', 'yellow');
      break;
    }
  }
  
  // 生成報告
  const allPassed = generateReport(results);
  
  // 清理
  log('\n🧹 清理測試環境...', 'yellow');
  
  // 退出
  const exitCode = allPassed ? 0 : 1;
  log(`\n${allPassed ? '🎉 所有測試通過！' : '💥 有測試失敗'}`, allPassed ? 'green' : 'red');
  process.exit(exitCode);
}

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  log(`❌ 未捕獲的異常: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ 未處理的 Promise 拒絕: ${reason}`, 'red');
  process.exit(1);
});

// 處理中斷信號
process.on('SIGINT', () => {
  log('\n\n🛑 測試被中斷', 'yellow');
  process.exit(130);
});

// 顯示幫助資訊
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
BrowserMCP 測試運行器

使用方法:
  node run-all-tests.js [選項]

選項:
  --help, -h          顯示此幫助資訊
  --verbose, -v       詳細輸出
  --bail              遇到失敗時停止
  --coverage          啟用覆蓋率報告
  --grep=<pattern>    只運行符合模式的測試

環境變數:
  WS_URL              WebSocket 伺服器 URL (預設: ws://localhost:9002)
  NODE_ENV            設為 'test' (自動設定)

範例:
  node run-all-tests.js                    # 運行所有測試
  node run-all-tests.js --verbose          # 詳細輸出
  node run-all-tests.js --bail             # 遇到失敗時停止
  node run-all-tests.js --grep="Network"   # 只運行包含 "Network" 的測試
`);
  process.exit(0);
}

// 執行主程序
main().catch((error) => {
  log(`❌ 執行錯誤: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});