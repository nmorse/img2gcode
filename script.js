const video = document.getElementById('video');
const canvas = document.getElementById('canvasSnap');
const context = canvas.getContext('2d');
const ready = document.getElementById('ready');
const snap = document.getElementById('snap');
const w = 24 // 320 // 640
const h = 16 // 240 // 480

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

// Load reference image
const referenceImage = new Image();
referenceImage.src = './test2.png';  // Replace with the actual path to the reference image

referenceImage.onload = function () {
    const refCanvas = document.getElementById('canvasOutput');
    const refContext = refCanvas.getContext('2d');
    refContext.drawImage(referenceImage, 0, 0, w, h);
};

const getColor = (img, x, y) => {
    const i = x*4 + y*w*4
    return [img.data[i], img.data[i+1], img.data[i+2], img.data[i+3]]
}

const setColorAt = (img, c, x, y) => {
    const i = x*4 + y*w*4
    img.data[i] = c[0]
    img.data[i+1] = c[1]
    img.data[i+2] = c[2]
}

const lighterThan = (c1, c2) => (c1[0] >= c2[0] && c1[1] >= c2[1] && c1[2] >= c2[2])

const scanFor = (c, image) => {
    const stroke = []
    for(let x = 0; x < w; x++) {
        for(let y = 0; y < h; y++) {
            const color = getColor(image, x, y)
            if (lighterThan(c, color)) {
                stroke.push({x, y})
                let y2 = y+1
                while(y2 < h && lighterThan(c, getColor(image, x, y2))) {
                    stroke.push({x, y2})
                    y2++
                }
                return stroke
            }
        }
    }
    return []
}

const lightenColor = (c1, c2) => {
    return [Math.min(255, c1[0]+(255-c2[0])), 
    Math.min(255, c1[1]+(255-c2[1])), 
    Math.min(255, c1[2]+(255-c2[2]))]
}

snap.addEventListener("click", function () {
    const refCanvas = document.getElementById('canvasOutput');
    const refContext = refCanvas.getContext('2d');
    // refContext.drawImage(referenceImage, 0, 0, w, h);
    const refImageData = refContext.getImageData(0, 0, w, h);

    context.drawImage(video, 0, 0, w, h);
    const capturedImageData = context.getImageData(0, 0, w, h);
    // console.log(getColor(capturedImageData, Math.floor(w/4), Math.floor(h/4)))

    const outCanvas2 = document.getElementById('canvasOutput2');
    const outContext2 = outCanvas2.getContext('2d');

    for(let x = 0; x < w; x++) {
        for(let y = 0; y < h; y++) {
            const color = getColor(capturedImageData, x, y)
            outContext2.fillStyle = `rgb(${color[0]} ${color[1]} ${color[2]})`;
            outContext2.beginPath(); // Start a new path
            outContext2.rect(x*10, y*10, 10, 10); // Add a rectangle to the current path
            outContext2.fill(); // Render the path
        }
    }

    const outCanvas3 = document.getElementById('canvasOutput3');
    const outContext3 = outCanvas3.getContext('2d');
    const outCanvas4 = document.getElementById('canvasOutput4');
    const outContext4 = outCanvas4.getContext('2d');
    // outContext4.globalCompositeOperation = "darken"
    
    let paintColor = []
    paintColor = [200, 200, 250] 
    brushWithColor(paintColor, capturedImageData, outContext3, outContext4);
    paintColor = [250, 250, 200] 
    brushWithColor(paintColor, capturedImageData, outContext3, outContext4);
    paintColor = [200, 250, 200] 
    brushWithColor(paintColor, capturedImageData, outContext3, outContext4);

    // paintColor = [100, 100, 250] 
    // brushWithColor(paintColor, capturedImageData, outContext3, outContext4);
    // paintColor = [250, 100, 100] 
    // brushWithColor(paintColor, capturedImageData, outContext3, outContext4);
    // paintColor = [100, 250, 100] 
    // brushWithColor(paintColor, capturedImageData, outContext3, outContext4);

});

function brushWithColor(paintColor, capturedImageData, outContext3, outContext4) {
    let moreToDo = true
    while (moreToDo) {
        const stroke = scanFor(paintColor, capturedImageData);
        stroke.map((ele) => {
            const color = getColor(capturedImageData, ele.x, ele.y);
            const reducedColor = lightenColor(color, paintColor);
            setColorAt(capturedImageData, reducedColor, ele.x, ele.y);
            outContext3.fillStyle = `rgb(${reducedColor[0]} ${reducedColor[1]} ${reducedColor[2]})`;
            outContext3.beginPath();
            outContext3.rect(ele.x * 10, ele.y * 10, 10, 10); // Add a rectangle to the current path
            outContext3.fill(); // Render the path


            // outContext4.fillStyle = `rgba(${paintColor[0]} ${paintColor[1]} ${paintColor[2]} 1)`
            outContext4.fillStyle = `rgb(${paintColor[0]} ${paintColor[1]} ${paintColor[2]} / 0.333)`;
            outContext4.beginPath();
            outContext4.rect(ele.x * 10, ele.y * 10, 10, 10);
            outContext4.fill();
        });
        moreToDo = (stroke.length > 0);
    }
    return moreToDo;
}

