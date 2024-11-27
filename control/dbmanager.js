import mysql from 'mysql2';

export const connectToDB = (db_selected) => {
    // TODO: protect db details within env file
    const dbConfigs = [
        {
            host: "ccscloud.dlsu.edu.ph",
            user: "root",
            port: 20452,
            password: "jHUyM3G4NWKcvbEhZ7ge5dPz",
            database: "dw_stream_games"
        }, 
        {
            host: "ccscloud.dlsu.edu.ph",
            user: "root",
            port: 20462,
            password: "jHUyM3G4NWKcvbEhZ7ge5dPz",
            database: "dw_stream_games"
        }, 
        {
            host: "ccscloud.dlsu.edu.ph",
            user: "root",
            port: 20472,
            password: "jHUyM3G4NWKcvbEhZ7ge5dPz",
            database: "dw_stream_games"
        }
    ];

    const selectedConfig = dbConfigs[parseInt(db_selected)];
    const conn = mysql.createConnection(selectedConfig);

    conn.connect(err => {
        if (err) {
            console.error("DB connection failed: ", err.stack);
        } else {
            console.log("Successfully connected to database node: ", db_selected);
        }
    });

    return conn;
}