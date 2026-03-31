import { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

const Index = () => {
  const [authed, setAuthed] = useState(() => localStorage.getItem('lomba_auth') === 'true');

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return <Dashboard onLogout={() => setAuthed(false)} />;
};

export default Index;
