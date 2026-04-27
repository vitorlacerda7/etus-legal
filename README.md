# ETUS · Jurídico

Sistema interno do time Jurídico do Grupo ETUS. Substitui os formulários do Google Forms por uma plataforma integrada com controle de acesso, auditoria e acompanhamento de solicitações.

> **Visual:** mesma identidade do [etus-vagas](https://etus-vagas-35cf4.web.app) — paleta, tipografia Space Grotesk, sidebar dark, badges, cards.

---

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs: contratos vigentes, vencimento em 30/60d, processos ativos, contingência, demandas abertas/urgentes. Gráficos (recharts). |
| **Contratos** | Cadastro, lista com filtros (empresa, tipo, status, vigência), detalhe com metadados e alteração de status, alertas de vencimento. |
| **Processos Judiciais** | Lista com nº CNJ, vara, comarca, área, partes. Timeline de movimentações manuais. Dashboard com contingência. |
| **Demandas** | Substitui 3 Google Forms: *Elaboração de contrato*, *Análise de contrato* e *Realização de tarefa*. Fluxo: abrir → atribuir analista → comentários → concluir. SLA visual por urgência. |
| **Espaço Seguro** | Canal anônimo de Compliance (substitui o Google Form "Espaço Seguro"). Relatos com sigilo, visualização restrita ao Jurídico. |
| **LGPD / Compliance** | Incidentes LGPD, inventário de dados pessoais (sistema, base legal, retenção), templates de resposta a titulares (CRUD em markdown). |
| **Usuários** | Gestão de papéis (líder promove/rebaixa), bloqueio de acesso. |

---

## Papéis (Roles)

| Role | Acesso |
|---|---|
| `juridico_lider` | Tudo: módulos, atribuição, promoção de usuários, Espaço Seguro admin |
| `juridico_analista` | Contratos, Processos, Demandas (atribuídas), LGPD, Espaço Seguro admin |
| `solicitante` | Criar/acompanhar próprias demandas, Espaço Seguro (envio de relatos) |

Primeiro login via Google → role padrão `solicitante`. O líder promove via tela de Usuários.

---

## Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Firebase (Auth + Firestore + Storage)
- **Roteamento:** react-router-dom v6
- **Charts:** recharts
- **CSS:** Puro (variáveis CSS, sem frameworks)
- **Ícones:** Unicode simbólico

---

## Setup local (PowerShell / Terminal)

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado 20 LTS)
- npm 9+
- Conta no [Firebase Console](https://console.firebase.google.com/)

### 1. Clonar o repositório

```powershell
git clone https://github.com/vitorlacerda7/etus-legal.git
cd etus-legal
```

### 2. Instalar dependências

```powershell
npm install
```

### 3. Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto (ou use um existente).
2. Ative **Authentication** → Sign-in providers → **Email/Senha** e **Google**.
3. Crie um **Firestore Database** (modo de teste inicialmente, depois aplique as rules abaixo).
4. Ative o **Storage** (para anexos futuros).
5. Em **Project Settings → General → Your apps**, clique em **Add app** (Web) e copie o `firebaseConfig`.

### 4. Criar arquivo `.env.local`

```powershell
Copy-Item .env.local.example .env.local
```

Edite `.env.local` com os valores do seu projeto Firebase:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 5. Publicar Firestore Rules

Copie o conteúdo de `firestore.rules` e cole no **Firestore Console → Rules** (ou use `firebase deploy --only firestore:rules` se tiver o CLI).

### 6. Rodar localmente

```powershell
npm run dev
```

Acesse `http://localhost:5173`.

### 7. Build para produção

```powershell
npm run build
```

### 8. Deploy no Firebase Hosting (opcional)

```powershell
npm install -g firebase-tools
firebase login
firebase init hosting   # aponte para dist/, SPA rewrite para index.html
firebase deploy --only hosting
```

---

## Firestore Rules

O arquivo `firestore.rules` contém as regras de segurança completas com RBAC:
- Usuários bloqueados não podem recriar seu perfil
- Solicitantes só veem próprias demandas
- Contratos, Processos e LGPD: acesso restrito ao Jurídico
- Espaço Seguro: qualquer autenticado envia, só Jurídico visualiza

---

## Estrutura do projeto

```
src/
├── components/        # Layout, Sidebar, Modal, KpiCard, StatusBadge, ProtectedRoute
├── contexts/          # AuthContext (Firebase Auth + perfil Firestore)
├── pages/
│   ├── contratos/     # ContratosList, ContratoNovo, ContratoDetalhe
│   ├── processos/     # ProcessosList, ProcessoNovo, ProcessoDetalhe
│   ├── demandas/      # DemandasList, DemandaNova, DemandaDetalhe
│   ├── lgpd/          # LgpdPage (incidentes, inventário, templates)
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── EspacoSeguro.tsx
│   ├── EspacoSeguroAdmin.tsx
│   └── Usuarios.tsx
├── utils/             # authAllowlist.ts, format.ts
├── firebase.ts        # Inicialização do Firebase
├── types.ts           # Tipos TypeScript + labels em PT-BR
├── App.tsx            # Roteamento
├── main.tsx           # Entrypoint
└── index.css          # Design system completo
```

---

## Domínios permitidos

Somente e-mails dos seguintes domínios podem acessar o sistema:
- `@etus.com.br`
- `@plusdin.com.br`
- `@brius.com.br`
- `@bhaz.com.br`

(Incluindo subdomínios.)

---

## Empresas do grupo

As empresas disponíveis nos formulários seguem a lista dos Google Forms originais:
- ETUS Media Holding Ltda.
- Plusdin Tecnologia e Informação Ltda.
- BRAZ Comunicação Ltda.
- Evolution Foundation Ltda.
- ETUS Digital LLC (Brius)
- E3J Serviços Ltda.
- Outra

---

## Próximos passos (follow-up)

- [ ] Upload de arquivos (PDF/Word) nos contratos e demandas via Firebase Storage
- [ ] Cloud Functions para alertas de vencimento por e-mail
- [ ] Integração com APIs de tribunais (PJe/TRF) para movimentações automáticas
- [ ] Knowledge Base / Playbooks (Fase 2)
- [ ] IA para classificação automática de demandas (Fase 3)
