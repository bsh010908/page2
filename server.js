const app = require('./app');
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running at: http://127.0.0.1:${PORT}`);
});