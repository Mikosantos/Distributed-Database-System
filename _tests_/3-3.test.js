jest.setTimeout(100000);

const puppeteer = require('puppeteer');
const query = require('../control/dbmanager.js').query; 

describe('step 3', () => {
    const db_selected_1 = 0;
    const db_selected_2 = 1;
    const db_selected_3 = 2;
    const ids = ['20', '300'];
    const testName = 'center-node-down-write-test-';

    const buttonId = '#btn-1'; 
    const width = 1280; 
    const height = 720; 
    const windowSize = '--window-size=' + width + ',' + height;
    const slowMo = 0;

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

        //open replication page
        //open and log anf recovery page

        let page = await browser.pages();
        page = page[0]; 
        await page.bringToFront();
        await page.goto('http://localhost:3000/'); 
        await page.setViewport({ width: width, height: height });

        await page.click('#create');
        await page.locator('#create-gameTitle').fill(testName); 
        await page.evaluate(() => {
            const dateInput = document.querySelector('#create-gameReleasedDate');
            dateInput.value = '2024-12-01'; 
            dateInput.dispatchEvent(new Event('input')); 
            dateInput.dispatchEvent(new Event('change')); 
        });

        await page.locator('#price').fill('300'); 
        await page.evaluate(() => {
            const dropdown = document.querySelector('select.inputString');
            dropdown.value = '0-0';
            dropdown.dispatchEvent(new Event('change')); 
        });  
        await page.locator('#posReview').fill('300');
        await page.locator('#negReview').fill('300'); 
        await page.click('#create-button');

        await new Promise(resolve => setTimeout(resolve, 10000));

        await configPage.bringToFront();
        await configPage.click(buttonId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await configPage.click('#back-button');
        await configPage.waitForNetworkIdle();
    });

    test('Case 3 - Failure in writing to the central node when attempting to replicate the transaction from Node 1 or Node 2', async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const centerGameBefore2010 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ'); 
        const centerGameDuringAfter2010 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ'); 
        const gameBefore2010 = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ'); 
        const gameDuringAfter2010 = await query(db_selected_3)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ'); 
        
       
        expect(centerGameBefore2010).toEqual(gameBefore2010);
        expect(centerGameDuringAfter2010).toEqual(gameDuringAfter2010);
    });

}, 100000);