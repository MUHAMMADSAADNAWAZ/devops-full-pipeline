const express = require('express')
const { Pool } = require('pg')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
})

async function startServer() {
  try {
    await pool.query('SELECT 1')
    console.log('Connected to PostgreSQL')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL
      )
    `)

    console.log('Users table ready')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

  } catch (err) {
    console.error('Failed to start application:', err)
    process.exit(1)
  }
}

app.post('/users', async (req, res) => {
  const { firstName, lastName } = req.body

  if (!firstName || !lastName) {
    return res.status(400).json({
      message: 'firstName and lastName are required'
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name)
       VALUES ($1, $2)
       RETURNING *`,
      [firstName, lastName]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Insert error:', err)
    res.status(500).json({ message: 'Database error' })
  }
})

app.get('/', (req, res) => {
  res.json({
    message: 'DevOps pipeline app is running 🚀',
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY id ASC'
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Fetch error:', err)
    res.status(500).json({ message: 'Database error' })
  }
})

app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

startServer()
