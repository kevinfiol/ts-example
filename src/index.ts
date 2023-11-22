import polka from 'polka';

const PORT = 8080;

polka()
  .use((req, res, next) => {
    res.on('finish', () => {
      console.log(`~> ${res.statusCode} - ${req.path}`);
    });

    next();
  })
  .get('/hello', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'kevin' }));
  })
  .listen(PORT, () => {
    console.log('> Running on localhost:' + PORT);
  });