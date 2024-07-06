const puppeteer = require('puppeteer');

async function main() {
  // Lanzar el navegador
  const browser = await puppeteer.launch({
    headless: true, // Ejecutar en modo headless
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Opciones adicionales
  });

  // Crear una nueva página
  const page = await browser.newPage();

  // Navegar a example.com
  await page.goto('http://example.com');

  // Cerrar el navegador
  await browser.close();

  console.log('Página cargada correctamente');
}

// Ejecutar la función main
main().catch(console.error);