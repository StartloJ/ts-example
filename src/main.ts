import express from 'express';
import { PORT } from './config';
import usersRouter from './user.route';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(usersRouter);

app.listen(PORT, () => {
  return console.log(`⚡️[server]: Now server is running at ${PORT}`);
});

export default app;