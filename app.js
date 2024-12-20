const express = require('express');
let uploadPost = require('./helpers/upload-post');
let login = require('./helpers/login');
const path = require('path');
const { executeQueue } = require('./helpers/queue');
const { addWatermark } = require('./helpers/watermark-add');
const fs = require('fs');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/add-watermark',async (req, res) => {
  let directoryPath = req.query.dpath;
  if (!directoryPath) {
    res.status(400).send('Missing directory path');
    return;
  }
  let callback = async (file) => {
    let input = path.resolve(__dirname, file);
    let watermark = path.resolve(__dirname, 'watermark.png');
    let output = path.resolve(__dirname, 'output', path.basename(file));
    await addWatermark(input, watermark, output);
  };
  executeQueue(directoryPath, callback);
  res.send('Queue started');
});

app.get('/rename-files', async (req, res) => {
  let dpath = req.query.dpath;
  let directoryPath = path.resolve(__dirname, dpath);
  if (!directoryPath) {
    res.status(400).send('Missing directory path');
    return;
  }

  let files = fs.readdirSync(directoryPath);
  files.forEach((file, index) => {
    let oldPath = path.join(directoryPath, file);
    let ext = path.extname(file);
    let newPath = path.join(directoryPath, `${index}${ext}`);
    fs.renameSync(oldPath, newPath);
  });
  res.send('Files renamed successfully');
});

app.get('/upload-directory', async (req, res) => {
  let dpath = req.query.dpath;
  let username = req.query.username;
  let password = req.query.password;
  let start = req.query.start || 0;
  let clearCookies = req.query.clearCookies || false;
  if (clearCookies) {
    fs.unlinkSync('cookies.json');
  }
  let directoryPath = path.resolve(__dirname, dpath);
  if (!directoryPath || !username || !password) {
    res.status(400).send('Missing parameters');
    return;
  }
  
  let {browser, page} = await login(username, password);
  let callback = async (file) => {
    let filepath = path.resolve(__dirname, file);
    let jsonFile = path.resolve(__dirname, 'captions.json');
    let fileBaseName = path.basename(file);
    let fileName = Number(fileBaseName.split('.')[0]);
    if (fileName < start) {
      return;
    }
    let parsedData = fs.readFileSync(jsonFile);
    let captions = JSON.parse(parsedData);
    let caption = 'Test caption';
    if (captions[fileName] && !isNaN(fileName)) {
    let {title,hashtags} = captions[fileName];
     caption = `${title}\n\n${hashtags}`;
    }
    await uploadPost(page, browser, filepath, caption);
  };
  await executeQueue(directoryPath, callback);
  res.send('All posts uploaded successfully');
});

app.get('/upload', async (req, res) => {
  let username = req.query.username;
  let password = req.query.password;
  let filepath = req.query.filepath;
  let caption = req.query.caption;
  if (!username || !password || !filepath || !caption) {
    res.status(400).send('Missing parameters');
    return;
  }
  let {browser, page} = await login(username, password);
  await uploadPost(page, browser, filepath, caption);
  res.send('Post uploaded successfully!');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});