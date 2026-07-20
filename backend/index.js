import app from "./app.js";
import pool from "./config/db.js";

// Nothing should fail silently: an error that reaches here would otherwise kill
// the process, or vanish entirely, with no clue as to what went wrong.
process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED PROMISE REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION:", error);
});

// Warn about missing configuration at startup rather than at first use
const REQUIRED_ENV = ["POSTGRES_URI", "JWT_SECRET_KEY"];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length) {
    console.error(
        "\n" +
        "==============================================================\n" +
        ` MISSING REQUIRED CONFIGURATION: ${missing.join(", ")}\n` +
        "--------------------------------------------------------------\n" +
        " The server will start but will not work correctly.\n" +
        " Copy backend/.env.example to backend/.env and fill it in.\n" +
        "==============================================================\n"
    );
}

// Test database connection
pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL successfully");
        client.release();
    })
    .catch(err => {
        console.error(
            "\n" +
            "==============================================================\n" +
            " DATABASE CONNECTION FAILED\n" +
            "--------------------------------------------------------------\n" +
            ` ${err.message}\n` +
            "\n" +
            " Check POSTGRES_URI in backend/.env.\n" +
            "==============================================================\n"
        );
        console.error(err);
    });

app.listen(3000, () => {
    console.log("Server started successfully");
    console.log("Listening on port 3000");
});

export default pool;