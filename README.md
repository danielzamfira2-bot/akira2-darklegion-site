# Akira2 DarkLegion Guide

Site-ul comunității, cu autentificare Discord și acces la ghiduri pe baza rolurilor de Tier.

## Pornire locală

1. Copiază `.env.example` ca `.env` și completează valorile.
2. Rulează `npm install`.
3. Rulează `npm start`.
4. Deschide `http://localhost:3000`.

Site-ul nu mai trebuie deschis direct prin `index.html`; autentificarea și ghidurile protejate funcționează numai prin serverul Node.

## Configurare Discord

În Discord Developer Portal, la aplicația botului existent:

1. Deschide `OAuth2`.
2. Adaugă Redirect URL-ul exact:
   - local: `http://localhost:3000/auth/discord/callback`
   - Railway: `https://DOMENIUL-TAU/auth/discord/callback`
3. Copiază Client ID și Client Secret în variabilele aplicației.
4. Copiază ID-ul serverului și ID-urile rolurilor Tier II și Tier III.

Nu pune niciodată Client Secret, Session Secret sau Bot Token în Git.

## Variabile Railway

Adaugă în serviciul site-ului:

- `NODE_ENV=production`
- `SESSION_SECRET`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_GUILD_ID`
- `DISCORD_TIER_2_ROLE_ID`
- `DISCORD_TIER_3_ROLE_ID`
- `DISCORD_PROGRESS_ADMIN_ROLE_IDS` — ID-ul rolului Admin; acceptă mai multe ID-uri separate prin virgulă
- `DISCORD_TIER_1_RESPONSIBLE_ROLE_IDS` — rolul/rolurile Responsabil Tier I
- `DISCORD_TIER_2_RESPONSIBLE_ROLE_IDS` — rolul/rolurile Responsabil Tier II
- `DISCORD_TIER_3_RESPONSIBLE_ROLE_IDS` — rolul/rolurile Responsabil Tier III
- `DISCORD_BOT_TOKEN` — tokenul botului existent, folosit numai pe server pentru reverificarea rolurilor

Adaugă un serviciu PostgreSQL în același proiect Railway. Tabelul de sesiuni se creează automat.

## Regula de acces

- Fără rol special: Tier I
- Rolul configurat prin `DISCORD_TIER_2_ROLE_ID`: Tier I + Tier II
- Rolul configurat prin `DISCORD_TIER_3_ROLE_ID`: acces complet

Botul poate continua să acorde și să retragă rolurile. Site-ul le verifică și adaptează automat accesul.

## Profiluri de progres

Membrii autentificați își pot salva echipamentul și progresul în pagina `progres.html`. Datele sunt păstrate în PostgreSQL. Adminul vede toate profilurile, iar fiecare Responsabil vede numai profilurile tierului configurat pentru rolul său. Adminul și Responsabilii pot gestiona și evidența săptămânală `jucător – item/Woni – cantitate` pentru tierurile la care au acces.
