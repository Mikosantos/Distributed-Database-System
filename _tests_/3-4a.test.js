jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const query1 = require('../control/dbmanager.js').query1; 
const query2 = require('../control/dbmanager.js').query2; 

describe('step 3', () => {
    const ids = ['20', '20'];
    const testName = 'GameBefore2010-down-write-test-';

    const buttonId = '#btn-2'; 
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
        await configPage.setViewport({width: width, height: height});    
        await configPage.click(buttonId);
        

        //open replication page
        //open and log anf recovery page

        let page = await browser.pages();
        page = page[0];
        await page.bringToFront();
        await page.goto('http://localhost:3000/');
        await page.setViewport({width: width, height: height});    

        await page.click('#update');
        for (var i = 0; i < 2; i ++) {   
            for (var j = 0; j < 3; j ++) {
                await page.locator('#update-id').fill(ids[i]);
                await page.locator('#update-gameTitle').fill(testName + j); 
                await page[i][j].evaluate(() => {
                    const dateInput = document.querySelector('#releasedDate');
                    dateInput.value = '2024-12-02'; 
                    dateInput.dispatchEvent(new Event('input')); 
                    dateInput.dispatchEvent(new Event('change')); 
                }); 
                await page[i][j].locator('#price').fill('300'); 
                await pages[i][j].evaluate(() => {
                    const dropdown = document.querySelector('select.inputString');
                    dropdown.value = '0 - 0';
                    dropdown.dispatchEvent(new Event('change'));
                });      
                await page[i][j].locator('#posReview').fill('300');
                await page[i][j].locator('#negReview').fill('300'); 
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await configPage.bringToFront();    
        await configPage.click(buttonId);
        await configPage.waitForNetworkIdle();

    });
    
    test('Case 4a - Failure in writing to Node 2 when attempting to replicate the transaction from the central node', async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const centerGameBefore2010 = await query1("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        const centerGameDuringAfter2010 = await query1("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');
        const gameBefore2010  = await query2("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        const gameDuringAfter2010 = await query3("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');

        expect(centerGameBefore2010).toEqual(gameBefore2010);
        expect(centerGameDuringAfter2010).toEqual(gameDuringAfter2010);
    });

});