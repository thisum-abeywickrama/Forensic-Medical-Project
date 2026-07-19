import pool from '../config/db.js';

// Helper to insert comma-separated strings into child tables
const insertCsvToChildTable = async (client, tableName, mlrId, csvString) => {
    if (!csvString || csvString.trim() === '') return;
    const values = csvString.split(',').map(v => v.trim()).filter(v => v !== '');
    for (const val of values) {
        await client.query(`INSERT INTO ${tableName} (mlr_id, value) VALUES ($1, $2)`, [mlrId, val]);
    }
};

class MlrModel {
    static async createMlrReport(m, injuries, grievousEntries) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        INSERT INTO mlr_reports (
          id, patient_id, special_investigations, death_causing_count,
          further_notes, patient_smell_liquor, under_influence_liquor,
          date_of_despatch, lab_request_id, status, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *;
      `;
            const values = [
                m.id, m.patientId, m.specialInvestigations, m.deathCausingCount,
                m.furtherNotes, m.patientSmellLiquor, m.underInfluenceLiquor,
                m.dateOfDespatch, m.labRequestId, m.status, m.createdBy
            ];

            await client.query(query, values);

            // Insert 1NF comma-separated child rows
            await insertCsvToChildTable(client, 'mlr_blunt_weapon_nos', m.id, m.bluntWeaponNos);
            await insertCsvToChildTable(client, 'mlr_blunt_contusion_nos', m.id, m.bluntContusionNos);
            await insertCsvToChildTable(client, 'mlr_cut_nos', m.id, m.cutNos);
            await insertCsvToChildTable(client, 'mlr_sharp_cutting_nos', m.id, m.sharpCuttingNos);
            await insertCsvToChildTable(client, 'mlr_stab_nos', m.id, m.stabNos);
            await insertCsvToChildTable(client, 'mlr_firearms_nos', m.id, m.firearmsNos);
            await insertCsvToChildTable(client, 'mlr_burns_nos', m.id, m.burnsNos);
            await insertCsvToChildTable(client, 'mlr_bite_nos', m.id, m.biteNos);

            // Insert injuries
            if (injuries && injuries.length > 0) {
                const insertInjuryQuery = `
          INSERT INTO mlr_injuries (mlr_id, injury_no, description)
          VALUES ($1, $2, $3);
        `;
                for (const injury of injuries) {
                    await client.query(insertInjuryQuery, [m.id, injury.no, injury.description]);
                }
            }

            // Insert non-grievous nos
            if (m.nonGrievousNos && m.nonGrievousNos.length > 0) {
                for (const v of m.nonGrievousNos) {
                    await client.query('INSERT INTO mlr_non_grievous_nos (mlr_id, value) VALUES ($1, $2)', [m.id, v]);
                }
            }

            // Insert grievous entries
            if (grievousEntries && grievousEntries.length > 0) {
                const insertGrievousQuery = `
          INSERT INTO mlr_grievous_entries (id, mlr_id, injury_no, limb, remarks)
          VALUES ($1, $2, $3, $4, $5);
        `;
                for (const entry of grievousEntries) {
                    await client.query(insertGrievousQuery, [entry.id, m.id, entry.injuryNo, entry.limb, entry.remarks]);
                }
            }

            await client.query('COMMIT');
            return m.id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateMlrReport(id, m, injuries, grievousEntries) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        UPDATE mlr_reports SET
          special_investigations = $1, death_causing_count = $2,
          further_notes = $3, patient_smell_liquor = $4, under_influence_liquor = $5,
          date_of_despatch = $6, lab_request_id = $7, status = $8
        WHERE id = $9;
      `;
            const values = [
                m.specialInvestigations, m.deathCausingCount,
                m.furtherNotes, m.patientSmellLiquor, m.underInfluenceLiquor,
                m.dateOfDespatch, m.labRequestId, m.status, id
            ];

            await client.query(query, values);

            // Delete old details
            await client.query(`DELETE FROM mlr_non_grievous_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_injuries WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_grievous_entries WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_blunt_weapon_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_blunt_contusion_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_cut_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_sharp_cutting_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_stab_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_firearms_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_burns_nos WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_bite_nos WHERE mlr_id = $1;`, [id]);

            // Re-insert 1NF comma-separated child rows
            await insertCsvToChildTable(client, 'mlr_blunt_weapon_nos', id, m.bluntWeaponNos);
            await insertCsvToChildTable(client, 'mlr_blunt_contusion_nos', id, m.bluntContusionNos);
            await insertCsvToChildTable(client, 'mlr_cut_nos', id, m.cutNos);
            await insertCsvToChildTable(client, 'mlr_sharp_cutting_nos', id, m.sharpCuttingNos);
            await insertCsvToChildTable(client, 'mlr_stab_nos', id, m.stabNos);
            await insertCsvToChildTable(client, 'mlr_firearms_nos', id, m.firearmsNos);
            await insertCsvToChildTable(client, 'mlr_burns_nos', id, m.burnsNos);
            await insertCsvToChildTable(client, 'mlr_bite_nos', id, m.biteNos);

            // Re-insert non-grievous nos
            if (m.nonGrievousNos && m.nonGrievousNos.length > 0) {
                for (const v of m.nonGrievousNos) {
                    await client.query('INSERT INTO mlr_non_grievous_nos (mlr_id, value) VALUES ($1, $2)', [id, v]);
                }
            }

            // Re-insert injuries
            if (injuries && injuries.length > 0) {
                const insertInjuryQuery = `
          INSERT INTO mlr_injuries (mlr_id, injury_no, description)
          VALUES ($1, $2, $3);
        `;
                for (const injury of injuries) {
                    await client.query(insertInjuryQuery, [id, injury.no, injury.description]);
                }
            }

            // Re-insert grievous entries
            if (grievousEntries && grievousEntries.length > 0) {
                const insertGrievousQuery = `
          INSERT INTO mlr_grievous_entries (id, mlr_id, injury_no, limb, remarks)
          VALUES ($1, $2, $3, $4, $5);
        `;
                for (const entry of grievousEntries) {
                    await client.query(insertGrievousQuery, [entry.id, id, entry.injuryNo, entry.limb, entry.remarks]);
                }
            }

            await client.query('COMMIT');
            return id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getMlrById(id) {
        const query = `
      SELECT 
        m.*,
        u.name AS doctor_name,
        u.qualifications AS doctor_qualifications,
        u.designation AS designation,
        u.station AS station,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_blunt_weapon_nos v WHERE v.mlr_id = m.id), '') AS blunt_weapon_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_blunt_contusion_nos v WHERE v.mlr_id = m.id), '') AS blunt_contusion_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_cut_nos v WHERE v.mlr_id = m.id), '') AS cut_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_sharp_cutting_nos v WHERE v.mlr_id = m.id), '') AS sharp_cutting_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_stab_nos v WHERE v.mlr_id = m.id), '') AS stab_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_firearms_nos v WHERE v.mlr_id = m.id), '') AS firearms_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_burns_nos v WHERE v.mlr_id = m.id), '') AS burns_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_bite_nos v WHERE v.mlr_id = m.id), '') AS bite_nos,
        COALESCE(
          (SELECT json_agg(ngn.value) FROM mlr_non_grievous_nos ngn WHERE ngn.mlr_id = m.id), '[]'
        ) AS non_grievous_nos,
        COALESCE(
          (SELECT json_agg(json_build_object('id', i.id, 'no', i.injury_no, 'description', i.description))
           FROM mlr_injuries i WHERE i.mlr_id = m.id), '[]'
        ) as injuries,
        COALESCE(
          (SELECT json_agg(json_build_object('id', g.id, 'injuryNo', g.injury_no, 'limb', g.limb, 'remarks', g.remarks))
           FROM mlr_grievous_entries g WHERE g.mlr_id = m.id), '[]'
        ) as grievous_entries
      FROM mlr_reports m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1;
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllMlrReports() {
        const query = `
      SELECT 
        m.*,
        u.name AS doctor_name,
        u.qualifications AS doctor_qualifications,
        u.designation AS designation,
        u.station AS station,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_blunt_weapon_nos v WHERE v.mlr_id = m.id), '') AS blunt_weapon_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_blunt_contusion_nos v WHERE v.mlr_id = m.id), '') AS blunt_contusion_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_cut_nos v WHERE v.mlr_id = m.id), '') AS cut_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_sharp_cutting_nos v WHERE v.mlr_id = m.id), '') AS sharp_cutting_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_stab_nos v WHERE v.mlr_id = m.id), '') AS stab_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_firearms_nos v WHERE v.mlr_id = m.id), '') AS firearms_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_burns_nos v WHERE v.mlr_id = m.id), '') AS burns_nos,
        COALESCE((SELECT string_agg(v.value, ', ') FROM mlr_bite_nos v WHERE v.mlr_id = m.id), '') AS bite_nos,
        COALESCE(
          (SELECT json_agg(ngn.value) FROM mlr_non_grievous_nos ngn WHERE ngn.mlr_id = m.id), '[]'
        ) AS non_grievous_nos,
        COALESCE(
          (SELECT json_agg(json_build_object('id', i.id, 'no', i.injury_no, 'description', i.description))
           FROM mlr_injuries i WHERE i.mlr_id = m.id), '[]'
        ) as injuries,
        COALESCE(
          (SELECT json_agg(json_build_object('id', g.id, 'injuryNo', g.injury_no, 'limb', g.limb, 'remarks', g.remarks))
           FROM mlr_grievous_entries g WHERE g.mlr_id = m.id), '[]'
        ) as grievous_entries
      FROM mlr_reports m
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC;
    `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default MlrModel;