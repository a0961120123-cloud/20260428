// Hand Pose Detection 轉置到全螢幕畫布中間
let video;
let handPose;
let hands = [];

function preload() {
  // 初始化手勢偵測模型（開啟翻轉，符合鏡像習慣）
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 建立影片並設定翻轉
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 開始偵測手勢
  handPose.detectStart(video, gotHands);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 3. 背景顏色設定為 #e7c6ff
  background('#e7c6ff');

  // 4. 計算影像顯示的大小（畫布寬高的 50%）
  let imgW = width * 0.5;
  let imgH = height * 0.5;
  
  // 5. 計算影像左上角的起始座標（為了讓影像置中）
  let offsetX = (width - imgW) / 2;
  let offsetY = (height - imgH) / 2;

  // 繪製影像在中間
  image(video, offsetX, offsetY, imgW, imgH);

  // 6. 處理手勢點位座標轉換
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // --- 核心座標轉換邏輯 ---
          // 將原始影片座標 (0~video.width) 映射到 (畫布上的影像起始點 ~ 結束點)
          let mappedX = map(keypoint.x, 0, video.width, offsetX, offsetX + imgW);
          let mappedY = map(keypoint.y, 0, video.height, offsetY, offsetY + imgH);

          // 區分左右手顏色
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(mappedX, mappedY, 12); // 調整圓圈大小
        }
      }
    }
  }
}

// 當視窗縮放時自動更新畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}