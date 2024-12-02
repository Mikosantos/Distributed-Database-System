jest.setTimeout(60000);

const puppeteer = require('puppeteer');
const { query } = require('../control/dbmanager.js');

describe('Step 2: Read-Read Concurrency Test', () => {
    let browsers = [];
    let pages = [];
    let gameBefore2010Node0, gameBefore2010Node1;   
    const testName1 = "test_name_step2case3";
    const dbSelected1 = 0;
    const dbSelected2 = 1;
    const id = '10';
    const nodeIds = ['#node-1', '#node-2'];
    const configUrl = 'http://localhost:3000/config';
    const baseUrl = 'http://localhost:3000/';
    const viewport = { width: 1280, height: 720 };
    const browserConfig = {
        headless: false,
        slowMo: 0,
        args: [`--window-size=${viewport.width},${viewport.height}`],
    };

    beforeAll(async () => {
        gameBefore2010Node0 = await query(dbSelected1)(
            'SELECT * FROM GAME_TABLE WHERE AppID = ?',id, 'READ');
        gameBefore2010Node1 = await query(dbSelected2)('SELECT * FROM GAME_TABLE WHERE AppID = ?', id,'READ');

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
                dateInput.value = '2024-12-01';
                dateInput.dispatchEvent(new Event('input'));
                dateInput.dispatchEvent(new Event('change'));
            });
            await page.locator('#price').fill('300');
            await page.evaluate(() => {
                const dropdown = document.querySelector('select.inputString');
                dropdown.value = '0 - 0';
                dropdown.dispatchEvent(new Event('change'));
            });
            await page.locator('#posReview').fill('300');
            await page.locator('#negReview').fill('300');
        };
    });

    afterAll(async () => {
        for (const browser of browsers) {
            await browser.close();
        }
    });


    test('Case 1: Validate concurrent read operations and data integrity', async () => {
     
        const centerNodeGameBefore2010 = await query(dbSelected1)('SELECT * FROM GAME_TABLE WHERE AppID = ?',id,'READ');

        const masterServerToNode2GameTitle = centerNodeGameBefore2010[0]?.Name;
        const gameBefore2010Node0ReleaseYear = new Date(gameBefore2010Node0[0]?.Release_date).getFullYear();
        const centerNodeGameBefore2010ReleaseYear = new Date(centerNodeGameBefore2010[0]?.Release_date).getFullYear();

        expect(masterServerToNode2GameTitle).toEqual(gameBefore2010Node0[0]?.Name);
        expect(Number(centerNodeGameBefore2010[0]?.Price)).toEqual(Number(gameBefore2010Node0[0]?.Price));
        expect(String(centerNodeGameBefore2010[0]?.Estimated_owners)).toEqual(String(gameBefore2010Node0[0]?.Estimated_owners));
        expect(Number(centerNodeGameBefore2010[0]?.positive)).toEqual(Number(gameBefore2010Node0[0]?.positive));
        expect(Number(centerNodeGameBefore2010[0]?.negative)).toEqual(Number(gameBefore2010Node0[0]?.negative));
        expect(centerNodeGameBefore2010ReleaseYear).toEqual(gameBefore2010Node0ReleaseYear);
    });
});
