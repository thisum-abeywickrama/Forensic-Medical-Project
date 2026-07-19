import pool from './config/db.js';

async function migrate() {
    try {
        console.log("Running migrations...");
        
        // Add profile_picture_url column
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);");
        await pool.query("ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);");

        // Add email verification columns
        console.log("Adding email verification columns to users...");

        // Detect a first run before creating the column: accounts that predate this
        // feature are grandfathered in, but only once. Checking first means re-running
        // the migration later cannot flip genuinely unverified accounts to verified.
        const { rows: existing } = await pool.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'email_verified';
        `);
        const isFirstRun = existing.length === 0;

        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;");

        if (isFirstRun) {
            const { rowCount } = await pool.query("UPDATE users SET email_verified = TRUE;");
            console.log(`Grandfathered ${rowCount} existing user(s) as already verified.`);
        }

        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_hash VARCHAR(255);");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0;");

        // Ensure bucket exists in storage.buckets
        console.log("Ensuring images storage bucket exists...");
        await pool.query(`
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('images', 'images', true) 
            ON CONFLICT (id) DO NOTHING;
        `);

        // Enable policy for public upload (INSERT)
        console.log("Creating public upload policy if not exists...");
        await pool.query(`
            CREATE POLICY "Allow public insert to images" 
            ON storage.objects 
            FOR INSERT 
            TO public 
            WITH CHECK (bucket_id = 'images');
        `).catch(err => {
            if (err.code === '42710') { // policy already exists
                console.log("Upload policy already exists.");
            } else {
                throw err;
            }
        });

        // Enable policy for public download (SELECT)
        console.log("Creating public select policy if not exists...");
        await pool.query(`
            CREATE POLICY "Allow public select from images" 
            ON storage.objects 
            FOR SELECT 
            TO public 
            USING (bucket_id = 'images');
        `).catch(err => {
            if (err.code === '42710') { // policy already exists
                console.log("Select policy already exists.");
            } else {
                throw err;
            }
        });

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log("Database connection closed.");
    }
}

migrate();
