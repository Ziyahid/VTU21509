const express = require('express');
const { loggingMiddleware } = require('./middleware/loggingMiddleware');
const routes = require('./routes');

const app = express();
const PORT = 3000;

app.use(loggingMiddleware);
app.use(routes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
