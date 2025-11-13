const bcrypt = require('bcrypt');
(async () => {
  const pass = process.argv[2];
  if(!pass){
    console.error('Usage: node hashPassword.js <password>');
    process.exit(1);
  }
  const h = await bcrypt.hash(pass, 10);
  console.log('hash:', h);
})();
