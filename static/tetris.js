
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const COLS = 10, ROWS = 20, SIZE = 30;
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

const COLORS = { I:'#7ef3ff', O:'#c8fbff', T:'#9fefff', S:'#aefaff', Z:'#8ee7ff', J:'#b7f7ff', L:'#a1f3ff' };

const SHAPES = {
  I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1],[0,0,0]],
  S:[[0,1,1],[1,1,0],[0,0,0]],
  Z:[[1,1,0],[0,1,1],[0,0,0]],
  J:[[1,0,0],[1,1,1],[0,0,0]],
  L:[[0,0,1],[1,1,1],[0,0,0]]
};

let bag = [];
function nextType(){ if(bag.length===0){ bag=['I','O','T','S','Z','J','L'].sort(()=>Math.random()-0.5);} return bag.pop(); }

function rotate(m){
  const N = m.length;
  const res = Array.from({length:N},()=>Array(N).fill(0));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ res[x][N-1-y] = m[y][x]; }
  return res;
}

function Piece(type){
  this.type = type;
  const s = SHAPES[type], N = s.length;
  this.shape = Array.from({length:N},(_,r)=>s[r].slice());
  this.x = Math.floor((COLS - N)/2);
  this.y = -1;
  this.color = COLORS[type];
}

const board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
let cur = new Piece(nextType());
let dropInterval = 120; // hard mode gravity
let lastDrop = performance.now();
let over = false;

// Controls
document.addEventListener('keydown', (e)=>{
  if(over) return;
  if(e.key === 'ArrowLeft'){ if(valid(cur.shape, cur.x-1, cur.y)) cur.x--; }
  else if(e.key === 'ArrowRight'){ if(valid(cur.shape, cur.x+1, cur.y)) cur.x++; }
  else if(e.key === 'ArrowUp'){ const rot = rotate(cur.shape); if(valid(rot, cur.x, cur.y)) cur.shape = rot; }
  else if(e.key === 'ArrowDown'){ if(valid(cur.shape, cur.x, cur.y+1)) cur.y++; }
  else if(e.key === ' '){
    while(valid(cur.shape, cur.x, cur.y+1)) cur.y++;
    lock();
  }
});

function valid(shape, offX, offY){
  const N = shape.length;
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      if(!shape[y][x]) continue;
      const nx = x + offX;
      const ny = y + offY;
      if(nx<0 || nx>=COLS || ny>=ROWS) return false;
      if(ny>=0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function lock(){
  const N = cur.shape.length;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(cur.shape[y][x]){
      const by = cur.y+y, bx = cur.x+x;
      if(by>=0) board[by][bx] = cur.color;
    }
  }
  // line clear
  for(let r=ROWS-1;r>=0;r--){
    if(board[r].every(v=>v)){ board.splice(r,1); board.unshift(Array(COLS).fill(null)); r++; }
  }
  cur = new Piece(nextType());
  if(!valid(cur.shape, cur.x, cur.y)){ over = true; }
}

function drop(){
  if(valid(cur.shape, cur.x, cur.y+1)){ cur.y++; } else { lock(); }
}

function drawCell(x,y,color){
  ctx.fillStyle = color || '#052029';
  ctx.fillRect(x*SIZE, y*SIZE, SIZE-1, SIZE-1);
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) drawCell(c,r, board[r][c] || '#052029');
  const N = cur.shape.length;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(cur.shape[y][x]){ const px=cur.x+x, py=cur.y+y; if(py>=0) drawCell(px,py,cur.color); }
  }
}

function loop(t){
  if(over){
    triggerAd();
    return;
  }
  if(t - lastDrop > dropInterval){ drop(); lastDrop = t; }
  render();
  requestAnimationFrame(loop);
}

// Ad logic & Vault tracking
const adEl = document.getElementById('ad');
const adSlide = document.getElementById('adSlide');
let adCount = 0;

// Vault UI
const vaultEl = document.getElementById('vault');
const vaultBtn = document.getElementById('vaultBtn');
const vaultClose = document.getElementById('vaultClose');
const seenList = document.getElementById('seenList');
const seenCount = document.getElementById('seenCount');
const savedToast = document.getElementById('savedToast');
const adsSeen = [];

function openVault(auto=false){
  seenList.innerHTML='';
  seenCount.textContent = String(adsSeen.length);
  adsSeen.slice().reverse().forEach(rec=>{
    const li=document.createElement('li');
    const img=document.createElement('img'); img.src=rec.preview;
    const meta=document.createElement('div'); meta.className='meta';
    const name=document.createElement('div'); name.className='name'; name.textContent=rec.name + (rec.choice && rec.choice!=='none' ? ` — ${rec.choice}` : '');
    const time=document.createElement('div'); time.className='time'; time.textContent=new Date(rec.ts).toLocaleTimeString();
    meta.appendChild(name); meta.appendChild(time);
    li.appendChild(img); li.appendChild(meta);
    seenList.appendChild(li);
  });
  vaultEl.classList.remove('hidden');
}
function closeVault(){ vaultEl.classList.add('hidden'); }
vaultBtn?.addEventListener('click', ()=> openVault(false));
vaultClose?.addEventListener('click', closeVault);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeVault(); });

function triggerAd(){
  adEl.classList.remove('hidden');
  const duration = 5000;
  const adSets = [
    ['/static/assets/ad1.png','/static/assets/ad2.png'], // Icarus(2)
    ['/static/assets/ad3.png','/static/assets/ad4.png'], // Yahweh(2)
    ['/static/assets/ad5.png','/static/assets/ad6.png']  // Momentum/Affect(2)
  ];
  const names = ['I.C.A.R.U.S.','Church of Yahweh','Momentum + Affect Industries'];
  const currentSet = adSets[adCount % adSets.length];
  const currentName = names[adCount % names.length];

  // Action selection per ad
  let userChoice = 'none';
  const actions = document.querySelector('.ad-actions');
  actions.onclick = (e)=>{
    if(e.target.tagName==='BUTTON'){
      userChoice = e.target.classList.contains('approve')?'approve': e.target.classList.contains('disapprove')?'disapprove':'ban';
    }
  };

  let idx = 0; adSlide.src = currentSet[idx];
  const step = duration / currentSet.length;
  const interval = setInterval(()=>{
    idx++;
    if(idx >= currentSet.length){ clearInterval(interval); }
    else { adSlide.src = currentSet[idx]; }
  }, step);
  // Track
  adsSeen.push({ name: currentName, preview: currentSet[0], ts: Date.now(), choice: userChoice });
  setTimeout(()=>{
    adCount++;
    // reset game & hide ad
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) board[r][c]=null;
    cur = new Piece(nextType());
    dropInterval = 120; over = false; lastDrop = performance.now();
    adEl.classList.add('hidden');
    // Toast
    if(savedToast){ savedToast.classList.add('show'); setTimeout(()=> savedToast.classList.remove('show'), 1400); }
    // Resume game
    requestAnimationFrame(loop);
  }, duration);
}

requestAnimationFrame(loop);
