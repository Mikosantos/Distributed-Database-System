/*  NEW NODE INDEX EVERY TEST RUN */
/*  NEW testName1  EVERY TEST RUN */

jest.setTimeout(60000);

const puppeteer = require('puppeteer');
const { query } = require('../control/dbmanager.js');

describe('Step 2: Write-write Concurrency Test', () => {
    let browsers = [];
    let pages = [];
    let gameBefore2010Node0, gameBefore2010Node2;   
    const testName1 = "testNameC8";
    const dbSelected1 = 0;
    const dbSelected3 = 2;
    const id = '3200380';
    const nodeIds = ['#node-1', '#node-3'];
    const configUrl = 'http://localhost:3000/config';
    const baseUrl = 'http://localhost:3000/';
    const viewport = { width: 1280, height: 720 };
    const browserConfig = {
        headless: false,
        slowMo: 0,
        args: [`--window-size=${viewport.width},${viewport.height}`],
    };

    beforeAll(async () => {
        gameBefore2010Node0 = await query(dbSelected1)('SELECT * FROM GAME_TABLE WHERE AppID = ?',id, 'READ');
        gameBefore2010Node2 = await query(dbSelected3)('SELECT * FROM GAME_TABLE WHERE AppID = ?',id, 'READ');

        //gameBefore2010Node1 = await query(dbSelected2)('SELECT * FROM GAME_TABLE WHERE AppID = ?', id,'READ');

        for (let i = 0; i < 2; i++) {
            const browser = await puppeteer.launch(browserConfig);
            browsers.push(browser);

            const page = await browser.newPage();
            await page.goto(configUrl);
            await page.setViewport(viewport);
            await page.click(nodeIds[i]);
            pages.push(page);

            await page.goto(baseUrl);
            await page.click('#update');
            await page.locator('#update-id').fill(id);
            await page.locator('#update-gameTitle').fill(testName1);
            await page.evaluate(() => {
                const dateInput = document.querySelector('#releasedDate');
                dateInput.value = '2015-12-03';
                dateInput.dispatchEvent(new Event('input'));
                dateInput.dispatchEvent(new Event('change'));
            });
            await page.locator('#price').fill('400');
            await page.evaluate(() => {
                const dropdown = document.querySelector('select.inputString');
                dropdown.value = '0-20,000';
                dropdown.dispatchEvent(new Event('change'));
            });
            await page.locator('#posReview').fill('400');
            await page.locator('#negReview').fill('400');
            await page.click('#update-button');
        };
    });

    afterAll(async () => {
        for (const browser of browsers) {
            await browser.close();
        }

    });


    test('Concurrent transactions in two or more nodes are writing (update) the same data item.', async () => {
     
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const centerNodeGameBefore2010Node0 = await query(dbSelected1)('SELECT * FROM GAME_TABLE WHERE AppID = ?',id,'READ');
        const centerNodeGameBefore2010Node2 = await query(dbSelected3)('SELECT * FROM GAME_TABLE WHERE AppID = ?',id,'READ');
        console.log(centerNodeGameBefore2010Node0[0]?.Name);
        console.log(gameBefore2010Node0[0]?.Name);
        const centerNodeGameBefore2010Node0GameTitle = centerNodeGameBefore2010Node0[0]?.Name;
        expect(centerNodeGameBefore2010Node0GameTitle).not.toEqual(gameBefore2010Node0[0]?.Name);

        const centerNodeGameBefore2010Node2GameTitle = centerNodeGameBefore2010Node2[0]?.Name;
        expect(centerNodeGameBefore2010Node2GameTitle).not.toEqual(gameBefore2010Node2[0]?.Name);

      
        });
});
