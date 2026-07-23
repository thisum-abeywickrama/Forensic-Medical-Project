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

        // Add password reset columns
        console.log("Adding password reset columns to users...");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_hash VARCHAR(255);");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_sent_at TIMESTAMP;");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_attempts INTEGER NOT NULL DEFAULT 0;");

        // Add PDF URL columns for forms
        console.log("Adding PDF URL columns to mlef_forms, mlr_reports, and pmr_forms...");
        await pool.query("ALTER TABLE mlef_forms ADD COLUMN IF NOT EXISTS part_a_pdf_url VARCHAR(500);");
        await pool.query("ALTER TABLE mlef_forms ADD COLUMN IF NOT EXISTS part_b_pdf_url VARCHAR(500);");
        await pool.query("ALTER TABLE mlr_reports ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);");
        await pool.query("ALTER TABLE pmr_forms ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);");

        console.log("Creating detailed autopsy form tables...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS autopsy_forms (
                id VARCHAR(50) PRIMARY KEY,
                patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
                pm_register_serial_no VARCHAR(255), date DATE, verdict VARCHAR(50),
                locus_examination TEXT, external_examination TEXT, injuries TEXT,
                injuries_on_continuation_sheet BOOLEAN DEFAULT FALSE,
                height VARCHAR(255), estimated_age VARCHAR(255), sex VARCHAR(50),
                eyes_and_pupils TEXT, hair TEXT, tongue TEXT, teeth TEXT,
                body_temperature VARCHAR(255), primary_flaccidity TEXT, rigor_mortis TEXT,
                hypostasis TEXT, putrefaction TEXT, nose_mouth_ears TEXT,
                urinary_and_sexual TEXT, anal TEXT, hands_and_nails TEXT, neck TEXT,
                head_soft_parts TEXT, skull_bones TEXT, brain_membranes_sinuses TEXT,
                brain_substance_ventricles TEXT, brain_blood_vessels TEXT, spinal_cord TEXT,
                thorax_bones TEXT, chest_cavity TEXT, pericardium TEXT, heart TEXT,
                coronary_vessels TEXT, large_blood_vessels TEXT, larynx_trachea_bronchi TEXT,
                pleura_and_lungs TEXT, gullet TEXT, abdomen_contents TEXT, peritoneum TEXT,
                diaphragm TEXT, liver_and_gall_bladder TEXT, spleen TEXT, stomach TEXT,
                small_intestines TEXT, large_intestines TEXT, pancreas TEXT, kidneys TEXT,
                suprarenal_glands TEXT, bladder_and_prostate TEXT, generative_organs TEXT,
                pelvic_blood_vessels TEXT, pelvic_bones TEXT, cause_of_death TEXT,
                mo_name VARCHAR(255), mo_qualifications VARCHAR(255), mo_designation VARCHAR(255),
                lab_request_id VARCHAR(50), status VARCHAR(50) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(50) REFERENCES users(id)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS autopsy_articles (
                id SERIAL PRIMARY KEY,
                autopsy_id VARCHAR(50) REFERENCES autopsy_forms(id) ON DELETE CASCADE,
                description TEXT,
                purpose TEXT
            );
        `);

        // Add foreign key indexes
        console.log("Creating foreign key indexes for query performance...");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlef_forms_patient_id ON mlef_forms(patient_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlef_forms_created_by ON mlef_forms(created_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlr_reports_patient_id ON mlr_reports(patient_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlr_reports_created_by ON mlr_reports(created_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_pmr_forms_patient_id ON pmr_forms(patient_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_pmr_forms_created_by ON pmr_forms(created_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_lab_requests_patient_id ON lab_requests(patient_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_lab_requests_requested_by ON lab_requests(requested_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlr_injuries_mlr_id ON mlr_injuries(mlr_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_mlr_grievous_entries_mlr_id ON mlr_grievous_entries(mlr_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_pmr_identifiers_pmr_id ON pmr_identifiers(pmr_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_autopsy_forms_patient_id ON autopsy_forms(patient_id);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_autopsy_forms_created_by ON autopsy_forms(created_by);");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_autopsy_articles_autopsy_id ON autopsy_articles(autopsy_id);");

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
