let video;
let handPose;
let hands = [];
let bubbles = []; // 儲存所有水泡物件的陣列

function preload() {
  // 初始化 HandPose 模型，並開啟翻轉 (flipped)
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 建立攝影機並設定鏡像
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 開始偵測手勢
  handPose.detectStart(video, gotHands);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 2. 設定背景顏色為 #e7c6ff
  background('#e7c6ff');

  // 3. 繪製全螢幕畫布正上方的文字
  fill(50); // 深灰色文字
  noStroke();
  textSize(32);
  textAlign(CENTER, TOP);
  // text("文字內容", width/2, 距離頂部距離);
  text("414730910陳益宏", width / 2, 20);

  // 4. 計算影像顯示的大小（畫布寬高的 50%）與偏移量（為了置中）
  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let offsetX = (width - imgW) / 2;
  let offsetY = (height - imgH) / 2;

  // 繪製攝影機影像在中間
  image(video, offsetX, offsetY, imgW, imgH);

  // 5. 處理手勢點位、連線與水泡產生
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        
        // --- 保留手指上的連線 ---
        strokeWeight(3);
        if (hand.handedness == "Left") {
          stroke(255, 0, 255); // 左手紫紅線
        } else {
          stroke(255, 255, 0); // 右手黃線
        }

        drawFinger(hand, 0, 4, offsetX, offsetY, imgW, imgH);   // 大拇指
        drawFinger(hand, 5, 8, offsetX, offsetY, imgW, imgH);   // 食指
        drawFinger(hand, 9, 12, offsetX, offsetY, imgW, imgH);  // 中指
        drawFinger(hand, 13, 16, offsetX, offsetY, imgW, imgH); // 無名指
        drawFinger(hand, 17, 20, offsetX, offsetY, imgW, imgH); // 小指

        // --- 保留關節點小圓圈 (0~20) 並在特定點產生水泡 ---
        noStroke();
        for (let i = 0; i < hand.keypoints.length; i++) {
          let kp = hand.keypoints[i];
          
          // 座標轉換：將影片座標映射到畫布置中影像的座標
          let kx = map(kp.x, 0, video.width, offsetX, offsetX + imgW);
          let ky = map(kp.y, 0, video.height, offsetY, offsetY + imgH);
          
          // 畫關節小圓圈
          if (hand.handedness == "Left") fill(255, 0, 255, 200); // 略帶透明
          else fill(255, 255, 0, 200);
          circle(kx, ky, 10);

          // 核心功能：在 4, 8, 12, 16, 20 (指尖) 產生水泡
          if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
            // 每 5 幀產生一個水泡，避免過多
            if (frameCount % 5 === 0) {
              // 產生一個新的 Bubble 物件，起始點在指尖 (kx, ky)
              bubbles.push(new Bubble(kx, ky));
            }
          }
        }
      }
    }
  }

  // 6. 處理水泡的動態（更新、顯示、檢查破裂）
  // 倒著迴圈跑陣列，這樣刪除物件時才不會出錯
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isPopped) {
      bubbles.splice(i, 1); // 如果水泡破了，從陣列中移除
    }
  }
}

// 輔助函式：負責座標轉換與畫指節連線
function drawFinger(hand, start, end, ox, oy, iw, ih) {
  for (let i = start; i < end; i++) {
    let pt1 = hand.keypoints[i];
    let pt2 = hand.keypoints[i + 1];

    let x1 = map(pt1.x, 0, video.width, ox, ox + iw);
    let y1 = map(pt1.y, 0, video.height, oy, oy + ih);
    let x2 = map(pt2.x, 0, video.width, ox, ox + iw);
    let y2 = map(pt2.y, 0, video.height, oy, oy + ih);

    line(x1, y1, x2, y2);
  }
}

// 7. 定義水泡類別 (Bubble Class) - 物件導向管理動態
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(10, 25); // 隨機水泡大小
    this.speedY = random(-2, -5); // 隨機向上速度
    this.speedX = random(-0.5, 0.5); // 微小的左右漂移
    this.alpha = 150; // 起始透明度 (0~255)
    this.isPopped = false; // 是否破裂的狀態
  }

  update() {
    // 位置更新
    this.y += this.speedY;
    this.x += this.speedX;
    
    // 透明度逐漸變淡
    this.alpha -= 1;

    // --- 設定破裂條件 (適當位置) ---
    // 條件 1: 到達螢幕頂部附近 (例如距離頂部 60px 以內)
    // 條件 2: 水泡變得太透明 (快看不見時)
    if (this.y < 60 || this.alpha <= 0) {
      this.isPopped = true;
    }
  }

  display() {
    push(); // 隔離樣式設定，不影響其他圖形
    stroke(255, this.alpha); // 白色邊框，帶有透明度
    strokeWeight(1);
    fill(200, 230, 255, this.alpha * 0.5); // 淺藍色填充，更透明
    circle(this.x, this.y, this.size);
    pop();
  }
}

// 當視窗大小改變時自動更新畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}