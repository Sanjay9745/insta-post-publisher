const puppeteer = require("puppeteer");
const fs = require("fs");

function login(username, password) {
  return new Promise(async (resolve, reject) => {
    try {
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
      });
      if (cookiesSet && !loginFailed) {
        console.log("Already logged in using existing cookies.");
      } else {
        console.log("Logging in...");
        await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

        // Wait for login form to be visible
        await page.waitForSelector('input[name="username"]', { visible: true });
        await page.type('input[name="username"]', username, { delay: 100 });
        await page.type('input[name="password"]', password, { delay: 100 });
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

      resolve({
        browser,
        page
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = login;