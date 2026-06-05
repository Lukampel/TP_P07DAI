import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import config from '../configs/db-config.js'
import pkg from 'pg'

const { Pool }  = pkg;

const pool = new Pool(config);
const router = Router();

// GET /api/calificaciones - Devuelve todas las calificaciones con JOIN
router.get('', async (req, res) => {
    try{
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
        const resultPg = await pool.query(sql);
        res.status(StatusCodes.OK).json(resultPg.rows);
    } catch (error){    
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    } 
});

// GET /api/calificaciones/:id - Devuelve una calificación por ID con JOIN
router.get('/:id', async (req, res) => {
    let id = req.params.id;

    try{
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
        const resultPg = await pool.query(sql, values);
        if (resultPg.rows.length > 0 ){
            res.status(StatusCodes.OK).json(resultPg.rows[0]);
        } else {
            res.status(StatusCodes.NOT_FOUND).send(`No se encontró la calificación (id: ${id}).`);
        }
    } catch (error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    }
});

// GET /api/calificaciones/alumno/:idAlumno - Devuelve calificaciones de un alumno
router.get('/alumno/:idAlumno', async (req, res) => {
    let idAlumno = req.params.idAlumno;

    try{
        // Primero validar que el alumno existe
        const sqlAlumno = `SELECT id FROM alumnos WHERE id = $1`;
        const resultAlumno = await pool.query(sqlAlumno, [idAlumno]);
        
        if (resultAlumno.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send(`El alumno con id ${idAlumno} no existe.`);
        }

        // Si existe, traer sus calificaciones
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
        const resultPg = await pool.query(sql, [idAlumno]);
        res.status(StatusCodes.OK).json(resultPg.rows);
    } catch (error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    }
});

// POST /api/calificaciones - Crea una nueva calificación
router.post('', async (req, res) => {
    let entity = req.body;

    try{
        // Validación 1: nota es obligatoria y debe ser entre 0 y 10
        if (!entity?.nota || typeof entity.nota !== 'number' || entity.nota < 0 || entity.nota > 10 || !Number.isInteger(entity.nota)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "La nota debe ser un número entero entre 0 y 10." });
        }

        // Validación 2: id_alumno es obligatorio y debe existir
        if (!entity?.id_alumno) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "El id_alumno es obligatorio." });
        }

        const sqlAlumno = `SELECT id FROM alumnos WHERE id = $1`;
        const resultAlumno = await pool.query(sqlAlumno, [entity.id_alumno]);
        if (resultAlumno.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: `El alumno con id ${entity.id_alumno} no existe.` });
        }

        // Validación 3: id_materia es obligatorio y debe existir
        if (!entity?.id_materia) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "El id_materia es obligatorio." });
        }

        const sqlMateria = `SELECT id FROM materias WHERE id = $1`;
        const resultMateria = await pool.query(sqlMateria, [entity.id_materia]);
        if (resultMateria.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: `La materia con id ${entity.id_materia} no existe.` });
        }

        // Validación 4: No debe existir ya una calificación para ese alumno en esa materia
        const sqlCheck = `SELECT id FROM calificaciones WHERE id_alumno = $1 AND id_materia = $2`;
        const resultCheck = await pool.query(sqlCheck, [entity.id_alumno, entity.id_materia]);
        if (resultCheck.rows.length > 0) {
            return res.status(StatusCodes.CONFLICT).json({ error: `Ya existe una calificación para el alumno ${entity.id_alumno} en la materia ${entity.id_materia}.` });
        }

        // Si todas las validaciones pasaron, insertar
        const sql = `INSERT INTO calificaciones (id_alumno, id_materia, nota, fecha) 
                    VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [
            entity.id_alumno,
            entity.id_materia,
            entity.nota,
            entity?.fecha ?? null
        ];
        const resultPg = await pool.query(sql, values);
        res.status(StatusCodes.CREATED).json(resultPg.rows[0]);
    } catch (error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    }
});

// PUT /api/calificaciones/:id - Modifica una calificación
router.put('/:id', async (req, res) => {
    let id = parseInt(req.params.id);
    let entity = req.body;

    try {
        // Validación 1: La calificación debe existir
        const sqlCheck = `SELECT id FROM calificaciones WHERE id = $1`;
        const resultCheck = await pool.query(sqlCheck, [id]);
        if (resultCheck.rows.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).send(`No se encontró la calificación (id: ${id}).`);
        }

        // Validación 2: Si se envía nota, debe ser un número entero entre 0 y 10
        if (entity?.nota !== undefined) {
            if (typeof entity.nota !== 'number' || entity.nota < 0 || entity.nota > 10 || !Number.isInteger(entity.nota)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: "La nota debe ser un número entero entre 0 y 10." });
            }
        }

        // Actualizar solo nota y/o fecha (ignorar id_alumno e id_materia si vienen)
        const sql = `UPDATE calificaciones SET 
                        nota = COALESCE($2, nota),
                        fecha = COALESCE($3, fecha)
                    WHERE id = $1`;

        const values = [
            id,
            entity?.nota ?? null,
            entity?.fecha ?? null
        ];
       
        const resultPg = await pool.query(sql, values);
        const rowsAffected = resultPg.rowCount;
        if (rowsAffected > 0){
            res.status(StatusCodes.OK).json(rowsAffected);
        } else {
            res.status(StatusCodes.NOT_FOUND).send(`No se encontró la calificación (id: ${id}).`);
        }
    } catch (error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    }
});

// DELETE /api/calificaciones/:id - Elimina una calificación
router.delete('/:id', async (req, res) => {
    let id = req.params.id;

    try{
        const sql = `DELETE FROM calificaciones WHERE id = $1`;
        const values = [id];
        const resultPg = await pool.query(sql, values);
        if (resultPg.rowCount > 0 ){
            res.status(StatusCodes.OK).json(null);
        } else {
            res.status(StatusCodes.NOT_FOUND).send(`No se encontró la calificación (id: ${id}).`);
        }
    } catch (error){
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error: ` + error.message);
    }
});

export default router;
