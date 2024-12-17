require('dotenv').config(); // Cargar variables de entorno desde el archivo .env
const express = require('express');
const { Client } = require('pg');  // Usamos 'pg' para la conexión a PostgreSQL
const swaggerUi = require('swagger-ui-express'); // Importar swagger-ui-express
const yaml = require('yamljs'); // Importar yamljs
const app = express();

// Cargar la documentación Swagger
const swaggerDocument = yaml.load('./swagger.yaml');

// Usar Swagger UI para mostrar la documentación en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json()); // Middleware para procesar JSON en las solicitudes

// Conexión a la base de datos PostgreSQL
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },  // Habilitar SSL para la conexión
});

client.connect()
  .then(() => console.log('Conexión exitosa a PostgreSQL'))
  .catch(err => console.error('Error de conexión:', err.stack));

// Rutas de la API
// 1. Obtener todos los clientes (http://localhost:3000/clientes)
app.get('/clientes', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM Clientes');
        res.json(result.rows);  // PostgreSQL devuelve 'rows' en lugar de 'recordset'
    } catch (err) {
        console.error('Error al obtener los clientes:', err);
        res.status(500).send('Error al obtener los clientes');
    }
});

// 2. Obtener un cliente por ID (http://localhost:3000/clientes/id)
app.get('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM Clientes WHERE id = $1', [id]);  // Usamos parámetro seguro $1
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    } catch (err) {
        console.error('Error al obtener el cliente:', err);
        res.status(500).send('Error al obtener el cliente');
    }
});

// 3. Crear un nuevo cliente (http://localhost:3000/clientes/crear)
app.post('/clientes/crear', async (req, res) => {
    const { Nombre, ComidaFavorita, DescuentoNavidad } = req.body;
  
    // Validación de datos
    if (!Nombre || typeof Nombre !== 'string') {
      return res.status(400).json({ error: 'El campo Nombre es obligatorio y debe ser una cadena de texto.' });
    }
    if (!ComidaFavorita || typeof ComidaFavorita !== 'string') {
      return res.status(400).json({ error: 'El campo ComidaFavorita es obligatorio y debe ser una cadena de texto.' });
    }
    if (DescuentoNavidad === undefined || isNaN(DescuentoNavidad) || DescuentoNavidad < 0) {
      return res.status(400).json({ error: 'El campo DescuentoNavidad es obligatorio y debe ser un número positivo.' });
    }
  
    try {
      // Ejecutar la consulta SQL para insertar el nuevo cliente
      await client.query('INSERT INTO Clientes (Nombre, ComidaFavorita, DescuentoNavidad) VALUES ($1, $2, $3)', [Nombre, ComidaFavorita, DescuentoNavidad]);
  
      res.status(201).json({ message: 'Cliente creado correctamente.' });
    } catch (error) {
      console.error('Error al crear cliente:', error.message);
      res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// 4. Actualizar un cliente por ID (http://localhost:3000/clientes/actualizar/:id)
app.put('/clientes/actualizar/:id', async (req, res) => {
    const { id } = req.params;
    const { Nombre, ComidaFavorita, DescuentoNavidad } = req.body;
  
    try {
      // Ejecutar la consulta SQL para actualizar los datos del cliente
      await client.query('UPDATE Clientes SET Nombre = $1, ComidaFavorita = $2, DescuentoNavidad = $3 WHERE id = $4', [Nombre, ComidaFavorita, DescuentoNavidad, id]);
  
      res.json({ message: 'Cliente actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar cliente:', error.message);
      res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// 5. Eliminar un cliente por ID (http://localhost:3000/clientes/eliminar/:id)
app.delete('/clientes/eliminar/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Ejecutar la consulta SQL para eliminar el cliente
      await client.query('DELETE FROM Clientes WHERE id = $1', [id]);
  
      res.json({ message: 'Cliente eliminado correctamente.' });
    } catch (error) {
      console.error('Error al eliminar cliente:', error.message);
      res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// Servidor escuchando
const port = process.env.PORT || 3000;  // Usamos el puerto asignado por Render o el 3000 por defecto
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
