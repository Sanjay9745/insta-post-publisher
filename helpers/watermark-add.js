const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

function overlayImageOnVideo(videoFilePath, imageFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    // Overlay position settings
    const overlayPosition = {
      x: 'main_w-overlay_w-10', // X coordinate (from left)
      y: 5, // Y coordinate (from top)
    };

    // FFmpeg command
    ffmpeg(videoFilePath)
      .input(imageFilePath)
      .complexFilter([
        '[1:v]scale=150:150[scaledImage]', // Increased the scale to 300x300
        '[0:v][scaledImage]overlay=' + overlayPosition.x + ':' + overlayPosition.y
      ])
      .output(outputFilePath)
      .on('start', () => {
        console.log('Processing started...');
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress?.percent?.toFixed(2)}% done`);
      })
      .on('error', (err) => {
        console.error('Error:', err.message);
        reject({success: false, error: err.message});
      })
      .on('end', () => {
        console.log('Processing finished!');
        resolve({succss: true, outputFilePath: outputFilePath});
      })
      .run();
  });
}

exports.addWatermark = overlayImageOnVideo;