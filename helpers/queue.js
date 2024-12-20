const fs = require('fs');
const path = require('path');

// Function to read files from a directory and add them to the queue
function readFilesFromFolder(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  const queue = [];

  // Filter and add only files to the queue (you can specify types if needed)
  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isFile()) {
      queue.push(filePath);  // Add file to the queue
    }
  });

  return queue;
}

// Function to execute a program and call the next in queue
async function executeProgram(queue, callback) {
  if (queue.length === 0) {
    console.log("All programs executed.");
    return;
  }

  const currentFile = queue.shift();
  await callback(currentFile);
  executeProgram(queue, callback);
}

exports.executeQueue = async function(directoryPath, callback) {
  const queue = readFilesFromFolder(directoryPath);
  await  executeProgram(queue, callback);
}
