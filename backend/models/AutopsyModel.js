import pool from '../config/db.js';

const FIELDS = [
    ['pm_register_serial_no', 'pmRegisterSerialNo'], ['date', 'date'], ['verdict', 'verdict'],
    ['locus_examination', 'locusExamination'], ['external_examination', 'externalExamination'],
    ['injuries', 'injuries'], ['injuries_on_continuation_sheet', 'injuriesOnContinuationSheet'],
    ['height', 'height'], ['estimated_age', 'estimatedAge'], ['sex', 'sex'],
    ['eyes_and_pupils', 'eyesAndPupils'], ['hair', 'hair'], ['tongue', 'tongue'], ['teeth', 'teeth'],
    ['body_temperature', 'bodyTemperature'], ['primary_flaccidity', 'primaryFlaccidity'],
    ['rigor_mortis', 'rigorMortis'], ['hypostasis', 'hypostasis'], ['putrefaction', 'putrefaction'],
    ['nose_mouth_ears', 'noseMouthEars'], ['urinary_and_sexual', 'urinaryAndSexual'], ['anal', 'anal'],
    ['hands_and_nails', 'handsAndNails'], ['neck', 'neck'], ['head_soft_parts', 'headSoftParts'],
    ['skull_bones', 'skullBones'], ['brain_membranes_sinuses', 'brainMembranesSinuses'],
    ['brain_substance_ventricles', 'brainSubstanceVentricles'], ['brain_blood_vessels', 'brainBloodVessels'],
    ['spinal_cord', 'spinalCord'], ['thorax_bones', 'thoraxBones'], ['chest_cavity', 'chestCavity'],
    ['pericardium', 'pericardium'], ['heart', 'heart'], ['coronary_vessels', 'coronaryVessels'],
    ['large_blood_vessels', 'largeBloodVessels'], ['larynx_trachea_bronchi', 'larynxTracheaBronchi'],
    ['pleura_and_lungs', 'pleuraAndLungs'], ['gullet', 'gullet'], ['abdomen_contents', 'abdomenContents'],
    ['peritoneum', 'peritoneum'], ['diaphragm', 'diaphragm'], ['liver_and_gall_bladder', 'liverAndGallBladder'],
    ['spleen', 'spleen'], ['stomach', 'stomach'], ['small_intestines', 'smallIntestines'],
    ['large_intestines', 'largeIntestines'], ['pancreas', 'pancreas'], ['kidneys', 'kidneys'],
    ['suprarenal_glands', 'suprarenalGlands'], ['bladder_and_prostate', 'bladderAndProstate'],
    ['generative_organs', 'generativeOrgans'], ['pelvic_blood_vessels', 'pelvicBloodVessels'],
    ['pelvic_bones', 'pelvicBones'], ['cause_of_death', 'causeOfDeath'], ['mo_name', 'moName'],
    ['mo_qualifications', 'moQualifications'], ['mo_designation', 'moDesignation'],
    ['lab_request_id', 'labRequestId'], ['status', 'status'],
];

const fieldValues = (form) => FIELDS.map(([, key]) => form[key]);

class AutopsyModel {
    static async createAutopsyForm(form, articles) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const columns = ['id', 'patient_id', ...FIELDS.map(([column]) => column), 'created_by'];
            const values = [form.id, form.patientId, ...fieldValues(form), form.createdBy];
            const query = `
                INSERT INTO autopsy_forms (${columns.join(', ')})
                VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')})
                RETURNING *;
            `;
            await client.query(query, values);

            if (articles && articles.length > 0) {
                const insertArticleQuery = `
                    INSERT INTO autopsy_articles (autopsy_id, description, purpose)
                    VALUES ($1, $2, $3);
                `;
                for (const article of articles) {
                    await client.query(insertArticleQuery, [form.id, article.description, article.purpose]);
                }
            }

            await client.query('COMMIT');
            return form.id;
        } catch (error) {
            console.error('Autopsy transaction failed, rolling back:', error);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateAutopsyForm(id, form, articles) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const values = fieldValues(form);
            const assignments = FIELDS.map(([column], index) => `${column} = $${index + 1}`);
            const query = `
                UPDATE autopsy_forms SET ${assignments.join(', ')}
                WHERE id = $${values.length + 1};
            `;
            await client.query(query, [...values, id]);

            await client.query('DELETE FROM autopsy_articles WHERE autopsy_id = $1;', [id]);
            if (articles && articles.length > 0) {
                const insertArticleQuery = `
                    INSERT INTO autopsy_articles (autopsy_id, description, purpose)
                    VALUES ($1, $2, $3);
                `;
                for (const article of articles) {
                    await client.query(insertArticleQuery, [id, article.description, article.purpose]);
                }
            }

            await client.query('COMMIT');
            return id;
        } catch (error) {
            console.error('Autopsy transaction failed, rolling back:', error);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getAutopsyById(id) {
        const query = `
            SELECT a.*,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ar.id, 'description', ar.description, 'purpose', ar.purpose))
                 FROM autopsy_articles ar WHERE ar.autopsy_id = a.id), '[]'
              ) AS articles_secured
            FROM autopsy_forms a
            WHERE a.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllAutopsyForms() {
        const query = `
            SELECT a.*,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ar.id, 'description', ar.description, 'purpose', ar.purpose))
                 FROM autopsy_articles ar WHERE ar.autopsy_id = a.id), '[]'
              ) AS articles_secured
            FROM autopsy_forms a
            ORDER BY a.created_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default AutopsyModel;
