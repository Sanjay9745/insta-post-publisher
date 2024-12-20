const puppeteer = require("puppeteer");
const fs = require("fs");
const sleep = ms => new Promise(res => setTimeout(res, ms));
const querystring = require('querystring'); // This helps to parse URL-encoded data

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  // Listen to console events from the page context
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

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

  // Go to the user's Instagram page
  await page.goto("https://www.instagram.com/reels/C9vkppJSPBX/");

  await sleep(2000);

  // Interact with the page and log messages
  await page.evaluate(() => {
    document.querySelector('div[aria-haspopup="menu"]')?.click();
  });
  let capturedResponse = null;

  // Listen for network requests and capture the first GraphQL response
  page.on("requestfinished", async (request) => {
    if (request.url().includes("graphql/query")) {
      const response = await request.response();
      const data = await response.json();
  
      // Check if the required data structure exists
      if (data?.data?.xdt_api__v1__media__media_id__comments__connection && !capturedResponse) {
        capturedResponse = data;
        console.log("Captured Response:", capturedResponse);
  
        // Extract the required cursor or other data from the response
        const endCursor = capturedResponse.data.xdt_api__v1__media__media_id__comments__connection.page_info.end_cursor;
  
        // Get the original payload
        let originalPayload;
        try {
          originalPayload = JSON.parse(request.postData());
        } catch (error) {
          // If the payload is not a JSON string, try to parse it as URL-encoded data
        }
        originalPayload = querystring.parse(request.postData());
  
        // Modify the payload for the next request
        const newPayload = {
          ...originalPayload,
          variables:  JSON.stringify({ // Serialize the 'variables' object as a JSON string
            after: endCursor
          })
        };
        const headers = request.headers();
        // Manually send the modified request
        let encodedData = "av=17841463485693976&__d=www&__user=0&__a=1&__req=i&__hs=19958.HYP%3Ainstagram_web_pkg.2.1..0.1&dpr=1&__ccg=UNKNOWN&__rev=1015924123&__s=ruaolh%3Agim17v%3Aoaxufg&__hsi=7406370069092948124&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0k24o0B-q1ew65xO0FE2awgo9oO0n24oaEnxO1ywOwv89k2C1Fwc60D82IzXwae4UaEW2G0AEco5G0zK5o4q3y1Sx-0lKq2-azo7u3vwDwHg2ZwrUdUbGwmk0zU8oC1Iwqo5q3e3zhA6bwIDyUrAwHxW1oCz8rwHwjE&__csr=gmMZb3cQnsQImlQYylmXZkZqjLBBHyeLlaKQl5HFeQidJd9fgCnyrrhWyKGByGQ-GJUyEgGA5-p38G-XybVQdGrWGu68GaCAxfCzWGjzQ48Ku9BCy8K9G4HhV8abyVA4U4mU01cxE4kE3vg0SNwaK3u2G1_oKq0Ck0j61wg0aqoekymi29w49B8awkE88j4iw5BDmxE51AVkQ0kW0Q81BCewzg9E0-603v2016Jw3uE&__comet_req=7&fb_dtsg=NAcPVgiJo8Y6c-9E6ihSVNSOMMUL99RzK-5bGKf_He6THJrhOSiJiXA%3A17853828322093762%3A1724258775&jazoest=25999&lsd=9H7ALJrZTZd3U0ePNd_AgV&__spin_r=1015924123&__spin_b=trunk&__spin_t=1724429910&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisClipsDesktopCommentsPopoverQuery&variables=%7B%22media_id%22%3A%223418111833549631575%22%7D&server_timestamps=true&doc_id=7789404247782895";
        let newData = querystring.stringify(encodedData)
        await page.evaluate(
          async (url, payload, headers) => {
            const response = await fetch(url, {
              method: "POST",
              
              headers: {
                ...headers,
                "Content-Type": "application/json"
              },
              body:payload
            });
  
            const data = await response.json();
            console.log("Modified request response:", JSON.stringify(data)); // Corrected logging
  
            // Check if the response contains the required structure before sending the next request
            if (data?.data?.xdt_api__v1__media__media_id__comments__connection) {
              // Modify and send the next request based on the new data
              const nextEndCursor = data.data.xdt_api__v1__media__media_id__comments__connection.page_info.end_cursor;
  
              const nextPayload = {
                ...payload,
                variables: {
                  after: nextEndCursor
                }
              };
  
              const nextResponse = await fetch(url, {
                method: "POST",
                headers: {
                  ...headers
                },
                body: JSON.stringify(nextPayload)
              });
  
              const nextData = await nextResponse.json();
              console.log("Next modified request response:", JSON.stringify(nextData)); // Corrected logging
            }
          },
          request.url(),
          newData,
          headers
        );
      }
    }
  });
  

})();

