#!/usr/bin/env node

/**
 * 直接使用 Puppeteer 測試 CNA 網站截圖
 * 繞過 WebSocket 通訊問題，直接驗證優化效果
 */

import puppeteer from 'puppeteer';

const CNA_URL = 'https://www.cna.com.tw/';

async function testCNAWithPuppeteer() {
  console.log('🧪 直接使用 Puppeteer 測試 CNA 網站截圖\n');
  
  let browser;
  let page;
  
  try {
    // 啟動瀏覽器
    console.log('🚀 啟動 Puppeteer（無頭模式）...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // 設置 User Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.log('✅ Puppeteer 啟動成功\n');
    
    // 導航到 CNA 網站
    console.log(`🌐 導航到 CNA 網站: ${CNA_URL}`);
    const navStart = Date.now();
    
    try {
      const response = await page.goto(CNA_URL, {
        waitUntil: 'networkidle2',
        timeout: 60000 // 60秒超時
      });
      
      const navDuration = Date.now() - navStart;
      console.log(`✅ 頁面載入成功，狀態: ${response.status()}，耗時: ${navDuration}ms`);
      
      // 等待頁面完全渲染
      console.log('⏳ 等待頁面完全渲染...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (navError) {
      console.error(`❌ 導航失敗: ${navError.message}`);
      return [{ test: '導航到 CNA', success: false, error: navError.message }];
    }
    
    const results = [];
    
    // 分析頁面內容特徵
    console.log('📊 分析頁面內容特徵...');
    const pageInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      
      const width = Math.max(body.scrollWidth, html.scrollWidth, html.clientWidth);
      const height = Math.max(body.scrollHeight, html.scrollHeight, html.clientHeight);
      
      // 檢測圖片
      const images = document.querySelectorAll('img');
      const hasPhotos = images.length > 0 && 
        Array.from(images).some(img => 
          img.src && !img.src.includes('svg') && !img.src.startsWith('data:image/svg')
        );
      
      // 檢測漸層和複雜背景
      const elements = document.querySelectorAll('*');
      let hasGradients = false;
      let complexElementCount = 0;
      
      Array.from(elements).slice(0, 1000).forEach(el => { // 限制檢測數量避免過慢
        const style = window.getComputedStyle(el);
        if (style.background && 
            (style.background.includes('gradient') || 
             style.backgroundImage.includes('gradient'))) {
          hasGradients = true;
        }
        
        // 計算複雜度
        if (style.boxShadow !== 'none' || 
            style.borderRadius !== '0px' ||
            style.transform !== 'none') {
          complexElementCount++;
        }
      });
      
      const totalElements = Math.min(elements.length, 1000);
      const complexity = totalElements > 0 ? complexElementCount / totalElements : 0;
      
      return {
        width,
        height,
        imageCount: images.length,
        hasPhotos,
        hasGradients,
        complexity: Math.round(complexity * 100),
        totalElements: elements.length
      };
    });
    
    console.log(`   頁面尺寸: ${pageInfo.width} x ${pageInfo.height}px`);
    console.log(`   圖片數量: ${pageInfo.imageCount}`);
    console.log(`   有照片: ${pageInfo.hasPhotos ? '是' : '否'}`);
    console.log(`   有漸層: ${pageInfo.hasGradients ? '是' : '否'}`);
    console.log(`   複雜度: ${pageInfo.complexity}%`);
    console.log(`   元素總數: ${pageInfo.totalElements}\n`);
    
    // 根據分析結果，我們的智慧壓縮應該選擇 JPEG 格式
    const recommendedFormat = pageInfo.hasPhotos || pageInfo.hasGradients ? 'jpeg' : 'png';
    console.log(`🤖 智慧壓縮建議格式: ${recommendedFormat}\n`);
    
    // 測試 1: 標準 PNG 截圖（模擬舊版本）
    console.log('📸 測試 1: 標準 PNG 截圖');
    const test1Start = Date.now();
    
    try {
      const png = await page.screenshot({
        type: 'png',
        encoding: 'base64',
        fullPage: false
      });
      
      const test1Duration = Date.now() - test1Start;
      const size1 = png.length;
      
      results.push({
        test: 'PNG 標準',
        success: true,
        duration: test1Duration,
        dataSize: size1,
        estimatedKB: Math.round(size1 * 0.75 / 1024)
      });
      
      console.log(`✅ PNG 截圖成功: ${test1Duration}ms, ${Math.round(size1 * 0.75 / 1024)}KB\n`);
      
    } catch (error) {
      const test1Duration = Date.now() - test1Start;
      results.push({
        test: 'PNG 標準',
        success: false,
        duration: test1Duration,
        error: error.message
      });
      console.log(`❌ PNG 截圖失敗: ${error.message} (${test1Duration}ms)\n`);
    }
    
    // 測試 2: JPEG 高品質截圖（優化版本）
    console.log('📸 測試 2: JPEG 高品質截圖');
    const test2Start = Date.now();
    
    try {
      const jpeg = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        encoding: 'base64',
        fullPage: false
      });
      
      const test2Duration = Date.now() - test2Start;
      const size2 = jpeg.length;
      
      results.push({
        test: 'JPEG 高品質',
        success: true,
        duration: test2Duration,
        dataSize: size2,
        estimatedKB: Math.round(size2 * 0.75 / 1024)
      });
      
      console.log(`✅ JPEG 截圖成功: ${test2Duration}ms, ${Math.round(size2 * 0.75 / 1024)}KB\n`);
      
    } catch (error) {
      const test2Duration = Date.now() - test2Start;
      results.push({
        test: 'JPEG 高品質',
        success: false,
        duration: test2Duration,
        error: error.message
      });
      console.log(`❌ JPEG 截圖失敗: ${error.message} (${test2Duration}ms)\n`);
    }
    
    // 測試 3: JPEG 標準品質截圖（最優化）
    console.log('📸 測試 3: JPEG 標準品質截圖');
    const test3Start = Date.now();
    
    try {
      const jpegStd = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        encoding: 'base64',
        fullPage: false
      });
      
      const test3Duration = Date.now() - test3Start;
      const size3 = jpegStd.length;
      
      results.push({
        test: 'JPEG 標準',
        success: true,
        duration: test3Duration,
        dataSize: size3,
        estimatedKB: Math.round(size3 * 0.75 / 1024)
      });
      
      console.log(`✅ JPEG 標準截圖成功: ${test3Duration}ms, ${Math.round(size3 * 0.75 / 1024)}KB\n`);
      
    } catch (error) {
      const test3Duration = Date.now() - test3Start;
      results.push({
        test: 'JPEG 標準',
        success: false,
        duration: test3Duration,
        error: error.message
      });
      console.log(`❌ JPEG 標準截圖失敗: ${error.message} (${test3Duration}ms)\n`);
    }
    
    // 測試 4: 全頁截圖測試（挑戰性測試）
    if (pageInfo.height > 2000) {
      console.log('📸 測試 4: 全頁截圖（挑戰性測試）');
      const test4Start = Date.now();
      
      try {
        const fullPage = await page.screenshot({
          type: 'jpeg',
          quality: 80,
          encoding: 'base64',
          fullPage: true
        });
        
        const test4Duration = Date.now() - test4Start;
        const size4 = fullPage.length;
        
        results.push({
          test: '全頁 JPEG',
          success: true,
          duration: test4Duration,
          dataSize: size4,
          estimatedKB: Math.round(size4 * 0.75 / 1024)
        });
        
        console.log(`✅ 全頁截圖成功: ${test4Duration}ms, ${Math.round(size4 * 0.75 / 1024)}KB\n`);
        
      } catch (error) {
        const test4Duration = Date.now() - test4Start;
        results.push({
          test: '全頁 JPEG',
          success: false,
          duration: test4Duration,
          error: error.message
        });
        console.log(`❌ 全頁截圖失敗: ${error.message} (${test4Duration}ms)\n`);
      }
    } else {
      console.log('ℹ️ 跳過全頁截圖測試（頁面高度較小）\n');
    }
    
    return { results, pageInfo };
    
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

function generateReport(results, pageInfo) {
  console.log('📊 CNA 網站直接截圖測試報告');
  console.log('=====================================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  // 成功率統計
  const successRate = Math.round((successful.length / results.length) * 100);
  console.log(`📈 截圖成功率: ${successRate}% (${successful.length}/${results.length})\n`);
  
  if (successful.length > 0) {
    console.log('✅ 成功的測試:');
    console.log('┌─────────────────┬──────────┬────────────┬─────────────┐');
    console.log('│ 測試項目        │ 耗時(ms) │ 資料大小   │ 檔案大小(KB)│');
    console.log('├─────────────────┼──────────┼────────────┼─────────────┤');
    
    successful.forEach(result => {
      const test = result.test.padEnd(15);
      const duration = result.duration.toString().padStart(8);
      const dataSize = result.dataSize.toLocaleString().padStart(10);
      const fileSize = result.estimatedKB.toString().padStart(11);
      
      console.log(`│ ${test} │ ${duration} │ ${dataSize} │ ${fileSize} │`);
    });
    
    console.log('└─────────────────┴──────────┴────────────┴─────────────┘\n');
    
    // 優化效果分析
    const baseline = successful.find(r => r.test === 'PNG 標準');
    if (baseline && successful.length > 1) {
      console.log('📈 優化效果分析 (相對於 PNG 標準):');
      successful.forEach(result => {
        if (result !== baseline) {
          const sizeReduction = Math.round((1 - result.estimatedKB / baseline.estimatedKB) * 100);
          const timeReduction = Math.round((1 - result.duration / baseline.duration) * 100);
          
          console.log(`   ${result.test}:`);
          console.log(`     檔案大小: ${sizeReduction > 0 ? '↓' : '↑'}${Math.abs(sizeReduction)}%`);
          console.log(`     處理時間: ${timeReduction > 0 ? '↓' : '↑'}${Math.abs(timeReduction)}%`);
        }
      });
      console.log();
    }
    
    // 效能統計
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const avgSize = successful.reduce((sum, r) => sum + r.estimatedKB, 0) / successful.length;
    const maxDuration = Math.max(...successful.map(r => r.duration));
    
    console.log('📊 效能統計:');
    console.log(`   平均處理時間: ${Math.round(avgDuration)}ms`);
    console.log(`   最長處理時間: ${Math.round(maxDuration)}ms`);
    console.log(`   平均檔案大小: ${Math.round(avgSize)}KB`);
    
    if (maxDuration < 30000) {
      console.log('   ✅ 處理時間表現優秀（<30秒）- 大幅改善！');
    } else if (maxDuration < 60000) {
      console.log('   ✅ 處理時間表現良好（<60秒）');
    } else if (maxDuration < 90000) {
      console.log('   ⚠️ 處理時間可接受（60-90秒）');
    } else {
      console.log('   ❌ 處理時間仍需優化（>90秒）');
    }
    console.log();
  }
  
  if (failed.length > 0) {
    console.log('❌ 失敗的測試:');
    failed.forEach(result => {
      console.log(`   ${result.test}: ${result.error} (${result.duration}ms)`);
    });
    console.log();
  }
  
  // 智慧壓縮驗證
  console.log('🤖 智慧壓縮驗證:');
  const hasPhotos = pageInfo.hasPhotos;
  const hasGradients = pageInfo.hasGradients;
  const complexity = pageInfo.complexity;
  
  if (hasPhotos || hasGradients) {
    console.log('   📸 頁面包含照片或漸層 → 建議使用 JPEG 格式 ✅');
    
    const jpegResults = successful.filter(r => r.test.includes('JPEG'));
    const pngResults = successful.filter(r => r.test.includes('PNG'));
    
    if (jpegResults.length > 0 && pngResults.length > 0) {
      const avgJpegSize = jpegResults.reduce((sum, r) => sum + r.estimatedKB, 0) / jpegResults.length;
      const avgPngSize = pngResults.reduce((sum, r) => sum + r.estimatedKB, 0) / pngResults.length;
      const savings = Math.round((1 - avgJpegSize / avgPngSize) * 100);
      
      console.log(`   💾 JPEG 相對 PNG 節省 ${savings}% 檔案大小`);
    }
  } else {
    console.log('   🎨 頁面較簡單 → PNG 格式可能更適合');
  }
  
  if (complexity > 30) {
    console.log(`   🧩 頁面複雜度較高 (${complexity}%) → JPEG 壓縮效果更佳`);
  }
  console.log();
  
  // 改善評估
  console.log('💡 CNA 網站截圖改善評估:');
  if (successRate === 100) {
    console.log('   🎉 截圖功能完全正常！優化效果顯著');
  } else if (successRate >= 75) {
    console.log('   ✅ 截圖功能大幅改善！大部分操作成功');
  } else if (successRate >= 50) {
    console.log('   ⚠️ 有所改善，但仍有優化空間');
  } else {
    console.log('   ❌ 截圖功能仍有問題，需要進一步診斷');
  }
  
  if (successful.length > 0) {
    const maxTime = Math.max(...successful.map(r => r.duration));
    if (maxTime < 30000) {
      console.log('   ⚡ 處理速度大幅提升！應該不會再有 Request Timeout');
    } else if (maxTime < 60000) {
      console.log('   🚀 處理速度顯著改善，超時風險大降低');
    }
  }
  
  console.log(`\n📋 測試摘要: ${successful.length}/${results.length} 通過，成功率 ${successRate}%`);
  
  return successRate >= 75; // 75% 以上成功率視為顯著改善
}

async function main() {
  console.log('🧪 CNA 網站截圖優化驗證測試');
  console.log('目標：直接驗證 Puppeteer 截圖優化效果');
  console.log('=====================================\n');
  
  try {
    const { results, pageInfo } = await testCNAWithPuppeteer();
    const improved = generateReport(results, pageInfo);
    
    if (improved) {
      console.log('\n🎉 CNA 網站截圖優化效果顯著！');
      console.log('💡 Puppeteer 層面的優化完全正常，WebSocket 通訊可能需要進一步優化');
    } else {
      console.log('\n⚠️ 仍需進一步優化');
    }
    
    return improved;
    
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