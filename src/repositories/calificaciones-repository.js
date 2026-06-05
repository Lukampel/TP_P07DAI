import DbPg from './db-pg.js';

export default class CalificacionesRepository {
    constructor() {
        console.log('Estoy en: CalificacionesRepository.constructor()');
        this.db = new DbPg();
    }

    getAllAsync = async () => {
        console.log(`CalificacionesRepository.getAllAsync()`);
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
        return await this.db.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`CalificacionesRepository.getByIdAsync(${id})`);
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
        return await this.db.queryOne(sql, [id]);
    }

    getByAlumnoIdAsync = async (idAlumno) => {
        console.log(`CalificacionesRepository.getByAlumnoIdAsync(${idAlumno})`);
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
        return await this.db.queryAll(sql, [idAlumno]);
    }

    existsAsync = async (idAlumno, idMateria) => {
        console.log(`CalificacionesRepository.existsAsync(${idAlumno}, ${idMateria})`);
        const sql = `SELECT id FROM calificaciones WHERE id_alumno = $1 AND id_materia = $2`;
        const result = await this.db.queryOne(sql, [idAlumno, idMateria]);
        return result !== null;
    }

    createAsync = async (entity) => {
        console.log(`CalificacionesRepository.createAsync(${JSON.stringify(entity)})`);
        const sql = `INSERT INTO calificaciones (id_alumno, id_materia, nota, fecha) 
                    VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [
            entity?.id_alumno ?? 0,
            entity?.id_materia ?? 0,
            entity?.nota ?? 0,
            entity?.fecha ?? null
        ];
        return await this.db.queryOne(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`CalificacionesRepository.updateAsync(${JSON.stringify(entity)})`);
        const sql = `UPDATE calificaciones SET 
                        nota = COALESCE($2, nota),
                        fecha = COALESCE($3, fecha)
                    WHERE id = $1`;
        const values = [
            entity.id,
            entity?.nota ?? null,
            entity?.fecha ?? null
        ];
        return await this.db.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`CalificacionesRepository.deleteByIdAsync(${id})`);
        const sql = `DELETE FROM calificaciones WHERE id=$1`;
        return await this.db.queryRowCount(sql, [id]);
    }
}