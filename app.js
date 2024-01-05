/*
CREATE TABLE  todo (id INTEGER, todo TEXT, priority TEXT, status TEXT );
INSERT INTO todo (id, todo, priority, status)
Values (1, "Learn HTML", "HIGH", "TO DO"),
(2, "Learn JS", "MEDIUM", "DONE"),
(3, "Learn CSS", "LOW", "DONE"),
(4, "Play CHESS", "LOW", "DONE");
SELECT * from todo;
*/

const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasepath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
let database = null

const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasepath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.messege}`)
    process.exit(1)
  }
}
intializeDbAndServer()

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = ` 
        SELECT 
          * 
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}'
          AND status = '${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = ` 
        SELECT 
          * 
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = ` 
        SELECT 
          * 
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      break
    default:
      getTodosQuery = `
      SELECT 
      *
      FROM
      todo
      WHERE 
      todo LIKE '%${search_q}%';`
  }
  data = await database.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = ` 
    SELECT 
    * 
    FROM 
    todo 
    WHERE 
    id = ${todoId};
  `
  const todo = await database.get(getTodosQuery)
  response.send(todo)
})

app.get('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodosQuery = `
   INSERT INTO 
   todo (id, todo, priority, status)
   VALUES (${id}, '${todo}', '${priority}', '${status}');
  `
  await database.run(postTodosQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateCoulumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateCoulumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateCoulumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateCoulumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT 
    *
    FROM
    todo
    WHERE
    id = ${todoId};`
  const previousTodo = await database.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
   UPDATE 
   todo
   SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
   WHERE 
    id = ${todoId};`
  await database.run(updateTodoQuery)
  response.send(`${updateCoulumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
   DELETE 
   FROM 
   todo 
   WHERE 
   id = ${todoId};`
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
