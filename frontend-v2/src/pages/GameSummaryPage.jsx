import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Ranking from '../components/Ranking';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function GameSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const players = location.state?.players || [];

  return (
    <div className="container min-h-screen px-4 py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="text-center">
          <h2 className="text-3xl font-bold">¡Juego finalizado!</h2>
          <p className="mt-1 text-white/80">¡Felicidades a todos los participantes!</p>
        </CardHeader>
        <CardBody>
          <Ranking players={players} />
          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={() => navigate('/dashboard')}>Volver al Panel Principal</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}