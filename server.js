const puppeteer = require("puppeteer");
const fs = require("fs");
const sleep = ms => new Promise(res => setTimeout(res, ms));
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  let cookiesSet = false;

  // Check if cookies file exists
  if (fs.existsSync("cookies.json")) {
    try {
      const cookiesFile = fs.readFileSync("cookies.json");
      const cookiesJson = JSON.parse(cookiesFile);

      const cookies = [];
      for (let cookie in cookiesJson) {
        cookies.push({
          name: cookie,
          value: cookiesJson[cookie],
          domain: ".instagram.com",
        });
      }

      // Set cookies to the page
      await page.setCookie(...cookies);
      cookiesSet = true;
    } catch (error) {
      console.error("Failed to read or parse cookies:", error);
    }
  }

  // Go to Instagram and check if we're logged in
  await page.goto("https://www.instagram.com/", { waitUntil: 'networkidle2' });
  const loginFailed = await page.evaluate(() => {
    return !!document.querySelector('input[name="username"]');
  })
  if (cookiesSet && !loginFailed) {
    console.log("Already logged in using existing cookies.");
  } else {
    console.log("Logging in...");
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

    // Wait for login form to be visible
    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.type('input[name="username"]', 'luke_franco123', { delay: 100 });
    await page.type('input[name="password"]', '70124165ll', { delay: 100 });
    await page.click('button[type="submit"]');

    // Wait for navigation or response after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

  
    // Get and save cookies after login
    const cookiesString = await page.cookies();
    const cookiesToSave = {};
    for (let cookie of cookiesString) {
      cookiesToSave[cookie.name] = cookie.value;
    }
    fs.writeFileSync('cookies.json', JSON.stringify(cookiesToSave, null, 2));
    console.log("Cookies saved successfully.");
  }

  await page.waitForSelector("svg[aria-label='New post']", { visible: true });
  await page.click("svg[aria-label='New post']");
  await page.waitForSelector("::-p-xpath(//button[text()='Select From Computer'])", { visible: true });
  const fileInput = await page.$("::-p-xpath(//form[@role='presentation']//input[@type='file'])");

  if (fileInput) {
    const filePath = '11.mp4';
    await fileInput.uploadFile(filePath);
    await sleep(5000);
    const Okxpath = "//div[@role='dialog']//button[contains(text(), 'OK')]";
    await page.evaluate((Okxpath) => {
      const element = document.evaluate(Okxpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        element.click();
      }
    }, Okxpath);

    await page.waitForSelector('::-p-xpath(//button[.//*[contains(@aria-label, "Select Crop")]])', { visible: true }).then(async(el) => {
      el.click();
      await page.waitForSelector("::-p-xpath(//span[text()='Original'])", { visible: true }).then((el) => {
        el.click();
      });
      el.click();
    });
   
    await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Next')])").then(async(el) => {
      el.click();
    });
   await sleep(1000);
    await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Next')])", { visible: true }).then(async(el) => {
      el.click();
    });
    await sleep(1000);
    await page.waitForSelector("::-p-xpath(//div[@contenteditable='true'])", { visible: true }).then(async(el) => {
      el.tap();
      el.type("Hello World");
    });
    sleep(1000);
    await page.waitForSelector("::-p-xpath(//div[@role='dialog']//div[@role='button' and contains(., 'Share')])", { visible: true }).then(async(el) => {
      el.click();
    });
   await sleep(180000);
  await browser.close();
  }
})();