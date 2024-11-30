import { config } from "dotenv";
import { Router } from "express";
import { db1, db2, db3, query, connectDB } from './dbmanager.js';
const router = Router();


router.get("/config", (req, res) => {
    const config = req.app.get('config');
    const db_selected = req.app.get('access'); 
    res.render('config', {
        error: null,
        db_selected:  db_selected,
        config: config 
    });
});

router.post("/config", async (req, res) => {
    const db_selected = req.body.db_selected;
    const prev_db_selected = req.app.get('access');
    const new_config = [
        req.body.config0 == 'true' ? true : false,
        req.body.config1 == 'true' ? true : false,
        req.body.config2 == 'true' ? true : false
    ];
    const prev_config = req.app.get('config');
    
    console.log("Incoming request:");
    console.log("db_selected: ", db_selected);
    console.log("prev_db_selected: ", prev_db_selected);
    console.log("req.body.config0: ", req.body.config0);
    console.log("req.body.config1: ", req.body.config1);
    console.log("req.body.config2: ", req.body.config2);
    console.log("new_config: ", new_config);
    console.log("prev_config: ", prev_config);
    
    let changed = -1; // Initialize changed to -1 for no change
    for (let i = 0; i < new_config.length; i++) {
        if (new_config[i] != prev_config[i]) {
            changed = i;
            break; // Exit loop after finding the first change
        }
    }

    console.log("changed: ", changed);

    req.app.set('config', new_config);
    req.app.set('access', db_selected);

    // SAMPLE QUERY
    /*
    connection.query("SELECT MIN(Release_date) AS Min_Release_Date, MAX(Release_date) AS Max_Release_Date FROM GAME_TABLE", (err, results) => {
        connection.end();

        if (err) {
            console.error("Failed query execution:", err);
            return res.render('config', {
                error: { status: "error", message: "Query failed."},
                db_selected,
                config: new_config
            });
        }

        console.log("Query results: ", results);

        res.render("config", {
            error: { status: 'ack', message: "Successful query execution!"}, 
            db_selected,
            config: new_config,
            data: results
        });
    });
    */


    /*
    console.log("Updated state:");
    console.log("New config:", new_config);
    console.log("Node selected:", parseInt(db_selected) + 1);
    */

    // Map db_selected to the correct DB connection
    let connection;
    switch (db_selected) {
        case '0':
            connection = db1;
            break;
        case '1':
            connection = db2;
            break;
        case '2':
            connection = db3;
            break;
        default:
            return res.render('config', {
                error: { status: 'error', message: "Invalid database selected." },
                db_selected: db_selected,
                config: new_config
            });
    }

    try {
        const queryFunc = query(db_selected); // query func from dbmanager
        const [results] = await queryFunc("SELECT MIN(Release_date) AS Min_Release_Date, MAX(Release_date) AS Max_Release_Date FROM GAME_TABLE", [], 'READ');

        console.log(results);

        const message = db_selected == prev_db_selected
            ? (changed >= 0 
                ? `Node ${changed + 1} ${new_config[changed] ? "ON" : "OFF"}!` 
                : "No changes detected.")
            : `Node ${parseInt(db_selected) + 1} selected!`;

        res.render('config', {
            error: { status: 'ack', message },
            db_selected: db_selected,
            config: new_config,
            data: results
        });

    } catch (err) {
        console.error("Error executing query:", err);

        res.render('config', {
            error: { status: 'error', message: "Database query execution failed!" },
            db_selected: db_selected,
            config: new_config
        });
    }
});
/* 
    if (db_selected == prev_db_selected) {
        const message = changed >= 0 
            ? "Node " + (changed + 1) + (new_config[changed] ? " ON" : " OFF") + "!"
            : "No changes detected.";
        // console.log("Response message:", message);
        res.render('config', {
            error: { status: 'ack', message },
            db_selected: db_selected,
            config: new_config
        });
    } else {
        const message = "Node " + (parseInt(db_selected) + 1) + " selected!";
        // console.log("Response message:", message);
        res.render('config', {
            error: { status: 'ack', message },
            db_selected: db_selected,
            config: new_config
        });
    }
});
*/

router.get("/", (req, res) => {
    res.render('index',{
        cssFile: 'index.css'
    });
});

router.get("/create", (req, res) => {
    res.render('create', {
        error: null,
        cssFile: 'create.css'
    });
});

router.post('/create', async (req, res) => {
    const config = req.app.get('config');

    // All write operations are done only in node 0 (Master node)
    const db_selected = 0;

    // console.log("Received game details:", req.body);
    // console.log("Determined database:", db_selected);

    let gameId;

    try {
        let queryFunc = query(db_selected);
        
        // Fetch the maximum AppId from the database
        const maxIdResult = await queryFunc("SELECT MAX(AppId) AS maxAppId FROM GAME_TABLE", [], 'READ');
        const maxAppId = maxIdResult[0]?.maxAppId || 0; // Default 0 if no entries are present
        
        console.log("Current max AppId:", maxAppId);

        gameId = parseInt(maxAppId, 10) + 10;

        console.log("Generated AppId:", gameId);

        req.body.AppID = gameId; // update appId

        const sql_script = "INSERT INTO GAME_TABLE (AppID, Name, Release_date, Price, Estimated_owners, positive, negative) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [req.body.AppID, req.body.gameTitle, req.body.releasedDate, req.body.price, req.body.ownerRange, 
            req.body.posReview, req.body.negReview];
        const mode = "WRITE";

        await queryFunc(sql_script, values, 'WRITE');
        console.log("Game successfully added with ID:", gameId);

        res.render('create', {
            error: null,
            success: { status: 'ack', message: "Game created!" },
            db_selected: db_selected
        });
        
    } catch (e) {
        console.error('Transaction failed. Rolling back...', e);
        res.render('create', {
            error: { status: 'error', message: "Server error has occurred!" },
            db_selected: db_selected
        });
    }
});

router.get("/update", (req, res) => {
    res.render('update', {
        error: null,
        cssFile: 'update.css'
    });
});

router.post('/update', async (req, res) => {
    // All write operations are done only in node 0 (Master node)
    const db_selected = 0;

    // console.log("Received game details:", req.body);
    // console.log("Determined database:", db_selected);

    try {
        let queryFunc = query(db_selected);
        
        const gameId = req.body.appid;
        console.log("Entered AppId:", gameId);

        const sql_script = "UPDATE GAME_TABLE SET Name = ?, Release_date = ?, Price = ?, Estimated_owners = ?, positive = ?, negative = ? WHERE AppID = ?";
        const values = [req.body.gameTitle, req.body.releasedDate, req.body.price, req.body.ownerRange, 
            req.body.posReview, req.body.negReview, gameId];

        await queryFunc(sql_script, values, 'WRITE');
        console.log("Game with ID: " + gameId + " successfully edited!", gameId);

        res.render('update', {
            error: null,
            success: { status: 'ack', message: "Game edited!" },
            db_selected: db_selected
        });
        
    } catch (e) {
        console.error('Transaction failed. Rolling back...', e);
        res.render('update', {
            error: { status: 'error', message: "Server error has occurred!" },
            db_selected: db_selected
        });
    }
});



router.get("/search", (req, res) => {
    res.render('search', {
        results: null, 
        AppID: null, 
        error: null,
        cssFile: 'search.css'
    });
});

router.get("/delete", (req, res) => {
    res.render('delete',{
        error: null,
        cssFile: 'delete.css'
    });
})

// ACTUAL-SEARCH
router.get("/search-game/:search_name", async (req, res) => {
    const searchName = req.params.search_name;
    console.log(searchName);
    const searchWords = searchName.split(' ').filter(word => word.trim() !== '');

    try {
        // Construct the SQL query
        const dbSelected = req.app.get('access'); 
        const config = req.app.get('config'); 
        
        const dbMap = [db1, db2, db3];
        const connection = dbMap[parseInt(dbSelected)];

        //console.log(config);

        const conditions = searchWords.map(word => `Name LIKE ?`).join(' OR ');
        const values = searchWords.map(word => `%${word}%`);

        const query = `SELECT * FROM GAME_TABLE WHERE ${conditions}`;

         // Execute the query
        if(config[0] === true || config[1] === true || config[2] === true) {
            connection.query(query, values, (error, results) => {
                if (error) {
                    console.error('Error searching games:', error);
                    res.status(500).json({ success: false, message: 'Error searching games', error });
                } else {
                    res.json({ success: true, results: results });
                }
                //console.log(results); //debugging
            });
        }
    } catch (error) {
        console.error('Error searching games:', error);
        res.status(500).json({ success: false, message: 'Error searching games', error });
    }
});

router.get("/report", async (req, res) => {
    try {
        const dbSelected = 0;
        const dbMap = [db1, db2, db3];
        const connection = dbMap[parseInt(dbSelected)];

        const query_1 = `SELECT COUNT(AppID) AS pre2010Count FROM GAME_TABLE WHERE YEAR(Release_date) < 2010`;
        const query_2 = `SELECT COUNT(AppID) AS post2010Count FROM GAME_TABLE WHERE YEAR(Release_date) >= 2010`;
        const query_3  = `SELECT DISTINCT Estimated_owners AS Owner_Range, COUNT(AppID) AS Count FROM GAME_TABLE GROUP BY Estimated_owners ORDER BY Estimated_owners ASC`;


        const pre2010Results = await new Promise((resolve, reject) => {
            connection.query(query_1, (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });

        const post2010Results = await new Promise((resolve, reject) => {
            connection.query(query_2, (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });

        
        const estimatedOwnersStats = await new Promise((resolve, reject) => {
            connection.query(query_3, (error, results) => {
                if (error) return reject(error);
                resolve(results); 
            });
        });
        
        const sortedEstimatedOwnersStats = estimatedOwnersStats
            .map(stat => ({
                range: stat.Owner_Range,
                count: stat.Count,
            }))
            .sort((a, b) => {
                const startA = parseInt(a.range.split('-')[0], 10);
                const startB = parseInt(b.range.split('-')[0], 10);
                return startA - startB; 
            });
        
        const gameReports = [
            { count: pre2010Results.pre2010Count },
            { count: post2010Results.post2010Count },
        ];
        
        res.render('report', {
            gameReports: gameReports,
            estimatedOwnersReport: sortedEstimatedOwnersStats,
            error: null,
            cssFile: 'report.css',
        });
        

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ success: false, message: 'Error generating report', error });
    }
});

export default router;
