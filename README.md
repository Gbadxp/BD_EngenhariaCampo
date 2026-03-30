# 🌐 FiberPlanner - Painel de Controle (Equipes de Fibra)

**FiberPlanner** é um sistema web robusto e responsivo desenvolvido sob medida para a gestão e acompanhamento técnico de demandas em campo por equipes de manutenção e infraestrutura de fibra óptica. 

Este projeto não depende de pesados frameworks complexos; seu foco principal está na leveza, escalabilidade imediata do lado do cliente *(Vanilla JS)* e na sincronização contínua de dados em tempo real utilizando Firebase.

---

## ✨ Principais Funcionalidades

O Painel de Controle oferece módulos poderosos de integração e visualização:

- **Modões de Exibição (Multivisões):**
  - 📄 **Modo Lista:** Uma exibição em cartões (cards) resumidos que trazem os principais indicadores de forma direta: status, endereço, equipe responsável e tipo do serviço (com clique para detalhes).
  - 📅 **Modo Calendário:** Uma visualização de grade mensal dinâmica onde cada balão ("chip") detalha o que está programado para o dia. Clicar nos dias expande a pauta diária.
  - 🌍 **Modo Mapa:** Usa integração robusta com **Leaflet.js** garantindo a localização via GPS de todas as demandas e plotando marcadores que podem ser clicados por cima da malha de mapas global.
  - 📊 **Dashboard:** Metrifica e compila gráficos visuais (produtividade por equipe, e separação de tarefas pendentes, em andamento e concluídas).

- **Gestão Organizacional Dinâmica:**
  - Painéis sobrepostos (modais) dedicados à inclusão, exclusão e alteração tanto de **Equipes de Campo** quanto de **Analistas**, espelhando de imediato na listagem lateral as novas adições via Realtime DB.

- **Exportação e Comunicação Rápida:**
  - 📥 **Exportar em Excel (.CSV):** Geração e download dinâmico de relatórios tubulares mantendo a legibilidade UTF-8 nativa.
  - 💬 **Exportação WhatsApp:** Ferramenta dedicada a selecionar a data e os filtros em tela para copiar um relatório pronto para envio, poupando minutos de formatação manual.

- **Filtros Customizados Inteligentes:**
  - Sistema de botões dinâmicos e acumulativos que permite mesclar, por exemplo, "Pendentes" e "Em Andamento" de todas as equipes de uma só vez ou de apenas uma única equipe selecionada através do *Sidebar* intuitivo.

- **Design Premium e Mobile-first:**
  - A interface conta com Tema Claro (Light) e Tema Escuro (Dark) nativos *(CSS Variables)*, bem como um layout impecável e responsivo *(Media Queries)* que se reajusta para desktops, tablets e smartphones.

---

## 🛠️ Arquitetura Técnica (Stack)

O ecossistema dispensa compilação pesada e é servido puramente pelos recursos nativos dos navegadores. 

1. **Front-End (Interface):**
   - **Linguagens:** HTML5, CSS3 *(Variáveis e Flexbox/Grid)*, Vanilla JavaScript *(ES6+)*.
   - **Fontes:** Google Fonts (*Inter* - interface moderna).
   - **Ícones/SVGs:** Integrados nativamente.
2. **Back-End (Banco de Dados e Sincronização):**
   - **Google Firebase (Realtime Database):** Toda inserção de tarefas, exclusão ou edição é propagada dinamicamente entre múltiplos usuários simultaneamente. Usa a versão Compat do SDK (v10.8.0).
3. **Módulos Terceirizados:**
   - **Leaflet.js:** Biblioteca open-source para a geração de mapas interativos *(Maps via CartoCDN base)*.

---

## 📂 Estrutura de Arquivos

A organização do código-fonte segue a separação lógica de conceitos:

```text
/FiberPlanner
│
├── index.html        # Esqueleto do sistema, modais nativos e chamadas dos plugins injetáveis (CDN Firebase/Leaflet)
├── styles.css        # Core do Design System. Regras responsivas, dark-theme e variáveis de estilos
└── app.js            # Base principal e motor Javascript. Trata a Lógica do Firebase, eventos globais e injeção do DOM.
    # (+ readme.md)   # Este arquivo
```

---

## 🚀 Como Utilizar o Sistema no Código (Para Desenvolvedores)

### 1. Manipulação do Firebase
Logo no início do arquivo `app.js`, o serviço é autenticado no Firebase pelas credenciais de configuração (`firebaseConfig`) já amarradas ao projeto principal. Toda nova consulta invoca os "listeners", os quais leem as mudanças e disparam o renderizador da tela ativamente via DB (e não *somente* via clique DOM). 

*Sempre que quiser injetar ou verificar algo offline, você deve remover as chaves de conexão inicial e retornar a dependência estática, bem como desligar o `listenForChanges`.*

### 2. Adicionando Novos Componentes Estéticos ou Modais
Sempre que desejar adicionar um novo pop-up HTML nativo:
- Siga a estrutura de classe base: `.modal-overlay` > `.modal` > `.modal-header` > `.modal-body` criada no `index.html`.
- Programe as lógicas de clique que incluem a classe genérica `.active` da janela mãe (Ex: `document.getElementById('myModal').classList.add('active')`). 

### 3. A Central de *Render* (`renderView()`)
Todas as funções globais que alteram dados sempre chamam indiretamente o re-render final da tela base, que cai num "funil" condicional do estado `currentDisplayMode`:
```javascript
// Funil principal da lógica de alteração de tab (app.js)
if (currentDisplayMode === 'list') { renderListView(filteredTasks, container); }
else if (currentDisplayMode === 'calendar') { renderCalendarView(filteredTasks, container); }
// ... e assim por diante.
```
É nestas instâncias onde é realizado o mapeamento detalhado da criação do HTML com `innerHTML +=`.

---

## 💡 Dicas de Padronização para Evolução Contínua

- **Sintaxe de Texto:** Todas as nomenclaturas técnicas *(Equipe e Analista, não gestor)* foram firmadas na interface e no motor de busca do sistema simultaneamente.
- **Z-Index:** Qualquer sobreposição (como um *modal* que abre um *outro modal* na frente do calendário) deve ter o seu z-index devidamente testado (um modal secundário como `detailsModal` tem de superar o primário base na ordem de DOM, ou requer estilo linear inline como `style="z-index:1050"`).
- **Tratamento Mobile:** Mudanças complexas de grid no HTML (`display: flex`) costumam colidir com o `@media (max-width: 900px)` do `styles.css`. Sempre prefira retirar o código *inline* e transportá-lo para classes quando ditar o layout, permitindo que a hierarquia do modo celular se sobreponha naturalmente!

---

*Coded by George Gomes (And optimized by the AI Agentic Companion) • 2026*
