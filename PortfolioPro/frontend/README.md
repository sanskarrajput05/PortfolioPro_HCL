# PortfolioPro frontend

The frontend is an Angular application that provides account access, a demo market watch, simulated buy and sell orders, holdings, and transaction history.

## Requirements

- Node.js and npm
- The PortfolioPro Spring Boot API running at `http://localhost:8080`
- The configured MySQL database available to the backend

## Run locally

From this directory, install dependencies and start the Angular development server:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The port is kept at 5173 to match the backend's configured CORS origin.

To create a production build, run `npm run build`.

All displayed stock and index prices are demonstration values, not live market data.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
