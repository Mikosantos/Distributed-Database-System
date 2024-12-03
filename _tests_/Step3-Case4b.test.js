/*  NEW NODE INDEX EVERY TEST RUN */
/*  NEW ID EVERY TEST RUN */
jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const query = require('../control/dbmanager.js').query;

describe('step 3', () => {
    const db_selected_1 = 0;
    const db_selected_3 = 2;
    const ids = '3200400';
    const testName = 'node3-down-write-test-name';

    const buttonId = '#btn-3'; 
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
        await new Promise(resolve => setTimeout(resolve, 2500));

        let page = await browser.pages();
        page = page[0];
        await page.bringToFront();
        await page.goto('http://localhost:3000/');
        await page.setViewport({width: width, height: height});    

        await page.click('#update'); 
        await page.locator('#update-id').fill(ids);
        await page.locator('#update-gameTitle').fill(testName); 
        await page.evaluate(() => {
            const dateInput = document.querySelector('#releasedDate');
            dateInput.value = '2024-12-02'; 
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
        await page.click('#update-button');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await configPage.bringToFront();  
        await configPage.waitForNetworkIdle();

    });
    
    test('Case 4a - Failure in writing to Node 3 when attempting to replicate the transaction from the central node', async () => {
        
        const centerToNode3 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');
        const firstGameDuringAfter2010Node = await query(db_selected_3)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[1], 'READ');

        const isCenterNodeDown = !centerToNode3 || centerToNode3.length === 0;
            console.log(`Center Node Status: ${isCenterNodeDown ? "Down" : "Up"}`);
            expect(isCenterNodeDown).toBe(true);
        
        if (!isCenterNodeDown) {
        const masterServerToNode3_gameTitle = centerToNode3[0]?.Name;
        expect(masterServerToNode3_gameTitle).not.toEqual(firstGameDuringAfter2010Node[0]?.Name);

        expect(Number(centerToNode3[0]?.Price)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.Price));
        expect(String(centerToNode3[0]?.Estimated_owners)).not.toEqual(String(firstGameDuringAfter2010Node[0]?.Estimated_owners));
        expect(Number(centerToNode3[0]?.positive)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.positive));
        expect(Number(centerToNode3[0]?.negative)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.negative));
        
        const firstGameDuringAfter2010Node_releaseYear =  new Date(firstGameDuringAfter2010Node[0]?.Release_date).getFullYear();
        const centerToNode3_releaseYear = new Date(centerToNode3[0]?.Release_date).getFullYear();
        expect(centerToNode3_releaseYear).toEqual(firstGameDuringAfter2010Node_releaseYear);
        }
    });

});
  