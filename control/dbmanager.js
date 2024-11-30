import mysql from 'mysql2';

export const connectDB = (node_port) => mysql.createConnection({
    host: "ccscloud.dlsu.edu.ph",
    user: "root",
    port: node_port,
    password: "jHUyM3G4NWKcvbEhZ7ge5dPz",
    database: "dw_stream_games",
    multipleStatements: true
});

export const db1 = connectDB(20452);
export const db2 = connectDB(20462);
export const db3 = connectDB(20472);

export const query1 = async (q, values, mode) => await query(db1)(q, values, mode);
export const query2 = async (q, values, mode) => await query(db2)(q, values, mode);
export const query3 = async (q, values, mode) => await query(db3)(q, values, mode);


// Map db_selected to the correct connection
const dbMap = {
    0: db1,
    1: db2,
    2: db3
};

export const query = (db_selected) => {
    const dbConnection = dbMap[parseInt(db_selected)];

    if (!dbConnection) {
        throw new Error('Invalid database selection');
    }

    return async(query_script, values, mode) => {
        try {
            await dbConnection.promise().query("START TRANSACTION");

            // Lock tables
            await dbConnection.promise().query("LOCK TABLES GAME_TABLE " + mode);

            // Execute query
            const [rows] = await dbConnection.promise().query(query_script, values);

            await dbConnection.promise().query("COMMIT");
            
            // Unlock tables
            await dbConnection.promise().query("UNLOCK TABLES");

            // Log connection details
            // console.log("Using db_selected with config:", dbConnection.config);

            return rows;
        } catch (err) {
            try {
                await dbConnection.promise().query("ROLLBACK");
                await dbConnection.promise().query("UNLOCK TABLES");
            } catch (rollbackErr) {
                throw new Error(rollbackErr.message);
            }
            throw new Error(err.message);
        }
    }
}

// Disconnect all databases
export const disconnectAllDBs = async () => {
    try {
        for (const [key, dbConnection] of Object.entries(dbMap)) {
            await dbConnection.promise().end();
            console.log(`Database ${key} disconnected.`);
        }
    } catch (err) {
        console.error("Error disconnecting databases:", err);
    }
};

//shutdown
process.on('SIGINT', async () => {
    console.log("Shutting down... Disconnecting from databases.");
    await disconnectAllDBs();
    process.exit(0);
});