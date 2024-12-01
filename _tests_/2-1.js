jest.setTimeout(60000);

const puppeteer = require('puppeteer');
const { query } = require('../control/dbmanager.js');

describe('Step 2', () => {
    const db_selected = 0; 
    const ids = ['10', '300'];
    const titles = ['Counter-Strike', 'Dota 2'];
    var gameBefore2010, gameDuringAfter2010;

    beforeAll(async () => {
        gameBefore2010 = await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ');
        gameDuringAfter2010 = await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ');

        const width = 1280; 
        const height = 720;
        const windowSize = '--window-size=' + width + ',' + height; 
        const slowMo = 0; 
        const browserConfig = {
            headless: false, 
            slowMo: slowMo, 
            args: [windowSize]
        }

        const browsers = [
            await puppeteer.launch(browserConfig),
            await puppeteer.launch(browserConfig),
            await puppeteer.launch(browserConfig),
            await puppeteer.launch(browserConfig)
        ];

        const pages = [
            [   
                (await browsers[0].pages())[0], 
                (await browsers[1].pages())[0]  
            ],
            [   
                (await browsers[2].pages())[0], 
                (await browsers[3].pages())[0]  
            ]
        ];

        for (var i = 0; i < 2; i++) { 
            for (var j = 0; j < 2; j++) { 
                await pages[i][j].goto('http://localhost:3000/'); 
                await pages[i][j].setViewport({width: width, height: height}); 
                await pages[i][j].click('#read'); 
                await pages[i][j].locator('#read-input').fill(titles[i]);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 4000));
        pages[0][0].click('#read-button'); 
        pages[0][1].click('#read-button'); 
        pages[1][0].click('#read-button'); 
        pages[1][1].click('#read-button');

        await pages[1][1].waitForNetworkIdle(200); 
        await new Promise(resolve => setTimeout(resolve, 4000)); 

        browsers[0].close();
        browsers[1].close();
        browsers[2].close();
        browsers[3].close();

    });
    
    test('Case 1, Read-Read Concurrency Test.', async () => {
        
        expect(await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ')).toEqual(gameBefore2010);
        expect(await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ')).not.toEqual(gameBefore2010);
        expect(await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ')).toEqual(gameDuringAfter2010);
        expect(await query(db_selected)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ')).not.toEqual(gameDuringAfter2010);
        
        });
}, 60000);
