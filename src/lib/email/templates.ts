/**
 * Email Templates for F1 Tracker
 * HTML email templates for notifications
 */

// ============================================
// Base Template
// ============================================

const BASE_STYLES = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 32px;
  }
  .logo {
    font-size: 28px;
    font-weight: bold;
    color: #ef4444;
    margin-bottom: 8px;
  }
  .content {
    background: linear-gradient(135deg, #1a1a1a 0%, #262626 100%);
    border-radius: 16px;
    padding: 32px;
    border: 1px solid #333;
  }
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16px;
  }
  .subtitle {
    color: #a3a3a3;
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #ffffff !important;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    margin: 16px 0;
  }
  .cta-button:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  }
  .info-box {
    background: #262626;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #333;
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .info-label {
    color: #a3a3a3;
  }
  .info-value {
    color: #ffffff;
    font-weight: 600;
  }
  .highlight {
    color: #ef4444;
    font-weight: bold;
  }
  .points-display {
    font-size: 48px;
    font-weight: bold;
    color: #ef4444;
    text-align: center;
    margin: 24px 0;
  }
  .badge-container {
    text-align: center;
    padding: 24px;
  }
  .badge-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  .footer {
    text-align: center;
    margin-top: 32px;
    color: #666;
    font-size: 12px;
  }
  .footer a {
    color: #ef4444;
    text-decoration: none;
  }
  .countdown {
    background: #ef4444;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    display: inline-block;
    font-weight: bold;
    font-size: 18px;
  }
`;

function baseTemplate(content: string, previewText: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>F1 Tracker</title>
  ${previewText ? `<meta name="x-apple-disable-message-reformatting">` : ""}
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  <div class="container">
    <div class="header">
      <div class="logo">🏎️ F1 Tracker</div>
    </div>
    ${content}
    <div class="footer">
      <p>Cet email a été envoyé par F1 Tracker.</p>
      <p><a href="{{{unsubscribeUrl}}}">Se désabonner des notifications</a> | <a href="{{{preferencesUrl}}}">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// Email Templates
// ============================================

export interface PredictionReminderData {
  userName: string;
  raceName: string;
  circuitName: string;
  country: string;
  sessionType: "RACE" | "SPRINT";
  sessionDateTime: string;
  timeUntil: string;
  predictUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function predictionReminderH24(data: PredictionReminderData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  
  const content = `
    <div class="content">
      <div class="title">🏁 ${data.raceName} dans 24h!</div>
      <p class="subtitle">
        Salut ${data.userName},<br><br>
        La ${sessionLabel.toLowerCase()} du <strong>${data.raceName}</strong> commence dans <span class="highlight">24 heures</span>!
        N'oublie pas de faire ton pronostic avant qu'il ne soit trop tard.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">🏎️ Grand Prix</span>
          <span class="info-value">${data.raceName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 Circuit</span>
          <span class="info-value">${data.circuitName}, ${data.country}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🎯 Session</span>
          <span class="info-value">${sessionLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Date</span>
          <span class="info-value">${data.sessionDateTime}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <div class="countdown">⏰ Plus que 24h pour pronostiquer!</div>
        <br><br>
        <a href="${data.predictUrl}" class="cta-button">Faire mon pronostic →</a>
      </div>
      
      <p class="subtitle" style="margin-top: 24px; font-size: 14px;">
        💡 <strong>Rappel:</strong> Les pronostics sont verrouillés 1 heure avant le début de la session.
      </p>
    </div>
  `;
  
  return baseTemplate(content, `🏎️ ${data.raceName} dans 24h - Fais ton pronostic!`);
}

export function predictionReminderH1(data: PredictionReminderData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  
  const content = `
    <div class="content">
      <div class="title">⚠️ DERNIÈRE CHANCE - ${data.raceName}</div>
      <p class="subtitle">
        Salut ${data.userName},<br><br>
        <span class="highlight">⏰ Plus qu'1 heure!</span> La ${sessionLabel.toLowerCase()} du <strong>${data.raceName}</strong> commence bientôt!
        C'est ta dernière chance de faire ton pronostic!
      </p>
      
      <div style="text-align: center; padding: 24px;">
        <div class="countdown" style="font-size: 24px; padding: 20px 40px;">
          🚨 1 HEURE RESTANTE 🚨
        </div>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">🏎️ Grand Prix</span>
          <span class="info-value">${data.raceName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🎯 Session</span>
          <span class="info-value">${sessionLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Départ</span>
          <span class="info-value">${data.sessionDateTime}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.predictUrl}" class="cta-button" style="font-size: 18px; padding: 16px 40px;">
          🏁 Pronostiquer MAINTENANT
        </a>
      </div>
    </div>
  `;
  
  return baseTemplate(content, `⚠️ DERNIÈRE CHANCE - ${data.raceName} dans 1h!`);
}

export interface ScoringResultData {
  userName: string;
  raceName: string;
  sessionType: "RACE" | "SPRINT";
  points: number;
  rank?: number;
  totalParticipants?: number;
  breakdown: {
    positions: number;
    pole: number;
    fastestLap: number;
    podiumBonus: number;
  };
  resultsUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function scoringResult(data: ScoringResultData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  const rankDisplay = data.rank && data.totalParticipants 
    ? `#${data.rank} sur ${data.totalParticipants} joueurs`
    : "";
  
  const content = `
    <div class="content">
      <div class="title">🏁 Résultats: ${data.raceName}</div>
      <p class="subtitle">
        Salut ${data.userName},<br><br>
        Voici ton score pour la ${sessionLabel.toLowerCase()} du <strong>${data.raceName}</strong>!
      </p>
      
      <div class="points-display">
        ${data.points} pts
      </div>
      
      ${rankDisplay ? `<p style="text-align: center; color: #a3a3a3; margin-bottom: 24px;">${rankDisplay}</p>` : ""}
      
      <div class="info-box">
        <div style="font-weight: bold; margin-bottom: 12px; color: #ffffff;">📊 Détail des points</div>
        <div class="info-row">
          <span class="info-label">🎯 Positions correctes</span>
          <span class="info-value">+${data.breakdown.positions} pts</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏆 Pole Position</span>
          <span class="info-value">+${data.breakdown.pole} pts</span>
        </div>
        <div class="info-row">
          <span class="info-label">⚡ Tour rapide</span>
          <span class="info-value">+${data.breakdown.fastestLap} pts</span>
        </div>
        <div class="info-row">
          <span class="info-label">🥇 Bonus podium</span>
          <span class="info-value">+${data.breakdown.podiumBonus} pts</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.resultsUrl}" class="cta-button">Voir le classement complet →</a>
      </div>
    </div>
  `;
  
  return baseTemplate(content, `🏁 Tu as marqué ${data.points} pts au ${data.raceName}!`);
}

export interface BadgeUnlockedData {
  userName: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  raceName?: string;
  profileUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function badgeUnlocked(data: BadgeUnlockedData): string {
  const content = `
    <div class="content">
      <div class="title">🏆 Nouveau Badge Débloqué!</div>
      
      <div class="badge-container">
        <div class="badge-icon">${data.badgeIcon}</div>
        <div style="font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 8px;">
          ${data.badgeName}
        </div>
        <div style="color: #a3a3a3;">
          ${data.badgeDescription}
        </div>
      </div>
      
      <p class="subtitle" style="text-align: center;">
        Félicitations ${data.userName}! 🎉<br>
        Tu as débloqué ce badge${data.raceName ? ` lors du ${data.raceName}` : ""}.
        Continue comme ça!
      </p>
      
      <div style="text-align: center;">
        <a href="${data.profileUrl}" class="cta-button">Voir tous mes badges →</a>
      </div>
    </div>
  `;
  
  return baseTemplate(content, `🏆 Badge débloqué: ${data.badgeName}!`);
}

export interface GroupInvitationData {
  userName: string;
  groupName: string;
  groupDescription?: string;
  senderName: string;
  memberCount: number;
  acceptUrl: string;
  declineUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function groupInvitation(data: GroupInvitationData): string {
  const content = `
    <div class="content">
      <div class="title">📨 Invitation à rejoindre un groupe</div>
      <p class="subtitle">
        Salut ${data.userName},<br><br>
        <strong>${data.senderName}</strong> t'invite à rejoindre le groupe <span class="highlight">"${data.groupName}"</span>!
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">👥 Groupe</span>
          <span class="info-value">${data.groupName}</span>
        </div>
        ${data.groupDescription ? `
        <div class="info-row">
          <span class="info-label">📝 Description</span>
          <span class="info-value">${data.groupDescription}</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="info-label">👤 Membres</span>
          <span class="info-value">${data.memberCount} membres</span>
        </div>
        <div class="info-row">
          <span class="info-label">✉️ Invité par</span>
          <span class="info-value">${data.senderName}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.acceptUrl}" class="cta-button">✅ Accepter l'invitation</a>
        <br>
        <a href="${data.declineUrl}" style="color: #666; font-size: 14px; text-decoration: none;">Décliner l'invitation</a>
      </div>
    </div>
  `;
  
  return baseTemplate(content, `📨 ${data.senderName} t'invite à rejoindre "${data.groupName}"`);
}

export interface ResultsAvailableData {
  userName: string;
  raceName: string;
  sessionType: "RACE" | "SPRINT";
  winner: string;
  pole: string;
  fastestLap: string;
  resultsUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function resultsAvailable(data: ResultsAvailableData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  
  const content = `
    <div class="content">
      <div class="title">🏁 Résultats Officiels: ${data.raceName}</div>
      <p class="subtitle">
        Salut ${data.userName},<br><br>
        Les résultats officiels de la ${sessionLabel.toLowerCase()} du <strong>${data.raceName}</strong> sont disponibles!
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">🥇 Vainqueur</span>
          <span class="info-value" style="color: #ffd700;">${data.winner}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏆 Pole Position</span>
          <span class="info-value">${data.pole}</span>
        </div>
        <div class="info-row">
          <span class="info-label">⚡ Tour rapide</span>
          <span class="info-value">${data.fastestLap}</span>
        </div>
      </div>
      
      <p class="subtitle" style="text-align: center;">
        Ton score a été calculé! Découvre combien de points tu as marqué.
      </p>
      
      <div style="text-align: center;">
        <a href="${data.resultsUrl}" class="cta-button">Voir mon score →</a>
      </div>
    </div>
  `;
  
  return baseTemplate(content, `🏁 ${data.raceName}: ${data.winner} remporte la ${sessionLabel.toLowerCase()}!`);
}

// ============================================
// Plain Text Versions
// ============================================

export function predictionReminderH24Plain(data: PredictionReminderData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  return `
🏎️ F1 TRACKER - RAPPEL PRONOSTIC

Salut ${data.userName},

La ${sessionLabel} du ${data.raceName} commence dans 24 heures!
N'oublie pas de faire ton pronostic avant qu'il ne soit trop tard.

📍 Circuit: ${data.circuitName}, ${data.country}
📅 Date: ${data.sessionDateTime}
⏰ Temps restant: 24h

👉 Faire mon pronostic: ${data.predictUrl}

💡 Rappel: Les pronostics sont verrouillés 1 heure avant le début de la session.

---
Se désabonner: ${data.unsubscribeUrl}
Gérer mes préférences: ${data.preferencesUrl}
  `.trim();
}

export function predictionReminderH1Plain(data: PredictionReminderData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  return `
🚨 F1 TRACKER - DERNIÈRE CHANCE

Salut ${data.userName},

⚠️ PLUS QU'1 HEURE!

La ${sessionLabel} du ${data.raceName} commence bientôt!
C'est ta dernière chance de faire ton pronostic!

👉 Pronostiquer MAINTENANT: ${data.predictUrl}

---
Se désabonner: ${data.unsubscribeUrl}
Gérer mes préférences: ${data.preferencesUrl}
  `.trim();
}

export function scoringResultPlain(data: ScoringResultData): string {
  const sessionLabel = data.sessionType === "RACE" ? "Course" : "Sprint";
  return `
🏁 F1 TRACKER - TON SCORE

Salut ${data.userName},

Voici ton score pour la ${sessionLabel} du ${data.raceName}:

🎯 TOTAL: ${data.points} points
${data.rank ? `📊 Classement: #${data.rank} sur ${data.totalParticipants} joueurs` : ""}

Détail:
- Positions correctes: +${data.breakdown.positions} pts
- Pole Position: +${data.breakdown.pole} pts
- Tour rapide: +${data.breakdown.fastestLap} pts
- Bonus podium: +${data.breakdown.podiumBonus} pts

👉 Voir le classement: ${data.resultsUrl}

---
Se désabonner: ${data.unsubscribeUrl}
Gérer mes préférences: ${data.preferencesUrl}
  `.trim();
}

// ============================================
// Export
// ============================================

export default {
  predictionReminderH24,
  predictionReminderH1,
  scoringResult,
  badgeUnlocked,
  groupInvitation,
  resultsAvailable,
  predictionReminderH24Plain,
  predictionReminderH1Plain,
  scoringResultPlain,
};
