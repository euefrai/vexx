// components/GlobalAchievementListener.jsx
"use client";

import { useState, useEffect } from "react";
import { AchievementNotification } from "./AchievementNotification";
import { CelebracaoModal } from "./CelebracaoModal";

export default function GlobalAchievementListener() {
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(null);
  const [celebracaoAtiva, setCelebracaoAtiva] = useState(null);

  useEffect(() => {
    const handleBadgeUnlocked = (e) => {
      const { badgeId, badge } = e.detail;
      if (!badgeId || !badge) return;

      console.log(`[GlobalAchievementListener] Capturado desbloqueio: ${badgeId}`);

      // Determinar se é um marco lendário de alta relevância
      const eMarcoLendario = [
        "streak-30",
        "corrida-21",
        "km-1000",
        "treino-50",
        "desafio-mestre"
      ].includes(badgeId);

      if (eMarcoLendario) {
        // Exibir o grande Modal de Celebração Premium
        setCelebracaoAtiva({
          badgeId,
          badge,
          dados: {
            distancia: badgeId === "km-1000" ? 1000 : (badgeId === "corrida-21" ? 21 : 0),
            tempo: "Membro Lendário",
            calorias: badge.reward,
            velocidadeMedia: badge.reward,
          }
        });
      } else {
        // Exibir notificação flutuante de conquista padrão
        setNotificacaoAtiva(badgeId);
        
        // Auto-dismiss após 4.5 segundos
        const timer = setTimeout(() => {
          setNotificacaoAtiva(null);
        }, 4500);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("vexx_badge_unlocked", handleBadgeUnlocked);
    return () => {
      window.removeEventListener("vexx_badge_unlocked", handleBadgeUnlocked);
    };
  }, []);

  return (
    <>
      {notificacaoAtiva && (
        <AchievementNotification
          badgeId={notificacaoAtiva}
          onClose={() => setNotificacaoAtiva(null)}
        />
      )}

      {celebracaoAtiva && (
        <CelebracaoModal
          isOpen={!!celebracaoAtiva}
          onClose={() => setCelebracaoAtiva(null)}
          dados={{
            distancia: celebracaoAtiva.dados.distancia,
            tempo: celebracaoAtiva.dados.tempo,
            calorias: celebracaoAtiva.badge.reward,
            velocidadeMedia: celebracaoAtiva.badge.reward,
          }}
        />
      )}
    </>
  );
}
