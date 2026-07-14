import pool from '../config/db.js';

class MlrModel {
    static async createMlrReport(m, injuries, grievousEntries) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        INSERT INTO mlr_reports (
          id, patient_id, special_investigations, non_grievous_nos, death_causing_count,
          blunt_weapon_nos, blunt_contusion_nos, cut_nos, sharp_cutting_nos, stab_nos,
          firearms_nos, burns_nos, bite_nos, further_notes, patient_smell_liquor,
          under_influence_liquor, date_of_despatch, lab_request_id, status, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *;
      `;
            const values = [
                m.id, m.patientId, m.specialInvestigations, m.nonGrievousNos, m.deathCausingCount,
                m.bluntWeaponNos, m.bluntContusionNos, m.cutNos, m.sharpCuttingNos, m.stabNos,
                m.firearmsNos, m.burnsNos, m.biteNos, m.furtherNotes, m.patientSmellLiquor,
                m.underInfluenceLiquor, m.dateOfDespatch, m.labRequestId, m.status, m.createdBy
            ];

            await client.query(query, values);

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
          special_investigations = $1, non_grievous_nos = $2, death_causing_count = $3,
          blunt_weapon_nos = $4, blunt_contusion_nos = $5, cut_nos = $6, sharp_cutting_nos = $7,
          stab_nos = $8, firearms_nos = $9, burns_nos = $10, bite_nos = $11, further_notes = $12,
          patient_smell_liquor = $13, under_influence_liquor = $14, date_of_despatch = $15,
          lab_request_id = $16, status = $17
        WHERE id = $18;
      `;
            const values = [
                m.specialInvestigations, m.nonGrievousNos, m.deathCausingCount,
                m.bluntWeaponNos, m.bluntContusionNos, m.cutNos, m.sharpCuttingNos,
                m.stabNos, m.firearmsNos, m.burnsNos, m.biteNos, m.furtherNotes,
                m.patientSmellLiquor, m.underInfluenceLiquor, m.dateOfDespatch,
                m.labRequestId, m.status, id
            ];

            await client.query(query, values);

            // Delete old details
            await client.query(`DELETE FROM mlr_injuries WHERE mlr_id = $1;`, [id]);
            await client.query(`DELETE FROM mlr_grievous_entries WHERE mlr_id = $1;`, [id]);

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