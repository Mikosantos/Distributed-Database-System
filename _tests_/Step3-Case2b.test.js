
jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const query = require('../control/dbmanager.js').query;

describe('step 3', () => {
    const ids = ['3200420'];
    const db_selected_1 = 0;
    //const db_selected_2 = 1;
    const db_selected_3 = 2;
    const buttonId = '#btn-3'; 
    const width = 1280; 
    const height = 720; 
    const windowSize = '--window-size=' + width + ',' + height;
    const slowMo = 0;

    //var firstGameBefore2010Node; 
    var firstGameDuringAfter2010Node; 

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
        await page.locator('#read-input').fill(ids[0]); 
        await page.click('#read-button');
        await page.waitForNetworkIdle();

        //firstGameBefore2010Node = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        firstGameDuringAfter2010Node = await query(db_selected_3)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');

        await new Promise(resolve => setTimeout(resolve, 1000));

        await configPage.bringToFront();
        await configPage.click(buttonId); 
        await configPage.waitForNetworkIdle();
    });
    test('STEP 3: Case 2b - Node 3 is unavailable during the execution of a transaction and then eventually comes back online', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        //const centerToNode2 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
        const centerToiNode3 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", ids[0], 'READ');
       
       // const masterServerToNode2_gameTitle = centerToNode2[0]?.Name;
        const masterServerToNode3_gameTitle = centerToiNode3[0]?.Name;
        //expect(masterServerToNode2_gameTitle).toEqual(firstGameBefore2010Node[0]?.Name);
        expect(masterServerToNode3_gameTitle).toEqual(firstGameDuringAfter2010Node[0]?.Name);

       // expect(Number(centerToNode2[0]?.Price)).toEqual(Number(firstGameBefore2010Node[0]?.Price));
        expect(Number(centerToiNode3[0]?.Price)).toEqual(Number(firstGameDuringAfter2010Node[0]?.Price));

        //expect(String(centerToNode2[0]?.Estimated_owners)).toEqual(String(firstGameBefore2010Node[0]?.Estimated_owners));
        expect(String(centerToiNode3[0]?.Estimated_owners)).toEqual(String(firstGameDuringAfter2010Node[0]?.Estimated_owners));

       // expect(Number(centerToNode2[0]?.positive)).toEqual(Number(firstGameBefore2010Node[0]?.positive));
        expect(Number(centerToiNode3[0]?.positive)).toEqual(Number(firstGameDuringAfter2010Node[0]?.positive));

        //expect(Number(centerToNode2[0]?.negative)).toEqual(Number(firstGameBefore2010Node[0]?.negative));
        expect(Number(centerToiNode3[0]?.negative)).toEqual(Number(firstGameDuringAfter2010Node[0]?.negative));
        
        
       // const firstGameBefore2010Node_releaseYear =  new Date(firstGameBefore2010Node[0]?.Release_date).getFullYear();
        const firstGameDuringAfter2010Node_releaseYear =  new Date(firstGameDuringAfter2010Node[0]?.Release_date).getFullYear();
        //const centerToNode2_releaseYear = new Date(centerToNode2[0]?.Release_date).getFullYear();
        const centerToiNode3_releaseYear = new Date(centerToiNode3[0]?.Release_date).getFullYear();
       // expect(centerToNode2_releaseYear).toEqual(firstGameBefore2010Node_releaseYear);
        expect(centerToiNode3_releaseYear).toEqual(firstGameDuringAfter2010Node_releaseYear);
    });
}, 30000);
