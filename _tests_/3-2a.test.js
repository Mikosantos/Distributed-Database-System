jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const query1 = require('../control/dbmanager.js').query1; 
const query2 = require('../control/dbmanager.js').query2; 
const query3 = require('../control/dbmanager.js').query3; 

describe('step 3', () => {
    const ids = ['20', '20']

    const buttonId = '#btn-2'; 
    const width = 1280; 
    const height = 720; 
    const windowSize = '--window-size=' + width + ',' + height;
    const slowMo = 0;

    var firstGameBefore2010Node; 
    var firstGameDuringAter2010Node; 

    beforeAll(async () => {
        const browser = await puppeteer.launch({
            headless: false, 
            slowMo: slowMo, 
            args: [windowSize] 
        });

        const configPage = await browser.newPage();
        await configPage.bringToFront(); 
        await configPage.goto('http://localhost:3000/config'); 
        await configPage.setViewport({ width: width, height: height }); 
        await configPage.click(buttonId); 

        let page = await browser.pages();
        page = page[0]; 
        await page.bringToFront();
        await page.goto('http://localhost:3000/'); 
        await page.setViewport({ width: width, height: height });

        await page.click('#read');
        await page.locator('#read-input').fill(ids[0]); 
        await page.click('#read-button');
        await page.waitForNetworkIdle(); 
        await page.locator('#read-input').fill(ids[1]); 
        await page.click('#read-button');
        await page.waitForNetworkIdle();

        firstGameBefore2010Node = await query2("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        firstGameDuringAter2010Node = await query3("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');

        await new Promise(resolve => setTimeout(resolve, 1000));

        await configPage.bringToFront();
        await configPage.click(buttonId); 
        await configPage.waitForNetworkIdle();
    });
    test('STEP 3: Case 2a - GameBefore2010Node is unavailable during the execution of a transaction and then eventually comes back online.', async () => {
        await new Promise(resolve => setTimeout(resolve, 4000));

        const centerToNode2 = await query1("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        const centerToiNode3 = await query1("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');

        expect(centerToNode2).toEqual(firstGameBefore2010Node);
        expect(centerToiNode3).toEqual(firstGameDuringAter2010Node);
    });
}, 30000);