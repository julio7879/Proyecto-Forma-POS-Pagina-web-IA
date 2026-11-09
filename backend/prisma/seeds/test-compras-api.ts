import jwt from 'jsonwebtoken';

async function main() {
  const secret = process.env.JWT_SECRET || 'secret';
  const token = jwt.sign({ userId: 1, correo: 'admin@forma.com', rol: 'ADMIN' }, secret);

  const res = await fetch('http://localhost:3001/api/compras', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('STATUS:', res.status);
  const data = await res.json();
  console.log('DATOS:', JSON.stringify(data, null, 2).slice(0, 1000));
}

main().catch(console.error);
