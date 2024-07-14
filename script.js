const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const ready = document.getElementById('ready');
const snap = document.getElementById('snap');
const w = 320 // 640
const h = 240 // 480

// Get access to the camera
ready.addEventListener("click", function() {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        video.srcObject = stream;
    })
    .catch(function(err) {
        console.log("An error occurred: " + err);
    });
});

// Trigger photo take
snap.addEventListener("click", function() {
    context.drawImage(video, 0, 0, w, h);
    const capturedImage = canvas.toDataURL('image/png');
    // You can send this image to the server or process it as needed
});

// Load reference image
const referenceImage = new Image();
referenceImage.src = './test2.png';  // Replace with the actual path to the reference image

referenceImage.onload = function() {
    const refCanvas = document.createElement('canvas');
    const refContext = refCanvas.getContext('2d');
    refCanvas.width = w;
    refCanvas.height = h;
    refContext.drawImage(referenceImage, 0, 0, w, h);
    const refImageData = refContext.getImageData(0, 0, w, h);
    console.log(refImageData.data[w*h/2], refImageData.data[w*h/2 + 1])

    snap.addEventListener("click", function() {
        context.drawImage(video, 0, 0, w, h);
        const capturedImageData = context.getImageData(0, 0, w, h);

        // Convert ImageData to cv.Mat
        const refMat = cv.matFromImageData(refImageData);
        const capturedMat = cv.matFromImageData(capturedImageData);

        // Subtract the images
        const diffMat = new cv.Mat();
        cv.absdiff(refMat, capturedMat, diffMat);
        
        cv.imshow('canvasOutput', diffMat);

        // // // Convert the difference image to binary
        // // const binaryMat = new cv.Mat();
        // // cv.threshold(diffMat, binaryMat, 50, 255, cv.THRESH_BINARY);

        // // // Find contours
        // // const contours = new cv.MatVector();
        // // const hierarchy = new cv.Mat();
        // // cv.findContours(binaryMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // // // Generate G-code
        // // const gcode = [];
        // // for (let i = 0; i < contours.size(); i++) {
        // //     const contour = contours.get(i);
        // //     gcode.push(`G0 X${contour.data32S[0]} Y${contour.data32S[1]}`);
        // //     for (let j = 1; j < contour.data32S.length; j += 2) {
        // //         gcode.push(`G1 X${contour.data32S[j]} Y${contour.data32S[j+1]}`);
        // //     }
        // // }

        // // console.log(gcode.join('\n'));

        // Clean up
        refMat.delete();
        capturedMat.delete();
        diffMat.delete();
        // // binaryMat.delete();
        // // contours.delete();
        // // hierarchy.delete();
    });
};
