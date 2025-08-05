#!/usr/bin/env node

/**
 * 直接測試 Puppeteer 截圖優化功能
 */

import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer';

async function testPuppeteerOptimizations() {
  console.log('🧪 直接測試 Puppeteer 截圖優化功能\n');
  
  let browser;
  let page;
  
  try {
    // 啟動瀏覽器
    console.log('🚀 啟動 Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    console.log('✅ Puppeteer 啟動成功\n');
    
    // 導航到測試頁面
    console.log('🌐 建立測試頁面...');
    const testHTML = `
      <html>
        <body style="
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
          height: 5000px;
          font-family: Arial, sans-serif;
          padding: 20px;
        ">
          <h1 style="color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            螢幕截圖優化測試頁面
          </h1>
          <div style="
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            <p>這是一個測試頁面，用來驗證螢幕截圖優化功能：</p>
            <ul>
              <li>✅ 智慧壓縮 (根據內容選擇最佳格式)</li>
              <li>✅ JPEG 品質優化</li>
              <li>✅ 分段截圖 (處理長頁面)</li>
              <li>✅ 頁面內容分析</li>
            </ul>
          </div>
          
          <div style="height: 200px; background: url('data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"100\\" height=\\"100\\"><rect width=\\"100\\" height=\\"100\\" fill=\\"%23ff0000\\"/></svg>') repeat;"></div>
          
          <div style="
            background: rgba(255,255,255,0.9);
            padding: 40px;
            margin: 40px 0;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          ">
            <h2>複雜度測試區域</h2>
            <p>這個區域包含複雜的視覺效果來測試壓縮算法的選擇。</p>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
              gap: 10px;
              margin: 20px 0;
            ">
              ${Array.from({length: 20}, (_, i) => `
                <div style="
                  background: linear-gradient(${i * 18}deg, hsl(${i * 20}, 70%, 60%), hsl(${(i + 1) * 20}, 70%, 40%));
                  height: 100px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">${i + 1}</div>
              `).join('')}
            </div>
          </div>
          
          <div style="height: 1000px; background: repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px);"></div>
        </body>
      </html>
    `;
    
    await page.setContent(testHTML);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待渲染
    console.log('✅ 測試頁面準備完成\n');
    
    const results = [];
    
    // 測試 1: 標準 PNG
    console.log('📸 測試 1: 標準 PNG 截圖');
    const start1 = Date.now();
    const png = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: false
    });
    const duration1 = Date.now() - start1;
    const size1 = png.length;
    
    results.push({
      test: 'PNG 標準',
      duration: duration1,
      size: size1,
      estimatedKB: Math.round(size1 * 0.75 / 1024)
    });
    console.log(`✅ 完成: ${duration1}ms, ${Math.round(size1 * 0.75 / 1024)}KB\n`);
    
    // 測試 2: JPEG 高品質
    console.log('📸 測試 2: JPEG 高品質 (90)');
    const start2 = Date.now();
    const jpegHigh = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      encoding: 'base64',
      fullPage: false
    });
    const duration2 = Date.now() - start2;
    const size2 = jpegHigh.length;
    
    results.push({
      test: 'JPEG 高品質',
      duration: duration2,
      size: size2,
      estimatedKB: Math.round(size2 * 0.75 / 1024)
    });
    console.log(`✅ 完成: ${duration2}ms, ${Math.round(size2 * 0.75 / 1024)}KB\n`);
    
    // 測試 3: JPEG 標準品質
    console.log('📸 測試 3: JPEG 標準品質 (80)');
    const start3 = Date.now();
    const jpegStd = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      encoding: 'base64',
      fullPage: false
    });
    const duration3 = Date.now() - start3;
    const size3 = jpegStd.length;
    
    results.push({
      test: 'JPEG 標準',
      duration: duration3,
      size: size3,
      estimatedKB: Math.round(size3 * 0.75 / 1024)
    });
    console.log(`✅ 完成: ${duration3}ms, ${Math.round(size3 * 0.75 / 1024)}KB\n`);
    
    // 測試 4: 全頁 PNG
    console.log('📸 測試 4: 全頁 PNG 截圖');
    const start4 = Date.now();
    try {
      const fullPng = await page.screenshot({
        type: 'png',
        encoding: 'base64',
        fullPage: true
      });
      const duration4 = Date.now() - start4;
      const size4 = fullPng.length;
      
      results.push({
        test: '全頁 PNG',
        duration: duration4,
        size: size4,
        estimatedKB: Math.round(size4 * 0.75 / 1024)
      });
      console.log(`✅ 完成: ${duration4}ms, ${Math.round(size4 * 0.75 / 1024)}KB\n`);
    } catch (error) {
      console.log(`❌ 失敗: ${error.message}\n`);
      results.push({
        test: '全頁 PNG',
        error: error.message
      });
    }
    
    // 測試 5: 全頁 JPEG
    console.log('📸 測試 5: 全頁 JPEG 截圖');
    const start5 = Date.now();
    try {
      const fullJpeg = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        encoding: 'base64',
        fullPage: true
      });
      const duration5 = Date.now() - start5;
      const size5 = fullJpeg.length;
      
      results.push({
        test: '全頁 JPEG',
        duration: duration5,
        size: size5,
        estimatedKB: Math.round(size5 * 0.75 / 1024)
      });
      console.log(`✅ 完成: ${duration5}ms, ${Math.round(size5 * 0.75 / 1024)}KB\n`);
    } catch (error) {
      console.log(`❌ 失敗: ${error.message}\n`);
      results.push({
        test: '全頁 JPEG',
        error: error.message
      });
    }
    
    return results;
    
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

function generateReport(results) {
  console.log('📊 Puppeteer 截圖優化測試報告');
  console.log('=====================================\n');
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  if (successful.length > 0) {
    console.log('✅ 成功的測試:');
    console.log('┌─────────────────┬──────────┬────────────┬─────────────┐');
    console.log('│ 測試項目        │ 耗時(ms) │ 資料大小   │ 檔案大小(KB)│');
    console.log('├─────────────────┼──────────┼────────────┼─────────────┤');
    
    successful.forEach(result => {
      const test = result.test.padEnd(15);
      const duration = result.duration.toString().padStart(8);
      const dataSize = result.size.toLocaleString().padStart(10);
      const fileSize = result.estimatedKB.toString().padStart(11);
      
      console.log(`│ ${test} │ ${duration} │ ${dataSize} │ ${fileSize} │`);
    });
    
    console.log('└─────────────────┴──────────┴────────────┴─────────────┘\n');
    
    // 壓縮效果分析
    const pngBase = successful.find(r => r.test === 'PNG 標準');
    if (pngBase && successful.length > 1) {
      console.log('📈 壓縮效果分析 (相對於 PNG 標準):');
      successful.forEach(result => {
        if (result !== pngBase) {
          const sizeReduction = Math.round((1 - result.estimatedKB / pngBase.estimatedKB) * 100);
          const timeChange = Math.round((result.duration - pngBase.duration) / pngBase.duration * 100);
          
          console.log(`   ${result.test}:`);
          console.log(`     檔案大小: ${sizeReduction > 0 ? '↓' : '↑'}${Math.abs(sizeReduction)}%`);
          console.log(`     處理時間: ${timeChange > 0 ? '↑' : '↓'}${Math.abs(timeChange)}%`);
        }
      });
      console.log();
    }
    
    // 效能建議
    console.log('💡 優化建議:');
    const avgJpegSize = successful
      .filter(r => r.test.includes('JPEG'))
      .reduce((sum, r) => sum + r.estimatedKB, 0) / 
      successful.filter(r => r.test.includes('JPEG')).length;
    
    if (pngBase && avgJpegSize && avgJpegSize < pngBase.estimatedKB) {
      const savings = Math.round((1 - avgJpegSize / pngBase.estimatedKB) * 100);
      console.log(`   🎯 JPEG 格式平均節省 ${savings}% 檔案大小`);
      console.log(`   🚀 建議在有漸層/照片的頁面使用 JPEG 格式`);
    }
    
    const fullPageResults = successful.filter(r => r.test.includes('全頁'));
    if (fullPageResults.length > 0) {
      const avgFullPageSize = fullPageResults.reduce((sum, r) => sum + r.estimatedKB, 0) / fullPageResults.length;
      if (avgFullPageSize > 1000) {
        console.log(`   ⚠️ 全頁截圖檔案較大 (${Math.round(avgFullPageSize)}KB)，建議實作分段截圖`);
      }
    }
    console.log();
  }
  
  if (failed.length > 0) {
    console.log('❌ 失敗的測試:');
    failed.forEach(result => {
      console.log(`   ${result.test}: ${result.error}`);
    });
    console.log();
  }
  
  console.log(`📋 測試摘要: ${successful.length}/${results.length} 通過`);
  
  return successful.length === results.length;
}

async function main() {
  try {
    const results = await testPuppeteerOptimizations();
    const allPassed = generateReport(results);
    
    console.log(allPassed ? '🎉 所有測試通過！' : '⚠️ 部分測試失敗');
    return allPassed;
    
  } catch (error) {
    console.error('\n❌ 測試執行失敗:', error.message);
    return false;
  }
}

// 執行測試
main()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 測試執行異常:', error);
    process.exit(1);
  });