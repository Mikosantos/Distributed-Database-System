/*  NEW NODE INDEX EVERY TEST RUN */
jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const query = require('../control/dbmanager.js').query;

describe('step 3', () => {
    const db_selected_1 = 0;
    const db_selected_2 = 1;
    const db_selected_3 = 2;
    const id = '420';
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
        await new Promise(resolve => setTimeout(resolve, 2500));

        let page = await browser.pages();
        page = page[0];
        await page.bringToFront();
        await page.goto('http://localhost:3000/');
        await page.setViewport({width: width, height: height});    

        await page.click('#update');
         
        await page.locator('#update-id').fill(id);
        await page.locator('#update-gameTitle').fill(testName); 
        await page.evaluate(() => {
            const dateInput = document.querySelector('#releasedDate');
            dateInput.value = '2009-12-02'; 
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await configPage.bringToFront();
        await configPage.close();

    });
    
    test('Case 4a - Failure in writing to Node 2 when attempting to replicate the transaction from the central node', async () => {
        
        const centerToNode2 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", id, 'READ');
        const centerToiNode3 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", id, 'READ');
        const firstGameBefore2010Node  = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", id, 'READ');
        const firstGameDuringAfter2010Node = await query(db_selected_3)("SELECT * FROM GAME_TABLE WHERE AppID = ?", id, 'READ');

        const masterServerToNode2_gameTitle = centerToNode2[0]?.Name;
        const masterServerToNode3_gameTitle = centerToiNode3[0]?.Name;
        expect(masterServerToNode2_gameTitle).not.toEqual(firstGameBefore2010Node[0]?.Name);
        expect(masterServerToNode3_gameTitle).not.toEqual(firstGameDuringAfter2010Node[0]?.Name);

        expect(Number(centerToNode2[0]?.Price)).not.toEqual(Number(firstGameBefore2010Node[0]?.Price));
        expect(Number(centerToiNode3[0]?.Price)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.Price));

        expect(String(centerToNode2[0]?.Estimated_owners)).not.toEqual(String(firstGameBefore2010Node[0]?.Estimated_owners));
        expect(String(centerToiNode3[0]?.Estimated_owners)).not.toEqual(String(firstGameDuringAfter2010Node[0]?.Estimated_owners));

        expect(Number(centerToNode2[0]?.positive)).not.toEqual(Number(firstGameBefore2010Node[0]?.positive));
        expect(Number(centerToiNode3[0]?.positive)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.positive));

        expect(Number(centerToNode2[0]?.negative)).not.toEqual(Number(firstGameBefore2010Node[0]?.negative));
        expect(Number(centerToiNode3[0]?.negative)).not.toEqual(Number(firstGameDuringAfter2010Node[0]?.negative));
        
        
        const firstGameBefore2010Node_releaseYear =  new Date(firstGameBefore2010Node[0]?.Release_date).getFullYear();
        const firstGameDuringAfter2010Node_releaseYear =  new Date(firstGameDuringAfter2010Node[0]?.Release_date).getFullYear();
        const centerToNode2_releaseYear = new Date(centerToNode2[0]?.Release_date).getFullYear();
        const centerToiNode3_releaseYear = new Date(centerToiNode3[0]?.Release_date).getFullYear();
        expect(centerToNode2_releaseYear).not.toEqual(firstGameBefore2010Node_releaseYear);
        expect(centerToiNode3_releaseYear).not.toEqual(firstGameDuringAfter2010Node_releaseYear);
    });

});
  