// Los tests usan una base en memoria con los datos de prueba: no necesitan MySQL.
process.env.DB_TIPO = 'sqljs';
process.env.JWT_SECRET = 'secreto-de-prueba';
process.env.SEMILLA_PASSWORD = 'entrenar123';
