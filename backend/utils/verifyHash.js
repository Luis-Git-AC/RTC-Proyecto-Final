const bcrypt = require('bcrypt');
const hash = '$2b$10$K7L/8Y3rt38OAK2M8Ko.deRw4wBAdbEi8Jmk2KdT5RZoqPzFy2QLS';
const password = process.argv[2] || 'admin123';
(async () => {
  try {
    const ok = await bcrypt.compare(password, hash);
    console.log('password:', password);
    console.log('match:', ok);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
