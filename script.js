const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const ready = document.getElementById('ready');
const snap = document.getElementById('snap');

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
    context.drawImage(video, 0, 0, 640, 480);
    const capturedImage = canvas.toDataURL('image/png');
    // You can send this image to the server or process it as needed
});

// Load reference image
const referenceImage = new Image();
referenceImage.src = 'test.png';  // Replace with the actual path to the reference image

referenceImage.onload = function() {
    const refCanvas = document.createElement('canvas');
    const refContext = refCanvas.getContext('2d');
    refCanvas.width = 640;
    refCanvas.height = 480;
    refContext.drawImage(referenceImage, 0, 0, 640, 480);
    const refImageData = refContext.getImageData(0, 0, 640, 480);

    snap.addEventListener("click", function() {
        context.drawImage(video, 0, 0, 640, 480);
        const capturedImageData = context.getImageData(0, 0, 640, 480);

        // Convert ImageData to cv.Mat
        const refMat = cv.matFromImageData(refImageData);
        const capturedMat = cv.matFromImageData(capturedImageData);

        // Subtract the images
        const diffMat = new cv.Mat();
        cv.absdiff(refMat, capturedMat, diffMat);

        // Convert the difference image to binary
        const binaryMat = new cv.Mat();
        cv.threshold(diffMat, binaryMat, 50, 255, cv.THRESH_BINARY);

        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(binaryMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Generate G-code
        const gcode = [];
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            gcode.push(`G0 X${contour.data32S[0]} Y${contour.data32S[1]}`);
            for (let j = 1; j < contour.data32S.length; j += 2) {
                gcode.push(`G1 X${contour.data32S[j]} Y${contour.data32S[j+1]}`);
            }
        }

        console.log(gcode.join('\n'));

        // Clean up
        refMat.delete();
        capturedMat.delete();
        diffMat.delete();
        binaryMat.delete();
        contours.delete();
        hierarchy.delete();
    });
};
