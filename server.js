import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const port = 8000;

app.use(cors());
app.use(express.static('.'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, req.path));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 