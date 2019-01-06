let dots = [];
let line = [];

// Default convertion function. Invert y and adds pan.
function convertToCanvas(canvas, pan, coord) {
  return [coord[0] + pan[0], canvas.height - coord[1] - pan[1]];
}

function convertFromCanvas(canvas, pan, coord) {
  const rect = canvas.getBoundingClientRect();
  const x = coord[0] - rect.left;
  const y = coord[1] - rect.top;
  return [x - pan[0] - 3, canvas.height - y - pan[1] + 4];
}

// Draw the frame, dots and line on the canvas
// using the provided conversion function.
function draw(canvas, conv, dots, line) {
  const ctx = canvas.getContext("2d");

  function drawDot(d) {
    ctx.fillRect(d[0], d[1], 4, 4);
  }

  function drawLine(from, to) {
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  }

  function drawFrame() {
    drawLine(conv([0, 0]), conv([canvas.width - 20, 0]));
    drawLine(conv([0, 0]), conv([0, canvas.height - 20]));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFrame();
  dots.forEach(d => drawDot(conv(d)));
  if (line.length == 2) drawLine(conv(line[0]), conv(line[1]));
}

// Compute the least square
// $$xh = (A^tA)^{-1}A^tb$$
function leastSquare(dots) {
  const A = math.transpose(math.matrix([
    dots.map(d => d[0]),
    new Array(dots.length).fill(1),
  ]));
  const b = math.transpose(math.matrix(dots.map(d => d[1])));
  const xh = math.multiply(
    math.multiply(
      math.inv(
        math.multiply(
          math.transpose(A),
          A,
        ),
      ),
      math.transpose(A),
    ),
    b,
  );
  return [
    math.subset(xh, math.index(0)),
    math.subset(xh, math.index(1)),
  ];
}

function mousedown(canvas, pan, toCanvas, fromCanvas, event) {
  if (event.button == 0) {
    // Right click, add dot
    dots.push(fromCanvas([event.clientX, event.clientY]));
  } else if (event.button == 2) {
    // Left click, remove dot
    const coord = fromCanvas([event.clientX, event.clientY]);
    dots = dots.filter(d =>
      // distance between a and b:
      // (a - b)^t * (a - b)
      math.multiply(
        math.transpose(math.subtract(coord, d)),
        math.subtract(coord, d),
      ) > 200
    );
  }
  if (dots.length > 1) {
    // line equation: Cx + D = y
    const [C, D] = leastSquare(dots);
    const left = -pan[0];
    const right = canvas.width - pan[0];
    line = [
      [left, C * left + D],
      [right, C * right + D],
    ];
  } else {
    line = [];
  }
  draw(canvas, toCanvas, dots, line);
}

// Retrieve canvas, define the pan, bind events and draw
function main() {
  const pan = [10, 10];
  const canvas = document.getElementsByTagName('canvas')[0];
  const toCanvas = convertToCanvas.bind(this, canvas, pan);
  const fromCanvas = convertFromCanvas.bind(this, canvas, pan);

  canvas.addEventListener('mousedown',
    mousedown.bind(this, canvas, pan, toCanvas, fromCanvas));
  canvas.oncontextmenu = (e) => e.preventDefault();

  draw(canvas, toCanvas, dots, line);
}

window.onload = main;
