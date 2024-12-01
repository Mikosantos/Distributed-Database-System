import { config } from "dotenv";
import { Router } from "express";
import { db1, db2, db3, query, connectDB, logTransaction } from './dbmanager.js';
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

router.get("/", async (req, res) => {
    const config = req.app.get('config');
    
    try {
        // Check and replicate pending transactions
        await checkAndReplicate(config);

        // Render index/landing page
        res.render('index',{
            cssFile: 'index.css'
        });
    } catch (err) {
        console.error('Error during check and replication:', err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

router.get("/create", (req, res) => {
    res.render('create', {
        error: null,
        cssFile: 'create.css'
    });
});

// Function to check if a node is up
function isNodeUp(node, config) {
    return config[node];
}

router.post('/create', async (req, res) => {
    const config = req.app.get('config');

    // All write operations are done only in node 0 (Master node)
    // HOWEVER, If node 0 (master node) is down, transfer access to the slave nodes
    // depending on the year the game was released.
    const releasedDate = new Date(req.body.releasedDate);

    let db_selected;
    
    if(config[0] === true) {
        console.log("NODE 1 is UP");
        db_selected = 0;
    }
    else { 
        console.log("NODE 1 is DOWN");
        db_selected = releasedDate.getFullYear() < 2010 ? 1 : 2;
        console.log(`Transferring master mode to ${db_selected === 1 ? 'NODE 2' : 'NODE 3'}`);
    }
    // console.log("Received game details:", req.body);
    // console.log("Determined database:", db_selected);

    let gameId;

    try {
        let queryFunc = query(db_selected);
        
        
        // Fetch the maximum AppId from the database
        const maxIdResult = await queryFunc("SELECT MAX(AppId) AS maxAppId FROM GAME_TABLE", [], 'READ');
        const maxAppId = maxIdResult[0]?.maxAppId || 0; // Default 0 if no entries are present
        
        // get new AppID
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

        // Log the transaction
        const execution_time = new Date();
        const transactionQuery = logTransaction(db_selected);

        const full_script = `
            INSERT INTO GAME_TABLE (AppID, Name, Release_date, Price, Estimated_owners, positive, negative)
            VALUES (
                ${values[0]}, 
                '${values[1]}', 
                '${values[2]}', 
                ${values[3]}, 
                '${values[4]}', 
                ${values[5]}, 
                ${values[6]}
            )
        `;


        const T_sql_script = "INSERT INTO TRANSACTION_LOGS (node_source, node_target, action, status, query, execution_time) VALUES (?, ?, ?, ?, ?, ?)";
        const T_values = [`NODE_${db_selected + 1}`, `NODE_${db_selected + 1}`, 'INSERT', 'COMPLETE', full_script, execution_time];
        const T_mode = "WRITE";
        await transactionQuery(T_sql_script, T_values, T_mode);

        // Data replication from NODE 1 to NODE 2 or NODE 3
        if (config[0] === true) {
            const nodeTarget = releasedDate.getFullYear() < 2010 ? 1 : 2;
            await replicateData(db_selected, nodeTarget, sql_script, values, config);
        // Data replication from NODE 2 or 3 to NODE 1
        } else { 
            await replicateData(db_selected, 0, sql_script, values, config);
        }
        
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

async function replicateData(nodeSource, nodeTarget, sql_script, values, config) {
    const execution_time = new Date();
    const nodeDescription = nodeTarget === 0 ? "NODE_1" : nodeTarget === 1 ? "NODE_2" : "NODE_3";

    if (!isNodeUp(nodeTarget, config)) {
        console.error(`DATA REPLICATION to ${nodeDescription} failed: Node is down`);
        const transactionQuery = logTransaction(nodeSource);

        const full_script = `
            INSERT INTO GAME_TABLE (AppID, Name, Release_date, Price, Estimated_owners, positive, negative)
            VALUES (
                ${values[0]}, 
                '${values[1]}', 
                '${values[2]}', 
                ${values[3]}, 
                '${values[4]}', 
                ${values[5]}, 
                ${values[6]}
            )
        `;

        const T_sql_script = "INSERT INTO TRANSACTION_LOGS (node_source, node_target, action, status, query, execution_time) VALUES (?, ?, ?, ?, ?, ?)";
        const T_values = [`NODE_${nodeSource + 1}`, nodeDescription, 'INSERT', 'PENDING', full_script, execution_time];
        const T_mode = "WRITE";

        await transactionQuery(T_sql_script, T_values, T_mode);
        return;
    }

    console.log(`DATA REPLICATION TO ${nodeDescription}`);

    const queryFunc = query(nodeTarget);
    const transactionQuery = logTransaction(nodeTarget);

    const full_script = `
            INSERT INTO GAME_TABLE (AppID, Name, Release_date, Price, Estimated_owners, positive, negative)
            VALUES (
                ${values[0]}, 
                '${values[1]}', 
                '${values[2]}', 
                ${values[3]}, 
                '${values[4]}', 
                ${values[5]}, 
                ${values[6]}
            )
        `;

    const T_sql_script = "INSERT INTO TRANSACTION_LOGS (node_source, node_target, action, status, query, execution_time) VALUES (?, ?, ?, ?, ?, ?)";
    const T_values = [`NODE_${nodeSource + 1}`, nodeDescription, 'INSERT', 'COMPLETE', full_script, execution_time];
    const T_mode = "WRITE";

    try {
        await queryFunc(sql_script, values, 'WRITE');
        console.log(`Data successfully replicated to ${nodeDescription} with ID: ${values[0]}`);
        await transactionQuery(T_sql_script, T_values, T_mode);
    } catch (err) {
        console.error(`Data replication to ${nodeDescription} failed:`, err);
        await transactionQuery(T_sql_script, T_values, T_mode);
    }
}

//recovery #pls gumana ka #AMEN
async function fetchPendingTransactions(node, config) {
    if (!isNodeUp(node, config)) return [];
    
    const queryFunc = logTransaction(node);
    try {
        const pendingTransactions = await queryFunc("SELECT * FROM TRANSACTION_LOGS WHERE status = 'PENDING'", [], 'READ');
        return pendingTransactions;
    } catch (err) {
        console.error(`Failed to fetch pending transactions from NODE ${node + 1}:`, err);
        return [];
    }
}

async function replicatePendingTransaction(transaction, config) {
    const nodeTarget = transaction.node_target === 'NODE_1' ? 0 : transaction.node_target === 'NODE_2' ? 1 : 2;
    const nodeSource = transaction.node_source === 'NODE_1' ? 0 : transaction.node_target === 'NODE_2' ? 1 : 2;
    if (!isNodeUp(nodeTarget, config)) return;

    console.log("NODE TARGET IS: " + transaction.node_target + "which is: " + nodeTarget)
    console.log("NODE SOURCE IS: " + transaction.node_source + "which is: " + nodeSource)
    
    const queryFunc = query(nodeTarget);
    
    try {
        console.log(transaction.query); //debugging
        await queryFunc(transaction.query, [], 'WRITE');

        console.log(`Pending transaction replicated to ${transaction.node_target}`);

        await markTransactionAsComplete(transaction.log_id, nodeSource);
        
        const transactionQuery = logTransaction(nodeTarget);
        const execution_time = new Date();
        const T_sql_script = "INSERT INTO TRANSACTION_LOGS (node_source, node_target, action, status, query, execution_time) VALUES (?, ?, ?, ?, ?, ?)";
        const T_values = [transaction.node_source, transaction.node_target, 'INSERT', 'COMPLETE', transaction.query, execution_time];
        const T_mode = "WRITE";
        await transactionQuery(T_sql_script, T_values, T_mode);
    } catch (err) {
        console.error(`Failed to replicate pending transaction to ${transaction.node_target}:`, err);
    }
}

async function markTransactionAsComplete(log_id, node) {
    const queryFunc = logTransaction(node);
    const sql_script = "UPDATE TRANSACTION_LOGS SET status = 'COMPLETE' WHERE log_id = ?";
    await queryFunc(sql_script, [log_id], 'WRITE');
}

async function checkAndReplicate(config) {
    for (let i = 0; i < config.length; i++) {
        if (isNodeUp(i, config)) {
            const pendingTransactions = await fetchPendingTransactions(i, config);
            for (const transaction of pendingTransactions) {
                await replicatePendingTransaction(transaction, config);
            }
        }
    }
}

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
        console.log("db_selected: ", db_selected)
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
