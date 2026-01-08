import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Study } from './pages/Study';
import { Decks } from './pages/Decks';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/study" element={<Study />} />
        <Route path="/decks" element={<Decks />} />
      </Routes>
    </Layout>
  );
}

export default App;
