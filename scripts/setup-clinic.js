#!/usr/bin/env node
// Script para configurar la IP del servidor en producción
// Uso: node scripts/setup-clinic.js 192.168.1.10

import { writeFileSync } from 'fs'

const ip = process.argv[2]

if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
  console.error('Error: Proporciona una IP válida.')
  console.error('Uso: node scripts/setup-clinic.js 192.168.1.10')
  process.exit(1)
}

const envContent = [
  '# ClinicalCore EHR — producción',
  `# Configurado el ${new Date().toLocaleDateString('es-MX')} para servidor ${ip}`,
  '# NUNCA commitear este archivo (está en .gitignore)',
  '',
  `VITE_POCKETBASE_URL=http://${ip}:8090`,
  'NODE_ENV=production',
  'VITE_APP_ENV=production',
  'VITE_INACTIVITY_TIMEOUT=1800000',
  'VITE_APP_VERSION=1.0.0',
  '',
].join('\n')

writeFileSync('.env.production', envContent, 'utf8')
console.log(`✓ .env.production configurado para servidor en ${ip}:8090`)
console.log('  Ejecuta "npm run build:electron" para generar el instalador.')
