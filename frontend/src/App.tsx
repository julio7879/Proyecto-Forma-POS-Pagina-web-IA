import { Routes, Route } from 'react-router-dom';
import { StorefrontLayout } from './layouts/StorefrontLayout/StorefrontLayout';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';

function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/" element={<h1 className="text-2xl font-bold">Bienvenido a Forma Store</h1>} />
      </Route>
    </Routes>
  );
}

export default App;