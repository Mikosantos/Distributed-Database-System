/* NEED NEW NAME EVERY RUN 
    NOTE NODE3 DUE TO DATE ASSIGNED IN CREATION OF GAME
/*  NEW NODE INDEX EVERY TEST RUN */
/*  NEW ID EVERY TEST RUN */

jest.setTimeout(50000);

const puppeteer = require('puppeteer');
const query = require('../control/dbmanager.js').query; 

describe('step 3', () => {
    const db_selected_1 = 0;
    const db_selected_2 = 1;
    const db_selected_3 = 2;
    const testName = 'center-node-down-write-test-new-name4';

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
        await new Promise(resolve => setTimeout(resolve, 2500));

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
        
        await new Promise(resolve => setTimeout(resolve, 1000));


        await configPage.bringToFront();
        //await configPage.click(buttonId); 
        await configPage.close();
    });

    test('Case 3 - Failure in writing to the central node when attempting to replicate the transaction from Node 1 or Node 2', async () => {
        const centerToNode3 = await query(db_selected_1)(
            "SELECT * FROM GAME_TABLE WHERE Name = ?", 
            testName, 
            'READ'
        );
        const firstGameDuringAfter2010Node = await query(db_selected_3)(
            "SELECT * FROM GAME_TABLE WHERE Name = ?", 
            testName, 
            'READ'
        );
    
        // Check if central node data is null or undefined
        const isCenterNodeDown = !centerToNode3 || centerToNode3.length === 0;
            console.log(`Center Node Status: ${isCenterNodeDown ? "Down" : "Up"}`);
            expect(isCenterNodeDown).toBe(true);
    
        if (!isCenterNodeDown) {
            expect(centerToNode3[0]?.Name).not.toEqual(firstGameDuringAfter2010Node[0]?.Name);
            expect(Number(centerToNode3[0]?.Price)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.Price));
            expect(String(centerToNode3[0]?.Estimated_owners)).not.toEqual(String(firstGameDuringAfter2010Node[0]?.Estimated_owners));
            expect(Number(centerToNode3[0]?.positive)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.positive));
            expect(Number(centerToNode3[0]?.negative)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.negative));
    
            const centerToNode3_releaseYear = new Date(centerToNode3[0]?.Release_date).getFullYear();
            const firstGameDuringAfter2010Node_releaseYear = new Date(firstGameDuringAfter2010Node[0]?.Release_date).getFullYear();
            expect(centerToNode3_releaseYear).not.toEqual(firstGameDuringAfter2010Node_releaseYear);
        }
    });
    
}, 50000);