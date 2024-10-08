const video = document.getElementById('video');
const canvas = document.getElementById('canvasSnap');
const context = canvas.getContext('2d');
const ready = document.getElementById('ready');
const snap = document.getElementById('snap');
const w = 96 // 48 // 24 // 320 // 640
const h = 64 // 32 //16 // 240 // 480
const scale = 5 // 10
let gcodes = []

//upload an image into a canvas tag to display and work with...
const loadFile = (event) => {
    const file = event.target.files[0];
    const canvas = document.getElementById("uploadedCanvas")
    const ctx = canvas.getContext("2d");
    if (file) {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function(e) {
            img.src = e.target.result;
        }

        img.onload = function() {
            // canvas.width = img.width;
            // canvas.height = img.height;
            ctx.drawImage(img, 0, 0, w, h);
            let uploadedImageData = ctx.getImageData(0, 0, w, h, { "willReadFrequently": true });
            //console.log(uploadedImageData)
            processImage(uploadedImageData)
        }

        reader.readAsDataURL(file);
    }
}

// downLoad g-code
let url = null
let downFilename = "toBrush_"

function triggerGenerateGCode() {
    var text = gcodes.join('\n') // GCode text
    var blob = new Blob([text], { type: "text/plain" })
    if (url != null) {
        URL.revokeObjectURL(url)
    }
    url = URL.createObjectURL(blob)
    downLink.href = url
    const now = new Date()
    const name = downFilename + now.toISOString().slice(0, 19) + ".gcode"
    downLink.innerHTML = name
    downLink.download = name
    downLink.style.visibility = "visible"
}


// Get access to the camera
ready.addEventListener("click", function () {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
        })
        .catch(function (err) {
            console.log("An error occurred: " + err);
        });
});

// // Trigger photo take
// snap.addEventListener("click", function () {
//     context.drawImage(video, 0, 0, w, h);
//     const capturedImage = canvas.toDataURL('image/png');
//     // You can send this image to the server or process it as needed
// });

// // Load reference image
// const referenceImage = new Image();
// referenceImage.src = './test2.png';  // Replace with the actual path to the reference image

// referenceImage.onload = function () {
//     const refCanvas = document.getElementById('canvasOutput');
//     const refContext = refCanvas.getContext('2d');
//     refContext.drawImage(referenceImage, 0, 0, w, h);
// };

const getColor = (img, x, y) => {
    const i = x * 4 + y * w * 4
    return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
}

const setColorAt = (img, c, x, y) => {
    const i = x * 4 + y * w * 4
    img.data[i] = Math.min(255, Math.max(0, c[0]))
    img.data[i + 1] = Math.min(255, Math.max(0, c[1]))
    img.data[i + 2] = Math.min(255, Math.max(0, c[2]))
}

const lighterThan = (c1, c2) => (c1[0] >= c2[0] && c1[1] >= c2[1] && c1[2] >= c2[2])

const scanFor = (c, image) => {
    const stroke = []
    console.log("scanFor image", image)

    for (let x = 0; x < w; x++) {
        console.log("x", x)

        for (let y = 0; y < h; y++) {
            const color = getColor(image, x, y)
            if (lighterThan(c, color)) {
                stroke.push({ x, y })
                let y2 = y + 1
                while (y2 < h && lighterThan(c, getColor(image, x, y2))) {
                    stroke.push({ x, y: y2 })
                    y2++
                }
                //return stroke
            }
        }
    }
    return stroke
}

const lightenColor = (c1, c2) => {
    return [Math.min(255, c1[0] + (255 - c2[0])),
    Math.min(255, c1[1] + (255 - c2[1])),
    Math.min(255, c1[2] + (255 - c2[2]))]
}

const clearCanvas = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height)
    ctx.beginPath();
    ctx.fillStyle = "rgb(255 255 255 / 1.0)";
    ctx.rect(0, 0, width, height);
    ctx.fill();
}

const r = (size = 1, offset = 0) => Math.random() * size + offset

const addGCodes = (bs) => {
    const f = 4 * (scale / 10) // scale factor (150 / 24 === 6.25) (100 / 16 is 6.25) 
    const d = 2.0 // depth
    const o = 20 // x and y offset
    const zo = 1.5
    const a = d * 3 // approach
    const ra = r() * f
    gcodes.push(`G0 X${(bs.x * f + o + ra).toFixed(2)} Y${(bs.y * f - a + o).toFixed(3)} Z${zo.toFixed(2)}`)
    gcodes.push(`G1 F1200 X${(bs.x * f + o + ra).toFixed(2)} Y${(bs.y * f + o).toFixed(2)} Z${(zo + d).toFixed(2)}`)
    gcodes.push(`G1 X${(bs.x * f + o + ra).toFixed(2)} Y${(bs.y * f + bs.delta_y * f + o).toFixed(4)} Z${(zo + d).toFixed(2)}`)
    gcodes.push(`G1 X${(bs.x * f + o + ra).toFixed(2)} Y${(bs.y * f + bs.delta_y * f + a + o).toFixed(2)} Z${zo.toFixed(2)}`)
}

function processImage(imageData) {
    gcodes = []
    const outCanvas2 = document.getElementById('canvasOutput2');
    const outContext2 = outCanvas2.getContext('2d');
    // clearCanvas(outContext2)
    console.log(w, h)
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const color = getColor(imageData, x, y)
            outContext2.fillStyle = `rgb(${color[0]} ${color[1]} ${color[2]})`;
            outContext2.beginPath(); // Start a new path
            outContext2.rect(x * scale, y * scale, scale, scale); // Add a rectangle to the current path
            outContext2.fill(); // Render the path
        }
    }

    const outCanvas3 = document.getElementById('canvasOutput3');
    const outContext3 = outCanvas3.getContext('2d');
    const outCanvas4 = document.getElementById('canvasOutput4');
    const outContext4 = outCanvas4.getContext('2d');


    clearCanvas(outContext3, 240, 160)
    clearCanvas(outContext4, 240, 160)
    outContext4.globalCompositeOperation = "darken" // multiply

    let paintColor = []
    let brushStrokes = []


    // paintColor = '#fa1243';
    paintColor = [50, 50, 50]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 0);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [255, 255, 170]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 1);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [255, 255, 70]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 2);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [255, 170, 255]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 3);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [255, 70, 255]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 4);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [170, 255, 255]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 5);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    paintColor = [70, 255, 255]
    brushStrokes = brushWithColor(paintColor, imageData, outContext3, outContext4, 6);
    // console.log(paintColor, brushStrokes)
    gcodes.push(`G0 Z0`, `G0 X0 Y0`, `M0`)
    brushStrokes.map(addGCodes)

    gcodes.push(`G0 Z0`)
    gcodes.push(`G0 X0 Y0`)
    gcodes.push(`M2`)


}

snap.addEventListener("click", function () {
    context.drawImage(video, 0, 0, w, h);
    let capturedImageData = context.getImageData(0, 0, w, h, { "willReadFrequently": true });

    processImage(capturedImageData)

});

function brushWithColor(paintColor, capturedImageData, outContext3, outContext4, ci) {
    const refCanvas = document.getElementById('canvasOutput');
    const refContext = refCanvas.getContext('2d');
    refContext.fillStyle = `rgb(${paintColor[0]} ${paintColor[1]} ${paintColor[2]} / 1)`;
    refContext.beginPath();
    refContext.rect(ci * 16, 0, 16, 16);
    refContext.fill();

    let moreToDo = true
    const allStrokes = []
    while (moreToDo) {
        const stroke = scanFor(paintColor, capturedImageData);
        const randomX = r(8);
        stroke.map((ele) => {
            const color = getColor(capturedImageData, ele.x, ele.y);
            const reducedColor = lightenColor(color, paintColor);
            setColorAt(capturedImageData, reducedColor, ele.x, ele.y);
            outContext3.fillStyle = `rgb(${reducedColor[0]} ${reducedColor[1]} ${reducedColor[2]})`;
            outContext3.beginPath();
            outContext3.rect(ele.x * scale, ele.y * scale, scale, scale); // Add a rectangle to the current path
            outContext3.fill(); // Render the path


            // outContext4.fillStyle = `rgba(${paintColor[0]} ${paintColor[1]} ${paintColor[2]} 1)`
            outContext4.fillStyle = `rgb(${paintColor[0]} ${paintColor[1]} ${paintColor[2]} / 0.1666)`;
            outContext4.beginPath();
            outContext4.rect(ele.x * scale, ele.y * scale, scale, scale);
            outContext4.fill();

            outContext4.fillStyle = `rgb(0 0 0 / 0.266)`;
            outContext4.beginPath();
            outContext4.rect(ele.x * scale + randomX, ele.y * scale, 1, scale);
            outContext4.fill();
        });
        moreToDo = (stroke.length > 0);
        if (moreToDo) {
            allStrokes.push({ x: stroke[0].x, y: stroke[0].y, delta_y: stroke.length })
        }
        moreToDo = false // trying just one pass 
    }
    return allStrokes;
}


// color picker
//const canvas = document.getElementById('canvas');
//const ctx = canvas.getContext('2d');
const colorWheel = document.getElementById('colorWheel');

// get the color data from the canvas at the clicked position
const canvasOutput2 = document.getElementById('canvasOutput2');
const ctxOutput2 = canvasOutput2.getContext('2d');

function getColorAtPixel(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    const imageData = ctxOutput2.getImageData(x, y, 1, 1).data;
    const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
    return color;
}

// Event listener for canvas click
canvasOutput2.addEventListener('click', function(event) {
    const color = getColorAtPixel(event);
    colorWheel.value = rgbToHex(color);
    colorWheel.style.display = 'block';
});

// Update canvas when the color wheel value changes
colorWheel.addEventListener('input', function(e) {
    console.log(e.target.value)
    console.log(this.value)
    // ctxOutput2.fillStyle = this.value;
    // ctxOutput2.fillRect(0, 0, canvas.width, canvas.height);
    // ctxOutput2.drawImage(img, 0, 0, canvas.width, canvas.height);
});

// Function to convert RGB to HEX
function rgbToHex(rgb) {
    const rgbArray = rgb.match(/\d+/g).map(Number);
    return `#${rgbArray.map(num => num.toString(16).padStart(2, '0')).join('')}`;
}
