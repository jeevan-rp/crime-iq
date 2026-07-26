// start.js - wrapper to map Zoho Catalyst port to Next.js PORT environment variable
process.env.PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000;
console.log(`Starting Next.js standalone server on port ${process.env.PORT}...`);
require('./server.js');
