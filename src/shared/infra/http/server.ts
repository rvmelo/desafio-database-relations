import app from './app';

import routes from './routes';
import '@shared/infra/typeorm';
import '@shared/container';

app.use(routes);

app.listen(3333, () => {
  console.log('🚀 Server started on port 3333!');
});
