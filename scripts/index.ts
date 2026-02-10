import type Level from './levels/level.ts';
import Sound from './sound.ts';

const $menu = document.getElementById('menu')!;
const $playBtn = document.getElementById('play-btn')!;
const $canvasСontainer = document.getElementById('canvas-container')!;
const $canvas = document.getElementById('canvas') as HTMLCanvasElement;


const ctx = $canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

let level: Level | null;
let loadingProgress = 0;

async function loadLevel(n: number) {
    loadingProgress = 0;
    level = null;
    const Level = (await import(`./levels/level${n}.ts`)).default;

    level = new Level(() => loadLevel(n + 1));
    level!.init();

    loadingProgress = 100;
}

const pressed: Set<string> = new Set();
document.addEventListener('keydown', event => pressed.add(event.code));
document.addEventListener('keyup', event => pressed.delete(event.code));

const debug = location.search.slice(1).split('&').includes('debug');
let renderTime: number;
let fakeProgress = 0;
let loaderAlpha = 1;

function render() {
    const now = Date.now();
    let dt = now - renderTime;

    if (dt > 1000) dt = 1000;
    renderTime = now;

    ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    if (level) {
        ctx.save();
        ctx.translate(512, 288);
        level.render(ctx, dt);
        if (debug) level.renderDebug(ctx);
        ctx.restore();
    }
    

    if (fakeProgress < 100) {
      fakeProgress += (loadingProgress - fakeProgress) * 0.1;
      drawLoadingBar(ctx, fakeProgress);

      if (fakeProgress >= 99.9) {
        fakeProgress = 100;
      }
    }
    else if (loaderAlpha > 0) {
        loaderAlpha -= 0.05;
        ctx.globalAlpha = loaderAlpha;
        drawLoadingBar(ctx, 100);
        ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
}

let physicsTime: number;

function drawLoadingBar(ctx: CanvasRenderingContext2D, progress: number) {
    const barWidth = 400;
    const barHeight = 20;
    const x = ($canvas.width - barWidth) / 2;
    const y = ($canvas.height - barHeight) / 2;

    ctx.fillStyle = '#6a5872';
    ctx.fillRect(0, 0, $canvas.width, $canvas.height);

    ctx.strokeStyle = "#bdbdbd";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    const fillWidth = (barWidth - 4) * (progress / 100);
    ctx.fillStyle = "#48ca9f";
    ctx.fillRect(x + 2, y + 2, fillWidth, barHeight - 4);
    
    ctx.fillStyle = "#fff";
    ctx.font = "14px 'epilepsySans', 'Gill Sans', calibri";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Загрузка ${progress.toFixed(2)}%`, $canvas.width / 2, y - 10);
}

function updatePhysics() {
    const now = Date.now();
    let dt = now - physicsTime;
    if (dt > 1000) dt = 1000;
    physicsTime = now;

    if (!level) return;
    level.updateKeyboard(pressed, dt);
    level.updatePhysics(dt);
}

function resize() {
    const width = innerHeight * 16 / 9;
    if (width <= innerWidth) {
        $canvas.style.width = width + 'px';
        $canvas.style.height = innerHeight + 'px';
    }
    else {
        $canvas.style.width = innerWidth + 'px';
        $canvas.style.height = innerWidth * 9 / 16 + 'px';
    }
}
addEventListener('resize', resize);
resize();

const soundTheme = Sound.load('theme', 1, true);

async function start() {
    await loadLevel(1);

    $menu.style.display = 'none';
    $canvasСontainer.style.display = 'flex';

    soundTheme.then(sound => sound.play());

    renderTime = Date.now();
    physicsTime = Date.now();
    requestAnimationFrame(render);
    setInterval(updatePhysics, 1000 / 60);
}

$playBtn.addEventListener('click', start);