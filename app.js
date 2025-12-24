// ===== 설정 =====
const SYMBOL_COUNT = 15;     // 1~15

const IMG_DIR = "keyboard/image";  // keyboard/image/1.png ...
const SND_DIR = "keyboard/sound";     // sound/1.mp3 ...

// 게임 설정
const gameSettings = {
  volume: 0.7, // 0 to 1
  isMuted: false,
  _lastVolume: 0.7,
  wordLength: 5,
  allowDuplicates: false,
};

// 게임 상태
let attempts = 0;
let isGameOver = false;
let secretCode = [];
// 각 심볼의 상태 기록 (1~15) -> "correct", "present", "absent" 또는 null
const symbolStates = Array(SYMBOL_COUNT + 1).fill(null);

function generateSecretCode() {
  const wordLen = gameSettings.wordLength;

  if (gameSettings.allowDuplicates) {
    // 중복 허용
    const code = [];
    for (let i = 0; i < wordLen; i++) {
      code.push(Math.floor(Math.random() * SYMBOL_COUNT) + 1);
    }
    return code;
  } else {
    // 중복 없음 (기존 로직)
    const allSymbols = Array.from({ length: SYMBOL_COUNT }, (_, i) => i + 1);
    if (wordLen > SYMBOL_COUNT) {
      console.error("중복이 허용되지 않는 상태에서 요청된 단어 길이가 심볼 개수보다 많습니다.");
      const code = [];
      for (let i = 0; i < wordLen; i++) {
        code.push(Math.floor(Math.random() * SYMBOL_COUNT) + 1);
      }
      return code;
    }
    for (let i = allSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSymbols[i], allSymbols[j]] = [allSymbols[j], allSymbols[i]];
    }
    return allSymbols.slice(0, wordLen);
  }
}

// 키보드 레이아웃(3x6 = 18칸)
const KEY_LAYOUT = [
  { type: "symbol", id: 1 }, { type: "symbol", id: 2 }, { type: "symbol", id: 3 }, { type: "symbol", id: 4 }, { type: "symbol", id: 5 }, { type: "backspace" },
  { type: "symbol", id: 6 }, { type: "symbol", id: 7 }, { type: "symbol", id: 8 }, { type: "symbol", id: 9 }, { type: "symbol", id: 10 }, { type: "enter" },
  { type: "symbol", id: 11 }, { type: "symbol", id: 12 }, { type: "symbol", id: 13 }, { type: "symbol", id: 14 }, { type: "symbol", id: 15 }
];

// ===== DOM =====
const currentRowEl = document.getElementById("currentRow");
const logEl = document.getElementById("log");
const keyboardEl = document.getElementById("keyboard");
const attemptCountEl = document.getElementById("attemptCount");

// 번역 대상 요소
const langToggle = document.getElementById("langToggle");
const headerDesc = document.getElementById("headerDesc");
const boardTitle = document.getElementById("boardTitle");
const logTitleText = document.getElementById("logTitleText");
const btnReset = document.getElementById("btnReset");
const btnCustom = document.getElementById("btnCustom");
const btnSettings = document.getElementById("btnSettings");

// 모달 요소
const resetModal = document.getElementById("resetModal");
const modalTitle = resetModal.querySelector(".modal-title");
const modalContent = resetModal.querySelector(".modal-content p");
const modalCancel = resetModal.querySelector(".modal-cancel");
const modalConfirm = document.getElementById("confirmReset");
const modalCloseBtn = resetModal.querySelector(".modal-close");

const TRANSLATIONS = {
  kor: {
    headerDesc: "(Speaki + Wordle)<br>스피키로 즐기는 워들입니다.",
    boardTitle: "입력",
    logTitle: "기록",
    btnReset: "정답 재설정",
    btnCustom: "정답 직접 설정",
    btnSettings: "설정",
    modalTitle: "정답 재설정",
    modalContent: "새로운 정답으로 게임을 다시 시작하시겠습니까?",
    modalCancel: "취소",
    modalConfirm: "확인",
    completeTitle: "초기화 완료",
    completeMsg: "새로운 정답이 설정되었습니다.",
    lastAnswer: "이전 정답",
    customTitle: "정답 직접 설정",
    customMsg: "원하는 정답으로 게임을 새로 시작하시겠습니까?",
    customOverlayTitle: "정답 입력",
    winTitle: "정답입니다!",
    winMsg: "축하합니다! {n}번 만에 정답을 맞추셨습니다!",
    btnRestart: "다시 시작",
    btnSave: "저장",
    winAnswerLabel: "정답",
    settingsTitle: "설정",
    soundLabel: "소리",
    wordLengthLabel: "정답 개수",
    allowDuplicates: "중복 글자 허용",
    btnResetSettings: "초기화",
    settingsConfirm: "확인",
    settingsChangeTitle: "설정 변경 확인",
    settingsChangeMsg: "게임 설정이 변경되어 현재 게임이 초기화됩니다.<br>계속하시겠습니까?"
  },
  eng: {
    headerDesc: "(Speaki + Wordle)<br>Play Wordle with Speaki!",
    boardTitle: "Enter",
    logTitle: "Log",
    btnReset: "Reset Answer",
    btnCustom: "Custom Answer",
    btnSettings: "Settings",
    modalTitle: "Reset Answer",
    modalContent: "Start a new game with a new answer?",
    modalCancel: "Cancel",
    modalConfirm: "Confirm",
    completeTitle: "Reset Complete",
    completeMsg: "A new answer has been set.",
    lastAnswer: "Last Answer",
    customTitle: "Set Custom Answer",
    customMsg: "Start a new game with your own answer?",
    customOverlayTitle: "Enter Answer",
    winTitle: "Correct!",
    winMsg: "Congratulations! Solved in {n} attempts!",
    btnRestart: "Play Again",
    btnSave: "Save",
    winAnswerLabel: "Answer",
    settingsTitle: "Settings",
    soundLabel: "Sound",
    wordLengthLabel: "Answer Length",
    allowDuplicates: "double letters",
    btnResetSettings: "Reset",
    settingsConfirm: "Confirm",
    settingsChangeTitle: "Confirm Settings Change",
    settingsChangeMsg: "Settings have changed and the current game will be reset.<br>Do you want to continue?"
  }
};

let currentLang = "kor";

function updateAllowDuplicatesBtnText() {
  const allowDuplicatesBtn = document.getElementById("allowDuplicatesBtn");
  if (!allowDuplicatesBtn) return;
  const t = TRANSLATIONS[currentLang];
  allowDuplicatesBtn.textContent = t.allowDuplicates;
}

function setLanguage(lang) {
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  
  headerDesc.innerHTML = t.headerDesc;
  boardTitle.textContent = t.boardTitle;
  logTitleText.textContent = t.logTitle;
  btnReset.textContent = t.btnReset;
  btnCustom.textContent = t.btnCustom;
  btnSettings.textContent = t.btnSettings;

  modalTitle.textContent = t.modalTitle;
  modalContent.textContent = t.modalContent;
  modalCancel.textContent = t.modalCancel;
  modalConfirm.textContent = t.modalConfirm;

  const completeTitle = document.getElementById("completeTitle");
  const completeMsg = document.getElementById("completeMsg");
  const lastAnswerLabel = document.getElementById("lastAnswerLabel");
  if (completeTitle) {
    completeTitle.textContent = t.completeTitle;
    completeMsg.textContent = t.completeMsg;
    lastAnswerLabel.textContent = t.lastAnswer;
  }

  const winTitle = document.getElementById("winTitle");
  const winMsg = document.getElementById("winMsg");
  const btnRestart = document.getElementById("btnRestart");
  const btnSave = document.getElementById("btnSave");
  if (winTitle) {
    winTitle.textContent = t.winTitle;
    winMsg.textContent = t.winMsg;
    btnRestart.textContent = t.btnRestart;
    if (btnSave) btnSave.textContent = t.btnSave;
  }

  // 설정 관련 번역 적용
  const settingsTitle = document.getElementById("settingsTitle");
  const soundLabel = document.getElementById("soundLabel");
  const wordLengthLabel = document.getElementById("wordLengthLabel");
  const btnResetSettings = document.getElementById("btnResetSettings");
  const btnConfirmSettings = document.getElementById("btnConfirmSettings");
  const settingsChangeTitle = document.getElementById("settingsChangeTitle");
  const settingsChangeMsg = document.getElementById("settingsChangeMsg");
  const confirmSettingsChange = document.getElementById("confirmSettingsChange");

  // 모달 취소 버튼들 번역
  const settingsModal = document.getElementById("settingsModal");
  if (settingsModal) {
    const settingsCancel = settingsModal.querySelector(".modal-cancel");
    if (settingsCancel) settingsCancel.textContent = t.modalCancel;
  }
  const settingsChangeModal = document.getElementById("settingsChangeModal");
  if (settingsChangeModal) {
    const settingsChangeCancel = settingsChangeModal.querySelector(".modal-cancel");
    if (settingsChangeCancel) settingsChangeCancel.textContent = t.modalCancel;
  }

  if (settingsTitle) settingsTitle.textContent = t.settingsTitle;
  if (soundLabel) soundLabel.textContent = t.soundLabel;
  if (wordLengthLabel) wordLengthLabel.textContent = t.wordLengthLabel;
  if (btnResetSettings) btnResetSettings.textContent = t.btnResetSettings;
  if (btnConfirmSettings) btnConfirmSettings.textContent = t.settingsConfirm;
  if (settingsChangeTitle) settingsChangeTitle.textContent = t.settingsChangeTitle;
  if (settingsChangeMsg) settingsChangeMsg.innerHTML = t.settingsChangeMsg;
  if (confirmSettingsChange) confirmSettingsChange.textContent = t.modalConfirm;

  // 중복 허용 버튼 텍스트 업데이트
  updateAllowDuplicatesBtnText();

  langToggle.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (document.activeElement && modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}

function showWinModal() {
  const winModal = document.getElementById("winModal");
  const winSecretDisplay = document.getElementById("winSecretDisplay");
  const winLogDisplay = document.getElementById("winLogDisplay");
  const winAnswerLabel = document.getElementById("winAnswerLabel");
  const winLogLabel = document.getElementById("winLogLabel");
  const winMsgEl = document.getElementById("winMsg");
  const t = TRANSLATIONS[currentLang];
  
  if (winMsgEl) winMsgEl.textContent = t.winMsg.replace("{n}", attempts);
  if (winAnswerLabel) winAnswerLabel.textContent = t.winAnswerLabel;
  if (winLogLabel) winLogLabel.textContent = t.logTitle;

  resizeModalRow(secretCode.length);

  winSecretDisplay.innerHTML = "";
  secretCode.forEach(id => winSecretDisplay.appendChild(createTile(id, "correct")));

  winLogDisplay.innerHTML = "";
  const logs = logEl.cloneNode(true);
  logs.querySelectorAll(".row-num").forEach(num => num.remove());
  while (logs.firstChild) winLogDisplay.appendChild(logs.firstChild);

  // 정답 사운드 순차 재생
  secretCode.forEach((id, index) => {
    setTimeout(() => {
      try {
        const sound = getSound(id);
        sound.currentTime = 0;
        sound.play();
      } catch (_) {}
    }, index * 100); // 0.1초 간격
  });

  openModal(winModal);
}

// ===== 커스텀 정답 로직 =====
let isCustomMode = false;
let customCurrent = Array(gameSettings.wordLength).fill(null);
const customConfirmModal = document.getElementById("customConfirmModal");
const customOverlay = document.getElementById("customOverlay");
const customRow = document.getElementById("customRow");
const submitCustomBtn = document.getElementById("submitCustom");
const confirmCustomBtn = document.getElementById("confirmCustom");

function startCustomMode() {
  closeModal(customConfirmModal);
  isCustomMode = true;
  customCurrent = Array(gameSettings.wordLength).fill(null);
  renderCustomRow();
  openModal(customOverlay);
  const keys = keyboardEl.querySelectorAll("button.key");
  keys.forEach(btn => btn.removeAttribute("data-state"));
}

function endCustomMode() {
  isCustomMode = false;
  closeModal(customOverlay);
  updateKeyboard();
}

function renderCustomRow() {
  customRow.innerHTML = "";
  for (let i = 0; i < gameSettings.wordLength; i++) {
    const tile = createTile(customCurrent[i]);
    customRow.appendChild(tile);
  }
  const filled = customCurrent.every(v => v !== null);
  submitCustomBtn.disabled = !filled;
}

function pushCustomSymbol(id) {
  try {
    const a = getSound(id);
    a.currentTime = 0;
    a.play();
  } catch (_) {}
  const idx = customCurrent.findIndex(v => v === null);
  if (idx === -1) return;
  customCurrent[idx] = id;
  renderCustomRow();
}

function backspaceCustom() {
  for (let i = customCurrent.length - 1; i >= 0; i--) {
    if (customCurrent[i] !== null) {
      customCurrent[i] = null;
      break;
    }
  }
  renderCustomRow();
}

function submitCustomAnswer() {
  if (!customCurrent.every(v => v !== null)) return;
  secretCode = [...customCurrent];
  console.log("DEV LOG: Secret code after custom setting:", secretCode);
  gameSettings.wordLength = customCurrent.length;
  attempts = 0;
  isGameOver = false;
  current = Array(gameSettings.wordLength).fill(null);
  symbolStates.fill(null);
  logEl.innerHTML = "";
  if (attemptCountEl) attemptCountEl.textContent = "(0)";
  resizeGameBoard();
  renderCurrentRow();
  const keys = keyboardEl.querySelectorAll("button.key");
  keys.forEach(btn => btn.removeAttribute("data-state"));
  endCustomMode();
}

function resetGame(showComplete = true) {
  const oldCode = [...secretCode];
  secretCode = generateSecretCode();
  console.log("DEV LOG: New secret code after reset:", secretCode);
  attempts = 0;
  isGameOver = false;
  current = Array(gameSettings.wordLength).fill(null);
  customCurrent = Array(gameSettings.wordLength).fill(null);
  symbolStates.fill(null);
  logEl.innerHTML = "";
  if (attemptCountEl) attemptCountEl.textContent = "(0)";
  resizeGameBoard();
  renderCurrentRow();
  updateKeyboard();
  const keys = keyboardEl.querySelectorAll("button.key");
  keys.forEach(btn => btn.removeAttribute("data-state"));
  closeModal(resetModal);
  closeModal(winModal);
  if (showComplete) showResetComplete(oldCode);
}

function resizeModalRow(numTiles) {
    const gap = 10;
    const availableWidth = Math.min(window.innerWidth * 0.9 - 40, 540);

    const totalGap = (numTiles - 1) * gap;
    let tileSize = (availableWidth - totalGap) / numTiles;
    tileSize = Math.min(tileSize, 70); 
    
    document.documentElement.style.setProperty('--modal-tile-size', `${tileSize}px`);
}

function showResetComplete(oldCode) {
  const completeModal = document.getElementById("resetCompleteModal");
  const displayRow = document.getElementById("newSecretDisplay");
  
  resizeModalRow(oldCode.length);
  
  displayRow.innerHTML = "";
  oldCode.forEach(id => displayRow.appendChild(createTile(id, "correct")));
  openModal(completeModal);
}

let current = Array(gameSettings.wordLength).fill(null);

const soundCache = new Map();
const clickSound1 = new Audio("sound/click1.mp3");
const clickSound2 = new Audio("sound/click2.mp3");

function applyVolume(sound) {
  sound.volume = gameSettings.isMuted ? 0 : gameSettings.volume;
}

function preloadSounds() {
  applyVolume(clickSound1);
  applyVolume(clickSound2);
  clickSound1.preload = "auto";
  clickSound2.preload = "auto";
  for (let i = 1; i <= SYMBOL_COUNT; i++) {
    getSound(i);
  }
}

function playClickSound1() {
  applyVolume(clickSound1);
  clickSound1.currentTime = 0;
  clickSound1.play();
}

function playClickSound2() {
  applyVolume(clickSound2);
  clickSound2.currentTime = 0;
  clickSound2.play();
}

function getSound(id) {
  if (!soundCache.has(id)) {
    const a = new Audio(`${SND_DIR}/${id}.mp3`);
    a.preload = "auto";
    soundCache.set(id, a);
  }
  const sound = soundCache.get(id);
  applyVolume(sound);
  return sound;
}

function createTile(symbolId = null, state = "") {
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.dataset.state = state;
  if (symbolId !== null) {
    tile.dataset.id = symbolId;
    const img = document.createElement("img");
    img.alt = `symbol ${symbolId}`;
    img.src = `${IMG_DIR}/${symbolId}.png`;
    tile.appendChild(img);
  }
  return tile;
}

function renderCurrentRow() {
  currentRowEl.innerHTML = "";
  for (let i = 0; i < gameSettings.wordLength; i++) {
    currentRowEl.appendChild(createTile(current[i]));
  }
}

function appendLogRow(symbolIds, states) {
  const row = document.createElement("div");
  row.className = "row";
  row.dataset.word = symbolIds.join(",");
  const numSpan = document.createElement("span");
  numSpan.className = "row-num";
  numSpan.textContent = attempts + 1;
  row.appendChild(numSpan);
  for (let i = 0; i < gameSettings.wordLength; i++) {
    row.appendChild(createTile(symbolIds[i], states[i]));
  }
  logEl.appendChild(row);
  row.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  for (const key of KEY_LAYOUT) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "key";
    if (key.type === "symbol") {
      btn.dataset.type = "symbol";
      btn.dataset.id = String(key.id);
      if (symbolStates[key.id]) btn.dataset.state = symbolStates[key.id];
      const img = document.createElement("img");
      img.alt = `symbol ${key.id}`;
      img.src = `${IMG_DIR}/${key.id}.png`;
      btn.appendChild(img);
    } else if (key.type === "backspace") {
      btn.classList.add("special", "backspace");
      btn.dataset.type = "backspace";
      btn.textContent = "⌫";
    } else if (key.type === "enter") {
      btn.classList.add("special", "enter");
      btn.dataset.type = "enter";
      btn.textContent = "⏎";
    }
    keyboardEl.appendChild(btn);
  }
}

function updateKeyboard() {
  keyboardEl.querySelectorAll("button.key[data-type='symbol']").forEach(btn => {
    const id = Number(btn.dataset.id);
    if (symbolStates[id]) btn.dataset.state = symbolStates[id];
  });
}

function pushSymbol(id) {
  try {
    const a = getSound(id);
    a.currentTime = 0;
    a.play();
  } catch (_) {}
  if (isGameOver) return;
  const idx = current.findIndex(v => v === null);
  if (idx === -1) return;
  current[idx] = id;
  renderCurrentRow();
}

function backspace() {
  if (isGameOver) return;
  for (let i = current.length - 1; i >= 0; i--) {
    if (current[i] !== null) {
      current[i] = null;
      break;
    }
  }
  renderCurrentRow();
}

function checkGuess(guess) {
  const result = Array(gameSettings.wordLength).fill("absent");
  const secretCopy = [...secretCode];
  const guessCopy = [...guess];
  for (let i = 0; i < gameSettings.wordLength; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      result[i] = "correct";
      secretCopy[i] = null;
      guessCopy[i] = null;
    }
  }
  for (let i = 0; i < gameSettings.wordLength; i++) {
    if (guessCopy[i] !== null) {
      const idx = secretCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        result[i] = "present";
        secretCopy[idx] = null;
      }
    }
  }
  return result;
}

function enter() {
  if (isGameOver) return;
  if (!current.every(v => v !== null)) return;
  const guess = [...current];
  const states = checkGuess(guess);
  appendLogRow(guess, states);
  states.forEach((state, i) => {
    const id = guess[i];
    const currentState = symbolStates[id];
    if (state === "correct") symbolStates[id] = "correct";
    else if (state === "present") { if (currentState !== "correct") symbolStates[id] = "present"; }
    else if (state === "absent") { if (!currentState) symbolStates[id] = "absent"; }
  });
  updateKeyboard();
  attempts++;
  if (attemptCountEl) attemptCountEl.textContent = `(${attempts})`;
  if (states.every(s => s === "correct")) {
    isGameOver = true;
    setTimeout(showWinModal, 100);
  }
  current = Array(gameSettings.wordLength).fill(null);
  renderCurrentRow();
}

function updateStickyTops() {
  const header = document.querySelector("header");
  const controls = document.querySelector(".controls");
  if (!header || !controls) return;

  const headerHeight = header.offsetHeight;
  const controlsHeight = controls.offsetHeight;
  
  document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--sticky-offset', `${headerHeight + controlsHeight}px`);
}

function resizeGameBoard() {
  const boardEl = document.querySelector(".board");
  if (!boardEl) return;

  const numTiles = gameSettings.wordLength;
  const gap = 10;
  
  const panelWidth = boardEl.parentElement.clientWidth - 32;
  const availableWidth = Math.min(panelWidth, 820 - 32); 

  const totalGap = (numTiles - 1) * gap;
  let tileSize = (availableWidth - totalGap) / numTiles;
  
  tileSize = Math.min(tileSize, 90); 

  document.documentElement.style.setProperty("--tile", `${tileSize}px`);
  
  const rowNumWidth = tileSize * 0.5;
  const rowNumMargin = tileSize * 0.1;
  const totalRowContentWidth = (numTiles * tileSize) + totalGap;
  const leftOffset = (totalRowContentWidth / 2) + rowNumWidth + rowNumMargin;
  
  document.documentElement.style.setProperty('--row-num-left', `calc(50% - ${leftOffset - 5}px)`);

  renderCustomRow();
}

// ===== 이벤트 =====
langToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".lang-btn");
  if (!btn || btn.classList.contains("active")) return;
  setLanguage(btn.dataset.lang);
});

btnReset.addEventListener("click", () => {
  playClickSound1();
  openModal(resetModal);
});
modalConfirm.addEventListener("click", () => {
  playClickSound1();
  resetGame(true);
});
btnCustom.addEventListener("click", () => {
  playClickSound1();
  openModal(customConfirmModal);
});
confirmCustomBtn.addEventListener("click", () => {
  playClickSound1();
  startCustomMode();
});
submitCustomBtn.addEventListener("click", () => {
  playClickSound1();
  submitCustomAnswer();
});

let settingsBackup = null;

function updateAllowDuplicatesBtnText() {
  const allowDuplicatesBtn = document.getElementById("allowDuplicatesBtn");
  if (!allowDuplicatesBtn) return;
  const t = TRANSLATIONS[currentLang];
  allowDuplicatesBtn.textContent = t.allowDuplicates;
}

btnSettings.addEventListener("click", () => {
  playClickSound1();
  const settingsModal = document.getElementById("settingsModal");

  // 전체 설정 백업
  settingsBackup = {
    volume: gameSettings.volume,
    isMuted: gameSettings.isMuted,
    _lastVolume: gameSettings._lastVolume,
    wordLength: gameSettings.wordLength,
    allowDuplicates: gameSettings.allowDuplicates
  };
  
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const btnMute = document.getElementById("btnMute");
  const wordLengthSlider = document.getElementById("wordLengthSlider");
  const wordLengthValue = document.getElementById("wordLengthValue");
  const allowDuplicatesBtn = document.getElementById("allowDuplicatesBtn");

  const currentVolume = gameSettings.isMuted ? 0 : Math.round(gameSettings.volume * 100);
  volumeSlider.value = currentVolume;
  volumeValue.textContent = currentVolume;
  btnMute.textContent = gameSettings.isMuted ? "🔇" : "🔊";
  volumeSlider.dataset.lastVolume = Math.round(gameSettings._lastVolume * 100);

  wordLengthSlider.value = gameSettings.wordLength;
  wordLengthValue.textContent = gameSettings.wordLength;
  
  allowDuplicatesBtn.classList.toggle("active", gameSettings.allowDuplicates);
  updateAllowDuplicatesBtnText();

  openModal(settingsModal);
});

const btnRestart = document.getElementById("btnRestart");
if (btnRestart) {
  btnRestart.addEventListener("click", () => {
    playClickSound1();
    resetGame(false);
  });
}

const btnSave = document.getElementById("btnSave");
if (btnSave) {
  btnSave.addEventListener("click", () => {
    const modalWindow = document.querySelector("#winModal .modal-window");
    const modalActions = document.querySelector("#winModal .modal-actions");
    const modalClose = document.querySelector("#winModal .modal-close");
    if (!modalWindow) return;
    
    if (modalActions) modalActions.style.display = "none";
    if (modalClose) modalClose.style.visibility = "hidden";
    
    html2canvas(modalWindow, { 
      backgroundColor: "#ffffff", 
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement("a");
      link.download = `speakidle_result_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      if (modalActions) modalActions.style.display = "flex";
      if (modalClose) modalClose.style.visibility = "visible";
    }).catch(err => {
      console.error("Capture failed:", err);
      if (modalActions) modalActions.style.display = "flex";
      if (modalClose) modalClose.style.visibility = "visible";
      alert("이미지 저장에 실패했습니다.");
    });
  });
}

const completeModal = document.getElementById("resetCompleteModal");
if (completeModal) {
  completeModal.querySelector(".modal-close").addEventListener("click", () => {
    playClickSound2();
    closeModal(completeModal);
  });
}

const winModal = document.getElementById("winModal");
winModal.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", () => {
    playClickSound2();
    closeModal(winModal);
  });
});

[modalCloseBtn, modalCancel].forEach(btn => {
  btn.addEventListener("click", () => {
    playClickSound2();
    closeModal(resetModal);
  });
});

customConfirmModal.querySelector(".modal-close").addEventListener("click", () => {
  playClickSound2();
  closeModal(customConfirmModal);
});
customConfirmModal.querySelector(".modal-cancel").addEventListener("click", () => {
  playClickSound2();
  closeModal(customConfirmModal);
});

// ... (previous code) ...
const settingsModal = document.getElementById("settingsModal");
const settingsChangeModal = document.getElementById("settingsChangeModal"); // 새로 추가

if (settingsModal) {
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const btnMute = document.getElementById("btnMute");
  const wordLengthSlider = document.getElementById("wordLengthSlider");
  const wordLengthValue = document.getElementById("wordLengthValue");
  const allowDuplicatesBtn = document.getElementById("allowDuplicatesBtn");

  wordLengthSlider.addEventListener("input", () => {
    wordLengthValue.textContent = wordLengthSlider.value;
  });

  allowDuplicatesBtn.addEventListener("click", () => {
    playClickSound1();
    allowDuplicatesBtn.classList.toggle("active");
    updateAllowDuplicatesBtnText();
  });

  volumeSlider.addEventListener("input", () => {
    const newVolume = parseInt(volumeSlider.value);
    volumeValue.textContent = newVolume;
    if (newVolume > 0) {
      btnMute.textContent = "🔊";
    } else {
      btnMute.textContent = "🔇";
    }

    // 실시간 적용
    gameSettings.volume = newVolume / 100;
    gameSettings.isMuted = (newVolume === 0);
    if (!gameSettings.isMuted) {
      gameSettings._lastVolume = gameSettings.volume;
    }
  });

  btnMute.addEventListener("click", () => {
    playClickSound1();
    const isCurrentlyMuted = volumeSlider.value == 0;
    if (isCurrentlyMuted) {
      const lastVol = parseFloat(volumeSlider.dataset.lastVolume) || 70;
      volumeSlider.value = lastVol;
      volumeValue.textContent = lastVol;
      btnMute.textContent = "🔊";
    } else {
      volumeSlider.dataset.lastVolume = volumeSlider.value;
      volumeSlider.value = 0;
      volumeValue.textContent = 0;
      btnMute.textContent = "🔇";
    }

    // 실시간 적용
    const newVolume = parseInt(volumeSlider.value);
    gameSettings.volume = newVolume / 100;
    gameSettings.isMuted = (newVolume === 0);
    if (!gameSettings.isMuted) {
      gameSettings._lastVolume = gameSettings.volume;
    }
  });
  
  const closeModalAndRevertUI = () => {
    // 취소 시 복구
    if (settingsBackup) {
      gameSettings.volume = settingsBackup.volume;
      gameSettings.isMuted = settingsBackup.isMuted;
      gameSettings._lastVolume = settingsBackup._lastVolume;
      gameSettings.wordLength = settingsBackup.wordLength;
      gameSettings.allowDuplicates = settingsBackup.allowDuplicates;
      settingsBackup = null;
    }
    closeModal(settingsModal);
    if (settingsChangeModal) closeModal(settingsChangeModal);
  };

  settingsModal.querySelector(".modal-close").addEventListener("click", () => {
    playClickSound2();
    closeModalAndRevertUI();
  });
  settingsModal.querySelector(".modal-cancel").addEventListener("click", () => {
    playClickSound2();
    closeModalAndRevertUI();
  });

  // 확인 버튼 핸들러 수정
  settingsModal.querySelector("#btnConfirmSettings").addEventListener("click", () => {
    playClickSound1();

    const newWordLength = parseInt(wordLengthSlider.value);
    const newAllowDuplicates = allowDuplicatesBtn.classList.contains("active");
    
    // 게임 재시작이 필요한 변경인지 확인
    const needsRestart = (
      newWordLength !== settingsBackup.wordLength ||
      newAllowDuplicates !== settingsBackup.allowDuplicates
    );

    // UI 값 임시 저장 (취소 시 복구 위해 아직 gameSettings에 반영 안함 - 소리는 이미 실시간 반영됨)
    // 하지만 여기서는 gameSettings는 소리만 실시간이고 나머지는 확인 시점 반영이라
    // 확인 버튼 누르면 일단 변경사항이 확정되어야 하는데, 재시작 확인이 필요함.
    
    // 로직 수정:
    // 1. 소리는 이미 gameSettings에 반영됨.
    // 2. 단어 길이/중복 설정은 아직 gameSettings에 반영 안 됨 (UI만 바뀜).
    // 3. needsRestart가 true면 확인 모달 띄움.
    // 4. false면 그냥 닫고 끝 (소리는 이미 반영됨, 나머지는 그대로).
    
    if (needsRestart) {
      // 확인 모달 띄우기
      openModal(settingsChangeModal);
    } else {
      // 변경 사항 확정 (백업 날림)
      settingsBackup = null;
      closeModal(settingsModal);
    }
  });

  settingsModal.querySelector("#btnResetSettings").addEventListener("click", () => {
    playClickSound1();

    volumeSlider.value = 70;
    volumeValue.textContent = '70';
    btnMute.textContent = "🔊";
    volumeSlider.dataset.lastVolume = 70;

    wordLengthSlider.value = 5;
    wordLengthValue.textContent = '5';
    
    allowDuplicatesBtn.classList.remove("active");
    updateAllowDuplicatesBtnText();
    
    // 소리 리셋 실시간 적용
    gameSettings.volume = 0.7;
    gameSettings.isMuted = false;
    gameSettings._lastVolume = 0.7;
  });

  // 설정 변경 확인 모달 이벤트
  if (settingsChangeModal) {
    const confirmBtn = settingsChangeModal.querySelector("#confirmSettingsChange");
    const cancelBtn = settingsChangeModal.querySelector(".modal-cancel");
    const closeBtn = settingsChangeModal.querySelector(".modal-close");

    confirmBtn.addEventListener("click", () => {
        playClickSound1();
        
        // UI 값으로 최종 적용
        gameSettings.wordLength = parseInt(wordLengthSlider.value);
        gameSettings.allowDuplicates = allowDuplicatesBtn.classList.contains("active");
        
        settingsBackup = null; // 변경 확정
        closeModal(settingsChangeModal);
        closeModal(settingsModal);
        resetGame(false);
    });

    [cancelBtn, closeBtn].forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound2();
            // 취소 시 원상 복구 후 모달 닫기
            closeModalAndRevertUI();
        });
    });
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (isCustomMode) return;
    const openModals = document.querySelectorAll(".modal-overlay.open");
    if (openModals.length > 0) {
      playClickSound2();
      openModals.forEach(closeModal);
    }
  }
  if (e.key === "Backspace") {
    e.preventDefault();
    playClickSound2();
    if(isCustomMode) backspaceCustom(); else backspace();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    playClickSound1();
    if (resetModal.classList.contains("open")) { resetGame(true); return; }
    if (customConfirmModal.classList.contains("open")) { startCustomMode(); return; }
    if (completeModal.classList.contains("open")) { closeModal(completeModal); return; }
    if (winModal.classList.contains("open")) { resetGame(false); return; }
    if(isCustomMode) submitCustomAnswer(); else enter();
    return;
  }
});

keyboardEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button.key");
  if (!btn) return;
  btn.blur();
  const type = btn.dataset.type;
  if (type === "symbol") {
    const id = Number(btn.dataset.id);
    if (Number.isFinite(id) && id >= 1 && id <= SYMBOL_COUNT) {
      if (isCustomMode) pushCustomSymbol(id); else pushSymbol(id);
    }
  } else if (type === "backspace") {
    playClickSound2();
    if (isCustomMode) backspaceCustom(); else backspace();
  } else if (type === "enter") {
    playClickSound1();
    if (isCustomMode) submitCustomAnswer(); else enter();
  }
});

logEl.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile || !tile.dataset.id) return;
  
  const id = Number(tile.dataset.id);
  if (Number.isFinite(id) && id >= 1 && id <= SYMBOL_COUNT) {
    if (isCustomMode) pushCustomSymbol(id); else pushSymbol(id);
  }
});

// ===== ?작 =====
setLanguage("kor");
preloadSounds();
secretCode = generateSecretCode();
// 개발???인 로그: ?재 ?답 코드
console.log("DEV LOG: Current secret code (initial generation):", secretCode);
buildKeyboard();
renderCurrentRow();
setTimeout(() => {
  resizeGameBoard();
  updateStickyTops();
  window.addEventListener("resize", () => {
    resizeGameBoard();
    updateStickyTops();
  });
}, 0);