import { config } from "dotenv";
import { Router } from "express";

const router = Router();
import { connectToDB, query} from './dbmanager.js';

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
    /*
    console.log("Incoming request:");
    console.log("db_selected: ", db_selected);
    console.log("prev_db_selected: ", prev_db_selected);
    console.log("req.body.config0: ", req.body.config0);
    console.log("req.body.config1: ", req.body.config1);
    console.log("req.body.config2: ", req.body.config2);
    console.log("new_config: ", new_config);
    console.log("prev_config: ", prev_config);
    */
    let changed = -1; // Initialize changed to -1 for no change
    for (let i = 0; i < new_config.length; i++) {
        if (new_config[i] != prev_config[i]) {
            changed = i;
            break; // Exit loop after finding the first change
        }
    }

    /*console.log("changed: ", changed);*/

    req.app.set('config', new_config);
    req.app.set('access', db_selected);

    const connection = await connectToDB(db_selected);

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
    const db_selected = 1

    console.log("Received game details:", req.body);
    console.log("Determined database:", db_selected);

    let gameId;

    try {
        let queryFunc  = query(db_selected);
        
        // Fetch the maximum AppId from the database
        const maxIdResult = await queryFunc("SELECT MAX(AppId) AS maxAppId FROM Game_table", [], 'READ');
        const maxAppId = maxIdResult[0]?.maxAppId || 0; // Default to 0 if no entries are present
        
        console.log("Current max AppId:", maxAppId);

        gameId = parseInt(maxAppId, 10) + 10;

        console.log("Generated AppId:", gameId);

        req.body.AppID = gameId; // Add generated AppId to the request body

        const sql_script = "INSERT INTO Game_table VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [req.body.AppID, req.body.gameTitle, req.body.ownerRange, req.body.price, 
            req.body.posReview, req.body.negReview, req.body.releasedDate];
        const table = "GAME_TABLE";
        const mode = "WRITE";

        // Insert the game data into the database
        await queryFunc("INSERT INTO Game_table SET ?;", req.body, 'WRITE');
        console.log("Game successfully added with ID:", gameId);

        const result = await queryFunc(db_selected)(sql_script, values, table, mode);
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
})

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
        var connection = connectToDB(dbSelected);  // Use the selected DB (0, 1, or 2)

        //console.log(config);

        const conditions = searchWords.map(word => `Name LIKE ?`).join(' OR ');
        const values = searchWords.map(word => `%${word}%`);

        const query = `SELECT * FROM GAME_TABLE WHERE ${conditions}`;

         // Execute the query
        if(config[0] === true) {
            connection.query(query, values, (error, results) => {
                if (error) {
                    console.error('Error searching games:', error);
                    res.status(500).json({ success: false, message: 'Error searching games', error });
                } else {
                    res.json({ success: true, results: results });
                }
                //console.log(results); //debugging
                connection.end(); // Close the connection after query execution
            });
        } else if (config[1] === true) {
            connection = connectToDB(1);
            connection.query(query, values, (error, results) => {
                if (error) {
                    console.error('Error searching games:', error);
                    res.status(500).json({ success: false, message: 'Error searching games', error });
                } else {
                    res.json({ success: true, results: results });
                }
                //console.log(results); //debugging
                connection.end(); // Close the connection after query execution
            });
        } else if (config[2] === true) {
            connection = connectToDB(2);
            connection.query(query, values, (error, results) => {
                if (error) {
                    console.error('Error searching games:', error);
                    res.status(500).json({ success: false, message: 'Error searching games', error });
                } else {
                    res.json({ success: true, results: results });
                }
                //console.log(results); //debugging
                connection.end(); // Close the connection after query execution
            });
        }

        
    } catch (error) {
        console.error('Error searching games:', error);
        res.status(500).json({ success: false, message: 'Error searching games', error });
    }
});

export default router;
