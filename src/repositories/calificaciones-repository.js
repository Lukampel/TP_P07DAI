import pkg from 'pg'
import config from './../configs/db-config.js';
import LogHelper from './../helpers/log-helper.js'

const { Pool }  = pkg;

export default class CalificacionesRepository {
    constructor() {
        console.log('Estoy en: CalificacionesRepository.constructor()');
        this.DBPool = null;
    }

    getDBPool = () => {
        if (this.DBPool == null){
            this.DBPool = new Pool(config);
        }
        return this.DBPool;
    }

    getAllAsync = async () => {
        console.log(`CalificacionesRepository.getAllAsync()`);
        let returnArray = null;
        
        try {
            const sql = `SELECT 
                            c.id,
                            c.id_alumno,
                            a.nombre as nombre_alumno,
                            a.apellido as apellido_alumno,
                            c.id_materia,
                            m.nombre as nombre_materia,
                            c.nota,
                            c.fecha
                        FROM calificaciones c
                        JOIN alumnos a ON c.id_alumno = a.id
                        JOIN materias m ON c.id_materia = m.id
                        ORDER BY c.id`;
            const resultPg = await this.getDBPool().query(sql);
            returnArray = resultPg.rows;
        } catch (error) {
            LogHelper.logError(error);
        }
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`CalificacionesRepository.getByIdAsync(${id})`);
        let returnEntity = null;
        try {
            const sql = `SELECT 
                            c.id,
                            c.id_alumno,
                            a.nombre as nombre_alumno,
                            a.apellido as apellido_alumno,
                            c.id_materia,
                            m.nombre as nombre_materia,
                            c.nota,
                            c.fecha
                        FROM calificaciones c
                        JOIN alumnos a ON c.id_alumno = a.id
                        JOIN materias m ON c.id_materia = m.id
                        WHERE c.id = $1`;
            const values = [id];
            const resultPg = await this.getDBPool().query(sql, values);
            if (resultPg.rows.length > 0){
                returnEntity = resultPg.rows[0];
            }
        } catch (error) {
            LogHelper.logError(error);
        }
        return returnEntity;
    }

    getByAlumnoIdAsync = async (idAlumno) => {
        console.log(`CalificacionesRepository.getByAlumnoIdAsync(${idAlumno})`);
        let returnArray = null;
        try {
            const sql = `SELECT 
                            c.id,
                            c.id_materia,
                            m.nombre as nombre_materia,
                            c.nota,
                            c.fecha
                        FROM calificaciones c
                        JOIN materias m ON c.id_materia = m.id
                        WHERE c.id_alumno = $1
                        ORDER BY c.id`;
            const values = [idAlumno];
            const resultPg = await this.getDBPool().query(sql, values);
            returnArray = resultPg.rows;
        } catch (error) {
            LogHelper.logError(error);
        }
        return returnArray;
    }

    existsAsync = async (idAlumno, idMateria) => {
        console.log(`CalificacionesRepository.existsAsync(${idAlumno}, ${idMateria})`);
        let exists = false;
        try {
            const sql = `SELECT id FROM calificaciones WHERE id_alumno = $1 AND id_materia = $2`;
            const values = [idAlumno, idMateria];
            const resultPg = await this.getDBPool().query(sql, values);
            exists = resultPg.rows.length > 0;
        } catch (error) {
            LogHelper.logError(error);
        }
        return exists;
    }

    createAsync = async (entity) => {
        console.log(`CalificacionesRepository.createAsync(${JSON.stringify(entity)})`);
        let newEntity = null;

        try {
            const sql = `INSERT INTO calificaciones (id_alumno, id_materia, nota, fecha) 
                        VALUES ($1, $2, $3, $4) RETURNING *`;
            const values = [
                entity?.id_alumno ?? 0,
                entity?.id_materia ?? 0,
                entity?.nota ?? 0,
                entity?.fecha ?? null
            ];
            const resultPg = await this.getDBPool().query(sql, values);
            newEntity = resultPg.rows[0];
        } catch (error) {
            LogHelper.logError(error);
        }
        return newEntity;
    }

    updateAsync = async (entity) => {
        console.log(`CalificacionesRepository.updateAsync(${JSON.stringify(entity)})`);
        let rowsAffected = 0;
        let id = entity.id;

        try {
            const sql = `UPDATE calificaciones SET 
                            nota = COALESCE($2, nota),
                            fecha = COALESCE($3, fecha)
                        WHERE id = $1`;

            const values = [
                id,
                entity?.nota ?? null,
                entity?.fecha ?? null
            ];
            const resultPg = await this.getDBPool().query(sql, values);
            rowsAffected = resultPg.rowCount;
        } catch (error) {
            LogHelper.logError(error);
        }
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`CalificacionesRepository.deleteByIdAsync(${id})`);
        let rowsAffected = 0;

        try {
            const sql = `DELETE FROM calificaciones WHERE id=$1`;
            const values = [id];
            const resultPg = await this.getDBPool().query(sql, values);
            rowsAffected = resultPg.rowCount;
        } catch (error) {
            LogHelper.logError(error);
        }
        return rowsAffected;
    }
}
