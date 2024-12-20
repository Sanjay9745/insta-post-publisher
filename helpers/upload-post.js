const sleep = ms => new Promise(res => setTimeout(res, ms));

function uploadPost(page, browser, filePath, caption) {
  return new Promise(async (resolve, reject) => {
    try {
      await page.waitForSelector("svg[aria-label='New post']", { visible: true });
      await page.click("svg[aria-label='New post']");
      await page.waitForSelector("::-p-xpath(//button[text()='Select From Computer'])", { visible: true });
      const fileInput = await page.$("::-p-xpath(//form[@role='presentation']//input[@type='file'])");

      if (fileInput) {
        await fileInput.uploadFile(filePath);
        await sleep(5000);
        const Okxpath = "//div[@role='dialog']//button[contains(text(), 'OK')]";
        await page.evaluate((Okxpath) => {
          const element = document.evaluate(Okxpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (element) {
            element.click();
          }
        }, Okxpath);

        await page.waitForSelector('::-p-xpath(//button[.//*[contains(@aria-label, "Select Crop")]])', { visible: true }).then(async (el) => {
          await sleep(1000);
          el.click();
          await page.waitForSelector("::-p-xpath(//span[text()='Original'])", { visible: true }).then((el) => {
            el.click();
          });
          await sleep(1000);
          el.click();
        });
        await sleep(1000);
        await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Next')])").then(async (el) => {
          el.click();
        });
        await sleep(1000);
        await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Next')])", { visible: true }).then(async (el) => {
          el.click();
        });
        await sleep(1000);
        await page.waitForSelector("::-p-xpath(//div[@contenteditable='true'])", { visible: true }).then(async (el) => {
          el.tap();
          el.type(caption);
        });
        await sleep(1000);
        await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Share')])", { visible: true }).then(async (el) => {
          el.click();
        });
        await sleep(120000);
        await page.reload();
        resolve({ success: true });
      } else {
        reject({ success: false, error: 'File input not found' });
      }
    } catch (error) {
      reject({ success: false, error: error.message });
    }
  });
}

module.exports = uploadPost;