import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Layout from "../components/Layout";
import { Card, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-start pt-32 px-4 gap-12">
        <section className="w-full max-w-6xl mx-auto text-center px-6 space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold">⚡ BrainBlitz</h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
            La experiencia definitiva de trivia multijugador
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {user ? (
              <Button as={Link} to="/dashboard" size="lg">
                Ir al panel
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" size="lg">
                  Iniciar sesión
                </Button>
                <Button as={Link} to="/register" variant="secondary" size="lg">
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </section>
        <section className="w-full max-w-6xl mx-auto px-6 space-y-8">
          <h2 className="text-3xl font-bold text-center">Características</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardBody className="text-center space-y-3 p-6">
                <div className="text-4xl">⚡</div>
                <h3 className="text-xl font-semibold">Juego en tiempo real</h3>
                <p className="text-white/70">
                  Juega con amigos con puntuación instantánea y partidas
                  dinámicas
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center space-y-3 p-6">
                <div className="text-4xl">🎮</div>
                <h3 className="text-xl font-semibold">Fácil de unirse</h3>
                <p className="text-white/70">
                  Únete con códigos de 6 dígitos o explora partidas públicas
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center space-y-3 p-6">
                <div className="text-4xl">🤝</div>
                <h3 className="text-xl font-semibold">Compite con amigos</h3>
                <p className="text-white/70">
                  Sigue tus estadísticas y demuestra tus conocimientos
                </p>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
